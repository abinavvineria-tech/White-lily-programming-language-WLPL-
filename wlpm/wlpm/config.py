"""Configuration management for WLPM."""

import json
import os
import platform

CONFIG_DIR_NAME = ".wlpm"
CONFIG_FILE_NAME = "config.json"
CACHE_DIR_NAME = "cache"
INSTALL_DIR_NAME = "packages"
REPOS_DIR_NAME = "repos"

DEFAULT_CONFIG = {
    "repositories": [
        "https://raw.githubusercontent.com/white-lily/wlpm-repository/main/repository.json"
    ],
    "install_dir": "",
    "cache_dir": "",
    "auto_update": True,
    "color": True,
    "verbose": False,
    "default_license": "MIT",
}


def _get_config_base() -> str:
    system = platform.system().lower()
    if "termux" in platform.platform().lower() or os.path.exists("/data/data/com.termux"):
        base = os.path.join(os.path.expanduser("~"), ".config", CONFIG_DIR_NAME)
    elif system == "windows":
        base = os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), CONFIG_DIR_NAME)
    elif system == "darwin":
        base = os.path.join(os.path.expanduser("~"), "Library", "Application Support", CONFIG_DIR_NAME)
    else:
        xdg = os.environ.get("XDG_CONFIG_HOME", os.path.join(os.path.expanduser("~"), ".config"))
        base = os.path.join(xdg, CONFIG_DIR_NAME)
    return base


class Config:
    def __init__(self, config_dir: str = ""):
        self.config_dir = config_dir or _get_config_base()
        self.config_path = os.path.join(self.config_dir, CONFIG_FILE_NAME)
        self.data = dict(DEFAULT_CONFIG)
        self._loaded = False

    @property
    def cache_dir(self) -> str:
        return self.data.get("cache_dir") or os.path.join(self.config_dir, CACHE_DIR_NAME)

    @property
    def install_dir(self) -> str:
        return self.data.get("install_dir") or os.path.join(self.config_dir, INSTALL_DIR_NAME)

    @property
    def repos_dir(self) -> str:
        return os.path.join(self.config_dir, REPOS_DIR_NAME)

    def load(self):
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    user_data = json.load(f)
                self.data.update(user_data)
            except (json.JSONDecodeError, OSError):
                pass
        self._loaded = True

    def save(self):
        os.makedirs(self.config_dir, exist_ok=True)
        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)

    def get(self, key: str, default=None):
        return self.data.get(key, default)

    def set(self, key: str, value):
        self.data[key] = value

    def ensure_dirs(self):
        for d in [self.config_dir, self.cache_dir, self.install_dir, self.repos_dir]:
            os.makedirs(d, exist_ok=True)
