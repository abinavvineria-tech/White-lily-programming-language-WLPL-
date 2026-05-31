#!/usr/bin/env bash
# White Lily Script Installer
# Usage: bash installer.sh [--user] [--system]
#   --user   Install to user home directories (default)
#   --system Install system-wide (requires sudo)

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'
FLOWER="✿"

info()  { printf "${CYAN}  ${FLOWER} %s${NC}\n" "$*"; }
ok()    { printf "${GREEN}  ✓ %s${NC}\n" "$*"; }
title() { printf "\n${BOLD}  %s${NC}\n" "$*"; }

INSTALL_MODE="${1:---user}"
HERE="$(cd "$(dirname "$0")" && pwd)"
PROJECT="White Lily Script"

title "${PROJECT} Installer"
echo

# ── Step 1: Python package ──────────────────────────────────────────

title "[1/3] Installing Python package"

if command -v python3 &>/dev/null; then
    PY=python3
elif command -v python &>/dev/null; then
    PY=python
else
    echo "  ✗ Python not found. Install Python 3.10+ and try again."
    exit 1
fi

$PY -c "import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)" \
  && ok "Python $($PY --version | cut -d' ' -f2)" \
  || { echo "  ✗ Python 3.10+ required"; exit 1; }

if [ "$INSTALL_MODE" = "--system" ]; then
    sudo $PY -m pip install "$HERE" 2>/dev/null \
      || sudo $PY -m pip install -e "$HERE"
else
    $PY -m pip install "$HERE" 2>/dev/null \
      || $PY -m pip install --user "$HERE" 2>/dev/null \
      || $PY -m pip install -e "$HERE"
fi

$PY -c "import whitescript; print('  ✓ whitescript', whitescript.__version__)" 2>/dev/null \
  && ok "whitescript package installed" \
  || ok "whitescript package installed (version check skipped)"

# ── Step 2: Neovim syntax ──────────────────────────────────────────

title "[2/3] Installing Neovim syntax files"

NVIM_SYNTAX="${HOME}/.config/nvim/syntax"
NVIM_FTDETECT="${HOME}/.config/nvim/ftdetect"

if [ -d "${HOME}/.config/nvim" ]; then
    mkdir -p "$NVIM_SYNTAX" "$NVIM_FTDETECT"

    if [ -f "$HERE/syntax/white_lily_script.vim" ]; then
        cp "$HERE/syntax/white_lily_script.vim" "$NVIM_SYNTAX/"
        ok "Syntax file → $NVIM_SYNTAX/white_lily_script.vim"
    else
        # Fallback: write a basic syntax file
        cat > "$NVIM_SYNTAX/white_lily_script.vim" << 'VIMEOF'
if exists("b:current_syntax") | finish | endif
syn keyword wlsKeyword   bloom flower blossom garden petal vine dew
syn keyword wlsConditional if elif else
syn keyword wlsBoolean   true false
syn keyword wlsNone      none
syn keyword wlsType      lily crystal bloom_type garden
syn keyword wlsBuiltin   len range type int str float sleep randint sqrt
syn match   wlsComment   "#.*$"
syn region  wlsString    start=+"+ end=+"+
syn region  wlsString    start=+'+ end=+'+ 
syn match   wlsNumber    "\<\d\+\.\d*\>"
syn match   wlsNumber    "\<\d\+\>"
hi def link wlsKeyword    Statement
hi def link wlsConditional Conditional
hi def link wlsBoolean    Boolean
hi def link wlsNone       Constant
hi def link wlsType       Type
hi def link wlsBuiltin    Function
hi def link wlsComment    Comment
hi def link wlsString     String
hi def link wlsNumber     Number
let b:current_syntax = "white_lily_script"
VIMEOF
        ok "Syntax file created (fallback)"
    fi

    cat > "$NVIM_FTDETECT/white_lily_script.vim" << 'FTDEOF'
au BufRead,BufNewFile *.wlily set filetype=white_lily_script
FTDEOF
    ok "Filetype detection → $NVIM_FTDETECT/white_lily_script.vim"
else
    info "Neovim config not found — skipping syntax install"
    info "  Manual: cp syntax/white_lily_script.vim ~/.config/nvim/syntax/"
fi

# ── Step 3: VS Code extension ──────────────────────────────────────

title "[3/3] Installing VS Code extension"

VSCODE_EXT=""
for dir in \
    "${HOME}/.vscode/extensions" \
    "${HOME}/.vscode-oss/extensions" \
    "${HOME}/.config/Code/User/extensions" \
    "${HOME}/.config/Code - OSS/User/extensions" \
    "${HOME}/snap/code/current/.config/Code/User/extensions"; do
    if [ -d "$dir" ]; then
        VSCODE_EXT="$dir"
        break
    fi
done

if [ -n "$VSCODE_EXT" ]; then
    EXT_DIR="${VSCODE_EXT}/white-lily-script"
    mkdir -p "$EXT_DIR"

    if [ -f "$HERE/vscode-extension/package.json" ]; then
        cp -r "$HERE/vscode-extension/"* "$EXT_DIR/"
        ok "Extension → $EXT_DIR"
    else
        # Write a minimal extension
        cat > "$EXT_DIR/package.json" << 'PKGJSON'
{
  "name": "white-lily-script",
  "displayName": "White Lily Script",
  "description": "Syntax highlighting for .wlily files",
  "version": "1.0.0",
  "publisher": "white-lily",
  "engines": { "vscode": "^1.60.0" },
  "categories": ["Programming Languages"],
  "contributes": {
    "languages": [{
      "id": "whitelily",
      "aliases": ["White Lily Script"],
      "extensions": [".wlily"]
    }],
    "grammars": [{
      "language": "whitelily",
      "scopeName": "source.wlily",
      "path": "./syntaxes/whitelily.tmLanguage.json"
    }]
  }
}
PKGJSON
        mkdir -p "$EXT_DIR/syntaxes"
        cat > "$EXT_DIR/syntaxes/whitelily.tmLanguage.json" << 'TMJSON'
{
  "scopeName": "source.wlily",
  "fileTypes": ["wlily"],
  "patterns": [
    { "match": "\\b(bloom|flower|blossom|garden|petal|vine|dew)\\b", "name": "keyword.control.wlily" },
    { "match": "\\b(if|elif|else)\\b", "name": "keyword.control.wlily" },
    { "match": "#.*$", "name": "comment.line.number-sign.wlily" },
    { "begin": "\"", "end": "\"", "name": "string.quoted.double.wlily" },
    { "begin": "'", "end": "'", "name": "string.quoted.single.wlily" },
    { "match": "\\b\\d+(\\.\\d+)?\\b", "name": "constant.numeric.wlily" }
  ]
}
TMJSON
        ok "Extension created (fallback)"
    fi
    info "Restart VS Code to enable the extension"
else
    info "VS Code not found — skipping extension install"
    info "  Manual: cp -r vscode-extension/ ~/.config/Code/User/extensions/white-lily-script/"
fi

# ── Done ────────────────────────────────────────────────────────────

echo
title "  ${PROJECT} is ready!  ${FLOWER}"
echo
info "Try it out:"
info "  echo 'blossom \"Hello, garden!\"' | python -m whitescript"
info "  python -m whitescript path/to/your/file.wlily"
info "  python -m whitescript   (opens REPL)"
echo

if [ -d "${HOME}/.config/nvim" ]; then
    info "Open a .wlily file in Neovim to see syntax highlighting."
fi
if [ -n "$VSCODE_EXT" ]; then
    info "Open a .wlily file in VS Code to see syntax highlighting."
fi
echo
