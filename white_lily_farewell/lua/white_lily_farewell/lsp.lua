local M = {}

local default_servers = {
  "lua_ls",
  "pyright",
  "ts_ls",
  "html",
  "cssls",
  "jsonls",
}

local function setup_diagnostics()
  local icons = require("white_lily_farewell.icons").icons.diagnostics

  vim.fn.sign_define("DiagnosticSignError", {
    text = icons.error,
    texthl = "DiagnosticSignError",
  })
  vim.fn.sign_define("DiagnosticSignWarn", {
    text = icons.warning,
    texthl = "DiagnosticSignWarn",
  })
  vim.fn.sign_define("DiagnosticSignInfo", {
    text = icons.info,
    texthl = "DiagnosticSignInfo",
  })
  vim.fn.sign_define("DiagnosticSignHint", {
    text = icons.hint,
    texthl = "DiagnosticSignHint",
  })

  vim.diagnostic.config({
    virtual_text = {
      prefix = "●",
      format = function(diag)
        local sev = ({ "Error", "Warn", "Info", "Hint" })[diag.severity] or "Info"
        local icon = icons[sev:lower()] or "●"
        return icon .. " " .. diag.message
      end,
    },
    float = {
      border = "rounded",
      header = "",
      prefix = "●",
      source = "always",
      focusable = true,
      style = "minimal",
    },
    severity_sort = true,
    signs = true,
    underline = true,
    update_in_insert = false,
  })
end

local function setup_handlers()
  local ns = vim.api.nvim_create_namespace("white_lily_lsp_progress")
  local progress_msgs = {}

  local status_ok = pcall(require, "lsp-status")
  if not status_ok then
    vim.api.nvim_create_autocmd("User", {
      pattern = "LspProgressStatusUpdated",
      callback = function()
        local ok, status = pcall(vim.lsp.status)
        if not ok then
          return
        end
        vim.b.lsp_progress = status
      end,
    })
  end

  vim.lsp.handlers["$/progress"] = function(_, _, params)
    local token = params.token
    local value = params.value
    if value.kind == "begin" or value.kind == "report" then
      local msg = value.message or "working..."
      progress_msgs[token] = msg
      local all = vim.tbl_values(progress_msgs)
      local text = "❀ " .. table.concat(all, ", ")
      vim.b.lsp_progress = text
    elseif value.kind == "end" then
      progress_msgs[token] = nil
      local all = vim.tbl_values(progress_msgs)
      if #all > 0 then
        vim.b.lsp_progress = "❀ " .. table.concat(all, ", ")
      else
        vim.b.lsp_progress = nil
      end
    end
  end
end

local function setup_hover()
  if vim.lsp.handlers then
    vim.lsp.handlers["textDocument/hover"] = vim.lsp.with(vim.lsp.handlers.hover, {
      border = "rounded",
      focusable = true,
    })
  end
end

local function lsp_keymaps(bufnr)
  local map = vim.keymap.set
  local opts = { buffer = bufnr, silent = true, noremap = true }

  map("n", "gd", vim.lsp.buf.definition, opts)
  map("n", "gD", vim.lsp.buf.declaration, opts)
  map("n", "gi", vim.lsp.buf.implementation, opts)
  map("n", "gr", vim.lsp.buf.references, opts)
  map("n", "K", vim.lsp.buf.hover, opts)
  map("n", "<C-k>", vim.lsp.buf.signature_help, opts)
  map("n", "<leader>rn", vim.lsp.buf.rename, opts)
  map("n", "<leader>ca", vim.lsp.buf.code_action, opts)
  map("n", "[d", vim.diagnostic.goto_prev, opts)
  map("n", "]d", vim.diagnostic.goto_next, opts)
  map("n", "<leader>ld", vim.diagnostic.open_float, opts)
end

function M.setup_servers(servers)
  local to_setup = servers or default_servers

  local capabilities = vim.lsp.protocol.make_client_capabilities()
  local cmp_ok, cmp_capabilities = pcall(require, "cmp_nvim_lsp")
  if cmp_ok then
    capabilities = cmp_capabilities.default_capabilities()
  end

  local use_new_api = pcall(require, "lspconfig.configs")
  local lspconfig_ok, lspconfig = pcall(require, "lspconfig")

  if not lspconfig_ok and not use_new_api then
    vim.notify("white_lily_farewell: nvim-lspconfig not found. Skipping LSP setup.", vim.log.levels.WARN)
    return
  end

  for _, server in ipairs(to_setup) do
    local base_config = vim.tbl_deep_extend("force", {}, M.server_configs[server] or {})
    local user_on_attach = base_config.on_attach
    base_config.capabilities = vim.tbl_deep_extend("force", capabilities, base_config.capabilities or {})
    base_config.on_attach = function(client, bufnr)
      lsp_keymaps(bufnr)
      if user_on_attach then
        user_on_attach(client, bufnr)
      end
    end
    if use_new_api then
      local ok_setup, err = pcall(function()
        vim.lsp.config[server] = vim.tbl_deep_extend("force", vim.lsp.config[server] or {}, base_config)
        vim.lsp.enable(server)
      end)
      if not ok_setup then
        vim.notify("white_lily_farewell: Failed to setup " .. server .. ": " .. tostring(err), vim.log.levels.WARN)
      end
    elseif lspconfig and lspconfig[server] then
      local ok_setup, err = pcall(lspconfig[server].setup, lspconfig[server], base_config)
      if not ok_setup then
        vim.notify("white_lily_farewell: Failed to setup " .. server .. ": " .. tostring(err), vim.log.levels.WARN)
      end
    else
      vim.notify("white_lily_farewell: Server " .. server .. " not available in lspconfig", vim.log.levels.WARN)
    end
  end
end

M.server_configs = {
  lua_ls = {
    settings = {
      Lua = {
        runtime = { version = "LuaJIT" },
        diagnostics = { globals = { "vim" } },
        workspace = {
          library = vim.api.nvim_get_runtime_file("", true),
          checkThirdParty = false,
        },
        telemetry = { enable = false },
        hint = { enable = true },
      },
    },
  },
  pyright = {
    settings = {
      python = {
        analysis = {
          typeCheckingMode = "basic",
          autoSearchPaths = true,
          useLibraryCodeForTypes = true,
        },
      },
    },
  },
  ts_ls = {
    settings = {},
    init_options = {
      hostInfo = "neovim",
    },
  },
  html = {
    settings = {},
  },
  cssls = {
    settings = {},
  },
  jsonls = {
    settings = {
      json = {
        schemas = {},
        validate = { enable = true },
      },
    },
  },
}

function M.setup(opts)
  setup_diagnostics()
  setup_handlers()
  setup_hover()

  local servers = opts and opts.servers or default_servers
  M.setup_servers(servers)
end

return M
