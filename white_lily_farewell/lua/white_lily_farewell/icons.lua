local M = {}

M.icons = {
  diagnostics = {
    error = "✗",
    warning = "⚠",
    info = "✦",
    hint = "❀",
  },

  git = {
    branch = "",
    modified = "●",
    added = "✚",
    removed = "✖",
    renamed = "➜",
  },

  lsp = {
    progress = "❀",
    installed = "✓",
    loading = "○",
    server = "⚘",
  },

  ui = {
    file = "",
    folder = "",
    close = "✕",
    separator = "",
    separator_left = "",
    circle = "●",
    diamond = "◇",
  },

  dashboard = {
    flower = "❀",
    petal = "✿",
    petal_alt = "❁",
    petal_small = "✾",
    bloom = "🌸",
    leaf = "🍃",
    star = "✦",
  },

  kind = {
    Text = "",
    Method = "",
    Function = "",
    Constructor = "",
    Field = "",
    Variable = "",
    Class = "",
    Interface = "",
    Module = "",
    Property = "",
    Unit = "",
    Value = "",
    Enum = "",
    Keyword = "",
    Snippet = "",
    Color = "",
    File = "",
    Reference = "",
    Folder = "",
    EnumMember = "",
    Constant = "",
    Struct = "",
    Event = "",
    Operator = "",
    TypeParameter = "",
  },
}

return M
