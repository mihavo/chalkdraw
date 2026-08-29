#!/usr/bin/env node
'use strict';

/**
 * Chalkdraw theme build.
 *
 * Reads src/chalkdraw-tokens.json and emits themes/chalkdraw-{deep,flat,paper}.json.
 * Change a color in the tokens file, run `npm run build`, commit both. No hex
 * literals belong in this file except the neutral #000000/#FFFFFF used for
 * alpha-only overlays.
 *
 * Design rules enforced here:
 *   - no italics, no bold, anywhere
 *   - fields/object keys use the identifier color (never their own hue)
 *   - comments stay above punctuation in contrast
 *   - never introduce a fourth accent hue; fill gaps by blending documented tokens
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const tokens = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'chalkdraw-tokens.json'), 'utf8')
);

/* ---------------------------------------------------------------- color utils */

const hex2rgb = (h) => {
  const s = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};

const rgb2hex = (rgb) =>
  '#' +
  rgb
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

/** Append an alpha channel: alpha('#7AA2F7', 0.28) -> '#7AA2F747' */
const alpha = (hex, a) =>
  hex.toUpperCase() +
  Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

/** Linear blend between two documented tokens. mix(a, b, 0.25) = 25% of b. */
const mix = (a, b, t) => {
  const [ar, ag, ab] = hex2rgb(a);
  const [br, bg, bb] = hex2rgb(b);
  return rgb2hex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
};

/**
 * Multiply each channel by a factor (Math.round per channel).
 */
const shade = (hex, factor) => rgb2hex(hex2rgb(hex).map((v) => v * factor));

/**
 * Ink derivation: dark punctuation and line numbers
 * are not chosen independently — they are the identifier color at 56% and 44%
 * per channel. Deriving them here rather than hardcoding keeps the three moving
 * together when the ink changes.
 */
const INK_DERIVATION = { punctuation: 0.56, lineNumber: 0.44 };

/** One step toward white (dark themes) or black (Paper) — used for bright ANSI. */
const step = (hex, isDark, amount = 0.22) =>
  mix(hex, isDark ? '#FFFFFF' : '#000000', amount);

/* ------------------------------------------------------------ scope mapping */

/**
 * TextMate scopes per syntax role. Scopes beyond the core list cover the
 * languages the theme is tested against (SQL, Markdown, JSON) without adding
 * a new hue.
 */
const SCOPES = {
  keyword: [
    'keyword',
    'keyword.control',
    'keyword.operator.new',
    'keyword.operator.expression',
    'keyword.other',
    'storage',
    'storage.type',
    'storage.modifier',
    'constant.language',
    'support.type.primitive',
    'variable.language', // this/self/super read as language keywords
  ],
  type: [
    'entity.name.type',
    'entity.name.class',
    'entity.name.namespace',
    'support.class',
    'support.type',
    'entity.other.inherited-class',
    'entity.name.tag', // CSS selectors + HTML tags
  ],
  function: [
    'entity.name.function',
    'support.function',
    'meta.function-call',
    'variable.function',
    'entity.name.function.member',
  ],
  string: [
    'string',
    'string.template',
    'punctuation.definition.string',
    'string.regexp',
  ],
  number: [
    'constant.numeric',
    'constant.other.color',
    'variable.other.constant',
    'constant.character.escape',
  ],
  comment: ['comment', 'punctuation.definition.comment'],
  identifier: [
    'variable',
    'variable.other',
    'variable.parameter',
    'meta.object-literal.key',
    'support.type.property-name', // JSON keys, CSS property names
    'entity.name.variable',
    'entity.other.attribute-name',
  ],
  punctuation: [
    'punctuation',
    'keyword.operator',
    'meta.brace',
    'punctuation.separator',
    'punctuation.terminator',
    'punctuation.accessor',
  ],
};

/**
 * Markdown: headings -> keyword, bold -> identifier (no bold),
 * emphasis -> type (no italic), inline code -> string, links -> function,
 * quotes -> comment.
 */
const markdownRules = (s) => [
  { scope: ['markup.heading', 'entity.name.section.markdown', 'punctuation.definition.heading.markdown'], role: 'keyword', color: s.keyword },
  { scope: ['markup.bold', 'punctuation.definition.bold.markdown'], role: 'bold -> identifier, weight-neutral', color: s.identifier },
  { scope: ['markup.italic', 'punctuation.definition.italic.markdown'], role: 'emphasis -> type, no italic', color: s.type },
  { scope: ['markup.inline.raw', 'markup.fenced_code', 'markup.raw'], role: 'inline code -> string', color: s.string },
  { scope: ['markup.underline.link', 'string.other.link', 'markup.link'], role: 'links -> function', color: s.function },
  { scope: ['markup.quote', 'beginning.punctuation.definition.quote.markdown'], role: 'block quote -> comment', color: s.comment },
  { scope: ['markup.list', 'beginning.punctuation.definition.list.markdown'], role: 'list bullets -> punctuation', color: s.punctuation },
  { scope: ['markup.inserted'], role: 'diff added -> number', color: s.number },
  { scope: ['markup.deleted'], role: 'diff removed -> error' },
];

/** Semantic token roles, mirroring the TextMate roles. */
const SEMANTIC = {
  keyword: 'keyword',
  type: 'type',
  class: 'type',
  struct: 'type',
  interface: 'type',
  enum: 'type',
  typeParameter: 'type',
  namespace: 'type',
  function: 'function',
  method: 'function',
  macro: 'function',
  property: 'identifier',
  parameter: 'identifier',
  variable: 'identifier',
  member: 'identifier',
  enumMember: 'number',
  number: 'number',
  string: 'string',
  comment: 'comment',
  operator: 'punctuation',
};

/* ------------------------------------------------------------------ builders */

