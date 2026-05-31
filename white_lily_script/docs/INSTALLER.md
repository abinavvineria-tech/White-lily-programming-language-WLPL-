# White Lily Script Installer

> One command to bloom in any garden.

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/.../installer.sh | bash
```

Or run locally:

```bash
bash installer.sh
```

## What It Does

| Step | Action |
|------|--------|
| 1 | Installs the `whitescript` Python package via pip |
| 2 | Copies Neovim syntax to `~/.config/nvim/syntax/white_lily_script.vim` |
| 3 | Copies filetype detection to `~/.config/nvim/ftdetect/white_lily_script.vim` |
| 4 | Copies VS Code extension to `~/.config/Code/User/extensions/white-lily-script/` (if VS Code is found) |

## Manual Install

```bash
# Python package
pip install .

# Neovim syntax
mkdir -p ~/.config/nvim/syntax ~/.config/nvim/ftdetect
cp syntax/white_lily_script.vim ~/.config/nvim/syntax/
echo 'au BufRead,BufNewFile *.wlily set filetype=white_lily_script' \
  > ~/.config/nvim/ftdetect/white_lily_script.vim

# VS Code extension
mkdir -p ~/.config/Code/User/extensions/white-lily-script
cp -r vscode-extension/* ~/.config/Code/User/extensions/white-lily-script/
```

## Verify

```bash
python -m whitescript --version
echo 'blossom "Hello from the garden!"' | python -m whitescript
```

## Requirements

- Python 3.10+
- pip
- Neovim (optional, for `.wlily` syntax highlighting)
- VS Code (optional, for `.wlily` syntax highlighting)

## Uninstall

```bash
pip uninstall whitescript -y
rm -f ~/.config/nvim/syntax/white_lily_script.vim
rm -f ~/.config/nvim/ftdetect/white_lily_script.vim
rm -rf ~/.config/Code/User/extensions/white-lily-script
```
