"""Command-line interface for WLPM."""

import argparse
import os
import sys

from wlpm import __version__
from wlpm.config import Config
from wlpm.installer import Installer
from wlpm.ui import (
    print_logo, print_header,
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

    p_remove = sub.add_parser("remove", aliases=["rm", "uninstall"], help="Remove a package")
    p_remove.add_argument("package", help="Package name to remove")

    p_update = sub.add_parser("update", aliases=["up", "refresh"], help="Update all packages")

    p_search = sub.add_parser("search", aliases=["find", "lookup"], help="Search packages")
    p_search.add_argument("query", help="Search query")

    p_list = sub.add_parser("list", aliases=["ls", "show"], help="List installed packages")

    p_info = sub.add_parser("info", aliases=["view", "inspect"], help="Show package info")
    p_info.add_argument("package", help="Package name")

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


def cmd_remove(args, installer: Installer):
    installer.remove(args.package)


def cmd_update(args, installer: Installer):
    installer.update()


def cmd_search(args, installer: Installer):
    installer.search(args.query)


def cmd_list(args, installer: Installer):
    installer.list_packages()


def cmd_info(args, installer: Installer):
    installer.info(args.package)


def cmd_cache(args, installer: Installer):
    if args.cache_command == "clear":
        installer.cache.clear()
        success("The garden has been cleared.")
    elif args.cache_command == "info":
        total = installer.cache.total_size()
        installed = len(installer.records.list_all())
        print()
        info(f"Cached packages: {len(os.listdir(installer.cache.packages_dir)) if os.path.exists(installer.cache.packages_dir) else 0}")
        info(f"Installed packages: {installed}")
        info(f"Cache size: {_format_size(total)}")
        print()


def cmd_config(args, installer: Installer):
    if args.config_command == "show":
        print()
        for key, value in installer.config.data.items():
            if key in ("repositories",):
                print(colorize(f"  {key}:", "green"))
                for repo in value:
                    print(colorize(f"    - {repo}", "dim"))
            else:
                print(colorize(f"  {key}: ", "green") + colorize(str(value), "silver"))
        print()
    elif args.config_command == "set":
        installer.config.set(args.key, args.value)
        installer.config.save()
        success(f"Set {args.key} = {args.value}")


def cmd_init(args, installer: Installer):
    import json
    import os
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


def _format_size(size: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"


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
        "remove": cmd_remove,
        "rm": cmd_remove,
        "uninstall": cmd_remove,
        "update": cmd_update,
        "up": cmd_update,
        "refresh": cmd_update,
        "search": cmd_search,
        "find": cmd_search,
        "lookup": cmd_search,
        "list": cmd_list,
        "ls": cmd_list,
        "show": cmd_list,
        "info": cmd_info,
        "view": cmd_info,
        "inspect": cmd_info,
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