function buildWorkbench(v, s, u, g, isDark) {
  const editorBg = v.editorBackground;
  const chrome = v.chromeBackground;
  const line = v.currentLine;

  // Gap fillers: blends of documented tokens only, never a new hue.
  const surfaceRaised = mix(chrome, u.fgFaint, 0.06); // hovers, dropdowns
  const surfaceSunken = mix(chrome, isDark ? '#000000' : u.border, 0.35); // inputs, badges
  const accentSoft = alpha(u.accent, 0.28);

  return {
    // --- editor ---------------------------------------------------------
    'editor.background': editorBg,
    'editor.foreground': s.identifier,
    'editorLineNumber.foreground': s.lineNumber,
    'editorLineNumber.activeForeground': u.accent,
    'editor.lineHighlightBackground': line,
    'editor.lineHighlightBorder': line,
    // Every cursor — editor and terminal — takes the identifier ink rather than
    // the accent (dark #BDB7AE, Paper #1E1C18).
    'editorCursor.foreground': s.identifier,
    'editor.selectionBackground': accentSoft,
    'editor.inactiveSelectionBackground': alpha(u.accent, 0.14),
    'editor.selectionHighlightBackground': alpha(u.accent, 0.14),
    'editor.wordHighlightBackground': alpha(u.accent, 0.12),
    'editor.wordHighlightStrongBackground': alpha(u.accent, 0.18),
    'editor.findMatchBackground': alpha(u.accent, 0.38),
    'editor.findMatchHighlightBackground': alpha(u.accent, 0.2),
    'editor.hoverHighlightBackground': alpha(u.accent, 0.14),
    'editor.rangeHighlightBackground': alpha(u.accent, 0.1),
    'editorIndentGuide.background1': u.border,
    'editorIndentGuide.activeBackground1': u.dim,
    'editorWhitespace.foreground': u.dim,
    'editorRuler.foreground': u.border,
    'editorBracketMatch.background': alpha(u.accent, 0.14),
    'editorBracketMatch.border': u.dim,
    'editorLink.activeForeground': u.accent,
    'editorOverviewRuler.border': u.border,
    'editorOverviewRuler.errorForeground': u.error,
    'editorOverviewRuler.warningForeground': u.warning,
    'editorOverviewRuler.infoForeground': u.accent,
    'editorError.foreground': u.error,
    'editorWarning.foreground': u.warning,
    'editorInfo.foreground': u.accent,
    'editorGutter.background': editorBg,
    'editorGutter.modifiedBackground': u.warning,
    'editorGutter.addedBackground': u.success,
    'editorGutter.deletedBackground': u.error,
    'editorCodeLens.foreground': s.comment,
    'editorInlayHint.foreground': s.comment,
    'editorInlayHint.background': alpha(u.dim, 0.25),

    // --- widgets --------------------------------------------------------
    'editorWidget.background': chrome,
    'editorWidget.foreground': s.identifier,
    'editorWidget.border': u.border,
    'editorSuggestWidget.background': chrome,
    'editorSuggestWidget.border': u.border,
    'editorSuggestWidget.foreground': s.identifier,
    'editorSuggestWidget.selectedBackground': line,
    'editorSuggestWidget.highlightForeground': u.accent,
    'editorHoverWidget.background': chrome,
    'editorHoverWidget.border': u.border,
    'debugExceptionWidget.background': chrome,
    'debugExceptionWidget.border': u.border,
    'peekView.border': u.border,
    'peekViewEditor.background': editorBg,
    'peekViewResult.background': chrome,
    'peekViewTitle.background': chrome,
    'peekViewResult.selectionBackground': line,
    'peekViewResult.fileForeground': u.fgStrong,
    'peekViewResult.lineForeground': u.fgMuted,

    // --- workbench surfaces ---------------------------------------------
    'foreground': u.fgMuted,
    'focusBorder': u.accent,
    'contrastBorder': u.border,
    'widget.border': u.border,
    'widget.shadow': alpha('#000000', isDark ? 0.4 : 0.12),
    'selection.background': accentSoft,
    'descriptionForeground': u.fgFaint,
    'errorForeground': u.error,
    'icon.foreground': u.fgMuted,
    'sash.hoverBorder': u.accent,

    'sideBar.background': chrome,
    'sideBar.foreground': u.fgTree,
    'sideBar.border': u.border,
    'sideBarTitle.foreground': u.fgFaint,
    'sideBarSectionHeader.background': chrome,
    'sideBarSectionHeader.foreground': u.fgFaint,
    'sideBarSectionHeader.border': u.border,

    'activityBar.background': chrome,
    'activityBar.foreground': u.fgStrong,
    'activityBar.inactiveForeground': u.fgMuted,
    'activityBar.border': u.border,
    'activityBar.activeBorder': u.accent,
    'activityBarBadge.background': u.accent,
    'activityBarBadge.foreground': isDark ? v.editorBackground : '#FFFFFF',

    'editorGroup.border': u.border,
    'editorGroupHeader.tabsBackground': chrome,
    'editorGroupHeader.tabsBorder': u.border,
    'editorGroupHeader.noTabsBackground': chrome,
    'tab.activeBackground': editorBg,
    'tab.inactiveBackground': chrome,
    'tab.activeForeground': u.fgStrong,
    'tab.inactiveForeground': u.fgMuted,
    'tab.hoverForeground': u.fgStrong,
    'tab.border': u.border,
    'tab.activeBorderTop': u.accent,
    'tab.activeBorder': editorBg,
    'tab.unfocusedActiveBorderTop': u.dim,
    'tab.lastPinnedBorder': u.border,

    'breadcrumb.background': editorBg,
    'breadcrumb.foreground': u.fgFaint,
    'breadcrumb.focusForeground': u.fgStrong,
    'breadcrumb.activeSelectionForeground': u.accent,
    'breadcrumbPicker.background': chrome,

    'titleBar.activeBackground': chrome,
    'titleBar.activeForeground': u.fgMuted,
    'titleBar.inactiveBackground': chrome,
    'titleBar.inactiveForeground': u.fgFaint,
    'titleBar.border': u.border,

    'menu.background': chrome,
    'menu.foreground': u.fgMuted,
    'menu.border': u.border,
    'menu.selectionBackground': line,
    'menu.selectionForeground': u.fgStrong,
    'menu.separatorBackground': u.border,
    'menubar.selectionBackground': line,
    'menubar.selectionForeground': u.fgStrong,

    'commandCenter.background': chrome,
    'commandCenter.foreground': u.fgMuted,
    'commandCenter.border': u.border,
    'commandCenter.activeBackground': surfaceRaised,
    'commandCenter.activeBorder': u.border,
    'commandCenter.inactiveForeground': u.fgFaint,
    'commandCenter.inactiveBorder': u.border,

    // Panel: title row and terminal body share `chrome` with NO divider between
    // them (explicit design decision — do not add a border there).
    'panel.background': chrome,
    'panel.border': u.border,
    'panelTitle.activeForeground': u.fgStrong,
    'panelTitle.inactiveForeground': u.fgMuted,
    'panelTitle.activeBorder': u.accent,
    'panelSection.border': u.border,
    'panelSectionHeader.background': chrome,
    'panelSectionHeader.foreground': u.fgFaint,
    'panelInput.border': u.border,

    'terminal.background': chrome,
    'terminal.foreground': s.identifier,
    'terminal.border': u.border,
    'terminalCursor.foreground': s.identifier,
    'terminal.selectionBackground': accentSoft,

    'statusBar.background': chrome,
    'statusBar.foreground': u.fgMuted,
    'statusBar.border': u.border,
    'statusBar.noFolderBackground': chrome,
    'statusBar.noFolderForeground': u.fgMuted,
    'statusBar.debuggingBackground': chrome,
    'statusBar.debuggingForeground': u.warning,
    'statusBarItem.hoverBackground': surfaceRaised,
    'statusBarItem.activeBackground': line,
    'statusBarItem.remoteBackground': u.accent,
    'statusBarItem.remoteForeground': isDark ? v.editorBackground : '#FFFFFF',
    'statusBarItem.errorBackground': chrome,
    'statusBarItem.errorForeground': u.error,
    'statusBarItem.warningBackground': chrome,
    'statusBarItem.warningForeground': u.warning,
    'statusBarItem.prominentBackground': surfaceSunken,
    'statusBarItem.prominentForeground': u.fgStrong,

    // --- lists / trees ---------------------------------------------------
    'list.activeSelectionBackground': line,
    'list.activeSelectionForeground': u.fgStrong,
    'list.inactiveSelectionBackground': line,
    'list.inactiveSelectionForeground': u.fgStrong,
    'list.hoverBackground': line,
    'list.hoverForeground': u.fgStrong,
    'list.focusBackground': line,
    'list.focusForeground': u.fgStrong,
    'list.focusOutline': u.border,
    'list.highlightForeground': u.accent,
    'list.errorForeground': u.error,
    'list.warningForeground': u.warning,
    'listFilterWidget.background': chrome,
    'listFilterWidget.outline': u.accent,
    'listFilterWidget.noMatchesOutline': u.error,
    'tree.indentGuidesStroke': u.border,
    'tree.inactiveIndentGuidesStroke': u.border,

    // --- inputs / controls -----------------------------------------------
    'input.background': surfaceSunken,
    'input.foreground': s.identifier,
    'input.border': u.border,
    'input.placeholderForeground': u.fgFaint,
    'inputOption.activeBorder': u.accent,
    'inputOption.activeForeground': u.fgStrong,
    'inputOption.activeBackground': alpha(u.accent, 0.2),
    'inputValidation.errorBackground': chrome,
    'inputValidation.errorBorder': u.error,
    'inputValidation.warningBackground': chrome,
    'inputValidation.warningBorder': u.warning,
    'inputValidation.infoBackground': chrome,
    'inputValidation.infoBorder': u.accent,
    'dropdown.background': chrome,
    'dropdown.foreground': s.identifier,
    'dropdown.border': u.border,
    'dropdown.listBackground': chrome,
    'checkbox.background': surfaceSunken,
    'checkbox.border': u.border,
    'checkbox.foreground': u.fgStrong,

    'button.background': u.accent,
    'button.foreground': isDark ? v.editorBackground : '#FFFFFF',
    'button.hoverBackground': step(u.accent, isDark, 0.12),
    'button.secondaryBackground': surfaceRaised,
    'button.secondaryForeground': u.fgStrong,
    'button.secondaryHoverBackground': mix(surfaceRaised, u.fgFaint, 0.1),
    'badge.background': u.accent,
    'badge.foreground': isDark ? v.editorBackground : '#FFFFFF',
    'progressBar.background': u.accent,

    'scrollbar.shadow': alpha('#000000', isDark ? 0.35 : 0.08),
    'scrollbarSlider.background': alpha(u.dim, 0.6),
    'scrollbarSlider.hoverBackground': alpha(u.dim, 0.8),
    'scrollbarSlider.activeBackground': alpha(u.dim, 1),
    'minimap.background': editorBg,
    'minimapSlider.background': alpha(u.dim, 0.4),
    'minimapSlider.hoverBackground': alpha(u.dim, 0.55),
    'minimapSlider.activeBackground': alpha(u.dim, 0.7),
    'minimap.findMatchHighlight': u.accent,
    'minimap.errorHighlight': u.error,
    'minimap.warningHighlight': u.warning,
    'minimapGutter.modifiedBackground': u.warning,
    'minimapGutter.addedBackground': u.success,
    'minimapGutter.deletedBackground': u.error,

    // --- quick input / notifications --------------------------------------
    'quickInput.background': chrome,
    'quickInput.foreground': s.identifier,
    'quickInputTitle.background': chrome,
    'quickInputList.focusBackground': line,
    'quickInputList.focusForeground': u.fgStrong,
    'pickerGroup.border': u.border,
    'pickerGroup.foreground': u.fgFaint,
    'keybindingLabel.background': surfaceSunken,
    'keybindingLabel.foreground': u.fgMuted,
    'keybindingLabel.border': u.border,
    'keybindingLabel.bottomBorder': u.border,
    'notifications.background': chrome,
    'notifications.foreground': s.identifier,
    'notifications.border': u.border,
    'notificationCenterHeader.background': chrome,
    'notificationCenterHeader.foreground': u.fgFaint,
    'notificationLink.foreground': u.accent,
    'notificationsErrorIcon.foreground': u.error,
    'notificationsWarningIcon.foreground': u.warning,
    'notificationsInfoIcon.foreground': u.accent,
    'banner.background': chrome,
    'banner.foreground': s.identifier,
    'banner.iconForeground': u.accent,

    // --- git / diff / SCM --------------------------------------------------
    // File-explorer git decorations use the dedicated `git` scale, never the
    // ui.warning / ui.success tokens — those stay on problems rows, error and
    // warning counts, test output and the status bar language indicator.
    //
    // Scale constraint: within a mode the six hued statuses share one oklch
    // lightness and chroma and differ only in hue —
    //   dark  L 0.83 C 0.048 · light L 0.55 C 0.075
    //   modified 85 · untracked 150 · deleted 25 · conflicting 325
    //   added 185 · submodule 265
    // Any future adjustment moves the (L, C) pair for the whole mode, never a
    // single status. `ignored` is a deliberate neutral and sits outside the
    // ramp. checkGitScale() below enforces this and fails the build otherwise.
    'gitDecoration.modifiedResourceForeground': g.modified,
    'gitDecoration.untrackedResourceForeground': g.untracked,
    'gitDecoration.deletedResourceForeground': g.deleted,
    'gitDecoration.conflictingResourceForeground': g.conflicting,
    'gitDecoration.addedResourceForeground': g.added,
    'gitDecoration.stageModifiedResourceForeground': g.stageModified,
    'gitDecoration.ignoredResourceForeground': g.ignored,
    'gitDecoration.submoduleResourceForeground': g.submodule,
    'diffEditor.insertedTextBackground': alpha(u.success, isDark ? 0.14 : 0.16),
    'diffEditor.removedTextBackground': alpha(u.error, isDark ? 0.14 : 0.16),
    'diffEditor.insertedLineBackground': alpha(u.success, isDark ? 0.09 : 0.11),
    'diffEditor.removedLineBackground': alpha(u.error, isDark ? 0.09 : 0.11),
    'diffEditor.border': u.border,
    'diffEditorOverview.insertedForeground': alpha(u.success, 0.6),
    'diffEditorOverview.removedForeground': alpha(u.error, 0.6),
    'merge.currentHeaderBackground': alpha(u.accent, 0.3),
    'merge.currentContentBackground': alpha(u.accent, 0.14),
    'merge.incomingHeaderBackground': alpha(u.success, 0.3),
    'merge.incomingContentBackground': alpha(u.success, 0.14),
    'merge.border': u.border,

    // --- problems / testing / debug ---------------------------------------
    'problemsErrorIcon.foreground': u.error,
    'problemsWarningIcon.foreground': u.warning,
    'problemsInfoIcon.foreground': u.accent,
    'testing.iconPassed': u.success,
    'testing.iconFailed': u.error,
    'testing.iconErrored': u.error,
    'testing.iconQueued': u.warning,
    'testing.iconSkipped': u.fgFaint,
    'testing.iconUnset': u.fgFaint,
    'debugToolBar.background': chrome,
    'debugToolBar.border': u.border,
    'debugIcon.breakpointForeground': u.error,
    'debugIcon.breakpointDisabledForeground': u.dim,
    'editor.stackFrameHighlightBackground': alpha(u.warning, 0.16),
    'editor.focusedStackFrameHighlightBackground': alpha(u.success, 0.16),
    'debugConsole.infoForeground': u.fgMuted,
    'debugConsole.warningForeground': u.warning,
    'debugConsole.errorForeground': u.error,
    'debugConsole.sourceForeground': u.fgFaint,
    'debugConsoleInputIcon.foreground': u.accent,

    // --- misc chrome -------------------------------------------------------
    'settings.headerForeground': u.fgStrong,
    'settings.modifiedItemIndicator': u.accent,
    'settings.dropdownBackground': chrome,
    'settings.dropdownBorder': u.border,
    'settings.textInputBackground': surfaceSunken,
    'settings.textInputBorder': u.border,
    'settings.numberInputBackground': surfaceSunken,
    'settings.numberInputBorder': u.border,
    'settings.checkboxBackground': surfaceSunken,
    'settings.checkboxBorder': u.border,
    'textLink.foreground': u.accent,
    'textLink.activeForeground': step(u.accent, isDark, 0.15),
    'textPreformat.foreground': s.string,
    'textBlockQuote.background': chrome,
    'textBlockQuote.border': u.border,
    'textCodeBlock.background': chrome,
    'textSeparator.foreground': u.border,
    'walkThrough.embeddedEditorBackground': editorBg,
    'welcomePage.background': editorBg,
    'welcomePage.tileBackground': chrome,
    'welcomePage.tileBorder': u.border,
    'welcomePage.progress.background': surfaceSunken,
    'welcomePage.progress.foreground': u.accent,
    'extensionButton.prominentBackground': u.accent,
    'extensionButton.prominentForeground': isDark ? v.editorBackground : '#FFFFFF',
    'extensionButton.prominentHoverBackground': step(u.accent, isDark, 0.12),
    'extensionBadge.remoteBackground': u.accent,
    'extensionIcon.starForeground': u.warning,
    'extensionIcon.verifiedForeground': u.success,
    'charts.red': u.error,
    'charts.blue': u.accent,
    'charts.yellow': u.warning,
    'charts.green': u.success,
    'charts.purple': s.function,
    'charts.orange': s.string,
    'charts.foreground': u.fgMuted,
    'charts.lines': u.border,

    // --- coverage fill --------------------------------------------------
    // These default to VS Code's own hues when left unset, which would put
    // off-palette colors on screen. Each maps to a documented token or a blend
    // of two — no new hue is introduced.
    'disabledForeground': u.fgFaint,
    'strongForeground': u.fgStrong,
    'surface.background': chrome,
    'surface.border': u.border,
    'window.activeBorder': u.border,
    'window.inactiveBorder': u.border,
    'toolbar.hoverBackground': surfaceRaised,
    'toolbar.hoverOutline': u.border,
    'toolbar.activeBackground': line,
    'profileBadge.background': surfaceSunken,
    'profileBadge.foreground': u.fgStrong,

    // Bracket-pair colorization is out of scope by design. Setting all three
    // levels to the punctuation color makes the feature a visual no-op instead
    // of letting VS Code paint its default gold/purple/blue rainbow.
    'editorBracketHighlight.foreground1': s.punctuation,
    'editorBracketHighlight.foreground2': s.punctuation,
    'editorBracketHighlight.foreground3': s.punctuation,
    'editorBracketHighlight.foreground4': s.punctuation,
    'editorBracketHighlight.foreground5': s.punctuation,
    'editorBracketHighlight.foreground6': s.punctuation,
    'editorBracketHighlight.unexpectedBracket.foreground': u.error,

    'editorActiveLineNumber.foreground': u.accent,
    'editorGhostText.foreground': s.comment,
    'editorLightBulb.foreground': u.warning,
    'editorLightBulbAutoFix.foreground': u.accent,
    'editorHint.foreground': u.fgFaint,
    'editorStickyScroll.background': editorBg,
    'editorStickyScrollHover.background': line,
    'editorStickyScroll.border': u.border,
    'editorGutter.commentRangeForeground': u.dim,
    'editorGutter.commentGlyphForeground': u.fgFaint,
    'editorUnnecessaryCode.opacity': alpha('#000000', 0.55),
    'editor.selectionHighlightBorder': alpha(u.accent, 0.28),
    'editor.symbolHighlightBackground': alpha(u.accent, 0.18),
    'editor.snippetTabstopHighlightBackground': alpha(u.accent, 0.14),
    'editor.linkedEditingBackground': alpha(u.accent, 0.14),
    'editor.inlineValuesForeground': s.comment,
    'editor.findRangeHighlightBackground': alpha(u.accent, 0.1),
    'editorGroup.dropBackground': alpha(u.accent, 0.18),
    'editorGroupHeader.border': u.border,
    'editorHoverWidget.statusBarBackground': surfaceRaised,
    'editorSuggestWidget.selectedForeground': u.fgStrong,
    'editorSuggestWidget.selectedIconForeground': u.accent,
    'editorSuggestWidget.focusHighlightForeground': u.accent,
    'editorMarkerNavigationError.background': u.error,
    'editorMarkerNavigationWarning.background': u.warning,
    'editorMarkerNavigationInfo.background': u.accent,
    'editorMarkerNavigationError.headerBackground': chrome,
    'editorMarkerNavigationWarning.headerBackground': chrome,
    'editorMarkerNavigationInfo.headerBackground': chrome,
    'editorOverviewRuler.findMatchForeground': alpha(u.accent, 0.5),
    'editorOverviewRuler.selectionHighlightForeground': alpha(u.accent, 0.35),
    'editorOverviewRuler.modifiedForeground': alpha(u.warning, 0.6),
    'editorOverviewRuler.addedForeground': alpha(u.success, 0.6),
    'editorOverviewRuler.deletedForeground': alpha(u.error, 0.6),

    // Symbol icons (outline, breadcrumb picker, suggest list) follow the
    // syntax roles so the icon and the token it points at agree.
    'symbolIcon.classForeground': s.type,
    'symbolIcon.interfaceForeground': s.type,
    'symbolIcon.structForeground': s.type,
    'symbolIcon.enumeratorForeground': s.type,
    'symbolIcon.typeParameterForeground': s.type,
    'symbolIcon.namespaceForeground': s.type,
    'symbolIcon.functionForeground': s.function,
    'symbolIcon.methodForeground': s.function,
    'symbolIcon.constructorForeground': s.function,
    'symbolIcon.eventForeground': s.function,
    'symbolIcon.variableForeground': s.identifier,
    'symbolIcon.fieldForeground': s.identifier,
    'symbolIcon.propertyForeground': s.identifier,
    'symbolIcon.enumeratorMemberForeground': s.number,
    'symbolIcon.constantForeground': s.number,
    'symbolIcon.stringForeground': s.string,
    'symbolIcon.keywordForeground': s.keyword,
    'symbolIcon.operatorForeground': s.punctuation,

    'debugIcon.startForeground': u.success,
    'debugIcon.continueForeground': u.accent,
    'debugIcon.pauseForeground': u.accent,
    'debugIcon.stopForeground': u.error,
    'debugIcon.disconnectForeground': u.error,
    'debugIcon.restartForeground': u.success,
    'debugIcon.stepOverForeground': u.accent,
    'debugIcon.stepIntoForeground': u.accent,
    'debugIcon.stepOutForeground': u.accent,
    'debugIcon.stepBackForeground': u.accent,
    'debugIcon.breakpointCurrentStackframeForeground': u.warning,
    'debugIcon.breakpointStackframeForeground': u.fgMuted,
    'debugIcon.breakpointUnverifiedForeground': u.fgFaint,
    'debugTokenExpression.name': s.identifier,
    'debugTokenExpression.value': s.identifier,
    'debugTokenExpression.string': s.string,
    'debugTokenExpression.number': s.number,
    'debugTokenExpression.boolean': s.keyword,
    'debugTokenExpression.type': s.type,
    'debugTokenExpression.error': u.error,
    'debugView.exceptionLabelBackground': u.error,
    'debugView.exceptionLabelForeground': isDark ? v.editorBackground : '#FFFFFF',
    'debugView.stateLabelBackground': surfaceSunken,
    'debugView.stateLabelForeground': u.fgStrong,
    'debugView.valueChangedHighlight': u.accent,

    'testing.peekBorder': u.error,
    'testing.peekHeaderBackground': chrome,
    'testing.messagePeekBorder': u.accent,
    'testing.messagePeekHeaderBackground': chrome,
    'testing.coveredBackground': alpha(u.success, 0.12),
    'testing.coveredBorder': alpha(u.success, 0.3),
    'testing.coveredGutterBackground': alpha(u.success, 0.4),
    'testing.uncoveredBackground': alpha(u.error, 0.1),
    'testing.uncoveredBorder': alpha(u.error, 0.28),
    'testing.uncoveredGutterBackground': alpha(u.error, 0.35),
    'testing.uncoveredBranchBackground': alpha(u.warning, 0.25),

    'activityBarTop.foreground': u.fgStrong,
    'activityBarTop.inactiveForeground': u.fgMuted,
    'activityBarTop.activeBorder': u.accent,
    'activityBarTop.dropBorder': u.accent,
    'activityBar.dropBorder': u.accent,
    'activityBar.activeFocusBorder': u.accent,
    'activityErrorBadge.background': u.error,
    'activityErrorBadge.foreground': isDark ? v.editorBackground : '#FFFFFF',
    'activityWarningBadge.background': u.warning,
    'activityWarningBadge.foreground': isDark ? v.editorBackground : '#FFFFFF',

    'tab.activeModifiedBorder': u.warning,
    'tab.inactiveModifiedBorder': mix(u.warning, chrome, 0.4),
    'tab.unfocusedActiveModifiedBorder': mix(u.warning, chrome, 0.4),
    'tab.unfocusedActiveForeground': u.fgMuted,
    'tab.unfocusedInactiveForeground': u.fgFaint,
    'tab.unfocusedHoverForeground': u.fgMuted,
    'tab.unfocusedHoverBackground': chrome,
    'tab.selectedBorderTop': u.accent,
    'tab.dragAndDropBorder': u.accent,

    // The panel title row and the terminal body share `chrome` with no divider
    // between them — pinned transparent so no default border appears.
    'panelTitle.border': alpha('#000000', 0),
    'sideBarTitle.border': u.border,
    'statusBar.focusBorder': u.accent,
    'statusBarItem.focusBorder': u.accent,
    'statusBarItem.remoteHoverBackground': step(u.accent, isDark, 0.12),
    'statusBarItem.offlineBackground': u.error,
    'statusBarItem.offlineForeground': isDark ? v.editorBackground : '#FFFFFF',
    'statusBarItem.compactHoverBackground': surfaceRaised,

    'list.deemphasizedForeground': u.fgFaint,
    'list.dropBackground': alpha(u.accent, 0.16),
    'list.dropBetweenBackground': u.accent,
    'list.filterMatchBackground': alpha(u.accent, 0.22),
    'list.filterMatchBorder': alpha(u.accent, 0.4),
    'list.focusHighlightForeground': u.accent,
    'list.invalidItemForeground': u.error,
    'tree.tableColumnsBorder': u.border,
    'tree.tableOddRowsBackground': alpha(u.dim, 0.12),

    'inputOption.hoverBackground': alpha(u.accent, 0.14),
    'inputValidation.errorForeground': u.fgStrong,
    'inputValidation.warningForeground': u.fgStrong,
    'inputValidation.infoForeground': u.fgStrong,
    'button.secondaryBorder': u.border,
    'radio.activeBorder': u.accent,
    'radio.activeBackground': alpha(u.accent, 0.2),
    'radio.activeForeground': u.fgStrong,
    'radio.inactiveBorder': u.border,
    'menu.selectionBorder': alpha('#000000', 0),
    'menubar.selectionBorder': alpha('#000000', 0),

    'extensionButton.background': u.accent,
    'extensionButton.foreground': isDark ? v.editorBackground : '#FFFFFF',
    'extensionButton.hoverBackground': step(u.accent, isDark, 0.12),
    'extensionButton.border': u.border,
    'extensionIcon.preReleaseForeground': s.function,
    'extensionIcon.sponsorForeground': u.error,
    'extensionIcon.privateForeground': u.fgFaint,

    'search.resultsInfoForeground': u.fgFaint,
    'searchEditor.findMatchBackground': alpha(u.accent, 0.2),
    'searchEditor.findMatchBorder': alpha(u.accent, 0.35),
    'settings.rowHoverBackground': line,
    'settings.focusedRowBackground': line,
    'settings.focusedRowBorder': u.border,
    'settings.headerBorder': u.border,
    'settings.sashBorder': u.border,
    'notificationCenter.border': u.border,
    'notificationToast.border': u.border,
    'walkthrough.stepTitle.foreground': u.fgStrong,
    'welcomePage.tileHoverBackground': surfaceRaised,
    'textPreformat.background': surfaceSunken,
    'textPreformat.border': u.border,

    'terminal.inactiveSelectionBackground': alpha(u.accent, 0.14),
    'terminal.findMatchBackground': alpha(u.accent, 0.38),
    'terminal.findMatchBorder': alpha(u.accent, 0.5),
    'terminal.findMatchHighlightBackground': alpha(u.accent, 0.2),
    'terminal.findMatchHighlightBorder': alpha(u.accent, 0.3),
    'terminal.initialHintForeground': u.fgFaint,
    'terminalCommandDecoration.defaultBackground': u.dim,
    'terminalCommandDecoration.successBackground': u.success,
    'terminalCommandDecoration.errorBackground': u.error,
    'terminalCommandGuide.foreground': u.border,
    'terminalStickyScroll.background': chrome,
    'terminalStickyScrollHover.background': line,
    'terminalStickyScroll.border': u.border,
    'terminalOverviewRuler.findMatchForeground': alpha(u.accent, 0.5),
    'terminalOverviewRuler.cursorForeground': s.identifier,

    'notebook.editorBackground': editorBg,
    'notebook.cellEditorBackground': editorBg,
    'notebook.cellBorderColor': u.border,
    'notebook.cellHoverBackground': line,
    'notebook.selectedCellBackground': line,
    'notebook.selectedCellBorder': u.border,
    'notebook.inactiveSelectedCellBorder': u.border,
    'notebook.focusedCellBorder': u.accent,
    'notebook.cellToolbarSeparator': u.border,
    'notebook.symbolHighlightBackground': alpha(u.accent, 0.14),
    'notebookStatusSuccessIcon.foreground': u.success,
    'notebookStatusErrorIcon.foreground': u.error,
    'notebookStatusRunningIcon.foreground': u.accent,

    'peekViewEditor.matchHighlightBackground': alpha(u.accent, 0.28),
    'peekViewEditor.matchHighlightBorder': alpha(u.accent, 0.4),
    'peekViewResult.matchHighlightBackground': alpha(u.accent, 0.28),
    'peekViewResult.selectionForeground': u.fgStrong,
    'peekViewTitleLabel.foreground': u.fgStrong,
    'peekViewTitleDescription.foreground': u.fgFaint,
    'multiDiffEditor.border': u.border,
    'multiDiffEditor.headerBackground': chrome,
    'multiDiffEditor.background': editorBg,
    'diffEditor.diagonalFill': u.border,
    'diffEditor.unchangedRegionBackground': chrome,
    'merge.commonHeaderBackground': alpha(u.dim, 0.3),
    'merge.commonContentBackground': alpha(u.dim, 0.14),
    // `renamed` is not assigned its own hue by the scale; it follows `added`,
    // which is how a rename reads in the explorer.
    'gitDecoration.renamedResourceForeground': g.added,
    'gitDecoration.stageDeletedResourceForeground': g.stageDeleted,
    'commentsView.resolvedIcon': u.fgFaint,
    'commentsView.unresolvedIcon': u.accent,
    'editorCommentsWidget.resolvedBorder': u.border,
    'editorCommentsWidget.unresolvedBorder': u.accent,
    'editorCommentsWidget.rangeBackground': alpha(u.accent, 0.1),
    'editorCommentsWidget.rangeActiveBackground': alpha(u.accent, 0.16),

    // --- terminal ANSI (derived — see README "Terminal palette") -----------
    'terminal.ansiBlack': chrome,
    'terminal.ansiRed': u.error,
    'terminal.ansiGreen': s.number,
    'terminal.ansiYellow': u.warning,
    'terminal.ansiBlue': s.keyword,
    'terminal.ansiMagenta': s.function,
    'terminal.ansiCyan': s.type,
    'terminal.ansiWhite': s.identifier,
    'terminal.ansiBrightBlack': isDark ? u.dim : u.fgFaint,
    'terminal.ansiBrightRed': step(u.error, isDark),
    'terminal.ansiBrightGreen': step(s.number, isDark),
    'terminal.ansiBrightYellow': step(u.warning, isDark),
    'terminal.ansiBrightBlue': step(s.keyword, isDark),
    'terminal.ansiBrightMagenta': step(s.function, isDark),
    'terminal.ansiBrightCyan': step(s.type, isDark),
    'terminal.ansiBrightWhite': isDark ? u.fgStrong : u.fgTree,
  };
}

