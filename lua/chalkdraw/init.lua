-- Chalkdraw for Neovim.
--
-- Three variants, sharing one palette source with the VS Code extension:
--   chalkdraw-deep   dark, editor is the darkest surface
--   chalkdraw-flat   dark, the same two greys inverted
--   chalkdraw-paper  light, warm uncoated stock
--
-- Usage:
--   vim.cmd.colorscheme('chalkdraw-deep')
-- or
--   require('chalkdraw').load('flat')

local palette = require('chalkdraw.palette')
local groups = require('chalkdraw.groups')

local M = {}

M.variants = { 'deep', 'flat', 'paper', 'cool' }

--- Return one variant's resolved palette, for statusline plugins and the like.
function M.palette(variant)
  return palette[variant or 'deep']
end

--- Options set by setup(), used when `:colorscheme chalkdraw-*` is called
--- directly (the colorscheme command cannot take arguments).
M.options = { transparent = false }

--- Apply a variant.
--- @param variant string|table 'deep'|'flat'|'paper'|'cool', or { variant=, transparent= }
--- @param opts table|nil { transparent = boolean }
function M.load(variant, opts)
  if type(variant) == 'table' then
    opts = variant
    variant = opts.variant
  end
  opts = vim.tbl_extend('force', {}, M.options, opts or {})
  -- vim.g.chalkdraw_transparent is the escape hatch for people who only ever
  -- call :colorscheme and never require the module.
  if vim.g.chalkdraw_transparent ~= nil then
    opts.transparent = vim.g.chalkdraw_transparent and true or false
  end

  variant = variant or 'deep'
  local p = palette[variant]
  if not p then
    vim.notify(
      ("chalkdraw: unknown variant '%s' (expected deep, flat, paper or cool)"):format(variant),
      vim.log.levels.ERROR
    )
    return
  end

  if vim.g.colors_name then
    vim.cmd('highlight clear')
  end
  if vim.fn.exists('syntax_on') == 1 then
    vim.cmd('syntax reset')
  end

  vim.o.termguicolors = true
  vim.o.background = p.kind
  vim.g.colors_name = 'chalkdraw-' .. variant

  local set = vim.api.nvim_set_hl
  for group, spec in pairs(groups.build(p, opts)) do
    set(0, group, spec)
  end

  for i, color in ipairs(groups.terminal(p)) do
    vim.g['terminal_color_' .. (i - 1)] = color
  end
end

--- Configure and apply. Options are remembered, so a later
--- `:colorscheme chalkdraw-flat` keeps them.
--- @param opts table|nil { variant = 'deep'|'flat'|'paper'|'cool', transparent = boolean }
function M.setup(opts)
  opts = opts or {}
  if opts.transparent ~= nil then
    M.options.transparent = opts.transparent
  end
  M.load(opts.variant, opts)
end

return M
