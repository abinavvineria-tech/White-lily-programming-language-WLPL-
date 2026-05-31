local M = {}

function M.load_colorscheme()
  vim.cmd("highlight clear")
  if vim.fn.exists("syntax_on") then
    vim.cmd("syntax reset")
  end
  vim.o.background = "dark"
  vim.g.colors_name = "white_lily_farewell"

  local c = require("white_lily_farewell.colors").colors
  require("white_lily_farewell.highlights").setup(c)
end

function M.setup(opts)
  opts = opts or {}

  if vim.g.colors_name ~= "white_lily_farewell" then
    M.load_colorscheme()
  end

  if opts.statusline ~= false then
    require("white_lily_farewell.statusline").setup()
  end

  if opts.lsp ~= false then
    require("white_lily_farewell.lsp").setup(opts)
  end

  if opts.cmp ~= false then
    require("white_lily_farewell.cmp").setup()
  end

  vim.api.nvim_create_user_command("WhiteLilyFarewell", function()
    require("white_lily_farewell.dashboard").show()
  end, {
    desc = "Show White Lily Farewell memorial dashboard",
  })
end

return M