function buildTokenColors(s, u) {
  const rules = [];
  const push = (name, scope, foreground) =>
    rules.push({ name, scope, settings: { foreground } });

  // Baseline: everything unclaimed reads as an identifier, never italic/bold.
  rules.push({
    name: 'Global — no italics, no bold, anywhere',
    scope: [
      'source',
      'text',
      'emphasis',
      'strong',
      'markup.italic',
      'markup.bold',
      'comment',
      'keyword',
      'variable.parameter',
      'entity.name.type',
    ],
    settings: { fontStyle: '' },
  });

  push('Comment', SCOPES.comment, s.comment);
  push('Punctuation & operators', SCOPES.punctuation, s.punctuation);
  push('Identifier — variables, params, fields, object keys', SCOPES.identifier, s.identifier);
  push('Keyword & storage', SCOPES.keyword, s.keyword);
  push('Type, class, namespace', SCOPES.type, s.type);
  push('Function & method', SCOPES.function, s.function);
  push('String', SCOPES.string, s.string);
  push('Number & constant', SCOPES.number, s.number);

  // Struct fields / object keys explicitly re-stated after the broad rules so
  // no language grammar can pull them into a second hue.
  push(
    'Fields & object keys — identifier color by design',
    [
      'variable.other.property',
      'variable.other.object.property',
      'variable.other.member',
      'meta.object-literal.key',
      'meta.structure.dictionary.key',
      'support.type.property-name.json',
      'entity.name.variable.field',
    ],
    s.identifier
  );

  // Language spot-fixes that keep every sample language on-palette.
  push('CSS property names', ['support.type.property-name.css'], s.identifier);
  push('CSS values & units', ['support.constant.property-value.css', 'keyword.other.unit'], s.number);
  push('JSON string values', ['string.quoted.double.json'], s.string);
  push('SQL keywords', ['keyword.other.sql', 'keyword.other.DML'], s.keyword);
  push('Python decorators & Go package', ['entity.name.function.decorator', 'meta.decorator', 'entity.name.package'], s.type);
  push('Template/format placeholders', ['constant.other.placeholder', 'meta.template.expression'], s.punctuation);
  push('Invalid', ['invalid', 'invalid.illegal'], u.error);
  push('Deprecated', ['invalid.deprecated'], u.warning);

  for (const r of markdownRules(s)) {
    push(r.name || `Markdown — ${r.role}`, r.scope, r.color || u.error);
  }

  // Belt and braces: strip any fontStyle a grammar might set on these.
  rules.push({
    name: 'No italics on comments/keywords/params/types (override)',
    scope: [
      'comment',
      'keyword',
      'storage',
      'variable.parameter',
      'entity.name.type',
      'entity.other.attribute-name',
      'markup.italic',
      'markup.bold',
    ],
    settings: { fontStyle: '' },
  });

  return rules;
}

