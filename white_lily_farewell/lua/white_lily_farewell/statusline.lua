local M = {}
local icons = require("white_lily_farewell.icons").icons

local mode_map = {
  n = "Normal", i = "Insert", v = "Visual", V = "Visual",
  [""] = "Visual", s = "Visual", S = "Visual", [""] = "Visual",
  c = "Command", r = "Replace", t = "Terminal",
  ["!"] = "Command",
}

local mode_texts = {
  n = " NORMAL ", i = " INSERT ", v = " VISUAL ", V = " V-LINE ",
  [""] = " V-BLK ", s = " SELECT ", S = " S-LINE ", [""] = " S-BLK ",
  c = " COMMAND ", r = " REPLACE ", t = " TERM ",
  ["!"] = " COMMAND ",
}

local function mode_suffix(m)
  return mode_map[m] or "Normal"
end

local function mode_str(m)
  return mode_texts[m] or (" " .. m:upper() .. " ")
end

local function lsp_status()
  local clients = vim.lsp.get_clients()
  if #clients == 0 then
    return ""
  end
  local names = vim.tbl_map(function(c)
    return c.name
  end, clients)
  return " " .. icons.lsp.server .. " " .. table.concat(names, ", ") .. " "
end

local function git_branch()
  local ok, result = pcall(vim.fn.system, "git branch --show-current 2>/dev/null")
  if not ok or result == "" then
    return ""
  end
  local branch = vim.trim(result)
  if branch == "" then
    return ""
  end
  return " " .. icons.git.branch .. " " .. branch .. " "
end

local function file_info()
  local filename = vim.fn.expand("%:t")
  if filename == "" then
    return " [No Name] "
  end
  local mod = vim.bo.modified and " " .. icons.git.modified .. " " or ""
  return " " .. filename .. mod .. " "
end

local function cursor_pos()
  local l = vim.fn.line(".")
  local c = vim.fn.col(".")
  local t = vim.fn.line("$")
  local pct = t > 1 and math.floor((l / t) * 100) or 0
  return string.format(" %d:%d %d%%%% ", l, c, pct)
end

function M.active()
  local m = vim.fn.mode()
  local suf = mode_suffix(m)
  local text = mode_str(m)
  local sep_right = icons.ui.separator
  local sep_left = icons.ui.separator_left

  return table.concat({
    "%#StatuslineMode" .. suf .. "#",
    text,
    "%#StatuslineSeparator#", sep_right,
    "%#StatuslineFilename#", file_info(),
    "%#StatuslineSeparator#", sep_right,
    "%#StatuslineInfo#", lsp_status(), git_branch(),
    "%=",
    "%#StatuslineInfo#", " " .. vim.bo.filetype .. " ",
    "%#StatuslineSeparator#", sep_left,
    "%#StatuslineMode" .. suf .. "#", cursor_pos(),
  })
end

function M.inactive()
  local name = vim.fn.expand("%:t")
  if name == "" then
    name = "[No Name]"
  end
  return table.concat({
    "%#StatuslineFilenameNC#", " " .. name .. " ",
    "%=",
    "%#StatuslineInfoNC#", " " .. vim.bo.filetype .. " ",
  })
end

function M.setup()
  vim.o.statusline = "%!v:lua.require('white_lily_farewell.statusline').active()"
end

return M
