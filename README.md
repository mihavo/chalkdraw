<div align="center">

<img src="./resources/icon/chalkdraw.png" width="96" alt="Chalkdraw" />

# Chalkdraw

**A distinct dark theme inspired by classic chalkboards, designed to minimize eye strain**

[![Version](https://vsmarketplacebadges.dev/version-short/michaelvolakis.chalkdraw.svg?color=a4bdd6&labelColor=17191b&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=michaelvolakis.chalkdraw)
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

**Transparent background**

```lua
{
  'mihavo/chalkdraw',
  lazy = false,
  priority = 1000,
  config = function()
    require('chalkdraw').setup({ variant = 'deep', transparent = true })
  end,
}
```

Clears the backgrounds that sit on the terminal — editor, sign column, status line, tab line, file trees — so your terminal's own background shows through. Floats, popups, the completion menu, the cursor line and selections keep theirs, since a transparent popup over arbitrary content is unreadable. The setting survives a later `:colorscheme chalkdraw-flat`. If you only ever use `:colorscheme`, set `vim.g.chalkdraw_transparent = true` before it instead.

Pick a variant with `chalkdraw-deep`, `chalkdraw-flat` or `chalkdraw-paper`. Treesitter, LSP semantic tokens, diagnostics, git signs and the 16 ANSI terminal colors are all covered, along with Telescope, nvim-tree, neo-tree, nvim-cmp, blink.cmp, which-key, indent guides, notify/noice, mini.nvim, lazy and mason.

<br />

## Variants

| Theme | Editor | Panels | Notes |
| --- | --- | --- | --- |
| **Chalkdraw Deep** | `#17191b` | `#1b1d1f` | Editor is the darkest surface |
| **Chalkdraw Flat** | `#1b1d1f` | `#17191b` | The same two greys, inverted |
| **Chalkdraw Paper** | `#ebe6da` | `#e2dcce` | Warm uncoated stock, never white |
| **Chalkdraw Cool** | `#131821` | `#0e141d` | Faint blue cast, panels darker than the editor |

<br />

## Screenshots

**Flat**

![Chalkdraw Flat](./resources/screenshots/chalkdraw-flat.png)

**Paper**

![Chalkdraw Paper](./resources/screenshots/chalkdraw-paper.png)

<br />

## Chalkdraw Cool

A near-neutral dark ground with a faint blue cast, where the panels sit one step *darker* than the editor rather than lighter — the inverse of Deep and Flat. The chrome is deliberately darker than Deep and Flat, and syntax runs at roughly 140% of Deep's chroma, so the colours carry further against the cooler ground: keyword blue and type teal do the structural work, functions are violet, and strings are the only warm note in the code. Identifiers stay a bright warm-neutral chalk white, which is what keeps it recognisably Chalkdraw.

**UI**

| Role | Hex |
| --- | --- |
| Editor background | `#131821` |
| Sidebar, tabs, title bar, terminal | `#0e141d` |
| Status bar | `#0b111a` |
| Dividers and tab borders | `#1e2733` |
| Active selection | `#1a2331` on `#e4eaf3` |
| Active tab | `#131821`, top border `#5e97ff` |
| Inactive tab text | `#8c97a5` |
| Foreground | `#e4eaf3` |
| Description text | `#8c97a5` |
| Section labels, inactive panel tabs | `#5f6a79` |
| Accent — links, cursor, focus, indicators | `#5e97ff` |
| Link hover | `#96bcff` |
| Tree files | `#b4bfcc` |
| Tree secondary | `#8c97a5` |
| Tree ignored | `#4e5460` |

**Syntax**

| Role | Hex |
| --- | --- |
| Default foreground | `#f2f0e8` |
| Keywords | `#5e97ff` |
| Types, packages, classes | `#2fd8b6` |
| Functions and methods | `#b79ce8` |
| Fields, properties, variables | `#a4bdd6` |
| Strings | `#e8c79a` |
| Numbers, constants, `nil`/`true`/`false` | `#e4798d` |
| Comments | `#5b6675` |
| Punctuation and operators | `#c3cfdf` |
| Line numbers | `#464e59` |

Cool reuses the shared git decoration scale unchanged, and is the one variant where fields and properties take a colour of their own rather than the default foreground.

<br />

## Palette

| Role | Dark | Paper |
| --- | --- | --- |
| Keywords, storage, control flow | `#7aa2f7` | `#0b4ea8` |
| Types, classes, packages | `#4fc9b0` | `#00655a` |
| Functions and methods | `#d1a8ff` | `#5c15b0` |
| Strings | `#ce9178` | `#9b3208` |
| Numbers, constants | `#b5cea8` | `#22660b` |
| Variables, fields, properties | `#a4bdd6` | `#1e1c18` |
| Operators, brackets, separators | `#8da3b8` | `#5c564d` |
| Comments | `#6d7681` | `#6e675a` |
| Line numbers | `#48535e` | `#8e8779` |
| Cursor | `#a4bdd6` | `#1e1c18` |
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