function buildSemantic(s) {
  const out = {};
  for (const [token, role] of Object.entries(SEMANTIC)) {
    out[token] = { foreground: s[role], fontStyle: '' };
  }
  // Go/Rust specifics.
  out['*.declaration'] = { fontStyle: '' };
  out['variable.readonly'] = { foreground: s.identifier, fontStyle: '' };
  out['variable.readonly.defaultLibrary'] = { foreground: s.keyword, fontStyle: '' };
  out['function.defaultLibrary'] = { foreground: s.function, fontStyle: '' };
  out['type.defaultLibrary'] = { foreground: s.keyword, fontStyle: '' };
  out['selfKeyword'] = { foreground: s.keyword, fontStyle: '' };
  return out;
}

function buildTheme(key) {
  const v = tokens.variants[key];
  const isDark = v.kind === 'dark';
  const u = tokens.ui[isDark ? 'dark' : 'light'];
  const g = tokens.git[isDark ? 'dark' : 'light'];

  // Paper's palette is authored directly; the dark palette derives its
  // punctuation and line number from the identifier ink.
  const s = { ...tokens.syntax[isDark ? 'dark' : 'light'] };
  if (isDark) {
    s.field = s.identifier;
    for (const [role, factor] of Object.entries(INK_DERIVATION)) {
      s[role] = shade(s.identifier, factor);
    }
  }

  return {
    $schema: 'vscode://schemas/color-theme',
    name: v.label,
    type: isDark ? 'dark' : 'light',
    semanticHighlighting: true,
    __syntax: s,
    colors: buildWorkbench(v, s, u, g, isDark),
    tokenColors: buildTokenColors(s, u),
    semanticTokenColors: buildSemantic(s),
  };
}

