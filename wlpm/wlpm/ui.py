"""Terminal UI: colors, progress bars, spinners, and themed messages."""

import os
import sys
import time
import threading
import shutil

FLOWER_FRAMES = ["❀", "✿", "❁", "✾", "🌸"]
LOGO_FLOWER = "❀"
PETAL_LINE = "✿"
LEAF = "🍃"
STAR = "✦"

COLORS = {
    "white": "\033[97m",
    "silver": "\033[38;5;251m",
    "green": "\033[38;5;151m",
    "green_bold": "\033[38;5;151;1m",
    "crystal": "\033[38;5;159m",
    "crystal_bold": "\033[38;5;159;1m",
    "crystal_dim": "\033[38;5;117m",
    "dim": "\033[38;5;244m",
    "red": "\033[38;5;210m",
    "yellow": "\033[38;5;221m",
    "bold": "\033[1m",
    "reset": "\033[0m",
    "italic": "\033[3m",
}

def colorize(text, *styles):
    codes = "".join(COLORS[s] for s in styles if s in COLORS)
    return f"{codes}{text}{COLORS['reset']}"

def strip_ansi(text):
    import re
    return re.sub(r"\033\[[0-9;]*m", "", text)

def term_width():
    return shutil.get_terminal_size((80, 24)).columns

def term_height():
    return shutil.get_terminal_size((80, 24)).lines

def print_divider(char="─", color="dim"):
    width = term_width()
    print(colorize(char * width, color))

