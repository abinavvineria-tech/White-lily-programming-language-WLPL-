# White Lily Package Manager (WLPM)

> *"A new flower blooms..."*

**WLPM** is an elegant, flower-themed package manager inspired by White Lily Cookie from *Cookie Run: Kingdom*. It brings a magical garden aesthetic to your terminal while providing robust package management features.

## Features

- 🌸 **Flower-Themed CLI** — Beautiful terminal output with flower animations, colored messages, and garden metaphors
- 📦 **Full Package Lifecycle** — Install, remove, update, search, list, and inspect packages
- 🌿 **Dependency Resolution** — Automatic dependency resolution with version conflict detection
- 🗃️ **JSON Repositories** — Simple JSON-based package repository format
- 💾 **Local Cache** — Efficient caching of downloaded packages
- 🔌 **Plugin System** — Extend WLPM with custom plugins and hooks
- ⚡ **Fast** — Lightweight and performant with minimal dependencies
- 🌍 **Cross-Platform** — Works on Linux, macOS, Windows, and Termux

## Installation

```bash
pip install wlpm
```

Or from source:

```bash
git clone https://github.com/white-lily/wlpm.git
cd wlpm
pip install -e .
```

## Quick Start

```bash
# Install a package
wlpm install lily-utils

# Remove a package
wlpm remove lily-utils

# Update all packages
wlpm update

# Search for packages
wlpm search http

# List installed packages
wlpm list

# Get package info
wlpm info lily-utils

# Initialize a new .wlpkg package
wlpm init
```

## Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `install <package>` | `i`, `add` | Install a package |
| `remove <package>` | `rm`, `uninstall` | Remove a package |
| `update` | `up`, `refresh` | Update all packages |
| `search <query>` | `find`, `lookup` | Search for packages |
| `list` | `ls`, `show` | List installed packages |
| `info <package>` | `view`, `inspect` | Show package info |
| `cache clear` | | Clear the package cache |
| `cache info` | | Show cache information |
| `config show` | | Show configuration |
| `config set <key> <value>` | | Set configuration value |
| `init` | `create` | Initialize a .wlpkg package |

## .wlpkg Package Format

WLPM uses `.wlpkg` (White Lily Package) files, which are JSON-based:

```json
{
  "name": "my-package",
  "version": "1.0.0",
  "description": "A beautiful package",
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "lily-utils": ">=1.0.0",
    "crystal-http": "^0.1.0"
  },
  "files": ["src/main.py", "README.md"],
  "keywords": ["utility", "example"],
  "type": "library"
}
```

## Repository Format

Repositories are JSON files listing available packages:

```json
{
  "name": "my-repository",
  "version": "1.0.0",
  "packages": {
    "package-name": {
      "versions": {
        "1.0.0": {
          "description": "...",
          "author": "...",
          "license": "MIT",
          "dependencies": {},
          "download_url": "https://...",
          "checksum": "sha256:...",
          "size": 1024,
          "keywords": []
        }
      }
    }
  }
}
```

See `repository/example.json` for a full example.

## Plugin System

WLPM supports plugins that can hook into package operations:

```python
from wlpm.plugins import Plugin, Hook

class MyPlugin(Plugin):
    name = "my-plugin"
    version = "0.1.0"
    description = "My custom plugin"

    def hooks(self):
        return {
            Hook.PRE_INSTALL: self.on_pre_install,
            Hook.POST_INSTALL: self.on_post_install,
        }

    def on_pre_install(self, package_name, version):
        print(f"About to install {package_name}")

    def on_post_install(self, package_name, version):
        print(f"Finished installing {package_name}")
```

Place plugins in `~/.config/.wlpm/plugins/` or register them programmatically.

## Configuration

WLPM stores its configuration at:
- **Linux:** `~/.config/.wlpm/config.json`
- **macOS:** `~/Library/Application Support/.wlpm/config.json`
- **Windows:** `%APPDATH%\.wlpm\config.json`
- **Termux:** `~/.config/.wlpm/config.json`

Default configuration:

```json
{
  "repositories": [
    "https://raw.githubusercontent.com/white-lily/wlpm-repository/main/repository.json"
  ],
  "auto_update": true,
  "color": true,
  "verbose": false,
  "default_license": "MIT"
}
```

## Package Specification Summary

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | string | Package name (lowercase, hyphens) |
| `version` | Yes | string | SemVer version (e.g., `1.0.0`) |
| `description` | No | string | Short description |
| `author` | No | string | Package author |
| `license` | No | string | SPDX license identifier |
| `dependencies` | No | object | Package dependencies with version specs |
| `files` | No | array | Files included in the package |
| `keywords` | No | array | Search keywords |
| `type` | No | string | `library` or `application` |

## Version Specifiers

| Spec | Meaning | Example |
|------|---------|---------|
| `1.0.0` | Exact version | `==1.0.0` |
| `>=1.0.0` | Greater or equal | `>=1.0.0` |
| `<=1.0.0` | Less or equal | `<=1.0.0` |
| `>1.0.0` | Greater than | `>1.0.0` |
| `<1.0.0` | Less than | `<1.0.0` |
| `^1.0.0` | Compatible with 1.x | `>=1.0.0,<2.0.0` |
| `~1.0.0` | Compatible with 1.0.x | `>=1.0.0,<1.1.0` |
| `>=1.0.0,<2.0.0` | Range | Custom range |

## Project Structure

```
wlpm/
├── pyproject.toml              # Project configuration
├── README.md                   # This file
├── LICENSE                     # MIT license
├── wlpm/
│   ├── __init__.py             # Package version and imports
│   ├── __main__.py             # python -m wlpm entry point
│   ├── cli.py                  # Command-line interface
│   ├── config.py               # Configuration management
│   ├── ui.py                   # Terminal UI (colors, spinners, progress)
│   ├── package.py              # Package model and version parsing
│   ├── repository.py           # Repository management
│   ├── cache.py                # Package caching and install records
│   ├── dependency.py           # Dependency resolution
│   ├── installer.py            # Install/remove/update operations
│   └── plugins.py              # Plugin system
├── tests/
│   ├── test_package.py         # Package model tests
│   ├── test_dependency.py      # Dependency resolver tests
│   ├── test_repository.py      # Repository tests
│   ├── test_cache.py           # Cache tests
│   └── test_cli.py             # CLI tests
├── repository/
│   └── example.json            # Example repository
└── logo/
    └── CONCEPT.md              # Logo concept documentation
```

## Development

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run tests with coverage
pytest --cov=wlpm

# Lint
ruff check wlpm/
```

## License

MIT
