"""Package repository handling for WLPM."""

import json
import os
import hashlib
from typing import Optional
from urllib.request import urlopen, Request
from urllib.error import URLError

from wlpm.package import PackageMetadata, Version
from wlpm.ui import info, error, warning


class RepositoryError(Exception):
    pass


class Repository:
    def __init__(self, url: str, cache_dir: str = ""):
        self.url = url
        self.cache_dir = cache_dir
        self._data: Optional[dict] = None
        self._packages: dict = {}
        self.name = ""
        self.description = ""
        self.version = ""

    @property
    def cache_path(self) -> str:
        if not self.cache_dir:
            return ""
        safe = self.url.replace("://", "_").replace("/", "_").replace(":", "_")
        return os.path.join(self.cache_dir, f"{safe}.json")

    def fetch(self, use_cache: bool = True) -> dict:
        if use_cache and self.cache_path and os.path.exists(self.cache_path):
            try:
                with open(self.cache_path, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
                self._parse()
                return self._data
            except (json.JSONDecodeError, OSError):
                pass

        try:
            req = Request(
                self.url,
                headers={"User-Agent": "WLPM/1.0 WhiteLilyPackageManager"},
            )
            with urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
        except URLError as e:
            if use_cache and self.cache_path and os.path.exists(self.cache_path):
                warning(f"Could not reach repository, using cached data: {e}")
                with open(self.cache_path, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
                self._parse()
                return self._data
            raise RepositoryError(f"Failed to fetch repository: {e}")

        try:
            self._data = json.loads(raw)
        except json.JSONDecodeError as e:
            raise RepositoryError(f"Invalid repository JSON: {e}")

        self._parse()

        if self.cache_path:
            os.makedirs(os.path.dirname(self.cache_path), exist_ok=True)
            with open(self.cache_path, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2, ensure_ascii=False)

        return self._data

    def _parse(self):
        if not self._data:
            return
        self.name = self._data.get("name", "")
        self.description = self._data.get("description", "")
        self.version = self._data.get("version", "")

        packages = self._data.get("packages", {})
        for pkg_name, pkg_data in packages.items():
            versions = pkg_data.get("versions", {})
            parsed_versions = {}
            for ver_str, ver_data in versions.items():
                meta = PackageMetadata(
                    name=pkg_name,
                    version=ver_str,
                    description=ver_data.get("description", ""),
                    author=ver_data.get("author", ""),
                    license=ver_data.get("license", "MIT"),
                    dependencies=ver_data.get("dependencies", {}),
                    download_url=ver_data.get("download_url", ""),
                    checksum=ver_data.get("checksum", ""),
                    size=ver_data.get("size", 0),
                    keywords=ver_data.get("keywords", []),
                )
                parsed_versions[ver_str] = meta
            self._packages[pkg_name] = parsed_versions

    @property
    def packages(self) -> dict:
        return self._packages

    def get_package(self, name: str) -> Optional[dict]:
        return self._packages.get(name)

    def get_version(self, name: str, version: str) -> Optional[PackageMetadata]:
        pkg = self._packages.get(name)
        if pkg:
            return pkg.get(version)
        return None

    def latest_version(self, name: str) -> Optional[str]:
        pkg = self._packages.get(name)
        if not pkg:
            return None
        versions = sorted(pkg.keys(), key=Version.parse)
        return versions[-1] if versions else None

    def search(self, query: str) -> list[tuple[str, str, str]]:
        query = query.lower()
        results = []
        for name, versions in self._packages.items():
            if query in name.lower():
                latest = self.latest_version(name)
                meta = versions.get(latest) if latest else None
                desc = meta.description if meta else ""
                results.append((name, desc, latest or ""))
            else:
                for ver_str, meta in versions.items():
                    if any(query in kw.lower() for kw in meta.keywords):
                        results.append((name, meta.description, ver_str))
                        break
        return results

    def verify_checksum(self, data: bytes, expected: str) -> bool:
        if not expected:
            return True
        if expected.startswith("sha256:"):
            actual = "sha256:" + hashlib.sha256(data).hexdigest()
            return actual == expected
        elif expected.startswith("sha1:"):
            actual = "sha1:" + hashlib.sha1(data).hexdigest()
            return actual == expected
        elif expected.startswith("md5:"):
            actual = "md5:" + hashlib.md5(data).hexdigest()
            return actual == expected
        return True


class RepositoryManager:
    def __init__(self, config):
        self.config = config
        self.repositories: list[Repository] = []

    def load(self):
        urls = self.config.get("repositories", [])
        for url in urls:
            repo = Repository(url, self.config.repos_dir)
            self.repositories.append(repo)

    def fetch_all(self, use_cache: bool = True):
        for repo in self.repositories:
            try:
                repo.fetch(use_cache=use_cache)
            except RepositoryError as e:
                error(f"Repository error ({repo.url}): {e}")

    def find_package(self, name: str) -> Optional[tuple[Repository, dict]]:
        for repo in self.repositories:
            pkg = repo.get_package(name)
            if pkg:
                return repo, pkg
        return None

    def search_all(self, query: str) -> list[tuple[str, str, str]]:
        results = []
        for repo in self.repositories:
            results.extend(repo.search(query))
        seen = set()
        unique = []
        for name, desc, ver in results:
            if name not in seen:
                seen.add(name)
                unique.append((name, desc, ver))
        return unique
