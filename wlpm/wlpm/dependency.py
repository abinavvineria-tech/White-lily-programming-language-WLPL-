"""Dependency resolution for WLPM."""

from collections import defaultdict
from typing import Optional

from wlpm.package import (
    Version,
    VersionSpec,
    parse_dependency_spec,
    check_version_satisfies,
    PackageMetadata,
)


class DependencyError(Exception):
    def __init__(self, message, package=""):
        self.package = package
        super().__init__(message)


class DependencyGraph:
    def __init__(self):
        self.nodes: dict[str, set[str]] = defaultdict(set)
        self.versions: dict[str, str] = {}
        self.specs: dict[str, list[list[VersionSpec]]] = defaultdict(list)

    def add_dependency(self, package: str, version: str, dependency: str, spec: str):
        self.nodes[package].add(dependency)
        self.versions[package] = version
        specs = parse_dependency_spec(spec)
        if specs:
            self.specs[dependency].append(specs)

    def has_cycle(self) -> bool:
        visited = set()
        rec_stack = set()

        def dfs(node):
            visited.add(node)
            rec_stack.add(node)
            for neighbor in self.nodes.get(node, set()):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            rec_stack.discard(node)
            return False

        for node in list(self.nodes.keys()):
            if node not in visited:
                if dfs(node):
                    return True
        return False


class DependencyResolver:
    def __init__(self, repositories: list, cache):
        self.repositories = repositories
        self.cache = cache
        self.resolved: dict[str, str] = {}
        self.graph = DependencyGraph()

    def resolve(self, package_name: str, version_spec: str = "") -> dict[str, str]:
        self.resolved = {}
        self.graph = DependencyGraph()
        self._resolve(package_name, version_spec, set())
        return self.resolved

    def _resolve(self, name: str, spec: str, seen: set):
        if name in seen:
            raise DependencyError(f"Circular dependency detected: {name}", name)
        seen.add(name)

        if name in self.resolved:
            seen.discard(name)
            return

        pkg_meta = self._find_best_match(name, spec)
        if not pkg_meta:
            raise DependencyError(
                f"Cannot find package '{name}' matching '{spec or 'any'}'", name
            )

        self.resolved[name] = pkg_meta.version

        for dep_name, dep_spec in pkg_meta.dependencies.items():
            self.graph.add_dependency(name, pkg_meta.version, dep_name, dep_spec)

            if dep_name in self.resolved:
                existing_ver = Version.parse(self.resolved[dep_name])
                dep_specs = parse_dependency_spec(dep_spec)
                if not check_version_satisfies(existing_ver, dep_specs):
                    raise DependencyError(
                        f"Version conflict for '{dep_name}': "
                        f"installed {self.resolved[dep_name]} does not satisfy {dep_spec}",
                        dep_name,
                    )
                continue

            self._resolve(dep_name, dep_spec, seen)

        seen.discard(name)

    def _find_best_match(
        self, name: str, spec: str
    ) -> Optional[PackageMetadata]:
        candidates = []
        spec_satisfied = parse_dependency_spec(spec) if spec else []

        for repo in self.repositories:
            pkg = repo.get_package(name)
            if not pkg:
                continue
            for ver_str, meta in pkg.items():
                ver = Version.parse(ver_str)
                if not spec_satisfied or check_version_satisfies(ver, spec_satisfied):
                    candidates.append((ver, meta))

        if not candidates:
            return None

        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    def resolve_with_cached(self, name: str) -> dict[str, str]:
        installed = self.cache.get_metadata(name)
        if installed:
            latest = sorted(installed.keys(), key=Version.parse)[-1]
            self.resolved[name] = latest
        else:
            self._resolve(name, "", set())
        return self.resolved