def print_header(title):
    width = term_width()
    side = max(0, (width - len(strip_ansi(title)) - 4) // 2)
    line = " " * side + colorize("❀ ", "green") + colorize(title, "bold", "white") + colorize(" ❀", "green") + " " * side
    print()
    print(line)
    print()

def print_logo():
    logo = [
        "      ❀          ",
        "     / \\         ",
        "    /   \\   ✿    ",
        "   /  ❀  \\      ",
        "  /_______\\     ",
        "      ||         ",
        "      ||         ",
        "    \\====/       ",
        "     \\__/        ",
    ]
    for line in logo:
        styled = ""
        for ch in line:
            if ch == "❀":
                styled += colorize("❀", "green_bold")
            elif ch == "✿":
                styled += colorize("✿", "crystal")
            elif ch in "/\\":
                styled += colorize(ch, "silver")
            elif ch in "=_" or ch == "|":
                styled += colorize(ch, "green")
            else:
                styled += ch
        print("  " + styled)
    print()
    print("  " + colorize("White Lily Package Manager", "bold", "white"))
    print("  " + colorize("magical package management", "italic", "dim"))
    print()

def success(message):
    print(colorize("  ❀  ", "green_bold") + colorize(message, "green"))

def error(message):
    print(colorize("  ✗  ", "red") + colorize(message, "red"))

def warning(message):
    print(colorize("  ✦  ", "yellow") + colorize(message, "yellow"))

def info(message):
    print(colorize("  ●  ", "crystal") + colorize(message, "silver"))

def install_msg(package):
    print(colorize("  ✿  ", "green") + colorize(f"A new flower blooms... {package}", "white"))

def remove_msg(package):
    print(colorize("  ❁  ", "crystal_dim") + colorize(f"The petals return to the garden... {package}", "silver"))

def update_msg():
    print(colorize("  ❀  ", "green") + colorize("Refreshing the garden...", "white"))

def done_msg():
    print()
    print(colorize("  ─" * 20, "dim"))
    print(colorize("  ❀  White Lily's blessing completed successfully.  ❀", "green_bold"))
    print(colorize("  ─" * 20, "dim"))
    print()

def search_result(package, description, version):
    print(colorize(f"  ❀  ", "green") + colorize(f"{package}", "bold", "white") + colorize(f" v{version}", "crystal_dim") + colorize(f"  {description}", "dim"))

def package_info(name, version, desc, author, license_, deps, size):
    print(colorize("  ❀ Package Information ❀", "green_bold"))
    print(colorize(f"    Name:         ", "silver") + colorize(name, "white"))
    print(colorize(f"    Version:      ", "silver") + colorize(version, "crystal"))
    print(colorize(f"    Description:  ", "silver") + colorize(desc, "dim"))
    print(colorize(f"    Author:       ", "silver") + colorize(author, "silver"))
    print(colorize(f"    License:      ", "silver") + colorize(license_, "dim"))
    print(colorize(f"    Size:         ", "silver") + colorize(size, "crystal_dim"))
    if deps:
        print(colorize(f"    Dependencies: ", "silver") + colorize(", ".join(deps), "dim"))
    else:
        print(colorize(f"    Dependencies: ", "silver") + colorize("None", "dim"))

def list_package(name, version):
    print(colorize(f"  ❀  {name}", "green") + colorize(f"  v{version}", "crystal_dim"))


class Spinner:
    def __init__(self, message="", frames=None):
        self.message = message
        self.frames = frames or FLOWER_FRAMES
        self.running = False
        self._thread = None

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop()

    def start(self):
        self.running = True
        self._thread = threading.Thread(target=self._spin, daemon=True)
        self._thread.start()

    def _spin(self):
        i = 0
        while self.running:
            frame = self.frames[i % len(self.frames)]
            sys.stdout.write(f"\r  {colorize(frame, 'green')}  {self.message}  ")
            sys.stdout.flush()
            time.sleep(0.15)
            i += 1

    def stop(self, final=None):
        self.running = False
        if self._thread:
            self._thread.join()
        sys.stdout.write("\r")
        sys.stdout.flush()
        if final:
            print(colorize(f"  {final}  ", "green") + self.message)


class ProgressBar:
    def __init__(self, total, prefix="", width=30):
        self.total = max(total, 1)
        self.current = 0
        self.prefix = prefix
        self.width = min(width, term_width() - 20)
        self._start_time = time.time()

    def update(self, amount=1):
        self.current = min(self.current + amount, self.total)
        self._draw()

    def _draw(self):
        pct = self.current / self.total
        filled = int(self.width * pct)
        bar = colorize("❀" * filled, "green") + colorize("·" * (self.width - filled), "dim")
        elapsed = time.time() - self._start_time
        pct_text = f"{int(pct * 100):3d}%"
        sys.stdout.write(f"\r  {bar}  {pct_text}  {self.prefix}")
        sys.stdout.flush()

    def finish(self):
        self.current = self.total
        self._draw()
        print()


class NalaProgress:
    def __init__(self):
        self.items = {}
        self._active = False

    def add(self, name: str, total: int = 1):
        self.items[name] = {"current": 0, "total": max(total, 1), "done": False}

    def update(self, name: str, amount: int = 1):
        if name in self.items:
            self.items[name]["current"] = min(
                self.items[name]["current"] + amount, self.items[name]["total"]
            )
        self._draw()

    def finish(self, name: str):
        if name in self.items:
            self.items[name]["done"] = True
            self.items[name]["current"] = self.items[name]["total"]
        self._draw()

    def _draw(self):
        lines = []
        for name, data in self.items.items():
            if data["done"]:
                pct = 100
                bar = colorize("❀" * 10, "green")
            else:
                pct = int(data["current"] / data["total"] * 100) if data["total"] else 0
                filled = pct // 10
                bar = colorize("❀" * filled, "green") + colorize("·" * (10 - filled), "dim")
            lines.append(f"  {bar}  {pct:3d}%  {colorize(name, 'silver')}")
        sys.stdout.write("\033[K" + "\n".join(lines) + "\033[A" * (len(lines) - 1) + "\r")
        sys.stdout.flush()

    def clear(self):
        if self.items:
            sys.stdout.write("\033[J")
            sys.stdout.flush()
        self.items = {}


def confirm(message):
    try:
        response = input(colorize(f"  ❀  {message} [Y/n] ", "green")).strip().lower()
        return response in ("", "y", "yes")
    except (EOFError, KeyboardInterrupt):
        print()
        return False


class FlowerAnimation:
    def __init__(self):
        self.running = False
        self._thread = None

    def start(self):
        self.running = True
        self._thread = threading.Thread(target=self._animate, daemon=True)
        self._thread.start()

    def _animate(self):
        chars = ["❀", "✿", "❁", "✾", "🌸", "✿"]
        i = 0
        while self.running:
            frame = " ".join(chars[(i + j) % len(chars)] for j in range(3))
            sys.stdout.write(f"\r  {colorize(frame, 'green')}  ")
            sys.stdout.flush()
            time.sleep(0.2)
            i += 1

    def stop(self):
        self.running = False
        if self._thread:
            self._thread.join()
        sys.stdout.write("\r")
        sys.stdout.flush()
