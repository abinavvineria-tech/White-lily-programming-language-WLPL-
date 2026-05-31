# White Lily Farewell

A calm, elegant Neovim colorscheme and memorial plugin inspired by **White Lily Cookie** from *Cookie Run: Kingdom*.

> *"In memory of White Lily Cookie — may her light bloom forever."*

## Features

- Custom colorscheme `white_lily_farewell` — white, silver, soft green, and crystal glow tones
- Fancy memorial dashboard with animated falling petals (`:WhiteLilyFarewell`)
- Themed statusline with mode indicators, LSP status, git branch, and file info
- LSP integration via `nvim-lspconfig` — Lua, Python, JS/TS, HTML, CSS, JSON
- Auto-completion via `nvim-cmp` with themed popup menu
- Diagnostics with rounded borders and flower icons
- Themed hover documentation and LSP progress notifications
- Optimized for Neovim 0.10+
- Lazy.nvim compatible

## Screenshots

> *Screenshots coming soon.*
>
> The colorscheme features a dark background with soft white text, silver accents,
> glowing crystal highlights, and elegant green tones throughout the editor,
> statusline, completion menu, and diagnostic popups.

## Installation

### lazy.nvim

```lua
{
  "your-username/white_lily_farewell",
  lazy = false,
  priority = 1000,
  opts = {},
}
```

### packer.nvim

```lua
use {
  "your-username/white_lily_farewell",
  config = function()
    require("white_lily_farewell").setup()
  end,
}
```

### vim-plug

```vim
Plug "your-username/white_lily_farewell"
```

Then in your config:

```vim
colorscheme white_lily_farewell
lua require("white_lily_farewell").setup()
```

## Usage

### Colorscheme

```vim
colorscheme white_lily_farewell
```

### Commands

| Command | Description |
|---------|-------------|
| `:WhiteLilyFarewell` | Open the memorial dashboard with animated petals |
| `:colorscheme white_lily_farewell` | Apply the colorscheme |

### Lua Setup

```lua
-- Minimal
require("white_lily_farewell").setup()

-- With options
require("white_lily_farewell").setup({
  -- LSP servers to configure (default shown)
  servers = { "lua_ls", "pyright", "ts_ls", "html", "cssls", "jsonls" },
})
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `statusline` | `boolean` | `true` | Enable custom statusline |
| `lsp` | `boolean` | `true` | Enable LSP configuration |
| `cmp` | `boolean` | `true` | Enable nvim-cmp configuration |
| `servers` | `table` | See above | List of LSP servers to set up |

## Dependencies

- **Required:** Neovim >= 0.10
- **Optional:** `nvim-lspconfig` (for LSP features)
- **Optional:** `nvim-cmp` + `cmp-nvim-lsp` (for completion)
- **Optional:** `luasnip` (for snippet expansion with cmp)
- **Optional:** Nerd Font (for icons)

## Structure

```
white_lily_farewell/
├── colors/
│   └── white_lily_farewell.vim   # Colorscheme entry
├── lua/
│   ├── white_lily_farewell.lua   # Plugin shortcut
│   └── white_lily_farewell/
│       ├── init.lua              # Main module & setup
│       ├── colors.lua            # Color palette
│       ├── highlights.lua        # Highlight groups
│       ├── dashboard.lua         # Memorial dashboard
│       ├── statusline.lua        # Statusline
│       ├── lsp.lua               # LSP configuration
│       ├── cmp.lua               # Completion config
│       └── icons.lua             # Icon definitions
├── LICENSE
└── README.md
```

## License

MIT
