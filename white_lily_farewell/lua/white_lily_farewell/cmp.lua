local M = {}

function M.setup()
  local ok, cmp = pcall(require, "cmp")
  if not ok then
    vim.notify("white_lily_farewell: nvim-cmp not found. Skipping completion setup.", vim.log.levels.WARN)
    return
  end

  local icons = require("white_lily_farewell.icons").icons.kind

  local sources = {
    { name = "nvim_lsp" },
    { name = "path" },
    { name = "buffer" },
  }

  local has_luasnip, luasnip = pcall(require, "luasnip")
  if has_luasnip then
    table.insert(sources, { name = "luasnip" })
  end

  cmp.setup({
    snippet = {
      expand = function(args)
        if has_luasnip then
          luasnip.lsp_expand(args.body)
        end
      end,
    },
    mapping = cmp.mapping.preset.insert({
      ["<C-b>"] = cmp.mapping.scroll_docs(-4),
      ["<C-f>"] = cmp.mapping.scroll_docs(4),
      ["<C-Space>"] = cmp.mapping.complete(),
      ["<C-e>"] = cmp.mapping.abort(),
      ["<CR>"] = cmp.mapping.confirm({ select = true }),
      ["<Tab>"] = cmp.mapping(function(fallback)
        if cmp.visible() then
          cmp.select_next_item()
        elseif has_luasnip and luasnip.expand_or_jumpable() then
          luasnip.expand_or_jump()
        else
          fallback()
        end
      end, { "i", "s" }),
      ["<S-Tab>"] = cmp.mapping(function(fallback)
        if cmp.visible() then
          cmp.select_prev_item()
        elseif has_luasnip and luasnip.jumpable(-1) then
          luasnip.jump(-1)
        else
          fallback()
        end
      end, { "i", "s" }),
    }),
    sources = sources,
    formatting = {
      format = function(entry, item)
        item.kind = (icons[item.kind] or "●") .. " " .. item.kind
        item.menu = ({
          nvim_lsp = "[LSP]",
          luasnip = "[Snippet]",
          buffer = "[Buffer]",
          path = "[Path]",
        })[entry.source.name]
        return item
      end,
    },
    sorting = {
      priority_weight = 2,
      comparators = {
        cmp.config.compare.offset,
        cmp.config.compare.exact,
        cmp.config.compare.score,
        cmp.config.compare.recently_used,
        cmp.config.compare.locality,
        cmp.config.compare.kind,
        cmp.config.compare.sort_text,
        cmp.config.compare.length,
        cmp.config.compare.order,
      },
    },
    window = {
      completion = {
        border = "rounded",
        winhighlight = "Normal:PMenu,FloatBorder:FloatBorder,CursorLine:PMenuSel,Search:None",
      },
      documentation = {
        border = "rounded",
        winhighlight = "Normal:NormalFloat,FloatBorder:FloatBorder",
      },
    },
  })
end

return M
