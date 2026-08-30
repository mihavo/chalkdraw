<div align="center">

<img src="./resources/icon/chalkdraw.png" width="96" alt="Chalkdraw" />

# Chalkdraw

**A chalkboard-inspired theme**

[![Version](https://vsmarketplacebadges.dev/version-short/michaelvolakis.chalkdraw.svg?color=abbfd6&labelColor=1b1d1f&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=michaelvolakis.chalkdraw)
[![Installs](https://vsmarketplacebadges.dev/installs-short/michaelvolakis.chalkdraw.svg?color=7aa2f7&labelColor=1b1d1f&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=michaelvolakis.chalkdraw)
[![Downloads](https://vsmarketplacebadges.dev/downloads-short/michaelvolakis.chalkdraw.svg?color=4fc9b0&labelColor=1b1d1f&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=michaelvolakis.chalkdraw)
[![License](https://img.shields.io/github/license/mihavo/chalkdraw?color=d1a8ff&labelColor=1b1d1f&style=for-the-badge)](./LICENSE)

</div>

<br />

![Chalkdraw — Deep, Flat, Cool and Paper](./resources/screenshots/chalkdraw-variants.png)

<br />

## Install

Open Quick Open (`Ctrl+P` / `Cmd+P`), then run:

```
ext install michaelvolakis.chalkdraw
```

Then pick the theme: **Preferences: Color Theme** → **Chalkdraw Deep**, **Chalkdraw Flat**, **Chalkdraw Cool** or **Chalkdraw Paper**.

<br />

## Neovim

The same four variants ship as a Neovim colorscheme, generated from the same palette source, so the two editors never drift apart. Requires Neovim 0.9+ with `termguicolors`.

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
<br />


## Screenshots

**Deep**

![Chalkdraw Deep](./resources/screenshots/chalkdraw-deep.png)

**Flat**

![Chalkdraw Flat](./resources/screenshots/chalkdraw-flat.png)

**Cool**

![Chalkdraw Cool](./resources/screenshots/chalkdraw-cool.png)

**Paper**

![Chalkdraw Paper](./resources/screenshots/chalkdraw-paper.png)

<br />

## Palette

| Role | Dark | Paper |
| --- | --- | --- |
| Keywords, storage, control flow | `#f29790` | `#b7272d` |
| Imported module paths | `#f5d39c` | `#80612c` |
| Types, classes, packages | `#4fc9b0` | `#006d5c` |
| Functions and methods | `#7aa2f7` | `#2c59c8` |
| Strings | `#75bf85` | `#29743f` |
| Numbers | `#e2b3ed` | `#7c5186` |
| Named constants, enum members | `#d19b6c` | `#7c3e2e` |
| Variables, fields, properties | `#abbfd6` | `#202e3e` |
| Parameter names in declarations | `#ffc491` | `#985500` |
| Operators, brackets, separators | `#93a4b8` | `#576474` |
| Comments | `#6d7681` | `#4e5d6f` |
| Line numbers | `#4b545e` | `#798593` |
| Cursor | `#abbfd6` | `#202e3e` |
| Rails, active marks | `#7aa2f7` | `#2e6da8` |
| Editor background | `#17191b` | `#ebe6da` |
| Sidebar, tabs, status bar | `#1b1d1f` | `#e2dcce` |
| Active line | `#1f2125` | `#cfcabf` |
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
