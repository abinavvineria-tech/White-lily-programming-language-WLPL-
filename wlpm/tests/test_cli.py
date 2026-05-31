"""Tests for the CLI module."""

import unittest
from unittest.mock import patch, MagicMock

from wlpm.cli import create_parser, main


class TestCLIParser(unittest.TestCase):
    def setUp(self):
        self.parser = create_parser()

    def test_parser_install(self):
        args = self.parser.parse_args(["install", "test-pkg"])
        self.assertEqual(args.command, "install")
        self.assertEqual(args.package, "test-pkg")

    def test_parser_remove(self):
        args = self.parser.parse_args(["remove", "test-pkg"])
        self.assertEqual(args.command, "remove")
        self.assertEqual(args.package, "test-pkg")

    def test_parser_update(self):
        args = self.parser.parse_args(["update"])
        self.assertEqual(args.command, "update")

    def test_parser_search(self):
        args = self.parser.parse_args(["search", "query"])
        self.assertEqual(args.command, "search")
        self.assertEqual(args.query, "query")

    def test_parser_list(self):
        args = self.parser.parse_args(["list"])
        self.assertEqual(args.command, "list")

    def test_parser_info(self):
        args = self.parser.parse_args(["info", "test-pkg"])
        self.assertEqual(args.command, "info")
        self.assertEqual(args.package, "test-pkg")

    def test_parser_aliases(self):
        args = self.parser.parse_args(["i", "test-pkg"])
        self.assertEqual(args.command, "i")
        args = self.parser.parse_args(["rm", "test-pkg"])
        self.assertEqual(args.command, "rm")
        args = self.parser.parse_args(["ls"])
        self.assertEqual(args.command, "ls")

    def test_parser_version(self):
        with self.assertRaises(SystemExit):
            self.parser.parse_args(["-v"])

    def test_parser_no_args(self):
        args = self.parser.parse_args([])
        self.assertIsNone(args.command)


class TestCLIMain(unittest.TestCase):
    @patch("wlpm.cli.Installer")
    @patch("wlpm.cli.Config")
    def test_main_install(self, MockConfig, MockInstaller):
        mock_config = MagicMock()
        MockConfig.return_value = mock_config
        mock_installer = MagicMock()
        MockInstaller.return_value = mock_installer

        main(["install", "test-pkg"])
        mock_installer.install.assert_called_once_with("test-pkg", "")

    @patch("wlpm.cli.Installer")
    @patch("wlpm.cli.Config")
    def test_main_remove(self, MockConfig, MockInstaller):
        mock_config = MagicMock()
        MockConfig.return_value = mock_config
        mock_installer = MagicMock()
        MockInstaller.return_value = mock_installer

        main(["remove", "test-pkg"])
        mock_installer.remove.assert_called_once_with("test-pkg")

    @patch("wlpm.cli.Installer")
    @patch("wlpm.cli.Config")
    def test_main_update(self, MockConfig, MockInstaller):
        mock_config = MagicMock()
        MockConfig.return_value = mock_config
        mock_installer = MagicMock()
        MockInstaller.return_value = mock_installer

        main(["update"])
        mock_installer.update.assert_called_once()

    @patch("wlpm.cli.Installer")
    @patch("wlpm.cli.Config")
    def test_main_search(self, MockConfig, MockInstaller):
        mock_config = MagicMock()
        MockConfig.return_value = mock_config
        mock_installer = MagicMock()
        MockInstaller.return_value = mock_installer

        main(["search", "query"])
        mock_installer.search.assert_called_once_with("query")

    @patch("wlpm.cli.Installer")
    @patch("wlpm.cli.Config")
    def test_main_list(self, MockConfig, MockInstaller):
        mock_config = MagicMock()
        MockConfig.return_value = mock_config
        mock_installer = MagicMock()
        MockInstaller.return_value = mock_installer

        main(["list"])
        mock_installer.list_packages.assert_called_once()

    @patch("wlpm.cli.Installer")
    @patch("wlpm.cli.Config")
    def test_main_info(self, MockConfig, MockInstaller):
        mock_config = MagicMock()
        MockConfig.return_value = mock_config
        mock_installer = MagicMock()
        MockInstaller.return_value = mock_installer

        main(["info", "test-pkg"])
        mock_installer.info.assert_called_once_with("test-pkg")
