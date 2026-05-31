"""Plugin system for WLPM."""

import importlib
import importlib.util
import inspect
import os
import sys
from typing import Any, Callable


class Hook:
    PRE_INSTALL = "pre_install"
    POST_INSTALL = "post_install"
    PRE_REMOVE = "pre_remove"
    POST_REMOVE = "post_remove"
    PRE_UPDATE = "pre_update"
    POST_UPDATE = "post_update"
    PRE_RESOLVE = "pre_resolve"
    POST_RESOLVE = "post_resolve"
    PRE_FETCH = "pre_fetch"
    POST_FETCH = "post_fetch"


class Plugin:
    name: str = ""
    version: str = "0.1.0"
    description: str = ""

    def on_load(self):
        pass

    def on_unload(self):
        pass

    def hooks(self) -> dict[str, Callable]:
        return {}


class PluginManager:
    def __init__(self, plugin_dir: str = ""):
        self.plugin_dir = plugin_dir
        self.plugins: dict[str, Plugin] = {}
        self._hooks: dict[str, list[tuple[str, Callable]]] = {
            Hook.PRE_INSTALL: [],
            Hook.POST_INSTALL: [],
            Hook.PRE_REMOVE: [],
            Hook.POST_REMOVE: [],
            Hook.PRE_UPDATE: [],
            Hook.POST_UPDATE: [],
            Hook.PRE_RESOLVE: [],
            Hook.POST_RESOLVE: [],
            Hook.PRE_FETCH: [],
            Hook.POST_FETCH: [],
        }

    def discover(self):
        if not self.plugin_dir or not os.path.isdir(self.plugin_dir):
            return
        sys.path.insert(0, self.plugin_dir)
        for fname in os.listdir(self.plugin_dir):
            if fname.endswith(".py") and not fname.startswith("_"):
                name = fname[:-3]
                self._load_plugin(name)

    def _load_plugin(self, name: str):
        try:
            spec = importlib.util.spec_from_file_location(
                name, os.path.join(self.plugin_dir, name + ".py")
            )
            if not spec or not spec.loader:
                return
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            for _, obj in inspect.getmembers(mod, inspect.isclass):
                if issubclass(obj, Plugin) and obj is not Plugin:
                    instance = obj()
                    instance.on_load()
                    self.plugins[name] = instance
                    for hook_name, callback in instance.hooks().items():
                        if hook_name in self._hooks:
                            self._hooks[hook_name].append((name, callback))
        except Exception as e:
            print(f"  [!] Failed to load plugin '{name}': {e}")

    def register_plugin(self, plugin: Plugin):
        self.plugins[plugin.name] = plugin
        plugin.on_load()
        for hook_name, callback in plugin.hooks().items():
            if hook_name in self._hooks:
                self._hooks[hook_name].append((plugin.name, callback))

    def unregister_plugin(self, name: str):
        plugin = self.plugins.pop(name, None)
        if plugin:
            plugin.on_unload()
            for hook_name in list(self._hooks.keys()):
                self._hooks[hook_name] = [
                    (pn, cb) for pn, cb in self._hooks[hook_name] if pn != name
                ]

    def run_hook(self, hook_name: str, *args, **kwargs) -> list[Any]:
        results = []
        for plugin_name, callback in self._hooks.get(hook_name, []):
            try:
                result = callback(*args, **kwargs)
                results.append(result)
            except Exception as e:
                print(f"  [!] Plugin '{plugin_name}' hook '{hook_name}' error: {e}")
        return results

    def list_plugins(self) -> list[tuple[str, str, str]]:
        return [
            (p.name, p.version, p.description) for p in self.plugins.values()
        ]
