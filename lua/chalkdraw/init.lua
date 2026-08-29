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

M.variants = { 'deep', 'flat', 'paper' }

--- Return one variant's resolved palette, for statusline plugins and the like.
function M.palette(variant)
  return palette[variant or 'deep']
end

--- Apply a variant. `variant` is 'deep', 'flat' or 'paper'.
function M.load(variant)
  variant = variant or 'deep'
  local p = palette[variant]
  if not p then
    vim.notify(
      ("chalkdraw: unknown variant '%s' (expected deep, flat or paper)"):format(variant),
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
  for group, spec in pairs(groups.build(p)) do
    set(0, group, spec)
  end

  for i, color in ipairs(groups.terminal(p)) do
    vim.g['terminal_color_' .. (i - 1)] = color
  end
end

--- Present for people who expect a setup() entry point; `opts.variant` selects.
function M.setup(opts)
  M.load((opts or {}).variant)
end

return M
