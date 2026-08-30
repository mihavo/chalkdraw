-- Highlight group mapping for Chalkdraw.
--
-- This is the Neovim counterpart of buildWorkbench()/buildTokenColors() in
-- src/build.js: it takes a resolved palette (lua/chalkdraw/palette.lua, which is
-- generated) and maps the roles onto highlight groups.
--
-- Design rules carried over from the VS Code theme:
--   * No italics and no bold, anywhere.
--   * Fields, properties and object keys use the identifier ink, never a hue of
--     their own.
--   * Comments stay above punctuation in contrast; they are not dimmed.
--   * Every cursor takes the identifier ink rather than the accent.
--   * Git status colors come from the `git` scale, never from ui.warning or
--     ui.success -- those stay on diagnostics and test output.
--   * Three accent hues, ever. Gaps are filled by blending existing tokens.

local M = {}

--- Blend two hex colors. `t` is how much of `b` to mix in.
local function blend(a, b, t)
  local function ch(hex, i)
    return tonumber(hex:sub(i, i + 1), 16)
  end
  local r = math.floor(ch(a, 2) + (ch(b, 2) - ch(a, 2)) * t + 0.5)
  local g = math.floor(ch(a, 4) + (ch(b, 4) - ch(a, 4)) * t + 0.5)
  local bl = math.floor(ch(a, 6) + (ch(b, 6) - ch(a, 6)) * t + 0.5)
  return string.format('#%02X%02X%02X', r, g, bl)
end

