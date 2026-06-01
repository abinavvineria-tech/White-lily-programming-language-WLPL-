"""Package installation, removal, and update logic using system package manager."""

import os
import re
import shutil
import subprocess

from wlpm.backends import get_backend
from wlpm.cache import InstallRecord, History
from wlpm.ui import (
    success, error, info, warning,
    install_msg, remove_msg, update_msg, done_msg,
    confirm, colorize, Spinner,
)


class Installer:
    def __init__(self, config):
        self.config = config
        self.backend = get_backend()
        self.records = InstallRecord(config.install_dir)
        self.history = History(os.path.join(config.config_dir, "history"))

        if not self.backend:
            error("No supported package manager found (apt/pkg).")
            raise SystemExit(1)

    def install(self, package_name: str, version: str = ""):
        packages = [package_name]
        if version:
            packages = [f"{package_name}={version}"]

        display = f"{package_name} {version}" if version else package_name
        install_msg(display)

        if not confirm(f"Install {display}?"):
            return False

        with Spinner(f"Planting {package_name}..."):
            try:
                self.backend.install(packages)
            except subprocess.CalledProcessError:
                error(f"Failed to install {package_name}.")
                return False

        success(f"{package_name} has bloomed.")
        self.history.add_entry("install", [{"name": package_name, "version": version}])
        done_msg()
        return True

    def reinstall(self, package_name: str):
        install_msg(f"{package_name} (replant)")

        if not confirm(f"Reinstall {package_name}?"):
            return False

        with Spinner(f"Replanting {package_name}..."):
            try:
                self.backend.install([package_name], reinstall=True)
            except subprocess.CalledProcessError:
                error(f"Failed to reinstall {package_name}.")
                return False

        success(f"{package_name} has been replanted.")
        self.history.add_entry("reinstall", [{"name": package_name}])
        done_msg()
        return True

    def remove(self, package_name: str, record: bool = True):
        remove_msg(package_name)

        if not confirm(f"Remove {package_name}?"):
            return False

        with Spinner(f"Gathering petals of {package_name}..."):
            try:
                self.backend.remove([package_name])
            except subprocess.CalledProcessError:
                error(f"Failed to remove {package_name}.")
                return False

        success(f"{package_name}'s petals have returned to the garden.")
        if record:
            self.history.add_entry("remove", [{"name": package_name}])
        done_msg()
        return True

    def purge(self, package_name: str):
        warning(f"Purging {package_name} (removes config files too)")

        if not confirm(f"Purge {package_name}?"):
            return False

        with Spinner(f"Purging {package_name}..."):
            try:
                self.backend.purge([package_name])
            except subprocess.CalledProcessError:
                error(f"Failed to purge {package_name}.")
                return False

        success(f"{package_name} has been completely removed.")
        self.history.add_entry("purge", [{"name": package_name}])
        done_msg()
        return True

    def autoremove(self):
        info("Checking for orphaned packages...")

        if not confirm("Remove orphaned packages?"):
            return False

        with Spinner("Sweeping the garden..."):
            try:
                self.backend.autoremove()
            except subprocess.CalledProcessError:
                error("Failed to autoremove.")
                return False

        success("Orphaned petals have been swept away.")
        self.history.add_entry("autoremove", [])
        done_msg()
        return True

    def update(self):
        update_msg()
        info("Refreshing package lists...")

        with Spinner("Gathering fresh seeds..."):
            try:
                self.backend.update()
            except subprocess.CalledProcessError:
                error("Failed to update package lists.")
                return False

        success("Package lists refreshed.")
        done_msg()
        return True

    def upgrade(self):
        info("Checking for upgradable packages...")

        upgradable = self.backend.list_upgradable()
        if not upgradable:
            info("All flowers are at their full bloom.")
            return True

        print()
        info(f"Found {len(upgradable)} upgradable package(s):")
        for pkg in upgradable:
            line = f"  \u2022 {pkg['name']}"
            if pkg.get("version"):
                line += colorize(f"  {pkg['version']}", "crystal_dim")
            print(line)
        print()

        if not confirm("Water these flowers (upgrade)?"):
            return False

        with Spinner("Watering the garden..."):
            try:
                self.backend.upgrade()
            except subprocess.CalledProcessError:
                error("Upgrade failed.")
                return False

        success("Garden has been watered.")
        self.history.add_entry("upgrade", [{"name": p["name"]} for p in upgradable])
        done_msg()
        return True

    def full_upgrade(self):
        info("Performing full garden renovation...")

        if not confirm("Full upgrade?"):
            return False

        with Spinner("Renovating the garden..."):
            try:
                self.backend.full_upgrade()
            except subprocess.CalledProcessError:
                error("Full upgrade failed.")
                return False

        success("Full garden renovation complete.")
        self.history.add_entry("full-upgrade", [])
        done_msg()
        return True

    def search(self, query: str):
        with Spinner(f"Searching for {query}..."):
            output = self.backend.search(query)

        if not output or not output.strip():
            info(f"No flowers found matching '{query}'.")
            return

        print()
        print(colorize(f"  Search results for '{query}':", "bold", "white"))
        print()
        for line in output.strip().split("\n"):
            if line.strip():
                print(f"  {colorize('\u2022', 'green')}  {colorize(line, 'silver')}")
        print()

    def show(self, package_name: str):
        with Spinner(f"Looking up {package_name}..."):
            output = self.backend.show(package_name)

        if not output or "Unable to locate" in output or "No packages found" in output:
            warning(f"No flower named '{package_name}' found.")
            return

        print()
        self._print_package_info(output)

    def _print_package_info(self, output):
        fields = {
            "Package": ("white", True),
            "Version": ("crystal", False),
            "Essential": ("dim", False),
            "Maintainer": ("silver", False),
            "Installed-Size": ("crystal_dim", False),
            "Depends": ("dim", False),
            "Recommends": ("dim", False),
            "Homepage": ("crystal_dim", False),
            "Download-Size": ("crystal_dim", False),
            "Description": ("silver", True),
        }
        for line in output.strip().split("\n"):
            for field, (color, bold) in fields.items():
                if line.startswith(f"{field}:"):
                    label = colorize(f"  {field}:", color)
                    if bold:
                        label = colorize(f"  {field}:", "bold", color)
                    value = line[len(field) + 1:].strip()
                    print(f"{label} {colorize(value, 'silver')}")
        print()

    def list_packages(self):
        with Spinner("Listing flowers..."):
            packages = self.backend.list_installed()

        if not packages:
            info("No flowers planted yet.")
            return

        print()
        print(colorize("  Flowers blooming in the garden:", "bold", "white"))
        print()
        for pkg in sorted(packages, key=lambda x: x["name"]):
            name = pkg["name"]
            version = pkg.get("version", "")
            status = pkg.get("status", "")
            line = f"  {colorize('\u2022', 'green')}  {colorize(name, 'white')}"
            if version:
                line += colorize(f"  v{version}", "crystal_dim")
            if status:
                line += colorize(f"  [{status}]", "dim")
            print(line)
        print(f"  {colorize(f'Total: {len(packages)}', 'dim')}")

    def list_upgradable(self):
        with Spinner("Checking for upgrades..."):
            packages = self.backend.list_upgradable()

        if not packages:
            info("All flowers are at their full bloom.")
            return

        print()
        print(colorize("  Upgradable flowers:", "bold", "white"))
        print()
        for pkg in packages:
            line = f"  {colorize('\u2022', 'green')}  {colorize(pkg['name'], 'white')}"
            if pkg.get("version"):
                line += colorize(f"  {pkg['version']}", "crystal_dim")
            print(line)
        print(f"  {colorize(f'Total: {len(packages)}', 'dim')}")

    def info(self, package_name: str):
        self.show(package_name)

    def show_history(self, limit: int = 20):
        entries = self.history.list_history(limit)
        if not entries:
            info("The garden has no history yet.")
            return

        print()
        print(colorize("  \u2740 Garden History \u2740", "green_bold"))
        print()
        for entry in entries:
            eid = entry.get("id", "?")
            action = entry.get("action", "?")
            timestamp = entry.get("time", "")
            status = entry.get("status", "completed")
            pkgs = entry.get("packages", [])
            names = ", ".join(p.get("name", "?") for p in pkgs)

            status_tag = colorize("\u2713", "green") if status == "completed" else colorize("\u21A9", "yellow")
            print(f"  {colorize(str(eid).rjust(3), 'silver')}  {status_tag}  "
                  f"{colorize(action.ljust(12), 'crystal')}  "
                  f"{colorize(names, 'white')}  "
                  f"{colorize(timestamp, 'dim')}")
        print()

    def undo(self):
        last = self.history.last_entry()
        if not last:
            info("Nothing to undo.")
            return

        action = last["action"]
        packages = last["packages"]
        info(f"Undoing {action} of {len(packages)} package(s)...")

        if action in ("install", "upgrade", "reinstall"):
            for pkg in packages:
                name = pkg["name"]
                with Spinner(f"Removing {name}..."):
                    try:
                        self.backend.remove([name])
                    except subprocess.CalledProcessError:
                        error(f"Failed to undo {name}.")
                        continue
                success(f"{name} has been returned to the earth.")
        elif action in ("remove", "purge", "autoremove"):
            warning("Cannot undo removal automatically. Reinstall with 'wlpm install'.")
            return
        else:
            warning(f"Cannot undo '{action}'.")
            return

        self.history.undo_last()
        done_msg()

    def clean(self):
        if not confirm("Clean the package cache?"):
            return False

        with Spinner("Cleaning the garden..."):
            try:
                self.backend.clean()
            except subprocess.CalledProcessError:
                error("Failed to clean cache.")
                return False

        success("Garden cleaned.")
        done_msg()
        return True
