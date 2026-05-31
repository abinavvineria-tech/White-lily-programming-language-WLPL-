"""Tests for the repository module."""

import json
import os
import tempfile
import unittest
from unittest.mock import patch, MagicMock

from wlpm.repository import Repository, RepositoryError


class TestRepository(unittest.TestCase):
    def setUp(self):
        self.repo_data = {
            "name": "test-repo",
            "version": "1.0.0",
            "description": "Test repository",
            "packages": {
                "test-pkg": {
                    "versions": {
                        "1.0.0": {
                            "description": "A test package",
                            "author": "Tester",
                            "license": "MIT",
                            "dependencies": {},
                            "download_url": "https://example.com/test-pkg-1.0.0.wlpkg",
                            "checksum": "",
                            "size": 1024,
                            "keywords": ["test"],
                        },
                        "2.0.0": {
                            "description": "A test package v2",
                            "author": "Tester",
                            "license": "MIT",
                            "dependencies": {},
                            "download_url": "https://example.com/test-pkg-2.0.0.wlpkg",
                            "checksum": "",
                            "size": 2048,
                            "keywords": ["test"],
                        },
                    },
                },
                "another-pkg": {
                    "versions": {
                        "0.5.0": {
                            "description": "Another package",
                            "author": "Dev",
                            "license": "MIT",
                            "dependencies": {"test-pkg": ">=1.0.0"},
                            "download_url": "",
                            "checksum": "",
                            "size": 512,
                            "keywords": ["utility"],
                        },
                    },
                },
            },
        }

    def test_parse_repository(self):
        repo = Repository("https://example.com/repo.json")
        repo._data = self.repo_data
        repo._parse()
        self.assertEqual(repo.name, "test-repo")
        self.assertIn("test-pkg", repo.packages)
        self.assertIn("2.0.0", repo.packages["test-pkg"])

    def test_get_package(self):
        repo = Repository("https://example.com/repo.json")
        repo._data = self.repo_data
        repo._parse()
        pkg = repo.get_package("test-pkg")
        self.assertIsNotNone(pkg)
        self.assertIn("1.0.0", pkg)
        self.assertIn("2.0.0", pkg)

    def test_get_version(self):
        repo = Repository("https://example.com/repo.json")
        repo._data = self.repo_data
        repo._parse()
        meta = repo.get_version("test-pkg", "1.0.0")
        self.assertIsNotNone(meta)
        self.assertEqual(meta.name, "test-pkg")
        self.assertEqual(meta.version, "1.0.0")

    def test_get_version_not_found(self):
        repo = Repository("https://example.com/repo.json")
        repo._data = self.repo_data
        repo._parse()
        meta = repo.get_version("nonexistent", "1.0.0")
        self.assertIsNone(meta)

    def test_latest_version(self):
        repo = Repository("https://example.com/repo.json")
        repo._data = self.repo_data
        repo._parse()
        latest = repo.latest_version("test-pkg")
        self.assertEqual(latest, "2.0.0")

    def test_search(self):
        repo = Repository("https://example.com/repo.json")
        repo._data = self.repo_data
        repo._parse()
        results = repo.search("test-pkg")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0][0], "test-pkg")

        results = repo.search("test")
        self.assertGreaterEqual(len(results), 1)

    def test_search_no_results(self):
        repo = Repository("https://example.com/repo.json")
        repo._data = self.repo_data
        repo._parse()
        results = repo.search("nonexistent-query")
        self.assertEqual(len(results), 0)

    def test_verify_checksum(self):
        repo = Repository("https://example.com/repo.json")
        data = b"test data"
        import hashlib
        expected = "sha256:" + hashlib.sha256(data).hexdigest()
        self.assertTrue(repo.verify_checksum(data, expected))
        self.assertFalse(repo.verify_checksum(b"wrong data", expected))

    def test_fetch_from_cache(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Repository("https://example.com/repo.json", cache_dir=tmpdir)
            safe = repo.url.replace("://", "_").replace("/", "_").replace(":", "_")
            cache_path = os.path.join(tmpdir, f"{safe}.json")
            with open(cache_path, "w") as f:
                json.dump(self.repo_data, f)
            result = repo.fetch(use_cache=True)
            self.assertEqual(result["name"], "test-repo")

    @patch("wlpm.repository.urlopen")
    def test_fetch_remote(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps(self.repo_data).encode()
        mock_urlopen.return_value.__enter__.return_value = mock_response

        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Repository("https://example.com/repo.json", cache_dir=tmpdir)
            result = repo.fetch(use_cache=False)
            self.assertEqual(result["name"], "test-repo")

    @patch("wlpm.repository.urlopen")
    def test_fetch_failure_no_cache(self, mock_urlopen):
        from urllib.error import URLError
        mock_urlopen.side_effect = URLError("Connection failed")

        repo = Repository("https://example.com/repo.json")
        with self.assertRaises(RepositoryError):
            repo.fetch(use_cache=False)
