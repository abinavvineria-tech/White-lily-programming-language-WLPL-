local M = {}

local petals = {}
local timer = nil
local win_id = nil
local buf_id = nil
local cols = 0
local rows = 0

local petal_chars = { "❀", "✿", "❁", "✾", "🌸", "✦" }
local flower_chars = { "❀", "✿", "🌸" }

local function randf(min, max)
  return min + math.random() * (max - min)
end

function M.hide()
  if timer then
    timer:stop()
    timer:close()
    timer = nil
  end
  if win_id and vim.api.nvim_win_is_valid(win_id) then
    vim.api.nvim_win_close(win_id, true)
  end
  win_id = nil
  buf_id = nil
end

local function random_petal_char()
  return petal_chars[math.random(#petal_chars)]
end

local function random_petal_hl()
  if math.random() < 0.3 then
    return "DashboardPetalAlt"
  end
  return "DashboardPetal"
end

local function create_petal()
  return {
    row = randf(-5, rows * 0.3),
    col = randf(1, cols - 1),
    char = random_petal_char(),
    hl = random_petal_hl(),
    speed = randf(0.3, 0.8),
    drift = randf(-0.15, 0.15),
    wobble = randf(0, 2 * math.pi),
    wobble_speed = randf(0.02, 0.05),
    wobble_amp = randf(0.2, 0.6),
  }
end

local function init_petals(count)
  petals = {}
  for _ = 1, count do
    table.insert(petals, create_petal())
  end
end

local function build_dashboard_content(win_w, win_h)
  rows = win_h
  cols = win_w
  local lines = {}
  for _ = 1, win_h do
    table.insert(lines, string.rep(" ", win_w))
  end
  return lines
end

local function draw_petals_on_lines(lines, petal_ns)
  vim.api.nvim_buf_clear_namespace(buf_id, petal_ns, 0, -1)
  for _, p in ipairs(petals) do
    local r = math.floor(p.row + 0.5)
    local c = math.floor(p.col + 0.5)
    if r >= 1 and r <= #lines and c >= 1 and c <= #lines[r] then
      local before = string.sub(lines[r], 1, c - 1)
      local after = string.sub(lines[r], c + 1)
      lines[r] = before .. p.char .. after
      vim.api.nvim_buf_set_extmark(buf_id, petal_ns, r - 1, c - 1, {
        hl_group = p.hl,
        hl_eol = false,
        priority = 100,
      })
    end
  end
  return lines
end

local function update_petals()
  for _, p in ipairs(petals) do
    p.wobble = p.wobble + p.wobble_speed
    p.row = p.row + p.speed * 0.08
    p.col = p.col + p.drift * 0.08 + math.sin(p.wobble) * p.wobble_amp * 0.05
    if p.row > rows + 2 then
      p.row = randf(-3, 0)
      p.col = randf(1, cols - 1)
      p.char = random_petal_char()
      p.hl = random_petal_hl()
      p.speed = randf(0.3, 0.8)
      p.drift = randf(-0.15, 0.15)
    end
    if p.col < 1 then p.col = 1 end
    if p.col > cols then p.col = cols end
  end
end

local function redraw()
  if not win_id or not vim.api.nvim_win_is_valid(win_id) then
    M.hide()
    return
  end
  local win_w = vim.api.nvim_win_get_width(win_id)
  local win_h = vim.api.nvim_win_get_height(win_id)
  if win_w ~= cols or win_h ~= rows then
    cols = win_w
    rows = win_h
  end
  update_petals()
  local lines = build_dashboard_content(cols, rows)
  local half_h = math.floor(rows / 2)
  local half_w = math.floor(cols / 2)

  local title_line = half_h - 4
  local subtitle_line = half_h - 2
  local date_line = half_h
  local prompt_line = rows - 3

  local title = "In Memory of White Lily Cookie"
  local subtitle = "May her light bloom forever."
  local date_text = "2021 - 2026"
  local prompt = "Press any key to continue..."

  if title_line >= 1 and title_line <= #lines then
    local left = math.max(1, half_w - math.floor(#title / 2))
    lines[title_line] = string.rep(" ", left - 1) .. title .. string.rep(" ", cols - left - #title + 1)
  end
  if subtitle_line >= 1 and subtitle_line <= #lines then
    local left = math.max(1, half_w - math.floor(#subtitle / 2))
    lines[subtitle_line] = string.rep(" ", left - 1) .. subtitle .. string.rep(" ", cols - left - #subtitle + 1)
  end
  if date_line >= 1 and date_line <= #lines then
    local left = math.max(1, half_w - math.floor(#date_text / 2))
    lines[date_line] = string.rep(" ", left - 1) .. date_text .. string.rep(" ", cols - left - #date_text + 1)
  end
  if prompt_line >= 1 and prompt_line <= #lines then
    local left = math.max(1, half_w - math.floor(#prompt / 2))
    lines[prompt_line] = string.rep(" ", left - 1) .. prompt .. string.rep(" ", cols - left - #prompt + 1)
  end

  local base_ns = vim.api.nvim_create_namespace("white_lily_base")
  vim.api.nvim_buf_clear_namespace(buf_id, base_ns, 0, -1)

  if title_line >= 1 and title_line <= #lines then
    local left = math.max(1, half_w - math.floor(#title / 2))
    vim.api.nvim_buf_set_extmark(buf_id, base_ns, title_line - 1, left - 1, {
      hl_group = "DashboardHeader",
      end_col = left + #title - 1,
      priority = 200,
    })
  end
  if subtitle_line >= 1 and subtitle_line <= #lines then
    local left = math.max(1, half_w - math.floor(#subtitle / 2))
    vim.api.nvim_buf_set_extmark(buf_id, base_ns, subtitle_line - 1, left - 1, {
      hl_group = "DashboardSubheader",
      end_col = left + #subtitle - 1,
      priority = 200,
    })
  end
  if date_line >= 1 and date_line <= #lines then
    local left = math.max(1, half_w - math.floor(#date_text / 2))
    vim.api.nvim_buf_set_extmark(buf_id, base_ns, date_line - 1, left - 1, {
      hl_group = "DashboardDate",
      end_col = left + #date_text - 1,
      priority = 200,
    })
  end
  if prompt_line >= 1 and prompt_line <= #lines then
    local left = math.max(1, half_w - math.floor(#prompt / 2))
    vim.api.nvim_buf_set_extmark(buf_id, base_ns, prompt_line - 1, left - 1, {
      hl_group = "DashboardDesc",
      end_col = left + #prompt - 1,
      priority = 200,
    })
  end

  local petal_ns = vim.api.nvim_create_namespace("white_lily_petals")
  lines = draw_petals_on_lines(lines, petal_ns)
  vim.api.nvim_buf_set_lines(buf_id, 0, -1, false, lines)
end

function M.show()
  if win_id and vim.api.nvim_win_is_valid(win_id) then
    M.hide()
    return
  end

  vim.api.nvim_set_hl(0, "DashboardHeader", { fg = "#FFFFFF", bold = true })
  vim.api.nvim_set_hl(0, "DashboardSubheader", { fg = "#A8E6FF", italic = true })
  vim.api.nvim_set_hl(0, "DashboardDate", { fg = "#B0D4F0" })
  vim.api.nvim_set_hl(0, "DashboardPetal", { fg = "#A8D5BA" })
  vim.api.nvim_set_hl(0, "DashboardPetalAlt", { fg = "#C8E6F0" })
  vim.api.nvim_set_hl(0, "DashboardDesc", { fg = "#808090" })
  vim.api.nvim_set_hl(0, "DashboardBorder", { fg = "#B0D4F0" })

  local editor_width = vim.o.columns
  local editor_height = vim.o.lines - vim.o.cmdheight - 1

  local width = math.min(60, editor_width - 4)
  local height = math.min(20, editor_height - 4)
  local row = math.floor((editor_height - height) / 2)
  local col = math.floor((editor_width - width) / 2)

  buf_id = vim.api.nvim_create_buf(false, true)
  cols = width
  rows = height

  local opts = {
    relative = "editor",
    width = width,
    height = height,
    row = row,
    col = col,
    style = "minimal",
    border = {
      { "┌", "DashboardBorder" },
      { "─", "DashboardBorder" },
      { "┐", "DashboardBorder" },
      { "│", "DashboardBorder" },
      { "┘", "DashboardBorder" },
      { "─", "DashboardBorder" },
      { "└", "DashboardBorder" },
      { "│", "DashboardBorder" },
    },
  }

  win_id = vim.api.nvim_open_win(buf_id, true, opts)
  vim.wo[win_id].cursorline = false
  vim.wo[win_id].cursorcolumn = false
  vim.wo[win_id].number = false
  vim.wo[win_id].relativenumber = false
  vim.wo[win_id].signcolumn = "no"
  vim.bo[buf_id].modifiable = true

  local count = math.floor(width * height * 0.07)
  init_petals(math.max(count, 15))

  local initial = {}
  for _ = 1, height do
    table.insert(initial, string.rep(" ", width))
  end
  vim.api.nvim_buf_set_lines(buf_id, 0, -1, false, initial)

  redraw()

  timer = vim.uv.new_timer()
  timer:start(0, 80, vim.schedule_wrap(function()
    redraw()
  end))

  local mappings = {
    ["q"] = true,
    ["<Esc>"] = true,
    ["<CR>"] = true,
    [" "] = true,
  }

  for key, _ in pairs(mappings) do
    vim.api.nvim_buf_set_keymap(buf_id, "n", key, "", {
      callback = function()
        M.hide()
      end,
      nowait = true,
      silent = true,
      noremap = true,
    })
  end
end

return M
