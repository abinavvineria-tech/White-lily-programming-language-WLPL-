"""Command-line interface for WLPM."""

import argparse
import json
import os
import sys

from wlpm import __version__
from wlpm.config import Config
from wlpm.installer import Installer
from wlpm.ui import (
    print_logo,
    success, error, info, warning,
    colorize,
)


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="wlpm",
        description="White Lily Package Manager - Magical package management",
        epilog="Let your garden bloom with White Lily's blessing.",
    )
    parser.add_argument(
        "-v", "--version",
        action="version",
        version=f"WLPM v{__version__} - White Lily Package Manager",
    )
    parser.add_argument(
        "--no-color",
        action="store_true",
        help="Disable colored output",
    )

    sub = parser.add_subparsers(dest="command", help="Available commands")

    p_install = sub.add_parser("install", aliases=["i", "add"], help="Install a package")
    p_install.add_argument("package", help="Package name to install")
    p_install.add_argument("version", nargs="?", default="", help="Version to install")

    p_reinstall = sub.add_parser("reinstall", help="Reinstall a package")
    p_reinstall.add_argument("package", help="Package name to reinstall")

    p_remove = sub.add_parser("remove", aliases=["rm", "uninstall"], help="Remove a package")
    p_remove.add_argument("package", help="Package name to remove")

    p_purge = sub.add_parser("purge", help="Remove a package completely (with config)")
    p_purge.add_argument("package", help="Package name to purge")

    p_autoremove = sub.add_parser("autoremove", help="Remove orphaned packages no longer needed")

    p_update = sub.add_parser("update", aliases=["up"], help="Update package lists (apt-like)")
    p_update.add_argument("--use-cache", action="store_true", help="Use cached repository data")

    p_upgrade = sub.add_parser("upgrade", help="Upgrade all upgradable packages")
    p_full_upgrade = sub.add_parser("full-upgrade", help="Upgrade all packages (full upgrade)")

    p_search = sub.add_parser("search", aliases=["find", "lookup"], help="Search packages")
    p_search.add_argument("query", help="Search query")

    p_list = sub.add_parser("list", aliases=["ls"], help="List installed packages")
    p_list.add_argument("--installed", action="store_true", help="Show installed packages")
    p_list.add_argument("--upgradable", action="store_true", help="Show upgradable packages")

    p_show = sub.add_parser("show", aliases=["info", "view", "inspect"], help="Show package details")
    p_show.add_argument("package", help="Package name")

    p_history = sub.add_parser("history", help="Show transaction history (nala-style)")
    p_history.add_argument("--limit", type=int, default=20, help="Number of entries to show")

    p_undo = sub.add_parser("undo", help="Undo the last transaction (nala-style)")

    p_clean = sub.add_parser("clean", help="Clean the package cache")

    p_cache = sub.add_parser("cache", help="Manage package cache")
    cache_sub = p_cache.add_subparsers(dest="cache_command", help="Cache commands")
    cache_clear = cache_sub.add_parser("clear", help="Clear the package cache")
    cache_info = cache_sub.add_parser("info", help="Show cache information")

    p_config = sub.add_parser("config", help="Manage WLPM configuration")
    config_sub = p_config.add_subparsers(dest="config_command", help="Config commands")
    config_show = config_sub.add_parser("show", help="Show current configuration")
    config_set = config_sub.add_parser("set", help="Set a configuration value")
    config_set.add_argument("key", help="Configuration key")
    config_set.add_argument("value", help="Configuration value")

    p_init = sub.add_parser(
        "init", aliases=["create"],
        help="Initialize a new .wlpkg package in the current directory",
    )

    return parser


def cmd_install(args, installer: Installer):
    installer.install(args.package, args.version)


def cmd_reinstall(args, installer: Installer):
    installer.reinstall(args.package)


def cmd_remove(args, installer: Installer):
    installer.remove(args.package)


def cmd_purge(args, installer: Installer):
    installer.purge(args.package)


def cmd_autoremove(args, installer: Installer):
    installer.autoremove()


def cmd_update(args, installer: Installer):
    installer.update()


def cmd_upgrade(args, installer: Installer):
    installer.upgrade()


def cmd_full_upgrade(args, installer: Installer):
    installer.full_upgrade()


def cmd_search(args, installer: Installer):
    installer.search(args.query)


def cmd_list(args, installer: Installer):
    if args.upgradable:
        installer.list_upgradable()
    else:
        installer.list_packages()


def cmd_show(args, installer: Installer):
    installer.info(args.package)


def cmd_history(args, installer: Installer):
    installer.show_history(args.limit)


def cmd_undo(args, installer: Installer):
    installer.undo()


def cmd_clean(args, installer: Installer):
    installer.clean()


def cmd_cache(args, installer: Installer):
    if args.cache_command == "clear":
        installer.clean()
    elif args.cache_command == "info":
        print()
        info(f"Backend: {installer.backend.name}")
        info("Use 'wlpm list' to see installed packages.")
        print()


def cmd_config(args, installer: Installer):
    if args.config_command == "show":
        print()
        for key, value in installer.config.data.items():
            print(colorize(f"  {key}: ", "green") + colorize(str(value), "silver"))
        print()
    elif args.config_command == "set":
        installer.config.set(args.key, args.value)
        installer.config.save()
        success(f"Set {args.key} = {args.value}")


def cmd_init(args, installer: Installer):
    name = os.path.basename(os.getcwd())
    pkg = {
        "name": name,
        "version": "0.1.0",
        "description": "",
        "author": "",
        "license": "MIT",
        "dependencies": {},
        "files": [],
        "type": "library",
    }
    path = os.path.join(os.getcwd(), f"{name}.wlpkg")
    if os.path.exists(path):
        warning(f"{name}.wlpkg already exists.")
        return
    with open(path, "w", encoding="utf-8") as f:
        json.dump(pkg, f, indent=2, ensure_ascii=False)
    success(f"Initialized {name}.wlpkg in the current garden.")


def main(argv=None):
    parser = create_parser()
    args = parser.parse_args(argv)

    config = Config()
    config.load()
    config.ensure_dirs()

    installer = Installer(config)

    if not args.command:
        print_logo()
        parser.print_help()
        print()
        info("Plant something new: wlpm install <package>")
        print()
        return

    print_logo()

    commands = {
        "install": cmd_install,
        "i": cmd_install,
        "add": cmd_install,
        "reinstall": cmd_reinstall,
        "remove": cmd_remove,
        "rm": cmd_remove,
        "uninstall": cmd_remove,
        "purge": cmd_purge,
        "autoremove": cmd_autoremove,
        "update": cmd_update,
        "up": cmd_update,
        "upgrade": cmd_upgrade,
        "full-upgrade": cmd_full_upgrade,
        "search": cmd_search,
        "find": cmd_search,
        "lookup": cmd_search,
        "list": cmd_list,
        "ls": cmd_list,
        "show": cmd_show,
        "info": cmd_show,
        "view": cmd_show,
        "inspect": cmd_show,
        "history": cmd_history,
        "undo": cmd_undo,
        "clean": cmd_clean,
        "cache": cmd_cache,
        "config": cmd_config,
        "init": cmd_init,
        "create": cmd_init,
    }

    cmd_func = commands.get(args.command)
    if cmd_func:
        try:
            cmd_func(args, installer)
        except KeyboardInterrupt:
            print()
            warning("The garden work was interrupted.")
            sys.exit(1)
        except Exception as e:
            error(f"Something wilted: {e}")
            if config.get("verbose"):
                import traceback
                traceback.print_exc()
            sys.exit(1)
    else:
        parser.print_help()