/* ------------------------------------------------------------- oklch + git scale */

/** sRGB hex -> Oklch. Used only to verify the git scale's shared (L, C). */
function oklch(hex) {
  const [r, g, b] = hex2rgb(hex).map((c) => {
    const n = c / 255;
    return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s2 = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s2;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s2;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s2;
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C: Math.hypot(A, B), H };
}

/**
 * The git scale is a single-lightness, single-chroma ramp: within a mode the six
 * hued statuses differ only in hue. This is what makes the statuses read as one
 * family, so it is enforced rather than documented — an adjustment has to move
 * the (L, C) pair for the whole mode, never one status on its own.
 *
 * `ignored` is a deliberate neutral and is exempt.
 */
function checkGitScale() {
  const errors = [];
  const { hues } = tokens.git.oklch;
  for (const mode of ['dark', 'light']) {
    const target = tokens.git.oklch[mode];
    for (const [status, hue] of Object.entries(hues)) {
      const hex = tokens.git[mode][status];
      const { L, C, H } = oklch(hex);
      if (Math.abs(L - target.L) > 0.01) {
        errors.push(`git.${mode}.${status} ${hex}: L ${L.toFixed(3)} != ${target.L}`);
      }
      if (Math.abs(C - target.C) > 0.008) {
        errors.push(`git.${mode}.${status} ${hex}: C ${C.toFixed(3)} != ${target.C}`);
      }
      const dH = Math.abs((((H - hue + 540) % 360) - 180));
      if (dH > 6) {
        errors.push(`git.${mode}.${status} ${hex}: hue ${H.toFixed(0)} != ${hue}`);
      }
    }
    // Statuses that mirror another status must stay identical to it.
    for (const [a, b] of [['stageModified', 'added'], ['stageDeleted', 'deleted']]) {
      if (tokens.git[mode][a] !== tokens.git[mode][b]) {
        errors.push(`git.${mode}.${a} must equal git.${mode}.${b}`);
      }
    }
  }
  return errors;
}

/* ---------------------------------------------------------------- self-checks */

const relLum = (hex) => {
  const c = hex2rgb(hex).map((x) => {
    const n = x / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [l1, l2] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/**
 * Two classes of check:
 *   errors   — invariants this build controls (fields == identifier, no fontStyle)
 *   warnings — properties of the authored palette values themselves. Those are
 *              design decisions, so a miss is reported for review rather than
 *              silently "fixed".
 */
function check(key, theme) {
  const v = tokens.variants[key];
  const isDark = v.kind === 'dark';
  const s = theme.__syntax;
  const bg = v.editorBackground;
  const errors = [];
  const warnings = [];

  if (s.field !== s.identifier) {
    errors.push(`field color ${s.field} differs from identifier ${s.identifier}`);
  }
  const styles = [
    ...theme.tokenColors.map((r) => r.settings.fontStyle),
    ...Object.values(theme.semanticTokenColors).map((r) => r.fontStyle),
  ].filter(Boolean);
  if (styles.length) errors.push(`fontStyle set on ${styles.length} rule(s) — must be none`);

  // chalkdraw-tokens.json records punctuation/lineNumber hexes as well as the
  // derivation factors. Where the two disagree the derivation wins, but the
  // divergence is surfaced rather than swallowed.
  if (isDark) {
    for (const [role, factor] of Object.entries(INK_DERIVATION)) {
      const derived = shade(s.identifier, factor);
      const recorded = (tokens.syntax.dark[role] || '').toUpperCase();
      if (recorded && recorded !== derived) {
        warnings.push(
          `${role}: derivation (identifier x ${factor}) gives ${derived}, ` +
            `but chalkdraw-tokens.json records ${recorded} — shipping ${derived}`
        );
      }
    }
  }

  const cComment = contrast(s.comment, bg);
  const cPunct = contrast(s.punctuation, bg);
  if (cComment <= cPunct) {
    warnings.push(
      `comment ${s.comment} (${cComment.toFixed(2)}:1) sits below punctuation ` +
        `${s.punctuation} (${cPunct.toFixed(2)}:1) against ${bg}`
    );
  }
  if (!isDark) {
    const FLOOR = 7;
    for (const role of ['keyword', 'type', 'function', 'string', 'number', 'comment', 'identifier', 'punctuation']) {
      const c = contrast(s[role], bg);
      if (c < FLOOR) warnings.push(`${role} ${s[role]} is ${c.toFixed(2)}:1 vs ${bg} (documented floor ~${FLOOR}:1)`);
    }
  }
  return { errors, warnings };
}

/* --------------------------------------------------------------------- emit */

let failed = false;

{
  const gitErrors = checkGitScale();
  if (gitErrors.length) {
    failed = true;
    console.error('\u2717 git scale broken');
    gitErrors.forEach((e) => console.error(`    error:   ${e}`));
  } else {
    const d = tokens.git.oklch.dark;
    const l = tokens.git.oklch.light;
    console.log(
      `\u2713 git scale holds \u2014 dark L ${d.L} C ${d.C}, light L ${l.L} C ${l.C}, hue-only variation`
    );
  }
}

// Deep and Flat are an exact inversion of each other: the same two greys swapped
// between editor and chrome (tokens.rules.variantPair). Changing one without
// mirroring the other is the failure this guards against.
{
  const d = tokens.variants.deep;
  const f = tokens.variants.flat;
  const pair = [];
  if (d.editorBackground !== f.chromeBackground) {
    pair.push(`deep editor ${d.editorBackground} != flat chrome ${f.chromeBackground}`);
  }
  if (d.chromeBackground !== f.editorBackground) {
    pair.push(`deep chrome ${d.chromeBackground} != flat editor ${f.editorBackground}`);
  }
  if (pair.length) {
    failed = true;
    console.error('\u2717 Deep/Flat inversion broken');
    pair.forEach((p) => console.error(`    error:   ${p}`));
  } else {
    console.log(
      `\u2713 Deep/Flat inversion holds \u2014 ${d.editorBackground} \u21c4 ${d.chromeBackground}`
    );
  }
}

// Superseded palette values. They must not reappear in generated output.
const RETIRED = [
  '#131416', '#191A1C', '#1D1F21', '#C4B7A4', '#26282B', '#57534E',
  '#D1C5B2', '#77706A', '#5C584F', '#DCD2C0', '#BCB4BA', '#AFCEDE', '#BBDCED',
];

for (const key of Object.keys(tokens.variants)) {
  const theme = buildTheme(key);
  const { errors, warnings } = check(key, theme);
  delete theme.__syntax;
  const out = path.join(ROOT, 'themes', `chalkdraw-${key}.json`);
  fs.writeFileSync(out, JSON.stringify(theme, null, 2) + '\n');

  const blob = JSON.stringify(theme).toUpperCase();
  for (const r of RETIRED) {
    if (blob.includes(r.toUpperCase())) errors.push(`retired value ${r} present in output`);
  }

  const n = Object.keys(theme.colors).length;
  console.log(
    `${errors.length ? '\u2717' : '\u2713'} ${theme.name} \u2014 ${n} workbench keys, ` +
      `${theme.tokenColors.length} token rules, ` +
      `${Object.keys(theme.semanticTokenColors).length} semantic rules`
  );
  errors.forEach((e) => console.error(`    error:   ${e}`));
  warnings.forEach((w) => console.warn(`    review:  ${w}`));
  if (errors.length) failed = true;
}
if (failed) process.exit(1);
