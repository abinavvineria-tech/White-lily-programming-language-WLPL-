"""Tests for the cache module."""

import json
import os
import tempfile
import unittest

from wlpm.cache import Cache, InstallRecord


class TestCache(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.cache = Cache(os.path.join(self.tmpdir, "cache"))
        self.cache.ensure_dirs()

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir)

    def test_cache_package(self):
        data = b"test package data"
        self.cache.cache_package("test-pkg", "1.0.0", data)
        self.assertTrue(self.cache.is_cached("test-pkg", "1.0.0"))
        self.assertEqual(
            self.cache.get_cached_package("test-pkg", "1.0.0"),
            data,
        )

    def test_cache_not_cached(self):
        self.assertFalse(self.cache.is_cached("nonexistent", "1.0.0"))
        self.assertIsNone(self.cache.get_cached_package("nonexistent", "1.0.0"))

    def test_save_and_get_metadata(self):
        meta = {"version": "1.0.0", "description": "Test"}
        self.cache.save_metadata("test-pkg", "1.0.0", meta)
        result = self.cache.get_metadata("test-pkg")
        self.assertIn("1.0.0", result)
        self.assertEqual(result["1.0.0"]["description"], "Test")

    def test_is_installed(self):
        self.assertFalse(self.cache.is_installed("test-pkg"))
        self.cache.save_metadata("test-pkg", "1.0.0", {"version": "1.0.0"})
        self.assertTrue(self.cache.is_installed("test-pkg"))
        self.assertTrue(self.cache.is_installed("test-pkg", "1.0.0"))
        self.assertFalse(self.cache.is_installed("test-pkg", "2.0.0"))

    def test_list_installed(self):
        self.cache.save_metadata("pkg-a", "1.0.0", {"version": "1.0.0"})
        self.cache.save_metadata("pkg-b", "2.0.0", {"version": "2.0.0"})
        installed = self.cache.list_installed()
        self.assertEqual(len(installed), 2)
        names = [i[0] for i in installed]
        self.assertIn("pkg-a", names)
        self.assertIn("pkg-b", names)

    def test_remove_package(self):
        self.cache.save_metadata("test-pkg", "1.0.0", {"version": "1.0.0"})
        self.cache.cache_package("test-pkg", "1.0.0", b"data")
        self.cache.remove_package("test-pkg", "1.0.0")
        self.assertFalse(self.cache.is_installed("test-pkg"))

    def test_remove_all_versions(self):
        self.cache.save_metadata("test-pkg", "1.0.0", {"version": "1.0.0"})
        self.cache.save_metadata("test-pkg", "2.0.0", {"version": "2.0.0"})
        self.cache.remove_package("test-pkg")
        self.assertFalse(self.cache.is_installed("test-pkg"))

    def test_clear(self):
        self.cache.save_metadata("test-pkg", "1.0.0", {"version": "1.0.0"})
        self.cache.clear()
        self.assertFalse(self.cache.is_installed("test-pkg"))
        self.assertTrue(os.path.exists(self.cache.cache_dir))

    def test_total_size(self):
        self.cache.cache_package("test-pkg", "1.0.0", b"x" * 1000)
        size = self.cache.total_size()
        self.assertGreaterEqual(size, 1000)


class TestInstallRecord(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.records = InstallRecord(os.path.join(self.tmpdir, "installed"))
        self.records.ensure_dirs()

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir)

    def test_add_and_get(self):
        self.records.add("test-pkg", "1.0.0", ["file1.py"], {"dep": ">=1.0"})
        result = self.records.get("test-pkg")
        self.assertIsNotNone(result)
        self.assertEqual(result["version"], "1.0.0")
        self.assertEqual(result["files"], ["file1.py"])

    def test_remove(self):
        self.records.add("test-pkg", "1.0.0", [], {})
        self.records.remove("test-pkg")
        self.assertIsNone(self.records.get("test-pkg"))

    def test_list_all(self):
        self.records.add("pkg-a", "1.0.0", [], {})
        self.records.add("pkg-b", "2.0.0", [], {})
        all_pkgs = self.records.list_all()
        self.assertIn("pkg-a", all_pkgs)
        self.assertIn("pkg-b", all_pkgs)
        self.assertEqual(len(all_pkgs), 2)
