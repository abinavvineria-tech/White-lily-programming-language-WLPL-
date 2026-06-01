"""Tests for the cache module."""

import json
import os
import tempfile
import time
import unittest

from wlpm.cache import Cache, InstallRecord, History


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


class TestHistory(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.history = History(os.path.join(self.tmpdir, "history"))
        self.history.ensure_dirs()

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir)

    def test_add_and_list(self):
        self.history.add_entry("install", [{"name": "pkg-a", "version": "1.0.0"}])
        entries = self.history.list_history()
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["action"], "install")

    def test_last_entry(self):
        self.history.add_entry("install", [{"name": "pkg-a", "version": "1.0.0"}])
        last = self.history.last_entry()
        self.assertEqual(last["action"], "install")

    def test_last_entry_empty(self):
        self.assertIsNone(self.history.last_entry())

    def test_get_entry(self):
        self.history.add_entry("remove", [{"name": "pkg-b"}])
        entries = self.history.list_history()
        eid = entries[0]["id"]
        entry = self.history.get_entry(eid)
        self.assertEqual(entry["action"], "remove")

    def test_undo_last(self):
        self.history.add_entry("install", [{"name": "pkg-a", "version": "1.0.0"}])
        undone = self.history.undo_last()
        self.assertEqual(undone["status"], "undone")
        entry = self.history.last_entry()
        self.assertEqual(entry["status"], "undone")

    def test_limit(self):
        for i in range(5):
            self.history.add_entry("install", [{"name": f"pkg-{i}"}])
        entries = self.history.list_history(limit=2)
        self.assertEqual(len(entries), 2)