--- Build the full highlight table for one variant.
--- @param p table resolved palette (lua/chalkdraw/palette.lua)
--- @param opts table|nil { transparent = boolean }
function M.build(p, opts)
  local s, u, g = p.syntax, p.ui, p.git
  local bg, chrome, line = p.shell.editor, p.shell.chrome, p.shell.line
  local dark = p.kind == 'dark'

  -- Gap fillers, mirroring the VS Code build: blends of existing tokens only.
  local raised = blend(chrome, u.fgFaint, 0.06)
  local sunken = blend(chrome, dark and '#000000' or u.border, 0.35)
  local sel = blend(bg, u.accent, 0.28)
  local visual = blend(bg, u.accent, 0.22)

  local hl = {
    ---------------------------------------------------------------- editor ---
    Normal = { fg = s.identifier, bg = bg },
    NormalNC = { fg = s.identifier, bg = bg },
    NormalFloat = { fg = s.identifier, bg = chrome },
    FloatBorder = { fg = u.border, bg = chrome },
    FloatTitle = { fg = u.fgStrong, bg = chrome },
    Cursor = { fg = bg, bg = s.identifier },
    lCursor = { fg = bg, bg = s.identifier },
    CursorIM = { fg = bg, bg = s.identifier },
    TermCursor = { fg = bg, bg = s.identifier },
    CursorLine = { bg = line },
    CursorColumn = { bg = line },
    ColorColumn = { bg = line },
    LineNr = { fg = s.lineNumber },
    CursorLineNr = { fg = u.accent },
    CursorLineSign = { bg = line },
    CursorLineFold = { bg = line },
    SignColumn = { bg = bg },
    FoldColumn = { fg = u.dim, bg = bg },
    Folded = { fg = u.fgFaint, bg = line },
    VertSplit = { fg = u.border, bg = bg },
    WinSeparator = { fg = u.border, bg = bg },
    EndOfBuffer = { fg = bg },
    NonText = { fg = u.dim },
    Whitespace = { fg = u.dim },
    SpecialKey = { fg = u.dim },
    MatchParen = { fg = u.accent, bg = blend(bg, u.accent, 0.14) },
    Visual = { bg = visual },
    VisualNOS = { bg = visual },
    Search = { fg = bg, bg = blend(bg, u.accent, 0.55) },
    IncSearch = { fg = bg, bg = u.accent },
    CurSearch = { fg = bg, bg = u.accent },
    Substitute = { fg = bg, bg = u.warning },
    Conceal = { fg = u.dim },
    Directory = { fg = u.accent },
    Title = { fg = u.fgStrong },
    Question = { fg = u.accent },
    MoreMsg = { fg = u.accent },
    ModeMsg = { fg = u.fgMuted },
    ErrorMsg = { fg = u.error },
    WarningMsg = { fg = u.warning },
    WinBar = { fg = u.fgFaint, bg = bg },
    WinBarNC = { fg = u.fgFaint, bg = bg },

    ------------------------------------------------------------------ ui -----
    StatusLine = { fg = u.fgMuted, bg = chrome },
    StatusLineNC = { fg = u.fgFaint, bg = chrome },
    TabLine = { fg = u.fgMuted, bg = chrome },
    TabLineFill = { bg = chrome },
    TabLineSel = { fg = u.fgStrong, bg = bg },
    Pmenu = { fg = s.identifier, bg = chrome },
    PmenuSel = { fg = u.fgStrong, bg = line },
    PmenuKind = { fg = s.type, bg = chrome },
    PmenuKindSel = { fg = s.type, bg = line },
    PmenuExtra = { fg = u.fgFaint, bg = chrome },
    PmenuExtraSel = { fg = u.fgMuted, bg = line },
    PmenuSbar = { bg = chrome },
    PmenuThumb = { bg = u.dim },
    PmenuMatch = { fg = u.accent, bg = chrome },
    PmenuMatchSel = { fg = u.accent, bg = line },
    WildMenu = { fg = u.fgStrong, bg = line },
    QuickFixLine = { bg = line },
    MsgArea = { fg = u.fgMuted },
    MsgSeparator = { fg = u.border },
    Menu = { fg = u.fgMuted, bg = chrome },
    Scrollbar = { bg = chrome },
    Tooltip = { fg = s.identifier, bg = chrome },

    -------------------------------------------------------------- syntax -----
    Comment = { fg = s.comment },
    Constant = { fg = s.number },
    String = { fg = s.string },
    Character = { fg = s.string },
    Number = { fg = s.number },
    Boolean = { fg = s.keyword },
    Float = { fg = s.number },
    Identifier = { fg = s.identifier },
    Function = { fg = s['function'] },
    Statement = { fg = s.keyword },
    Conditional = { fg = s.keyword },
    Repeat = { fg = s.keyword },
    Label = { fg = s.keyword },
    Operator = { fg = s.punctuation },
    Keyword = { fg = s.keyword },
    Exception = { fg = s.keyword },
    PreProc = { fg = s.keyword },
    Include = { fg = s.keyword },
    Define = { fg = s.keyword },
    Macro = { fg = s['function'] },
    PreCondit = { fg = s.keyword },
    Type = { fg = s.type },
    StorageClass = { fg = s.keyword },
    Structure = { fg = s.type },
    Typedef = { fg = s.type },
    Special = { fg = s['function'] },
    SpecialChar = { fg = s.number },
    Tag = { fg = s.type },
    Delimiter = { fg = s.punctuation },
    SpecialComment = { fg = s.comment },
    Debug = { fg = u.warning },
    Underlined = { fg = u.accent, underline = true },
    Ignore = { fg = u.fgFaint },
    Error = { fg = u.error },
    Todo = { fg = u.warning, bg = 'NONE' },

    ------------------------------------------------------------ diagnostics --
    DiagnosticError = { fg = u.error },
    DiagnosticWarn = { fg = u.warning },
    DiagnosticInfo = { fg = u.accent },
    DiagnosticHint = { fg = u.success },
    DiagnosticOk = { fg = u.success },
    DiagnosticVirtualTextError = { fg = u.error, bg = blend(bg, u.error, 0.10) },
    DiagnosticVirtualTextWarn = { fg = u.warning, bg = blend(bg, u.warning, 0.10) },
    DiagnosticVirtualTextInfo = { fg = u.accent, bg = blend(bg, u.accent, 0.10) },
    DiagnosticVirtualTextHint = { fg = u.success, bg = blend(bg, u.success, 0.10) },
    DiagnosticUnderlineError = { sp = u.error, undercurl = true },
    DiagnosticUnderlineWarn = { sp = u.warning, undercurl = true },
    DiagnosticUnderlineInfo = { sp = u.accent, undercurl = true },
    DiagnosticUnderlineHint = { sp = u.success, undercurl = true },
    DiagnosticUnnecessary = { fg = u.fgFaint },
    DiagnosticDeprecated = { fg = u.fgFaint, strikethrough = true },

    ---------------------------------------------------------------- diff -----
    DiffAdd = { bg = blend(bg, g.added, 0.18) },
    DiffChange = { bg = blend(bg, g.modified, 0.14) },
    DiffDelete = { bg = blend(bg, g.deleted, 0.18) },
    DiffText = { bg = blend(bg, g.modified, 0.30) },
    Added = { fg = g.added },
    Changed = { fg = g.modified },
    Removed = { fg = g.deleted },

    ----------------------------------------------------------- git signs -----
    -- Same scale as the VS Code file-explorer decorations.
    SignAdd = { fg = g.added },
    SignChange = { fg = g.modified },
    SignDelete = { fg = g.deleted },
    GitSignsAdd = { fg = g.added },
    GitSignsChange = { fg = g.modified },
    GitSignsDelete = { fg = g.deleted },
    GitSignsUntracked = { fg = g.untracked },
    GitSignsAddNr = { fg = g.added },
    GitSignsChangeNr = { fg = g.modified },
    GitSignsDeleteNr = { fg = g.deleted },
    GitSignsCurrentLineBlame = { fg = u.fgFaint },
    GitGutterAdd = { fg = g.added },
    GitGutterChange = { fg = g.modified },
    GitGutterDelete = { fg = g.deleted },
    diffAdded = { fg = g.added },
    diffRemoved = { fg = g.deleted },
    diffChanged = { fg = g.modified },
    diffFile = { fg = s.type },
    diffLine = { fg = u.fgFaint },
    diffIndexLine = { fg = u.fgFaint },
    diffOldFile = { fg = g.deleted },
    diffNewFile = { fg = g.added },

    ------------------------------------------------------------- spelling ----
    SpellBad = { sp = u.error, undercurl = true },
    SpellCap = { sp = u.warning, undercurl = true },
    SpellLocal = { sp = u.accent, undercurl = true },
    SpellRare = { sp = s['function'], undercurl = true },
  }

  ---------------------------------------------------------------- treesitter --
  -- Roles mirror the VS Code scope mapping exactly.
  local ts = {
    ['@comment'] = s.comment,
    ['@comment.documentation'] = s.comment,
    ['@comment.error'] = u.error,
    ['@comment.warning'] = u.warning,
    ['@comment.todo'] = u.warning,
    ['@comment.note'] = u.accent,

    ['@constant'] = s.number,
    ['@constant.builtin'] = s.keyword,
    ['@constant.macro'] = s.keyword,
    ['@number'] = s.number,
    ['@number.float'] = s.number,
    ['@boolean'] = s.keyword,
    ['@character'] = s.string,
    ['@character.special'] = s.number,

    ['@string'] = s.string,
    ['@string.documentation'] = s.string,
    ['@string.regexp'] = s.string,
    ['@string.escape'] = s.number,
    ['@string.special'] = s.number,
    ['@string.special.url'] = s['function'],

    ['@function'] = s['function'],
    ['@function.builtin'] = s['function'],
    ['@function.call'] = s['function'],
    ['@function.macro'] = s['function'],
    ['@function.method'] = s['function'],
    ['@function.method.call'] = s['function'],
    ['@constructor'] = s.type,

    ['@keyword'] = s.keyword,
    ['@keyword.function'] = s.keyword,
    ['@keyword.operator'] = s.keyword,
    ['@keyword.return'] = s.keyword,
    ['@keyword.import'] = s.keyword,
    ['@keyword.storage'] = s.keyword,
    ['@keyword.repeat'] = s.keyword,
    ['@keyword.conditional'] = s.keyword,
    ['@keyword.exception'] = s.keyword,
    ['@keyword.directive'] = s.keyword,
    ['@keyword.coroutine'] = s.keyword,

    ['@type'] = s.type,
    ['@type.builtin'] = s.keyword,
    ['@type.definition'] = s.type,
    ['@type.qualifier'] = s.keyword,
    ['@module'] = s.type,
    ['@module.builtin'] = s.type,
    ['@attribute'] = s.type,
    ['@attribute.builtin'] = s.type,

    -- Fields, properties and object keys take the identifier ink by design.
    ['@variable'] = s.identifier,
    ['@variable.builtin'] = s.keyword,
    ['@variable.parameter'] = s.parameter or s.field,
    ['@variable.parameter.builtin'] = s.parameter or s.field,
    ['@variable.member'] = s.field,
    ['@property'] = s.field,
    ['@field'] = s.field,
    ['@label'] = s.keyword,

    ['@operator'] = s.punctuation,
    ['@punctuation'] = s.punctuation,
    ['@punctuation.delimiter'] = s.punctuation,
    ['@punctuation.bracket'] = s.punctuation,
    ['@punctuation.special'] = s.punctuation,

    ['@tag'] = s.type,
    ['@tag.builtin'] = s.type,
    ['@tag.attribute'] = s.identifier,
    ['@tag.delimiter'] = s.punctuation,

    ['@diff.plus'] = g.added,
    ['@diff.minus'] = g.deleted,
    ['@diff.delta'] = g.modified,

    ['@none'] = s.identifier,
  }
  for group, fg in pairs(ts) do
    hl[group] = { fg = fg }
  end

  -- Markup: headings take the keyword color, emphasis the type color, inline
  -- code the string color, links the function color -- and, per the design,
  -- strong text is weight-neutral rather than bold.
  -- Imported module paths. Go's bundled highlights.scm tags the path as a
  -- plain @string, so after/queries/go/highlights.scm adds @string.import on
  -- top; unmapped, it would simply inherit @string.
  hl['@string.import'] = { fg = s.importPath or s.string }
  hl['@module.import'] = { fg = s.importPath or s.string }

  hl['@markup.heading'] = { fg = s.keyword }
  hl['@markup.heading.1'] = { fg = s.keyword }
  hl['@markup.heading.2'] = { fg = s.keyword }
  hl['@markup.heading.3'] = { fg = s.keyword }
  hl['@markup.heading.4'] = { fg = s.keyword }
  hl['@markup.heading.5'] = { fg = s.keyword }
  hl['@markup.heading.6'] = { fg = s.keyword }
  hl['@markup.strong'] = { fg = s.identifier }
  hl['@markup.italic'] = { fg = s.type }
  hl['@markup.strikethrough'] = { fg = u.fgFaint, strikethrough = true }
  hl['@markup.underline'] = { fg = u.accent, underline = true }
  hl['@markup.raw'] = { fg = s.string }
  hl['@markup.raw.block'] = { fg = s.string }
  hl['@markup.link'] = { fg = s['function'] }
  hl['@markup.link.label'] = { fg = s['function'] }
  hl['@markup.link.url'] = { fg = s['function'], underline = true }
  hl['@markup.quote'] = { fg = s.comment }
  hl['@markup.list'] = { fg = s.punctuation }
  hl['@markup.list.checked'] = { fg = u.success }
  hl['@markup.list.unchecked'] = { fg = u.fgFaint }
  hl['@markup.math'] = { fg = s.number }
  hl['@markup.environment'] = { fg = s.keyword }

  ------------------------------------------------------------------- lsp -----
  -- Mirrors semanticTokenColors in the VS Code build.
  local lsp = {
    ['@lsp.type.namespace'] = s.type,
    ['@lsp.type.type'] = s.type,
    ['@lsp.type.class'] = s.type,
    ['@lsp.type.struct'] = s.type,
    ['@lsp.type.interface'] = s.type,
    ['@lsp.type.enum'] = s.type,
    ['@lsp.type.typeParameter'] = s.type,
    ['@lsp.type.parameter'] = s.parameter or s.field,
    ['@lsp.type.variable'] = s.identifier,
    ['@lsp.type.property'] = s.field,
    ['@lsp.type.enumMember'] = s.number,
    ['@lsp.type.function'] = s['function'],
    ['@lsp.type.method'] = s['function'],
    ['@lsp.type.macro'] = s['function'],
    ['@lsp.type.decorator'] = s.type,
    ['@lsp.type.event'] = s['function'],
    ['@lsp.type.keyword'] = s.keyword,
    ['@lsp.type.modifier'] = s.keyword,
    ['@lsp.type.comment'] = s.comment,
    ['@lsp.type.string'] = s.string,
    ['@lsp.type.number'] = s.number,
    ['@lsp.type.regexp'] = s.string,
    ['@lsp.type.operator'] = s.punctuation,
    ['@lsp.typemod.variable.readonly'] = s.identifier,
    ['@lsp.typemod.variable.defaultLibrary'] = s.keyword,
    ['@lsp.typemod.function.defaultLibrary'] = s['function'],
    ['@lsp.typemod.type.defaultLibrary'] = s.keyword,
  }
  for group, fg in pairs(lsp) do
    hl[group] = { fg = fg }
  end

  hl.LspReferenceText = { bg = blend(bg, u.accent, 0.12) }
  hl.LspReferenceRead = { bg = blend(bg, u.accent, 0.12) }
  hl.LspReferenceWrite = { bg = blend(bg, u.accent, 0.18) }
  hl.LspSignatureActiveParameter = { fg = u.accent }
  hl.LspInlayHint = { fg = s.comment, bg = blend(bg, u.dim, 0.25) }
  hl.LspCodeLens = { fg = s.comment }
  hl.LspInfoBorder = { fg = u.border, bg = chrome }

  --------------------------------------------------------------- plugins -----
  -- Common plugins, kept on the same tokens so nothing introduces a new hue.
  local plugins = {
    -- Telescope
    TelescopeNormal = { fg = s.identifier, bg = chrome },
    TelescopeBorder = { fg = u.border, bg = chrome },
    TelescopeTitle = { fg = u.fgStrong },
    TelescopePromptNormal = { fg = s.identifier, bg = sunken },
    TelescopePromptBorder = { fg = u.border, bg = sunken },
    TelescopePromptPrefix = { fg = u.accent },
    TelescopeSelection = { fg = u.fgStrong, bg = line },
    TelescopeSelectionCaret = { fg = u.accent, bg = line },
    TelescopeMatching = { fg = u.accent },

    -- nvim-tree / neo-tree
    NvimTreeNormal = { fg = u.fgTree, bg = chrome },
    NvimTreeWinSeparator = { fg = u.border, bg = chrome },
    NvimTreeRootFolder = { fg = u.fgFaint },
    NvimTreeFolderName = { fg = u.fgTree },
    NvimTreeOpenedFolderName = { fg = u.fgStrong },
    NvimTreeFolderIcon = { fg = u.accent },
    NvimTreeIndentMarker = { fg = u.border },
    NvimTreeCursorLine = { bg = line },
    NvimTreeGitDirty = { fg = g.modified },
    NvimTreeGitNew = { fg = g.untracked },
    NvimTreeGitDeleted = { fg = g.deleted },
    NvimTreeGitStaged = { fg = g.stageModified },
    NvimTreeGitMerge = { fg = g.conflicting },
    NvimTreeGitIgnored = { fg = g.ignored },
    NeoTreeNormal = { fg = u.fgTree, bg = chrome },
    NeoTreeNormalNC = { fg = u.fgTree, bg = chrome },
    NeoTreeDirectoryName = { fg = u.fgTree },
    NeoTreeDirectoryIcon = { fg = u.accent },
    NeoTreeRootName = { fg = u.fgFaint },
    NeoTreeIndentMarker = { fg = u.border },
    NeoTreeGitModified = { fg = g.modified },
    NeoTreeGitUntracked = { fg = g.untracked },
    NeoTreeGitDeleted = { fg = g.deleted },
    NeoTreeGitAdded = { fg = g.added },
    NeoTreeGitConflict = { fg = g.conflicting },
    NeoTreeGitIgnored = { fg = g.ignored },

    -- nvim-cmp / blink
    CmpItemAbbr = { fg = s.identifier },
    CmpItemAbbrDeprecated = { fg = u.fgFaint, strikethrough = true },
    CmpItemAbbrMatch = { fg = u.accent },
    CmpItemAbbrMatchFuzzy = { fg = u.accent },
    CmpItemMenu = { fg = u.fgFaint },
    CmpItemKindText = { fg = s.identifier },
    CmpItemKindVariable = { fg = s.identifier },
    CmpItemKindField = { fg = s.field },
    CmpItemKindProperty = { fg = s.field },
    CmpItemKindFunction = { fg = s['function'] },
    CmpItemKindMethod = { fg = s['function'] },
    CmpItemKindConstructor = { fg = s.type },
    CmpItemKindClass = { fg = s.type },
    CmpItemKindInterface = { fg = s.type },
    CmpItemKindStruct = { fg = s.type },
    CmpItemKindModule = { fg = s.type },
    CmpItemKindKeyword = { fg = s.keyword },
    CmpItemKindConstant = { fg = s.number },
    CmpItemKindSnippet = { fg = u.fgMuted },
    BlinkCmpMenu = { fg = s.identifier, bg = chrome },
    BlinkCmpMenuBorder = { fg = u.border, bg = chrome },
    BlinkCmpMenuSelection = { bg = line },
    BlinkCmpLabelMatch = { fg = u.accent },

    -- indent guides
    IblIndent = { fg = u.border },
    IblScope = { fg = u.dim },
    IndentBlanklineChar = { fg = u.border },
    IndentBlanklineContextChar = { fg = u.dim },

    -- which-key
    WhichKey = { fg = u.accent },
    WhichKeyGroup = { fg = s.type },
    WhichKeyDesc = { fg = s.identifier },
    WhichKeySeparator = { fg = u.fgFaint },
    WhichKeyFloat = { bg = chrome },
    WhichKeyBorder = { fg = u.border, bg = chrome },

    -- notify / noice
    NotifyERRORBorder = { fg = u.error },
    NotifyWARNBorder = { fg = u.warning },
    NotifyINFOBorder = { fg = u.accent },
    NotifyDEBUGBorder = { fg = u.fgFaint },
    NotifyTRACEBorder = { fg = s['function'] },
    NotifyERRORTitle = { fg = u.error },
    NotifyWARNTitle = { fg = u.warning },
    NotifyINFOTitle = { fg = u.accent },
    NoiceCmdlinePopupBorder = { fg = u.border },
    NoiceCmdlineIcon = { fg = u.accent },

    -- mini.nvim
    MiniStatuslineFilename = { fg = u.fgMuted, bg = chrome },
    MiniTablineCurrent = { fg = u.fgStrong, bg = bg },
    MiniTablineVisible = { fg = u.fgMuted, bg = chrome },
    MiniTablineHidden = { fg = u.fgFaint, bg = chrome },
    MiniIndentscopeSymbol = { fg = u.dim },

    -- lazy / mason
    LazyNormal = { fg = s.identifier, bg = chrome },
    LazyH1 = { fg = u.fgStrong, bg = line },
    LazyButton = { fg = u.fgMuted, bg = raised },
    LazyButtonActive = { fg = u.fgStrong, bg = line },
    MasonNormal = { fg = s.identifier, bg = chrome },
    MasonHeader = { fg = u.fgStrong, bg = line },
    MasonHighlight = { fg = u.accent },
  }
  for group, spec in pairs(plugins) do
    hl[group] = spec
  end

  -- Transparency: clear the backgrounds that sit directly on the terminal, so
  -- whatever is behind it shows through. Floats, popups and selections keep
  -- their backgrounds -- a transparent completion menu is unreadable over
  -- arbitrary content, which is the same call tokyonight and catppuccin make.
  if opts and opts.transparent then
    local clear = {
      'Normal', 'NormalNC', 'EndOfBuffer', 'SignColumn', 'FoldColumn',
      'LineNr', 'CursorLineNr', 'MsgArea', 'VertSplit', 'WinSeparator',
      'StatusLine', 'StatusLineNC', 'TabLine', 'TabLineFill', 'TabLineSel',
      'WinBar', 'WinBarNC', 'Folded',
      'NvimTreeNormal', 'NvimTreeWinSeparator', 'NeoTreeNormal', 'NeoTreeNormalNC',
      'TelescopeNormal', 'TelescopeBorder',
      'MiniStatuslineFilename', 'MiniTablineCurrent', 'MiniTablineVisible',
      'MiniTablineHidden',
    }
    for _, group in ipairs(clear) do
      if hl[group] then hl[group].bg = 'NONE' end
    end
    -- EndOfBuffer paints its tildes in the background colour to hide them;
    -- with no background it has to fall back to the dimmest ink.
    hl.EndOfBuffer = { fg = u.dim, bg = 'NONE' }
  end

  return hl
end

--- The 16 ANSI terminal colors, matching the VS Code terminal palette.
function M.terminal(p)
  local s, u = p.syntax, p.ui
  local dark = p.kind == 'dark'
  local function step(hex)
    return blend(hex, dark and '#FFFFFF' or '#000000', 0.22)
  end
  return {
    p.shell.chrome, u.error, s.number, u.warning,
    s.keyword, s['function'], s.type, s.identifier,
    dark and u.dim or u.fgFaint, step(u.error), step(s.number), step(u.warning),
    step(s.keyword), step(s['function']), step(s.type),
    dark and u.fgStrong or u.fgTree,
  }
end

return M
