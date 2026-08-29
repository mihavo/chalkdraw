<div align="center">

<img src="./resources/icon/chalkdraw.png" width="96" alt="Chalkdraw" />

# Chalkdraw

**A distinct dark theme inspired by classic chalkboards, designed to minimize eye strain**

[![Version](https://vsmarketplacebadges.dev/version-short/michaelvolakis.chalkdraw.svg?color=e8dccf&labelColor=17191b&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=michaelvolakis.chalkdraw)
[![Installs](https://vsmarketplacebadges.dev/installs-short/michaelvolakis.chalkdraw.svg?color=7aa2f7&labelColor=17191b&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=michaelvolakis.chalkdraw)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/michaelvolakis.chalkdraw.svg?color=4fc9b0&labelColor=17191b&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=michaelvolakis.chalkdraw)
[![License](https://img.shields.io/github/license/mihavo/chalkdraw?color=d1a8ff&labelColor=17191b&style=for-the-badge)](./LICENSE)

</div>

<br />

![Chalkdraw — Deep, Flat and Paper](./resources/screenshots/chalkdraw-variants.png)

<br />

## Install

Open Quick Open (`Ctrl+P` / `Cmd+P`), then run:

```
ext install michaelvolakis.chalkdraw
```

Then pick the theme: **Preferences: Color Theme** → **Chalkdraw Deep**, **Chalkdraw Flat** or **Chalkdraw Paper**.

<br />

## Neovim

The same three variants ship as a Neovim colorscheme, generated from the same palette source, so the two editors never drift apart. Requires Neovim 0.9+ with `termguicolors`.

**lazy.nvim**

```lua
{
  'mihavo/chalkdraw',
  lazy = false,
  priority = 1000,
  config = function()
    vim.cmd.colorscheme('chalkdraw-deep')
  end,
}
```

**packer**

```lua
use { 'mihavo/chalkdraw', config = function() vim.cmd.colorscheme('chalkdraw-deep') end }
```

Pick a variant with `chalkdraw-deep`, `chalkdraw-flat` or `chalkdraw-paper`. Treesitter, LSP semantic tokens, diagnostics, git signs and the 16 ANSI terminal colors are all covered, along with Telescope, nvim-tree, neo-tree, nvim-cmp, blink.cmp, which-key, indent guides, notify/noice, mini.nvim, lazy and mason.

<br />

## Variants

| Theme | Editor | Panels | Notes |
| --- | --- | --- | --- |
| **Chalkdraw Deep** | `#17191b` | `#1b1d1f` | Editor is the darkest surface |
| **Chalkdraw Flat** | `#1b1d1f` | `#17191b` | The same two greys, inverted |
| **Chalkdraw Paper** | `#ebe6da` | `#e2dcce` | Warm uncoated stock, never white |

<br />

## Screenshots

**Flat**

![Chalkdraw Flat](./resources/screenshots/chalkdraw-flat.png)

**Paper**

![Chalkdraw Paper](./resources/screenshots/chalkdraw-paper.png)

<br />

## Palette

| Role | Dark | Paper |
| --- | --- | --- |
| Keywords, storage, control flow | `#7aa2f7` | `#0b4ea8` |
| Types, classes, packages | `#4fc9b0` | `#00655a` |
| Functions and methods | `#d1a8ff` | `#5c15b0` |
| Strings | `#ce9178` | `#9b3208` |
| Numbers, constants | `#b5cea8` | `#22660b` |
| Variables, fields, properties | `#e8dccf` | `#1e1c18` |
| Operators, brackets, separators | `#c8bdb2` | `#5c564d` |
| Comments | `#6d7681` | `#6e675a` |
| Line numbers | `#66615b` | `#8e8779` |
| Cursor | `#e8dccf` | `#1e1c18` |
| Rails, active marks | `#7aa2f7` | `#2e6da8` |
| Editor background | `#17191b` | `#ebe6da` |
| Sidebar, tabs, status bar | `#1b1d1f` | `#e2dcce` |
| Active line | `#1f2125` | `#dfd8c8` |
| Dividers | `#282a2d` | `#d9d3c7` |

<br />

## Recommended settings

The screenshots above use these settings:

```jsonc
{
  "workbench.colorTheme": "Chalkdraw Deep",
  "editor.fontFamily": "JetBrains Mono, monospace",
  "editor.fontLigatures": false,
  "editor.fontSize": 13,
  "editor.lineHeight": 22,
  "editor.tabSize": 4,
  "editor.renderWhitespace": "selection"
}
```
