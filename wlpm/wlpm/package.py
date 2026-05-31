"""Package model, .wlpkg format, and version comparison."""

import json
import re
from dataclasses import dataclass, field
from typing import Optional


SEMVER_RE = re.compile(r"^(\d+)(?:\.(\d+))?(?:\.(\d+))?$")
VERSION_SPEC_RE = re.compile(
    r"^(?:(>=|<=|>|<|==|~|\^|!=)\s*)?(\d+(?:\.\d+)?(?:\.\d+)?)$"
)


@dataclass
class Version:
    major: int = 0
    minor: int = 0
    patch: int = 0

    @classmethod
    def parse(cls, text: str) -> "Version":
        m = SEMVER_RE.match(text.strip())
        if not m:
            raise ValueError(f"Invalid version: {text}")
        major = int(m.group(1))
        minor = int(m.group(2) or 0)
        patch = int(m.group(3) or 0)
        return cls(major=major, minor=minor, patch=patch)

    def __str__(self):
        return f"{self.major}.{self.minor}.{self.patch}"

    def __repr__(self):
        return f"Version({self.major}.{self.minor}.{self.patch})"

    def __eq__(self, other):
        if isinstance(other, str):
            other = Version.parse(other)
        return (self.major, self.minor, self.patch) == (other.major, other.minor, other.patch)

    def __lt__(self, other):
        if isinstance(other, str):
            other = Version.parse(other)
        return (self.major, self.minor, self.patch) < (other.major, other.minor, other.patch)

    def __le__(self, other):
        return self < other or self == other

    def __gt__(self, other):
        if isinstance(other, str):
            other = Version.parse(other)
        return (self.major, self.minor, self.patch) > (other.major, other.minor, other.patch)

    def __ge__(self, other):
        return self > other or self == other

    def __hash__(self):
        return hash((self.major, self.minor, self.patch))


@dataclass
class VersionSpec:
    operator: str
    version: Version

    @classmethod
    def parse(cls, spec: str) -> "VersionSpec":
        spec = spec.strip()
        m = VERSION_SPEC_RE.match(spec)
        if not m:
            raise ValueError(f"Invalid version spec: {spec}")
        op = m.group(1) or "=="
        ver = Version.parse(m.group(2))
        return cls(operator=op, version=ver)

    def matches(self, version: Version) -> bool:
        if self.operator == "==":
            return version == self.version
        elif self.operator == ">=":
            return version >= self.version
        elif self.operator == "<=":
            return version <= self.version
        elif self.operator == ">":
            return version > self.version
        elif self.operator == "<":
            return version < self.version
        elif self.operator == "!=":
            return version != self.version
        elif self.operator == "^":
            return (version.major == self.version.major
                    and version >= self.version)
        elif self.operator == "~":
            if self.version.minor is not None:
                return (version.major == self.version.major
                        and version.minor == self.version.minor
                        and version >= self.version)
            return version.major == self.version.major and version >= self.version
        return False

    def __str__(self):
        return f"{self.operator}{self.version}"

    def __repr__(self):
        return f"VersionSpec('{self.operator}', {self.version})"


@dataclass
class PackageMetadata:
    name: str
    version: str
    description: str = ""
    author: str = ""
    license: str = "MIT"
    dependencies: dict = field(default_factory=dict)
    files: list = field(default_factory=list)
    repository: str = ""
    keywords: list = field(default_factory=list)
    package_type: str = "library"
    download_url: str = ""
    checksum: str = ""
    size: int = 0

    @classmethod
    def from_dict(cls, data: dict) -> "PackageMetadata":
        return cls(
            name=data.get("name", ""),
            version=data.get("version", "0.0.1"),
            description=data.get("description", ""),
            author=data.get("author", ""),
            license=data.get("license", "MIT"),
            dependencies=data.get("dependencies", {}),
            files=data.get("files", []),
            repository=data.get("repository", ""),
            keywords=data.get("keywords", []),
            package_type=data.get("type", "library"),
            download_url=data.get("download_url", ""),
            checksum=data.get("checksum", ""),
            size=data.get("size", 0),
        )

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "author": self.author,
            "license": self.license,
            "dependencies": self.dependencies,
            "files": self.files,
            "repository": self.repository,
            "keywords": self.keywords,
            "type": self.package_type,
        }

    @classmethod
    def from_wlpkg(cls, path: str) -> "PackageMetadata":
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls.from_dict(data)

    def to_wlpkg(self, path: str):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)


@dataclass
class PackageInfo:
    name: str
    description: str = ""
    author: str = ""
    license: str = "MIT"
    dependencies: dict = field(default_factory=dict)
    installed_version: Optional[str] = None
    available_versions: list = field(default_factory=list)
    repository: str = ""
    size: int = 0

    @classmethod
    def from_installed(cls, metadata: PackageMetadata) -> "PackageInfo":
        return cls(
            name=metadata.name,
            description=metadata.description,
            author=metadata.author,
            license=metadata.license,
            dependencies=metadata.dependencies,
            installed_version=metadata.version,
            repository=metadata.repository,
            size=metadata.size,
        )


def parse_dependency_spec(spec: str) -> list[VersionSpec]:
    parts = [s.strip() for s in spec.split(",")]
    return [VersionSpec.parse(p) for p in parts if p]


def check_version_satisfies(version: Version, specs: list[VersionSpec]) -> bool:
    return all(s.matches(version) for s in specs)
