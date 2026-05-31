"""Tests for the package module."""

import json
import os
import tempfile
import unittest

from wlpm.package import (
    Version,
    VersionSpec,
    PackageMetadata,
    parse_dependency_spec,
    check_version_satisfies,
)


class TestVersion(unittest.TestCase):
    def test_parse_full(self):
        v = Version.parse("1.2.3")
        self.assertEqual(v.major, 1)
        self.assertEqual(v.minor, 2)
        self.assertEqual(v.patch, 3)

    def test_parse_major_minor(self):
        v = Version.parse("1.2")
        self.assertEqual(v.major, 1)
        self.assertEqual(v.minor, 2)
        self.assertEqual(v.patch, 0)

    def test_parse_major_only(self):
        v = Version.parse("1")
        self.assertEqual(v.major, 1)
        self.assertEqual(v.minor, 0)
        self.assertEqual(v.patch, 0)

    def test_comparison(self):
        self.assertTrue(Version.parse("2.0.0") > Version.parse("1.9.9"))
        self.assertTrue(Version.parse("1.0.0") < Version.parse("1.0.1"))
        self.assertTrue(Version.parse("1.0.0") == Version.parse("1.0.0"))
        self.assertTrue(Version.parse("1.0.0") >= Version.parse("1.0.0"))
        self.assertTrue(Version.parse("1.0.0") <= Version.parse("1.0.0"))

    def test_invalid(self):
        with self.assertRaises(ValueError):
            Version.parse("not-a-version")

    def test_str(self):
        self.assertEqual(str(Version.parse("1.2.3")), "1.2.3")
        self.assertEqual(str(Version.parse("1.0.0")), "1.0.0")


class TestVersionSpec(unittest.TestCase):
    def test_exact(self):
        spec = VersionSpec.parse("1.0.0")
        self.assertTrue(spec.matches(Version.parse("1.0.0")))
        self.assertFalse(spec.matches(Version.parse("1.0.1")))

    def test_greater_equal(self):
        spec = VersionSpec.parse(">=1.0.0")
        self.assertTrue(spec.matches(Version.parse("1.0.0")))
        self.assertTrue(spec.matches(Version.parse("2.0.0")))
        self.assertFalse(spec.matches(Version.parse("0.9.0")))

    def test_less_equal(self):
        spec = VersionSpec.parse("<=1.0.0")
        self.assertTrue(spec.matches(Version.parse("1.0.0")))
        self.assertTrue(spec.matches(Version.parse("0.9.0")))
        self.assertFalse(spec.matches(Version.parse("1.0.1")))

    def test_greater(self):
        spec = VersionSpec.parse(">1.0.0")
        self.assertTrue(spec.matches(Version.parse("1.0.1")))
        self.assertFalse(spec.matches(Version.parse("1.0.0")))
        self.assertFalse(spec.matches(Version.parse("0.9.0")))

    def test_less(self):
        spec = VersionSpec.parse("<1.0.0")
        self.assertTrue(spec.matches(Version.parse("0.9.9")))
        self.assertFalse(spec.matches(Version.parse("1.0.0")))

    def test_not_equal(self):
        spec = VersionSpec.parse("!=1.0.0")
        self.assertTrue(spec.matches(Version.parse("1.0.1")))
        self.assertFalse(spec.matches(Version.parse("1.0.0")))

    def test_caret(self):
        spec = VersionSpec.parse("^1.0.0")
        self.assertTrue(spec.matches(Version.parse("1.0.0")))
        self.assertTrue(spec.matches(Version.parse("1.5.0")))
        self.assertFalse(spec.matches(Version.parse("2.0.0")))

    def test_tilde(self):
        spec = VersionSpec.parse("~1.0.0")
        self.assertTrue(spec.matches(Version.parse("1.0.0")))
        self.assertTrue(spec.matches(Version.parse("1.0.5")))
        self.assertFalse(spec.matches(Version.parse("1.1.0")))
        self.assertFalse(spec.matches(Version.parse("2.0.0")))

    def test_invalid(self):
        with self.assertRaises(ValueError):
            VersionSpec.parse("not-a-spec")


class TestParseDependencySpec(unittest.TestCase):
    def test_single(self):
        specs = parse_dependency_spec(">=1.0.0")
        self.assertEqual(len(specs), 1)
        self.assertTrue(specs[0].matches(Version.parse("1.0.0")))

    def test_range(self):
        specs = parse_dependency_spec(">=1.0.0,<2.0.0")
        self.assertEqual(len(specs), 2)
        self.assertTrue(check_version_satisfies(Version.parse("1.5.0"), specs))
        self.assertFalse(check_version_satisfies(Version.parse("2.0.0"), specs))
        self.assertFalse(check_version_satisfies(Version.parse("0.9.0"), specs))


class TestPackageMetadata(unittest.TestCase):
    def test_from_dict(self):
        data = {
            "name": "test-package",
            "version": "1.0.0",
            "description": "A test package",
            "author": "Test Author",
            "license": "MIT",
            "dependencies": {"dep1": ">=1.0.0"},
            "files": ["file1.py"],
            "type": "library",
        }
        meta = PackageMetadata.from_dict(data)
        self.assertEqual(meta.name, "test-package")
        self.assertEqual(meta.version, "1.0.0")
        self.assertEqual(meta.description, "A test package")
        self.assertEqual(meta.author, "Test Author")

    def test_to_dict(self):
        meta = PackageMetadata(
            name="test",
            version="1.0.0",
            description="desc",
            author="author",
            dependencies={"dep": ">=1.0"},
        )
        d = meta.to_dict()
        self.assertEqual(d["name"], "test")
        self.assertEqual(d["version"], "1.0.0")
        self.assertEqual(d["dependencies"], {"dep": ">=1.0"})

    def test_wlpkg_roundtrip(self):
        meta = PackageMetadata(
            name="roundtrip",
            version="2.0.0",
            description="Round trip test",
            author="Tester",
        )
        with tempfile.NamedTemporaryFile(mode="w", suffix=".wlpkg", delete=False) as f:
            path = f.name
        try:
            meta.to_wlpkg(path)
            loaded = PackageMetadata.from_wlpkg(path)
            self.assertEqual(loaded.name, meta.name)
            self.assertEqual(loaded.version, meta.version)
            self.assertEqual(loaded.description, meta.description)
        finally:
            os.unlink(path)
