"""Tests for the dependency resolver."""

import unittest
from unittest.mock import MagicMock, patch

from wlpm.dependency import DependencyResolver, DependencyError, DependencyGraph


class TestDependencyGraph(unittest.TestCase):
    def test_no_cycle(self):
        g = DependencyGraph()
        g.add_dependency("a", "1.0", "b", ">=1.0")
        g.add_dependency("b", "1.0", "c", ">=1.0")
        self.assertFalse(g.has_cycle())

    def test_cycle_detected(self):
        g = DependencyGraph()
        g.add_dependency("a", "1.0", "b", ">=1.0")
        g.add_dependency("b", "1.0", "a", ">=1.0")
        self.assertTrue(g.has_cycle())

    def test_self_cycle(self):
        g = DependencyGraph()
        g.add_dependency("a", "1.0", "a", ">=1.0")
        self.assertTrue(g.has_cycle())


class TestDependencyResolver(unittest.TestCase):
    def setUp(self):
        self.mock_repos = []
        self.mock_cache = MagicMock()
        self.resolver = DependencyResolver(self.mock_repos, self.mock_cache)

    def _make_repo(self, packages: dict):
        repo = MagicMock()
        def get_package(name):
            return packages.get(name)
        repo.get_package = get_package
        return repo

    def test_resolve_simple(self):
        repo = self._make_repo({
            "a": {
                "1.0.0": MagicMock(
                    name="a",
                    version="1.0.0",
                    dependencies={},
                ),
            },
        })
        self.resolver.repositories = [repo]
        result = self.resolver.resolve("a")
        self.assertEqual(result, {"a": "1.0.0"})

    def test_resolve_with_deps(self):
        repo = self._make_repo({
            "a": {
                "1.0.0": MagicMock(
                    name="a",
                    version="1.0.0",
                    dependencies={"b": ">=1.0.0"},
                ),
            },
            "b": {
                "2.0.0": MagicMock(
                    name="b",
                    version="2.0.0",
                    dependencies={"c": ">=1.0.0"},
                ),
            },
            "c": {
                "1.5.0": MagicMock(
                    name="c",
                    version="1.5.0",
                    dependencies={},
                ),
            },
        })
        self.resolver.repositories = [repo]
        result = self.resolver.resolve("a")
        self.assertEqual(result["a"], "1.0.0")
        self.assertEqual(result["b"], "2.0.0")
        self.assertEqual(result["c"], "1.5.0")

    def test_resolve_version_spec(self):
        repo = self._make_repo({
            "a": {
                "1.0.0": MagicMock(
                    name="a", version="1.0.0", dependencies={},
                ),
                "2.0.0": MagicMock(
                    name="a", version="2.0.0", dependencies={},
                ),
                "3.0.0": MagicMock(
                    name="a", version="3.0.0", dependencies={},
                ),
            },
        })
        self.resolver.repositories = [repo]
        result = self.resolver.resolve("a", ">=1.0.0,<3.0.0")
        self.assertEqual(result["a"], "2.0.0")

    def test_resolve_not_found(self):
        repo = self._make_repo({})
        self.resolver.repositories = [repo]
        with self.assertRaises(DependencyError):
            self.resolver.resolve("nonexistent")

    def test_version_conflict(self):
        repo = self._make_repo({
            "a": {
                "1.0.0": MagicMock(
                    name="a", version="1.0.0",
                    dependencies={"b": ">=2.0.0"},
                ),
            },
            "b": {
                "1.0.0": MagicMock(
                    name="b", version="1.0.0", dependencies={},
                ),
            },
        })
        self.resolver.repositories = [repo]
        with self.assertRaises(DependencyError):
            self.resolver.resolve("a")
