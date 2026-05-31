"""Local package cache management for WLPM."""

import json
import os
import shutil
from typing import Optional

from wlpm.package import PackageMetadata
from wlpm.ui import info, error


class Cache:
    def __init__(self, cache_dir: str):
        self.cache_dir = cache_dir
        self.packages_dir = os.path.join(cache_dir, "packages")
        self.metadata_dir = os.path.join(cache_dir, "metadata")

    def ensure_dirs(self):
        os.makedirs(self.packages_dir, exist_ok=True)
        os.makedirs(self.metadata_dir, exist_ok=True)

    def cached_package_path(self, name: str, version: str) -> str:
        return os.path.join(self.packages_dir, f"{name}-{version}.wlpkg")

    def is_cached(self, name: str, version: str) -> bool:
        return os.path.exists(self.cached_package_path(name, version))

    def cache_package(self, name: str, version: str, data: bytes):
        path = self.cached_package_path(name, version)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)

    def get_cached_package(self, name: str, version: str) -> Optional[bytes]:
        path = self.cached_package_path(name, version)
        if os.path.exists(path):
            with open(path, "rb") as f:
                return f.read()
        return None

    def metadata_path(self, name: str) -> str:
        return os.path.join(self.metadata_dir, f"{name}.json")

    def save_metadata(self, name: str, version: str, meta: dict):
        path = self.metadata_path(name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        existing = {}
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    existing = json.load(f)
                if not isinstance(existing, dict):
                    existing = {}
            except (json.JSONDecodeError, OSError):
                existing = {}
        existing[version] = meta
        with open(path, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2, ensure_ascii=False)

    def get_metadata(self, name: str) -> dict:
        path = self.metadata_path(name)
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, OSError):
                pass
        return {}

    def get_installed_versions(self, name: str) -> list[str]:
        meta = self.get_metadata(name)
        return sorted(meta.keys())

    def is_installed(self, name: str, version: str = "") -> bool:
        meta = self.get_metadata(name)
        if version:
            return version in meta
        return len(meta) > 0

    def list_installed(self) -> list[tuple[str, str, dict]]:
        results = []
        if not os.path.exists(self.metadata_dir):
            return results
        for fname in os.listdir(self.metadata_dir):
            if not fname.endswith(".json"):
                continue
            name = fname[:-5]
            meta = self.get_metadata(name)
            for ver, data in meta.items():
                results.append((name, ver, data))
        return sorted(results, key=lambda x: x[0])

    def remove_package(self, name: str, version: str = ""):
        if version:
            pkg_path = self.cached_package_path(name, version)
            if os.path.exists(pkg_path):
                os.remove(pkg_path)
            meta = self.get_metadata(name)
            if version in meta:
                del meta[version]
                if meta:
                    with open(self.metadata_path(name), "w", encoding="utf-8") as f:
                        json.dump(meta, f, indent=2, ensure_ascii=False)
                else:
                    os.remove(self.metadata_path(name))
        else:
            meta = self.get_metadata(name)
            for ver in meta:
                pkg_path = self.cached_package_path(name, ver)
                if os.path.exists(pkg_path):
                    os.remove(pkg_path)
            meta_path = self.metadata_path(name)
            if os.path.exists(meta_path):
                os.remove(meta_path)

    def clear(self):
        if os.path.exists(self.cache_dir):
            shutil.rmtree(self.cache_dir)
        self.ensure_dirs()

    def total_size(self) -> int:
        total = 0
        if os.path.exists(self.packages_dir):
            for dirpath, _, filenames in os.walk(self.packages_dir):
                for fn in filenames:
                    fp = os.path.join(dirpath, fn)
                    total += os.path.getsize(fp)
        return total


class InstallRecord:
    def __init__(self, install_dir: str):
        self.install_dir = install_dir
        self.record_path = os.path.join(install_dir, ".wlpm-installed.json")

    def ensure_dirs(self):
        os.makedirs(self.install_dir, exist_ok=True)

    def load(self) -> dict:
        if os.path.exists(self.record_path):
            try:
                with open(self.record_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, OSError):
                pass
        return {}

    def save(self, records: dict):
        os.makedirs(os.path.dirname(self.record_path), exist_ok=True)
        with open(self.record_path, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)

    def add(self, name: str, version: str, files: list, dependencies: dict):
        records = self.load()
        records[name] = {
            "version": version,
            "files": files,
            "dependencies": dependencies,
            "installed_at": __import__("time").time(),
        }
        self.save(records)

    def remove(self, name: str):
        records = self.load()
        records.pop(name, None)
        self.save(records)

    def get(self, name: str) -> Optional[dict]:
        records = self.load()
        return records.get(name)

    def list_all(self) -> dict:
        return self.load()
