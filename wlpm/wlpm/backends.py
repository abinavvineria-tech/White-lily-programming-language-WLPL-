"""System package manager backends for WLPM."""

import os
import re
import shlex
import subprocess
import sys
from typing import Optional


def detect_backend():
    if os.path.exists("/data/data/com.termux"):
        termux_home = os.environ.get("HOME", "")
        if termux_home and os.path.exists(os.path.join(termux_home, ".termux")):
            return "pkg"
    for cmd in ("apt", "nala"):
        if subprocess.run(["which", cmd], capture_output=True).returncode == 0:
            return cmd
    for cmd in ("apt-get",):
        if subprocess.run(["which", cmd], capture_output=True).returncode == 0:
            return cmd
    return None


def run(cmd, capture_output=True, check=False, quiet=False, timeout=300):
    if not quiet:
        from wlpm.ui import info
        info(f"Running: {' '.join(cmd)}")
    try:
        result = subprocess.run(
            cmd,
            capture_output=capture_output,
            text=True,
            check=check,
            timeout=timeout,
        )
        return result
    except subprocess.CalledProcessError as e:
        if not quiet:
            from wlpm.ui import error
            error(f"Command failed: {e.stderr.strip() if e.stderr else str(e)}")
        raise
    except subprocess.TimeoutExpired:
        from wlpm.ui import error
        error("Command timed out.")
        raise


class Backend:
    name = "auto"

    def install(self, packages, reinstall=False):
        raise NotImplementedError

    def remove(self, packages):
        raise NotImplementedError

    def purge(self, packages):
        raise NotImplementedError

    def update(self):
        raise NotImplementedError

    def upgrade(self, packages=None):
        raise NotImplementedError

    def full_upgrade(self):
        raise NotImplementedError

    def autoremove(self):
        raise NotImplementedError

    def search(self, query):
        raise NotImplementedError

    def show(self, package):
        raise NotImplementedError

    def list_installed(self):
        raise NotImplementedError

    def list_upgradable(self):
        raise NotImplementedError

    def clean(self):
        raise NotImplementedError


class AptBackend(Backend):
    name = "apt"

    def __init__(self):
        self.bin = detect_backend()

    def install(self, packages, reinstall=False):
        cmd = ["apt", "install"] + (["--reinstall"] if reinstall else []) + packages
        return run(cmd, capture_output=False, check=False, quiet=True)

    def remove(self, packages):
        cmd = ["apt", "remove"] + packages
        return run(cmd, capture_output=False, check=False, quiet=True)

    def purge(self, packages):
        cmd = ["apt", "purge"] + packages
        return run(cmd, capture_output=False, check=False, quiet=True)

    def update(self):
        return run(["apt", "update"], capture_output=False, check=False, quiet=True)

    def upgrade(self, packages=None):
        if packages:
            cmd = ["apt", "upgrade"] + packages
        else:
            cmd = ["apt", "upgrade"]
        return run(cmd, capture_output=False, check=False, quiet=True)

    def full_upgrade(self):
        return run(["apt", "full-upgrade"], capture_output=False, check=False, quiet=True)

    def autoremove(self):
        return run(["apt", "autoremove"], capture_output=False, check=False, quiet=True)

    def search(self, query):
        result = run(["apt", "search", query])
        return result.stdout if result else ""

    def show(self, package):
        result = run(["apt", "show", package])
        return result.stdout if result else ""

    def list_installed(self):
        result = run(["apt", "list", "--installed"])
        return self._parse_list(result.stdout) if result else []

    def list_upgradable(self):
        result = run(["apt", "list", "--upgradable"])
        return self._parse_list(result.stdout) if result else []

    def clean(self):
        return run(["apt", "clean"], capture_output=False, check=False, quiet=True)

    def _parse_list(self, output):
        lines = output.strip().split("\n")[1:]
        packages = []
        for line in lines:
            if not line.strip():
                continue
            parts = line.split()
            if not parts:
                continue
            pkg_part = parts[0]
            if "/" in pkg_part:
                name = pkg_part.split("/")[0]
            else:
                name = pkg_part
            version = ""
            status = ""
            for p in parts[1:]:
                if p.startswith("[") and p.endswith("]"):
                    status = p[1:-1]
                elif not version and re.match(r"^[\d.]+", p):
                    version = p.rstrip(",")
            packages.append({"name": name, "version": version, "status": status})
        return packages


class PkgBackend(AptBackend):
    name = "pkg"

    def __init__(self):
        self.bin = "pkg"

    def install(self, packages, reinstall=False):
        cmd = ["pkg", "install"] + packages
        return run(cmd, capture_output=False, check=False, quiet=True)

    def remove(self, packages):
        cmd = ["pkg", "uninstall"] + packages
        return run(cmd, capture_output=False, check=False, quiet=True)

    def purge(self, packages):
        cmd = ["apt", "purge"] + packages
        return run(cmd, capture_output=False, check=False, quiet=True)

    def update(self):
        return run(["pkg", "update"], capture_output=False, check=False, quiet=True)

    def upgrade(self, packages=None):
        if packages:
            cmd = ["pkg", "upgrade"] + packages
        else:
            cmd = ["pkg", "upgrade"]
        return run(cmd, capture_output=False, check=False, quiet=True)

    def full_upgrade(self):
        return run(["pkg", "upgrade"], capture_output=False, check=False, quiet=True)

    def autoremove(self):
        return run(["apt", "autoremove"], capture_output=False, check=False, quiet=True)

    def search(self, query):
        result = run(["pkg", "search", query])
        return result.stdout if result else ""

    def show(self, package):
        result = run(["apt", "show", package])
        return result.stdout if result else ""

    def list_installed(self):
        result = run(["pkg", "list-installed"])
        return self._parse_pkg_list(result.stdout) if result else []

    def list_upgradable(self):
        result = run(["apt", "list", "--upgradable"])
        return self._parse_list(result.stdout) if result else []

    def clean(self):
        return run(["apt", "clean"], capture_output=False, check=False, quiet=True)

    def _parse_pkg_list(self, output):
        lines = output.strip().split("\n")
        packages = []
        for line in lines:
            if not line.strip():
                continue
            parts = line.split("/")
            if parts:
                name = parts[0].strip()
                version = parts[1].strip() if len(parts) > 1 else ""
                packages.append({"name": name, "version": version, "status": ""})
        return packages


def get_backend():
    detected = detect_backend()
    if detected == "pkg":
        return PkgBackend()
    elif detected and detected in ("apt", "nala", "apt-get"):
        return AptBackend()
    return None
