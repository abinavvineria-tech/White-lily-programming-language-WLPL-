"""Package installation, removal, and update logic."""

import json
import os
import shutil
import tempfile
from urllib.request import urlopen, Request
from urllib.error import URLError

from wlpm.ui import (
    success, error, info, warning,
    install_msg, remove_msg, update_msg, done_msg,
    ProgressBar, Spinner, confirm,
)
from wlpm.package import PackageMetadata, Version, parse_dependency_spec, check_version_satisfies
from wlpm.dependency import DependencyResolver, DependencyError
from wlpm.repository import RepositoryManager
from wlpm.cache import Cache, InstallRecord


class Installer:
    def __init__(self, config):
        self.config = config
        self.cache = Cache(config.cache_dir)
        self.records = InstallRecord(config.install_dir)
        self.repo_manager = RepositoryManager(config)

    def install(self, package_name: str, version: str = ""):
        self.cache.ensure_dirs()
        self.records.ensure_dirs()
        self.repo_manager.load()

        info("Opening the garden gates...")
        with Spinner("Gathering flower seeds..."):
            self.repo_manager.fetch_all()

        spec = f"=={version}" if version else ""

        resolver = DependencyResolver(self.repo_manager.repositories, self.cache)
        try:
            if spec:
                resolved = resolver.resolve(package_name, spec)
            else:
                resolved = resolver.resolve(package_name, "")
        except DependencyError as e:
            error(f"Failed to resolve dependencies: {e}")
            return False

        names = list(resolved.keys())
        main_idx = names.index(package_name) if package_name in names else 0

        for i, (dep_name, dep_ver) in enumerate(resolved.items()):
            if self.cache.is_installed(dep_name, dep_ver):
                info(f"{dep_name} v{dep_ver} already blooms in the garden.")
                continue

            install_msg(f"{dep_name} v{dep_ver}")

            pkg = self._find_package_meta(dep_name, dep_ver)
            if not pkg:
                error(f"Package {dep_name} v{dep_ver} not found in repositories.")
                continue

            bar = ProgressBar(3, prefix=f"Planting {dep_name}")
            bar.update()

            data = self._download_package(pkg)
            bar.update()

            if data:
                self.cache.cache_package(dep_name, dep_ver, data)
                self.cache.save_metadata(dep_name, dep_ver, {
                    "version": dep_ver,
                    "description": pkg.description,
                    "author": pkg.author,
                    "license": pkg.license,
                    "dependencies": pkg.dependencies,
                    "size": len(data),
                })
                self._extract_and_install(dep_name, dep_ver, data)
                self.records.add(dep_name, dep_ver, pkg.files, pkg.dependencies)
                bar.update()
                bar.finish()
                success(f"{dep_name} v{dep_ver} has bloomed.")

            else:
                bar.finish()
                error(f"Failed to download {dep_name}.")

        done_msg()
        return True

    def remove(self, package_name: str):
        self.cache.ensure_dirs()
        self.records.ensure_dirs()

        if not self.cache.is_installed(package_name):
            warning(f"{package_name} is not blooming in the garden.")
            return False

        deps = self.records.get(package_name, {}).get("dependencies", {})
        remove_msg(package_name)

        with Spinner(f"Gathering petals of {package_name}..."):
            inst_dir = os.path.join(self.config.install_dir, package_name)
            if os.path.exists(inst_dir):
                shutil.rmtree(inst_dir)
            self.cache.remove_package(package_name)
            self.records.remove(package_name)

        success(f"{package_name}'s petals have returned to the garden.")
        done_msg()
        return True

    def update(self):
        self.cache.ensure_dirs()
        self.records.ensure_dirs()
        self.repo_manager.load()

        update_msg()

        with Spinner("Gathering fresh seeds..."):
            self.repo_manager.fetch_all(use_cache=False)

        installed = self.records.list_all()
        if not installed:
            info("No flowers planted yet. Plant some with 'wlpm install'.")
            return True

        updated_count = 0
        for name, data in installed.items():
            current_ver = data.get("version", "")
            for repo in self.repo_manager.repositories:
                latest = repo.latest_version(name)
                if latest and Version.parse(latest) > Version.parse(current_ver):
                    info(f"Updating {name} v{current_ver} -> v{latest}")
                    self.install(name, latest)
                    updated_count += 1
                    break

        if updated_count == 0:
            info("All flowers are at their full bloom.")
        else:
            success(f"{updated_count} flower(s) have been refreshed.")

        done_msg()
        return True

    def search(self, query: str):
        self.repo_manager.load()
        with Spinner("Searching the garden..."):
            self.repo_manager.fetch_all()
            results = self.repo_manager.search_all(query)

        if not results:
            info(f"No flowers found matching '{query}'.")
            return

        print()
        from wlpm.ui import search_result
        for name, desc, ver in results:
            search_result(name, desc, ver)

    def list_packages(self):
        installed = self.records.list_all()
        if not installed:
            info("No flowers planted yet. Plant some with 'wlpm install'.")
            return

        print()
        from wlpm.ui import header_color, colorize, list_package
        print(colorize("  Flowers blooming in the garden:", "bold", "white"))
        print()
        for name, data in sorted(installed.items()):
            list_package(name, data.get("version", "?"))
        print()

    def info(self, package_name: str):
        self.repo_manager.load()
        with Spinner("Searching the garden..."):
            self.repo_manager.fetch_all()
            installed = self.records.get(package_name)

        repo_result = self.repo_manager.find_package(package_name)
        from wlpm.ui import package_info

        if repo_result:
            _, versions = repo_result
            latest_ver = sorted(versions.keys(), key=Version.parse)[-1]
            latest_meta = versions[latest_ver]
            package_info(
                name=package_name,
                version=latest_ver,
                desc=latest_meta.description,
                author=latest_meta.author,
                license_=latest_meta.license,
                deps=list(latest_meta.dependencies.keys()),
                size=latest_meta.size,
            )
        elif installed:
            package_info(
                name=package_name,
                version=installed.get("version", "?"),
                desc=installed.get("description", ""),
                author=installed.get("author", ""),
                license_=installed.get("license", ""),
                deps=list(installed.get("dependencies", {}).keys()),
                size=installed.get("size", 0),
            )
        else:
            warning(f"No flower named '{package_name}' found in the garden.")

    def _find_package_meta(self, name: str, version: str) -> PackageMetadata:
        for repo in self.repo_manager.repositories:
            meta = repo.get_version(name, version)
            if meta:
                return meta
        return None

    def _download_package(self, meta: PackageMetadata) -> bytes:
        if not meta.download_url:
            return self._generate_placeholder(meta)
        try:
            req = Request(
                meta.download_url,
                headers={"User-Agent": "WLPM/1.0 WhiteLilyPackageManager"},
            )
            with urlopen(req, timeout=30) as resp:
                data = resp.read()
                if meta.checksum:
                    if not self.repo_manager.repositories[0].verify_checksum(data, meta.checksum):
                        error(f"Checksum verification failed for {meta.name}")
                        return b""
                return data
        except URLError as e:
            error(f"Download failed: {e}")
            return self._generate_placeholder(meta)

    def _generate_placeholder(self, meta: PackageMetadata) -> bytes:
        pkg_data = json.dumps(meta.to_dict(), indent=2).encode("utf-8")
        return pkg_data

    def _extract_and_install(self, name: str, version: str, data: bytes):
        inst_dir = os.path.join(self.config.install_dir, name, version)
        os.makedirs(inst_dir, exist_ok=True)
        try:
            pkg = json.loads(data.decode("utf-8"))
            wlpkg_path = os.path.join(inst_dir, f"{name}.wlpkg")
            with open(wlpkg_path, "w", encoding="utf-8") as f:
                json.dump(pkg, f, indent=2, ensure_ascii=False)
            files = pkg.get("files", [])
            for fname in files:
                fpath = os.path.join(inst_dir, fname)
                os.makedirs(os.path.dirname(fpath), exist_ok=True)
                if not os.path.exists(fpath):
                    with open(fpath, "w") as f:
                        f.write(f"# {name} - {fname}\n")
        except (json.JSONDecodeError, UnicodeDecodeError):
            wlpkg_path = os.path.join(inst_dir, f"{name}.wlpkg")
            with open(wlpkg_path, "wb") as f:
                f.write(data)
