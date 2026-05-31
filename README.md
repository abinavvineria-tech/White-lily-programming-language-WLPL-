# White Lily Programming Language (WLPL) 🌸

> A magical, nature-inspired programming language ecosystem.

## Projects

| Project | Description |
|---------|-------------|
| **White Lily Script** | A Python-like language with flower-themed keywords (`.wlily`) |
| **WLPM** | A flower-themed Python package manager |
| **White Lily Farewell** | A Neovim colorscheme, dashboard, statusline & LSP config |

---

## Quick Install

```bash
bash installer.sh
```

Or install individually:

### White Lily Script

```bash
cd white_lily_script
pip install .
python -m whitescript examples/hello.wlily
```

### WLPM

```bash
cd wlpm
pip install .
wlpm --help
```

### White Lily Farewell (Neovim)

```bash
cp white_lily_farewell/colors/white_lily_farewell.vim ~/.config/nvim/colors/
cp -r white_lily_farewell/lua/white_lily_farewell ~/.config/nvim/lua/
```

Then add to `~/.config/nvim/lua/plugins/init.lua`:
```lua
{ import = "plugins.white_lily_farewell" },
```

---

## Requirements

- Python 3.10+
- Neovim 0.10+ (for White Lily Farewell)

## Language Features

White Lily Script uses nature-inspired keywords:

| Keyword | Meaning |
|---------|---------|
| `bloom` | Declare a variable |
| `flower` | Define a function |
| `blossom` | Print output |
| `garden` | Main entry point |
| `petal` | Return a value |
| `vine` | Loop over items |
| `dew` | Read user input |

```python
# hello.wlily
bloom name = dew("What is your name? ")
blossom "Hello, " .. name .. "!"
```

See `white_lily_script/docs/TUTORIAL.md` for a full beginner's guide.

---

## Ancient Heroes ✿

```
PureVanilla  DarkCacao  Hollyberry  GoldenCheese  WhiteLily
```

Their names are sacred keywords in `.wlily` files — they glow like old friends in your editor.

---

## License

MIT
