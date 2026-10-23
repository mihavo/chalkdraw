'use strict';

/**
 * Chalkdraw for JetBrains IDEs.
 *
 * A JetBrains theme is two files per variant:
 *
 *   *.theme.json  the workbench -- frame, tool windows, tabs, popups, controls
 *   *.xml         the editor colour scheme -- syntax, gutter, diff, console
 *
 * Both are generated from src/chalkdraw-tokens.json, the same source the VS Code
 * themes, the Neovim colorscheme and the iTerm2 presets come from. No hex
 * literals belong in this file.
 *
 * ---------------------------------------------------------------- islands
 *
 * 2025.2 introduced the Islands look: the editor and each tool window are
 * rounded cards floating on the window frame, rather than panels butted against
 * each other. It needs two grounds instead of one, and it needs them to differ
 * enough to read as separate surfaces.
 *
 * Chalkdraw already has exactly two: the editor background and the chrome
 * background. So:
 *
 *   island (editor, tool windows, tabs, popups)  = editorBackground
 *   frame  (title bar, status bar, stripes, gap) = chromeBackground
 *
 * Deep puts the lighter grey on the frame, Flat and Cool put it on the island,
 * and Paper puts it on the island as well. That is the variantPair rule showing
 * through: nothing here decides which way round a variant goes.
 *
 * It does decide how far apart the two sit. In VS Code the seam between editor
 * and sidebar is a hairline and 1.04:1 is enough; in Islands the seam is a 6px
 * gap of frame showing between two rounded cards, and at 1.04:1 the cards do not
 * read at all. The bundled Islands themes sit at 1.18--1.34:1. So the frame is
 * the variant's chrome grey pushed further from the editor in whatever direction
 * it already goes, until it clears FRAME_SEPARATION. The arrangement is the
 * variant's; only the distance is the port's.
 *
 * The distance is measured in oklch lightness, not in a contrast ratio. Down at
 * Flat's and Cool's end of the scale a WCAG ratio needs an enormous absolute
 * step to move at all -- asking Flat's #151515 for 1.18:1 lands it on #070707,
 * which is no longer a grey.
 *
 * `Islands: 1` in the ui block is what turns the renderer on -- the IDE reads it
 * as an int and enables the many-island layout whenever the new UI is active.
 * Island.borderColor must equal the island surface, because the "border" is the
 * gap the frame is painted through, not a stroke around the card.
 */

/**
 * Oklch lightness the frame must clear against the island for the card edges to
 * read. The bundled Islands themes sit at 0.059 (Dark), 0.063 (Light) and 0.077
 * (Darcula); 0.058 is the gentlest of the three, which suits a theme that is
 * trying not to shout.
 */
const FRAME_SEPARATION = 0.058;

/**
 * The stroke colour the platform's new-UI icons are actually drawn in. Remapping
 * it through icons.ColorPalette is how a theme gets the toolbar and tool-window
 * icons onto its own ink -- it is what Islands Dark does, with one entry.
 *
 * These two are literals on purpose: they are the platform's values, not
 * Chalkdraw's, and they are what the SVGs contain. Verified by scanning the
 * bundled expui icon set.
 */
const PLATFORM_ICON_STROKE = { dark: '#CED0D6', light: '#6C707E' };

/** Card geometry. Matches the bundled Islands themes; compact is the dense mode. */
const ISLAND = {
  arc: 20,
  arcCompact: 16,
  borderArcLength: 14,
  borderArcLengthCompact: 10,
  borderWidth: 6,
  borderWidthCompact: 4,
  inactiveAlpha: 0.56,
  toolWindowAlpha: 0.2,
};

/**
 * Editor-scheme attributes, as role names. Everything the bundled Darcula and
 * Default schemes colour explicitly has to be listed, or that scheme's own value
 * shows through the parent link -- Darcula's orange keywords and olive strings
 * would survive into Chalkdraw otherwise.
 *
 * A `null` role means "foreground unset": the attribute inherits DEFAULT_* and
 * only needs its background or effect cleared.
 */
const SCHEME_ROLES = {
  /* the DEFAULT_ family is the fallback root every language maps onto */
  TEXT: 'identifier',
  DEFAULT_IDENTIFIER: 'identifier',
  DEFAULT_LOCAL_VARIABLE: 'identifier',
  DEFAULT_REASSIGNED_LOCAL_VARIABLE: 'identifier',
  DEFAULT_INSTANCE_FIELD: 'field',
  DEFAULT_STATIC_FIELD: 'field',
  DEFAULT_PARAMETER: 'parameter',
  DEFAULT_REASSIGNED_PARAMETER: 'parameter',
  DEFAULT_KEYWORD: 'keyword',
  DEFAULT_STRING: 'string',
  CUSTOM_STRING_ATTRIBUTES: 'string',
  DEFAULT_NUMBER: 'number',
  DEFAULT_CONSTANT: 'constant',
  DEFAULT_CLASS_NAME: 'type',
  DEFAULT_CLASS_REFERENCE: 'type',
  DEFAULT_INTERFACE_NAME: 'type',
  DEFAULT_TAG: 'type',
  TYPE_PARAMETER_NAME_ATTRIBUTES: 'type',
  DEFAULT_FUNCTION_DECLARATION: 'function',
  DEFAULT_FUNCTION_CALL: 'function',
  DEFAULT_INSTANCE_METHOD: 'function',
  DEFAULT_STATIC_METHOD: 'function',
  DEFAULT_LINE_COMMENT: 'comment',
  DEFAULT_BLOCK_COMMENT: 'comment',
  DEFAULT_DOC_COMMENT: 'comment',
  DEFAULT_DOC_COMMENT_TAG: 'comment',
  DEFAULT_DOC_COMMENT_TAG_VALUE: 'comment',
  DEFAULT_DOC_MARKUP: 'comment',
  DEFAULT_BRACES: 'punctuation',
  DEFAULT_BRACKETS: 'punctuation',
  DEFAULT_PARENTHS: 'punctuation',
  DEFAULT_COMMA: 'punctuation',
  DEFAULT_DOT: 'punctuation',
  DEFAULT_SEMICOLON: 'punctuation',
  DEFAULT_OPERATION_SIGN: 'punctuation',
  DEFAULT_METADATA: 'keyword',
  DEFAULT_VALID_STRING_ESCAPE: 'constant',
  DEFAULT_TEMPLATE_LANGUAGE_COLOR: null,

  /* Java / Kotlin / Scala keys the parent schemes pin by hand.
   *
   * Annotations take the keyword ink, not the constant one: the Java TextMate
   * grammar scopes `@Service` as `storage.type.annotation.java`, which the VS
   * Code theme catches with `storage.type`. Colouring them tan here would put
   * `@Service` on a different ink in the two editors. */
  ANNOTATION_NAME_ATTRIBUTES: 'keyword',
  ANNOTATION_ATTRIBUTE_NAME_ATTRIBUTES: 'identifier',
  'Static method access': 'function',
  'Static property reference ID': 'field',
  IMPLICIT_ANONYMOUS_CLASS_PARAMETER_ATTRIBUTES: 'type',
  TEMPLATE_VARIABLE_ATTRIBUTES: 'parameter',
  KOTLIN_MUTABLE_VARIABLE: 'identifier',
  KOTLIN_NAMED_ARGUMENT: 'parameter',
  KOTLIN_TYPE_PARAMETER: 'type',
  KOTLIN_SMART_CONSTANT: 'constant',
  KOTLIN_LABEL: 'keyword',
  'Scala Type Alias': 'type',
  'Scala Type parameter': 'type',

  /* markup and templating */
  XML_TAG: 'punctuation',
  XML_TAG_NAME: 'keyword',
  XML_TAG_DATA: 'identifier',
  XML_NS_PREFIX: 'type',
  XML_COMMENT: 'comment',
  HTML_COMMENT: 'comment',
  XML_ATTRIBUTE_NAME: 'parameter',
  XML_ATTRIBUTE_VALUE: 'string',
  XML_ENTITY_REFERENCE: 'constant',
  XML_PROLOGUE: 'punctuation',
  XML_CUSTOM_TAG_NAME: 'type',
  HTML_TAG: 'punctuation',
  HTML_TAG_NAME: 'keyword',
  HTML_ATTRIBUTE_NAME: 'parameter',
  HTML_ATTRIBUTE_VALUE: 'string',
  HTML_ENTITY_REFERENCE: 'constant',
  HTML_CUSTOM_TAG_NAME: 'type',
  'CSS.COLOR': 'number',
  'CSS.IMPORTANT': 'keyword',
  'CSS.URL': 'string',
  'PROPERTIES.KEY': 'field',
  'PROPERTIES.KEY_VALUE_SEPARATOR': 'punctuation',
  'PROPERTIES.INVALID_STRING_ESCAPE': 'constant',
  JSP_DIRECTIVE_NAME: 'keyword',
  VELOCITY_DIRECTIVE: 'keyword',
  VELOCITY_KEYWORD: 'keyword',
  VELOCITY_REFERENCE: 'identifier',
  'XPATH.KEYWORD': 'keyword',
  'XPATH.XPATH_NAME': 'type',
  'XPATH.FUNCTION': 'function',
  'XPATH.XPATH_VARIABLE': 'identifier',
  HAML_TAG: 'keyword',
  HAML_CLASS: 'type',
  HAML_ID: 'type',
  HAML_COMMENT: 'comment',
  SASS_RULE: 'keyword',
  SASS_DIRECTIVE: 'keyword',
  SASS_ATTRIBUTE: 'parameter',
  SASS_VARIABLE: 'identifier',
  SASS_CONSTANT: 'constant',
  SASS_MIXIN: 'function',
  SASS_COMMENT: 'comment',
  LESS_VARIABLE: 'identifier',

  /* JavaScript */
  'JS.GLOBAL_FUNCTION': 'function',
  'JS.GLOBAL_VARIABLE': 'identifier',
  'JS.INSTANCE_MEMBER_FUNCTION': 'function',
  'JS.REGEXP': 'string',
  'JS.JSX_CLIENT_COMPONENT': 'type',

  /* regexp */
  'REGEXP.BRACES': 'punctuation',
  'REGEXP.BRACKETS': 'punctuation',
  'REGEXP.PARENTHS': 'punctuation',
  'REGEXP.CHAR_CLASS': 'type',
  'REGEXP.META': 'keyword',
  'REGEXP.ESC_CHARACTER': 'constant',
  'REGEXP.QUOTE_CHARACTER': 'constant',
  'REGEXP.REDUNDANT_ESCAPE': 'number',

  /* markdown */
  MARKDOWN_LINK_TEXT: 'function',
  MARKDOWN_AUTO_LINK: 'importPath',
  MARKDOWN_IMAGE: 'string',

  /* misc leaks from Darcula */
  CUSTOM_KEYWORD1_ATTRIBUTES: 'keyword',
  CUSTOM_KEYWORD2_ATTRIBUTES: 'type',
  CUSTOM_KEYWORD3_ATTRIBUTES: 'function',
  CUSTOM_KEYWORD4_ATTRIBUTES: 'constant',
  CUSTOM_VALID_STRING_ESCAPE_ATTRIBUTES: 'constant',
  GHERKIN_REGEXP_PARAMETER: 'parameter',
  CTRL_CLICKABLE: 'function',
  DOC_CODE_INLINE: 'string',
  BREADCRUMBS_DEFAULT: 'lineNumber',
  BREADCRUMBS_INACTIVE: 'lineNumber',
  BREADCRUMBS_HOVERED: 'identifier',
  BREADCRUMBS_CURRENT: 'identifier',
};


/**
 * Attributes the parent schemes colour that the role table above does not reach.
 *
 * A Chalkdraw scheme names Darcula (or Default, for Paper) as its parent, so any
 * attribute those schemes give a colour to and this one does not shows through in
 * a JetBrains colour. The Java plugin registers INSTANCE_FIELD_ATTRIBUTES and
 * friends against the Default scheme, which is why Java fields came out Darcula
 * purple while everything around them was already Chalkdraw.
 *
 * src/jetbrains-parent-keys.json lists every such key; the build reports any that
 * is still unhandled. Regenerate that file against a newer IDE with
 * scripts/harvest-jetbrains-keys.js.
 */
const PARENT_FOREGROUND = {
  /* Java and Groovy, registered against the Default scheme */
  INSTANCE_FIELD_ATTRIBUTES: 'field',
  STATIC_FIELD_ATTRIBUTES: 'field',
  // `static final` reads as a named constant, the same call the VS Code theme
  // makes for `variable.other.constant`.
  STATIC_FINAL_FIELD_ATTRIBUTES: 'constant',
  GROOVY_KEYWORD: 'keyword',

  /* custom file types */
  CUSTOM_LINE_COMMENT_ATTRIBUTES: 'comment',
  CUSTOM_MULTI_LINE_COMMENT_ATTRIBUTES: 'comment',
  CUSTOM_NUMBER_ATTRIBUTES: 'number',
  CUSTOM_INVALID_STRING_ESCAPE_ATTRIBUTES: 'string',

  /* markup */
  DEFAULT_ATTRIBUTE: 'identifier',
  DEFAULT_ENTITY: 'constant',
  // markup.heading takes the keyword ink in the VS Code theme
  MARKDOWN_HEADER: 'keyword',
  YAML_ANCHOR: 'constant',

  /* JavaScript, TypeScript, Angular */
  'JS.LOCAL_VARIABLE': 'identifier',
  'TS.TYPE_PARAMETER': 'type',
  'NG.SIGNAL': 'function',

  /* SQL and database */
  SQL_OUTER_QUERY_COLUMN: 'field',
  SQL_SYNTHETIC_ENTITY: 'function',
  'List/map to object conversion': 'type',

  /* shell */
  'BASH.INTERNAL_COMMAND': 'keyword',
  'BASH.EXTERNAL_COMMAND': 'function',
  'BASH.FUNCTION_CALL': 'function',
  'BASH.FUNCTION_DEF_NAME': 'function',

  /* HTTP client */
  HTTP_REQUEST_PARAMETER_NAME: 'parameter',
  HTTP_REQUEST_PARAMETER_VALUE: 'string',
  HTTP_REQUEST_MULTIPART_BOUNDARY: 'punctuation',

  /* Kotlin and Compose */
  KOTLIN_CONTEXT_ARGUMENT: 'parameter',
  IntelliJComposableCallTextAttributes: 'function',
  ATTR_INTERNAL_CALL_ID: 'function',

  /* Mermaid */
  MERMAID_KEYWORD: 'keyword',
  MERMAID_TITLE: 'type',
  MERMAID_DIAGRAM_NAME: 'type',
  MERMAID_GENERIC: 'identifier',
  MERMAID_IDENTIFIER: 'identifier',
  MERMAID_EDGE: 'punctuation',
  MERMAID_FRONTMATTER_DELIMITER: 'punctuation',
  MERMAID_CONSTANT: 'constant',

  /* Attributes the parents style but do not colour. Darcula gives
   * STATIC_METHOD_ATTRIBUTES italics and nothing else, which is how every static
   * call ended up italic in a theme whose first rule is that nothing is. */
  STATIC_METHOD_ATTRIBUTES: 'function',
  JOIN_POINT: 'function',
  DEFAULT_LABEL: 'keyword',
  DEFAULT_PREDEFINED_SYMBOL: 'constant',
  'COFFEESCRIPT.GLOBAL_VARIABLE': 'identifier',
  'Closure braces': 'punctuation',
  'JS.PARAMETER': 'parameter',
  KOTLIN_PACKAGE_FUNCTION_CALL: 'function',
  KOTLIN_DYNAMIC_FUNCTION_CALL: 'function',
  KOTLIN_DYNAMIC_PROPERTY_CALL: 'field',
  KOTLIN_BACKING_FIELD_VARIABLE: 'field',
  KOTLIN_CLOSURE_DEFAULT_PARAMETER: 'parameter',
  KOTLIN_FUNCTION_LITERAL_BRACES_AND_ARROW: 'punctuation',
  'BASH.SHEBANG': 'comment',
  'BASH.HERE_DOC_START': 'string',
  'BASH.HERE_DOC_END': 'string',
  'BEAN.INACTIVE': 'comment',
  HAML_TEXT: 'identifier',
  TERMINAL_CLASS_NAME_LOG_REFERENCE: 'function',

  /* markdown emphasis carries no weight or slant here, the same call the VS Code
   * theme makes when it emits no fontStyle for markup.bold and markup.italic */
  MARKDOWN_BOLD: 'identifier',
  MARKDOWN_ITALIC: 'identifier',
  MARKDOWN_HEADER_BOLD: 'keyword',
  MARKDOWN_REFERENCE_LINK: 'function',

  /* refactoring and usage-view prefixes */
  $NUMBER_OF_USAGES: 'comment',
  $EXCLUDED_NODE: 'comment',
  $TEXT_NODE: 'identifier',
};

/** The same, for keys whose parent value is a ui colour rather than a syntax one. */
const PARENT_FOREGROUND_UI = {
  $HAS_READ_ONLY_CHILD: 'error',
  $INVALID_PREFIX: 'error',
  $READ_ONLY_PREFIX: 'error',
  KOTLIN_COROUTINE_DEBUGGER_VALUE: 'error',
  COMPOSE_SERVICE_STATUS_ERROR: 'error',
  KUBERNETES_POD_STATUS_ERROR: 'error',
  COMPOSE_SERVICE_STATUS_SUCCESS: 'success',
  KUBERNETES_POD_STATUS_SUCCESS: 'success',
  COMPOSE_SERVICE_STATUS_NEUTRAL: 'fgMuted',
  KUBERNETES_POD_STATUS_OTHER: 'fgMuted',
  INLAY_BUTTON_DEFAULT: 'fgMuted',
  INLAY_BUTTON_FOCUSED: 'fgStrong',
  INLAY_BUTTON_HOVERED: 'fgStrong',
  INLAY_BUTTON_HINT: 'fgFaint',
  AI_INLAY_BUTTON_DEFAULT: 'fgMuted',
  AI_INLAY_BUTTON_FOCUSED: 'fgStrong',
  AI_INLAY_BUTTON_HOVERED: 'fgStrong',
  INVISIBLE_INLAY_BUTTON: 'dim',
  COMPOSE_INVISIBLE_PORT_BUTTON: 'dim',
  FILESTATUS_ERRORS: 'error',
  GENERIC_SERVER_ERROR_OR_WARNING: 'warning',
};

/**
 * Background-only leaks. Each is re-mixed onto the variant's own editor ground at
 * the given weight, so a Darcula grey such as #3A3A3A does not land on #181818.
 * `on` names a syntax role or a ui colour; `null` means the editor ground itself.
 */
const PARENT_BACKGROUND = {
  CONSOLE_OUTPUT: { on: null },
  HAML_RUBY_CODE: { on: null },
  VELOCITY_SCRIPTING_BACKGROUND: { on: null },
  'SPY-JS.FUNCTION_SCOPE': { on: null },
  'SPY-JS.PROGRAM_SCOPE': { on: null },

  DIFF_INSERTED: { on: 'success', t: 0.18 },
  DIFF_DELETED: { on: 'error', t: 0.14 },
  DIFF_DELETED_FROM_FS: { on: 'error', t: 0.1 },
  DIFF_MODIFIED: { on: 'accent', t: 0.18 },
  DIFF_CONFLICT: { on: 'warning', t: 0.18 },
  DIFF_ABSENT: { on: 'dim', t: 0.14 },
  DIFF_UNKNOWN: { on: 'dim', t: 0.14 },
  DUPLICATE_FROM_SERVER: { on: 'warning', t: 0.2 },
  DELETED_TEXT_ATTRIBUTES: { on: 'error', t: 0.22, fg: 'comment' },

  EVALUATED_EXPRESSION_ATTRIBUTES: { on: 'accent', t: 0.16 },
  EVALUATED_EXPRESSION_EXECUTION_LINE_ATTRIBUTES: { on: 'accent', t: 0.22 },
  INLINE_STACK_FRAMES: { on: 'number', t: 0.16 },
  DEBUGGER_SMART_STEP_INTO_TARGET: { on: 'number', t: 0.2 },
  DEBUGGER_SMART_STEP_INTO_SELECTION: { on: 'number', t: 0.3 },

  KOTLIN_SMART_CAST_RECEIVER: { on: 'success', t: 0.16 },
  KOTLIN_SMART_CAST_VALUE: { on: 'success', t: 0.16 },
  KOTLIN_PROPERTY_WITH_BACKING_FIELD: { on: 'number', t: 0.16 },
  'TS.TYPE_GUARD': { on: 'success', t: 0.16 },
  ComposeStateReadScopeHighlightingTextAttributes: { on: 'accent', t: 0.2 },

  REGEXP_MATCHED_GROUPS: { on: 'dim', t: 0.35 },
  'BASH.BINARY_DATA': { on: 'accent', t: 0.2 },
  TERMINAL_COMMAND_TO_RUN_USING_IDE: { on: 'success', t: 0.2 },
  'SPY-JS.EXCEPTION': { on: 'error', t: 0.2 },
  'SPY-JS.PATH_LEVEL_ONE': { on: 'success', t: 0.2 },
  MERMAID_NOTE: { on: 'warning', t: 0.14 },
  'SPY-JS.PATH_LEVEL_TWO': { on: 'success', t: 0.14 },
  $OCCURENCE: { on: 'accent', t: 0.18 },
  $SELECTED_OCCURENCE: { on: 'accent', t: 0.3 },
};

/** Purple prompt text the AI features use. It follows the number ink. */
const PARENT_PROMPT_KEYS = [
  'INLINE_PROMPT',
  'INLINE_PROMPT_PROGRESS_DARK',
  'INLINE_PROMPT_PROGRESS_LIGHT',
  'BLOCK_TERMINAL_GENERATE_COMMAND_PROMPT_TEXT',
];

/** Code With Me paints one hue per collaborator; the git scale already has six. */
const COLLAB_HUES = ['modified', 'untracked', 'deleted', 'conflicting', 'added', 'submodule'];

module.exports = function createJetBrains(deps) {
  const { mix, alpha, step, contrast, oklch, parentKeys } = deps;
  const lightness = (hex) => oklch(hex).L;

  /* ------------------------------------------------------------- palette */

  /**
   * The named colours a variant's theme.json declares. Everything in the ui
   * block references one of these, so retuning a token moves the whole IDE.
   */
  /**
   * The two grounds. `frame` starts at the variant's chrome grey and is walked
   * away from the editor -- lighter if the variant already puts the lighter grey
   * on the chrome, darker if it does not -- until the cards separate.
   */
  function grounds(ctx) {
    const { v, isDark } = ctx;
    const island = v.editorBackground;
    const authored = v.chromeBackground;

    const islandL = lightness(island);
    // Which way the variant already leans. A dead heat cannot happen in the
    // shipped tokens, but if it ever did, dark themes lift the frame.
    const lighter = lightness(authored) === islandL ? isDark : lightness(authored) > islandL;
    const target = lighter ? '#FFFFFF' : '#000000';

    let frame = authored;
    for (let t = 0; Math.abs(lightness(frame) - islandL) < FRAME_SEPARATION && t < 1; t += 0.01) {
      frame = mix(authored, target, t);
    }
    return { island, frame, authored, moved: frame !== authored, islandL };
  }

  function palette(ctx) {
    const { v, isDark, s, u, vs } = ctx;

    const { island, frame } = grounds(ctx);
    const line = v.currentLine;

    // Dialogs, menus and popups are the one place the widened frame is wrong.
    // It exists to open a gap between the cards; a dialog is not a card, and at
    // Flat's #0F0F0F it reads as a hole. VS Code paints all of these on the
    // variant's authored chrome grey, so take that value directly -- it is the
    // same surface, already decided.
    const popup = vs['menu.background'];

    return {
      island,
      'island-line': line,
      // Inputs, straight from the VS Code theme rather than derived a second time.
      'island-sunken': vs['input.background'],
      frame,
      // Button faces. Chalkdraw's are nearly flat, told apart by their border --
      // a lifted grey here is what made the Settings buttons look borrowed.
      'button-face': vs['button.secondaryBackground'],
      'button-ink': vs['button.secondaryForeground'],
      'button-default-face': vs['button.background'],
      'button-default-ink': vs['button.foreground'],
      // Chips: tags, counters, mnemonics. The current-line grey is the one step
      // above the ground that the theme already owns.
      chip: line,
      popup,
      border: u.border,
      dim: u.dim,

      ink: s.identifier,
      'ink-strong': u.fgStrong,
      'ink-muted': u.fgMuted,
      'ink-faint': u.fgFaint,
      'ink-tree': u.fgTree,
      // Text and icons drawn on a filled accent. Chalkdraw's accents are light,
      // so this is the ground, not white -- the same call the VS Code theme makes
      // for button.foreground.
      'ink-over-accent': island,
      // Icons sit a step below the strongest ink: on a toolbar they should read
      // as chrome, not as content.
      'icon-stroke': u.fgTree,

      accent: u.accent,
      'accent-hover': u.accentHover || step(u.accent, isDark),
      'accent-selection': mix(island, u.accent, isDark ? 0.26 : 0.2),
      'accent-selection-soft': mix(island, u.accent, isDark ? 0.14 : 0.11),
      'accent-frame-selection': mix(frame, u.accent, isDark ? 0.26 : 0.2),

      error: u.error,
      warning: u.warning,
      success: u.success,

      // Transparent washes. Hover states have to work on the frame and on the
      // island at once, so they are alpha over neutral rather than a flat grey.
      'wash-hover': alpha(u.fgStrong, isDark ? 0.07 : 0.06),
      'wash-pressed': alpha(u.fgStrong, isDark ? 0.12 : 0.1),
      'wash-border': alpha(u.fgStrong, isDark ? 0.14 : 0.12),
      'wash-none': alpha(u.border, 0),
    };
  }

  /* ----------------------------------------------------------- ui block */

  function uiBlock(ctx) {
    const { v, isDark, s, u, g, vs } = ctx;

    return {
      /* every component that names nothing more specific */
      '*': {
        foreground: 'ink-strong',
        background: 'popup',
        disabledBackground: 'popup',
        disabledText: 'ink-faint',
        inactiveForeground: 'ink-faint',
        inactiveUnderlineColor: 'dim',
        modifiedItemForeground: 'accent',
        separatorForeground: 'ink-faint',
        shortcutForeground: 'ink-muted',
        focusColor: 'accent',
        infoForeground: 'ink-muted',
        borderColor: 'border',
        separatorColor: 'border',
        disabledForeground: 'ink-faint',
        disabledBorderColor: 'border',
        hoverBackground: 'wash-hover',
        selectionBackground: 'accent-selection',
        selectionForeground: 'ink-strong',
        selectionInactiveBackground: 'island-line',
        selectionInactiveForeground: 'ink-strong',
        lightSelectionBackground: 'accent-selection-soft',
        selectionBackgroundInactive: 'island-line',
        inactiveBackground: 'frame',
        acceleratorForeground: 'ink-muted',
        underlineColor: 'accent',
      },

      /* ---------------------------------------------- named panel surfaces
       *
       * `*` fills gaps; it never beats a key the parent states outright, and
       * ExperimentalDark states `*.background` as its own grey. Every dialog,
       * scroll pane and menu therefore has to be named, or Settings comes up in
       * the platform's charcoal rather than the variant's chrome. */
      Panel: { background: 'popup', foreground: 'ink-strong' },
      Viewport: { background: 'popup', foreground: 'ink-strong' },
      ScrollPane: { background: 'popup' },
      SplitPane: { background: 'popup', highlight: 'border' },
      OptionPane: { background: 'popup', foreground: 'ink-strong', messageForeground: 'ink-strong' },
      TitledBorder: { titleColor: 'ink-strong' },
      MainMenu: {
        background: 'frame',
        selectionBackground: 'accent-selection',
        selectionForeground: 'ink-strong',
        transparentSelectionBackground: 'wash-hover',
      },
      TitlePane: { background: 'frame', Button: { hoverBackground: 'wash-hover' } },
      // The platform paints a dark halo under popups; on a near-black frame it
      // reads as a smudge, so it is switched off rather than recoloured.
      Ide: { Shadow: Object.fromEntries(
        ['top', 'bottom', 'left', 'right', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight']
          .flatMap((side) => [[`${side}0Color`, 'wash-none'], [`${side}1Color`, 'wash-none']])
      ) },

      /* --------------------------------------------------------- islands */
      Islands: 1,
      Island: {
        arc: ISLAND.arc,
        'arc.compact': ISLAND.arcCompact,
        borderArcLength: ISLAND.borderArcLength,
        'borderArcLength.compact': ISLAND.borderArcLengthCompact,
        borderWidth: ISLAND.borderWidth,
        'borderWidth.compact': ISLAND.borderWidthCompact,
        // The gap between cards is painted in the island's own colour and then
        // the frame shows through the rounded corners. Anything else outlines
        // every card in a stroke the design does not have.
        borderColor: 'island',
        inactiveAlpha: ISLAND.inactiveAlpha,
        toolWindowAlpha: ISLAND.toolWindowAlpha,
      },

      /* ------------------------------------------------------ window frame */
      MainWindow: {
        background: 'frame',
        Tab: {
          background: 'frame',
          selectedBackground: 'island',
          selectedForeground: 'ink-strong',
          selectedInactiveBackground: 'chip',
          hoverBackground: 'wash-hover',
          hoverForeground: 'ink-strong',
          separatorColor: 'border',
          borderColor: 'frame',
          foreground: 'ink-muted',
        },
        FullScreeControl: { Background: 'chip' },
      },
      MainToolbar: {
        background: 'frame',
        inactiveBackground: 'frame',
        borderColor: 'wash-none',
        Icon: { hoverBackground: 'wash-hover', pressedBackground: 'wash-pressed' },
        Dropdown: {
          hoverBackground: 'wash-hover',
          pressedBackground: 'wash-pressed',
          transparentHoverBackground: 'wash-hover',
        },
      },
      StatusBar: {
        // No third grey here even where the variant has one (Cool's status bar):
        // under Islands the status bar is part of the frame, and a separate
        // ground there competes with the cards instead of receding behind them.
        background: 'frame',
        borderColor: 'wash-none',
        topBorderWidth: 0,
        Widget: {
          foreground: 'ink-muted',
          hoverForeground: 'ink-strong',
          hoverBackground: 'wash-hover',
          pressedBackground: 'wash-pressed',
        },
        Breadcrumbs: {
          foreground: 'ink-muted',
          hoverForeground: 'ink-strong',
          hoverBackground: 'wash-hover',
          pressedBackground: 'wash-pressed',
          selectionBackground: 'wash-pressed',
          selectionInactiveBackground: 'wash-hover',
        },
      },
      NavBar: { borderColor: 'wash-none' },
      Borders: { color: 'border', ContrastBorderColor: 'border' },
      OnePixelDivider: { background: 'border' },
      Toolbar: { borderColor: 'border', Floating: { background: 'popup' } },
      Separator: { separatorColor: 'border' },

      /* ------------------------------------------------------ tool windows */
      ToolWindow: {
        background: 'island',
        borderColor: 'island',
        Button: {
          foreground: 'ink-muted',
          hoverBackground: 'wash-hover',
          selectedBackground: 'wash-pressed',
          selectedForeground: 'ink-strong',
          DragAndDrop: {
            buttonDropBackground: 'accent-selection',
            buttonDropBorderColor: 'accent',
            buttonFloatingBackground: 'chip',
            stripeBackground: 'frame',
          },
        },
        Header: { background: 'island', inactiveBackground: 'island', borderColor: 'island' },
        HeaderTab: {
          selectedInactiveBackground: 'island-line',
          selectedBackground: 'island-line',
          hoverBackground: 'wash-hover',
          hoverInactiveBackground: 'wash-hover',
          underlinedTabBackground: 'island-line',
          underlinedTabForeground: 'ink-strong',
          underlineColor: 'accent',
          inactiveUnderlineColor: 'dim',
        },
        Stripe: { background: 'frame', borderColor: 'wash-none', separatorColor: 'border', DragAndDrop: { separatorColor: 'accent' } },
        DragAndDrop: { areaBackground: 'accent-selection-soft' },
      },

      /* ------------------------------------------------------ editor tabs */
      EditorTabs: {
        background: 'island',
        underlinedTabBackground: 'island-line',
        inactiveUnderlinedTabBackground: 'island',
        underlinedTabForeground: 'ink-strong',
        underlinedTabInactiveForeground: 'ink-muted',
        inactiveColoredFileBackground: 'wash-none',
        hoverBackground: 'wash-hover',
        underlineColor: 'accent',
        inactiveUnderlineColor: 'dim',
        underlinedBorderColor: 'wash-none',
        inactiveUnderlinedTabBorderColor: 'wash-none',
        underTabsBorderColor: 'island',
        borderColor: 'island',
      },

      /* ---------------------------------------------------------- editor */
      Editor: {
        background: 'island',
        shortcutForeground: 'accent',
        SearchField: { background: 'island-sunken', borderColor: 'border' },
        Toolbar: { borderColor: 'border' },
        ToolTip: {
          background: 'popup',
          foreground: 'ink-strong',
          border: 'border',
          selectionBackground: 'accent-selection',
          iconHoverBackground: 'wash-hover',
          errorBackground: mixDown(ctx, u.error),
          errorBorder: 'error',
          warningBackground: mixDown(ctx, u.warning),
          warningBorder: 'warning',
          successBackground: mixDown(ctx, u.success),
          successBorder: 'success',
        },
      },
      EditorPane: { background: 'island', inactiveBackground: 'island' },
      Code: { Block: { borderColor: 'border', EditorPane: { borderColor: 'border' } } },

      /* ------------------------------------------------- lists and trees */
      List: {
        background: 'island',
        foreground: 'ink-tree',
        hoverBackground: 'wash-hover',
        hoverInactiveBackground: 'wash-hover',
        selectionBackground: 'accent-selection',
        selectionForeground: 'ink-strong',
        selectionInactiveBackground: 'island-line',
        Tag: { background: 'chip', foreground: 'ink-muted' },
        Button: { hoverBackground: 'wash-hover', separatorColor: 'wash-border' },
      },
      Tree: {
        background: 'island',
        foreground: 'ink-tree',
        hoverBackground: 'wash-hover',
        hoverInactiveBackground: 'wash-hover',
        selectionBackground: 'accent-selection',
        selectionForeground: 'ink-strong',
        selectionInactiveBackground: 'island-line',
        modifiedItemForeground: g.modified,
        errorForeground: 'error',
        hash: 'border',
      },
      Table: {
        background: 'island',
        gridColor: 'border',
        stripeColor: 'island-line',
        hoverBackground: 'wash-hover',
        selectionBackground: 'accent-selection',
        selectionInactiveBackground: 'island-line',
        lightSelectionBackground: 'accent-selection-soft',
        lightSelectionInactiveBackground: 'island-line',
      },
      TableHeader: { background: 'island', bottomSeparatorColor: 'border' },
      TabbedPane: { hoverColor: 'wash-hover', underlineColor: 'accent', contentAreaColor: 'border' },

      /* --------------------------------------------------------- popups */
      Popup: {
        background: 'popup',
        borderColor: 'border',
        separatorColor: 'border',
        separatorForeground: 'ink-faint',
        innerBorderColor: 'border',
        Header: { activeBackground: 'popup', inactiveBackground: 'popup', inactiveForeground: 'ink-muted' },
        inactiveBorderColor: 'border',
        Toolbar: { background: 'popup', borderColor: 'border' },
        Advertiser: { background: 'popup', foreground: 'ink-faint', borderColor: 'border' },
        paintBorder: true,
      },
      ComplexPopup: { Header: { background: 'popup' } },
      PopupMenu: { background: 'popup', selectionBackground: 'accent-selection' },
      Menu: { background: 'popup', borderColor: 'border', separatorColor: 'border' },
      MenuItem: { background: 'popup', selectionBackground: 'accent-selection', acceleratorForeground: 'ink-faint' },
      MenuBar: { background: 'frame', borderColor: 'wash-none' },
      CompletionPopup: {
        background: 'popup',
        foreground: 'ink-strong',
        selectionBackground: 'accent-selection',
        selectionInactiveBackground: 'island-line',
        matchForeground: 'accent',
        matchSelectionForeground: 'accent-hover',
        Advertiser: { background: 'popup', foreground: 'ink-faint' },
      },
      SearchEverywhere: {
        SearchField: { background: 'island-sunken', borderColor: 'border', infoForeground: 'ink-faint' },
        Tab: { selectedBackground: 'accent-selection', selectedForeground: 'ink-strong' },
        List: { separatorColor: 'border', separatorForeground: 'ink-faint', settingsBackground: 'popup' },
        Advertiser: { background: 'popup', foreground: 'ink-faint' },
        Header: { background: 'popup' },
      },
      ToolTip: {
        background: 'popup',
        foreground: 'ink-strong',
        borderColor: 'border',
        infoForeground: 'ink-muted',
        shortcutForeground: 'ink-faint',
        Actions: { background: 'popup' },
      },
      ParameterInfo: {
        background: 'popup',
        foreground: 'ink-muted',
        borderColor: 'border',
        currentParameterForeground: 'ink-strong',
        currentOverloadBackground: 'island-line',
        infoForeground: 'ink-faint',
        lineSeparatorColor: 'border',
      },
      AlertDialog: { background: 'popup' },
      NewClass: { Panel: { background: 'popup' }, SearchField: { background: 'island-sunken' } },

      /* ------------------------------------------------------- controls */
      Component: {
        borderColor: 'border',
        focusColor: 'accent',
        focusedBorderColor: 'accent',
        disabledBorderColor: 'border',
        errorFocusColor: 'error',
        inactiveErrorFocusColor: mixDown(ctx, u.error),
        warningFocusColor: 'warning',
        inactiveWarningFocusColor: mixDown(ctx, u.warning),
        infoForeground: 'ink-faint',
      },
      Button: {
        background: 'button-face',
        foreground: 'button-ink',
        startBackground: 'button-face',
        endBackground: 'button-face',
        startBorderColor: 'border',
        endBorderColor: 'border',
        focusedBorderColor: 'accent',
        disabledBorderColor: 'border',
        disabledText: 'ink-faint',
        loadingForeground: 'ink-muted',
        shadowColor: 'wash-none',
        default: {
          startBackground: 'button-default-face',
          endBackground: 'button-default-face',
          startBorderColor: 'button-default-face',
          endBorderColor: 'button-default-face',
          foreground: 'button-default-ink',
          focusColor: 'accent-hover',
          focusedBorderColor: 'accent-hover',
          loadingForeground: 'button-default-ink',
          shadowColor: 'wash-none',
        },
        Split: { default: { iconColor: 'button-default-ink', separatorColor: 'accent-hover' } },
      },
      ToggleButton: {
        onBackground: 'success',
        onForeground: 'ink-over-accent',
        offBackground: 'island-sunken',
        offForeground: 'ink-muted',
        buttonColor: 'ink-strong',
        borderColor: 'border',
      },
      SegmentedButton: {
        selectedButtonColor: 'chip',
        selectedStartBorderColor: 'border',
        selectedEndBorderColor: 'border',
        focusedSelectedButtonColor: 'accent-selection',
      },
      TextField: { background: 'island-sunken', foreground: 'ink-strong', caretForeground: 'ink' },
      TextArea: { background: 'island-sunken', foreground: 'ink-strong', caretForeground: 'ink' },
      PasswordField: { background: 'island-sunken', foreground: 'ink-strong', caretForeground: 'ink' },
      FormattedTextField: { background: 'island-sunken', foreground: 'ink-strong' },
      SearchFieldWithExtension: { background: 'island-sunken' },
      ComboBox: {
        background: 'island-sunken',
        nonEditableBackground: 'island-sunken',
        disabledBackground: 'frame',
        modifiedItemForeground: 'accent',
        ArrowButton: { background: 'island-sunken', nonEditableBackground: 'island-sunken', iconColor: 'ink-muted', disabledIconColor: 'ink-faint' },
        selectionBackground: 'accent-selection',
      },
      CheckBox: { background: 'frame', foreground: 'ink-strong' },
      RadioButton: { background: 'frame', foreground: 'ink-strong' },
      Label: { foreground: 'ink-strong', disabledForeground: 'ink-faint', infoForeground: 'ink-muted', errorForeground: 'error', warningForeground: 'warning' },
      Link: {
        foreground: 'accent',
        activeForeground: 'accent',
        hoverForeground: 'accent-hover',
        pressedForeground: 'accent-hover',
        visitedForeground: 'accent',
        secondaryForeground: 'ink-muted',
        focusedBorderColor: 'accent',
      },
      Hyperlink: { linkColor: 'accent' },
      Bookmark: {
        Mnemonic: { iconForeground: 'ink-over-accent', iconBackground: 'warning', iconBorderColor: 'warning' },
        MnemonicAssigned: { background: 'warning', foreground: 'ink-over-accent' },
        MnemonicAvailable: { borderColor: 'border' },
        MnemonicCurrent: { background: 'accent' },
        iconBackground: 'warning',
      },
      Review: {
        Branch: { Background: 'chip', 'Background.Hover': 'island-line' },
        ChatItem: { Hover: 'wash-hover' },
        State: { Background: 'chip', Foreground: 'ink-muted' },
      },
      SearchOption: {
        selectedBackground: 'accent-selection',
        selectedHoveredBackground: 'accent-frame-selection',
        selectedPressedBackground: 'accent-frame-selection',
      },
      // Status pills. The platform ships saturated blues and greens here; these
      // follow the palette so a badge is not the loudest thing on screen.
      Badge: {
        blueBackground: 'accent',
        blueForeground: 'ink-over-accent',
        blueSecondaryBackground: mixDown(ctx, u.accent),
        blueSecondaryForeground: 'accent',
        greenBackground: 'success',
        greenForeground: 'ink-over-accent',
        greenOutlineBorderColor: 'success',
        greenOutlineForeground: 'success',
        greenSecondaryBackground: mixDown(ctx, u.success),
        greenSecondaryForeground: 'success',
        graySecondaryBackground: 'chip',
        graySecondaryForeground: 'ink-muted',
        purpleSecondaryBackground: mixDown(ctx, s.number),
        purpleSecondaryForeground: s.number,
        disabledBackground: 'chip',
        disabledForeground: 'ink-faint',
      },
      ActionButton: { hoverBackground: 'wash-hover', pressedBackground: 'wash-pressed', hoverBorderColor: 'wash-none', pressedBorderColor: 'wash-none' },
      ProgressBar: {
        progressColor: 'accent',
        indeterminateStartColor: 'accent',
        indeterminateEndColor: 'accent-selection',
        trackColor: 'island-line',
        failedColor: 'error',
        passedColor: 'success',
        progressCounterBackground: 'accent',
        progressCounterForeground: 'ink-over-accent',
      },
      Slider: { background: 'frame', trackColor: 'island-line', buttonColor: 'accent', buttonBorderColor: 'accent', tickColor: 'ink-faint', foreground: 'ink-strong' },
      Counter: { background: 'accent', foreground: 'ink-over-accent' },
      Tag: { background: 'chip' },
      Shortcut: { borderColor: 'border', foreground: 'ink-muted' },
      DragAndDrop: { borderColor: 'accent', areaBackground: 'accent-selection-soft' },
      SpeedSearch: { background: 'popup', foreground: 'ink-strong', borderColor: 'border', errorForeground: 'error' },

      /* --------------------------------------------------- scroll bars */
      ScrollBar: {
        trackColor: 'wash-none',
        thumbColor: alpha(u.dim, 0.6),
        thumbBorderColor: alpha(u.dim, 0.6),
        hoverTrackColor: 'wash-none',
        hoverThumbColor: alpha(u.dim, 0.85),
        hoverThumbBorderColor: alpha(u.dim, 0.85),
        Transparent: {
          trackColor: 'wash-none',
          thumbColor: alpha(u.dim, 0.6),
          thumbBorderColor: alpha(u.dim, 0),
          hoverTrackColor: alpha(u.dim, 0.1),
          hoverThumbColor: alpha(u.dim, 0.85),
          hoverThumbBorderColor: alpha(u.dim, 0.85),
        },
        Mac: {
          trackColor: 'wash-none',
          thumbColor: alpha(u.dim, 0.6),
          hoverThumbColor: alpha(u.dim, 0.85),
        },
      },

      /* ------------------------------------------------ notifications */
      Notification: {
        background: 'popup',
        foreground: 'ink-strong',
        borderColor: 'border',
        errorBackground: mixDown(ctx, u.error),
        errorForeground: 'ink-strong',
        errorBorderColor: 'error',
        ToolWindow: {
          informativeBackground: mixDown(ctx, u.accent),
          informativeBorderColor: 'accent',
          warningBackground: mixDown(ctx, u.warning),
          warningBorderColor: 'warning',
          errorBackground: mixDown(ctx, u.error),
          errorBorderColor: 'error',
          informativeForeground: 'ink-strong',
          warningForeground: 'ink-strong',
          errorForeground: 'ink-strong',
        },
        Button: { background: 'button-face', foreground: 'button-ink', borderColor: 'border' },
        MoreButton: { background: 'popup', foreground: 'ink-muted', innerBorderColor: 'border' },
        linkForeground: 'accent',
        iconHoverBackground: 'wash-hover',
        WelcomeScreen: { separatorColor: 'border' },
        Shadow: Object.fromEntries(
          ['top', 'bottom', 'left', 'right', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight']
            .flatMap((side) => [[`${side}0Color`, 'wash-none'], [`${side}1Color`, 'wash-none']])
        ),
      },
      NotificationsToolwindow: { newNotification: { background: 'popup', hoverBackground: 'wash-hover' } },
      Banner: {
        infoBackground: mixDown(ctx, u.accent),
        infoBorderColor: 'accent',
        warningBackground: mixDown(ctx, u.warning),
        warningBorderColor: 'warning',
        errorBackground: mixDown(ctx, u.error),
        errorBorderColor: 'error',
        successBackground: mixDown(ctx, u.success),
        successBorderColor: 'success',
      },

      /* ---------------------------------------------- run / debug / vcs */
      RunWidget: {
        // Only `runningIconColor` is drawn on the filled pill. The rest sit on the
        // bare toolbar, so pointing them at the over-accent ink paints them in the
        // editor ground -- black icons on a black bar.
        foreground: 'ink-strong',
        iconColor: 'icon-stroke',
        runIconColor: 'success',
        runningBackground: 'success',
        runningIconColor: 'ink-over-accent',
        stopBackground: 'error',
        hoverBackground: 'wash-hover',
        pressedBackground: 'wash-pressed',
      },
      Debugger: {
        EvaluateExpression: { background: 'island-sunken' },
        // The variables pane, matched to the VS Code theme's debugTokenExpression
        // set rather than the platform's orange-on-blue.
        Variables: {
          valueForeground: vs['debugTokenExpression.value'],
          typeForeground: vs['debugTokenExpression.type'],
          changedValueForeground: 'accent',
          modifyingValueForeground: 'accent',
          errorMessageForeground: 'error',
          exceptionForeground: 'error',
          collectingDataForeground: 'ink-faint',
          evaluatingExpressionForeground: 'ink-faint',
        },
      },
      VersionControl: {
        FileHistory: { Commit: { selectedBranchBackground: 'island-line' } },
        Log: { Commit: { currentBranchBackground: 'island-line', unmatchedForeground: 'ink-faint', Reference: { foreground: 'ink-muted' } } },
        RefLabel: { backgroundBase: 'chip', foreground: 'ink-muted' },
        MarkerPopup: { borderColor: 'border' },
        GitLog: {
          headIconColor: g.modified,
          localBranchIconColor: g.untracked,
          remoteBranchIconColor: g.submodule,
          tagIconColor: 'ink-muted',
          otherIconColor: 'ink-muted',
        },
        Merge: { Status: { NoConflicts: { foreground: 'success' } } },
      },
      // Scope colours -- the tint behind a tab or tree row for library files,
      // test sources and the like. They are painted as opaque fills, so an alpha
      // here does not soften them: it drops the alpha and lands the full ink on
      // the tab. Pre-mix onto the editor ground instead, the way the bundled
      // themes state them (Islands Dark ships #291F1C for Yellow, not #E5C07B).
      FileColor: {
        Yellow: scope(ctx, u.warning),
        Green: scope(ctx, u.success),
        Orange: scope(ctx, s.parameter || u.warning),
        Rose: scope(ctx, u.error),
        Violet: scope(ctx, s.number),
        Blue: scope(ctx, u.accent),
        Gray: scope(ctx, u.dim, 2),
      },

      /* ------------------------------------------------- welcome screen */
      WelcomeScreen: {
        background: 'frame',
        borderColor: 'border',
        separatorColor: 'border',
        Details: { background: 'island' },
        Projects: { background: 'island', selectionBackground: 'accent-selection', selectionInactiveBackground: 'island-line', actions: { background: 'island' } },
        SidePanel: { background: 'frame' },
        Banner: { background: 'popup' },
      },
      Plugins: {
        background: 'island',
        SectionHeader: { background: 'frame', foreground: 'ink-muted' },
        SearchField: { background: 'island-sunken' },
        Button: {
          installBackground: 'button-face',
          installForeground: 'success',
          installBorderColor: 'success',
          installFillBackground: 'success',
          installFillForeground: 'ink-over-accent',
          updateBackground: 'accent',
          updateForeground: 'ink-over-accent',
          updateBorderColor: 'accent',
        },
        tagBackground: 'chip',
        tagForeground: 'ink-muted',
        eapTagBackground: mixDown(ctx, u.warning),
        paidTagBackground: mixDown(ctx, u.accent),
        trialTagBackground: mixDown(ctx, u.success),
        Tab: { selectedBackground: 'accent-selection', selectedForeground: 'ink-strong', hoverBackground: 'wash-hover' },
        lightSelectionBackground: 'accent-selection-soft',
      },
    };
  }

  /**
   * A status colour laid over the frame at low weight -- the ground for banners
   * and inline notifications. Returns a literal, not a colour name, because
   * every caller wants a different hue.
   */
  function mixDown(ctx, hex) {
    return mix(grounds(ctx).frame, hex, ctx.isDark ? 0.16 : 0.13);
  }

  /** A scope tint: a hue laid over the island at the weight a row can carry. */
  function scope(ctx, hex, weight = 1) {
    return mix(grounds(ctx).island, hex, (ctx.isDark ? 0.14 : 0.1) * weight);
  }

  /* --------------------------------------------------------- theme.json */

  function themeJson(ctx) {
    const { key, v, isDark } = ctx;
    const colors = palette(ctx);

    return {
      name: v.label,
      dark: isDark,
      author: 'Michael Volakis',
      // Everything not named below falls through to the platform's new-UI theme,
      // so the port only has to state what Chalkdraw actually decides.
      parentTheme: isDark ? 'ExperimentalDark' : 'ExperimentalLightWithLightHeader',
      editorScheme: `/themes/chalkdraw-${key}.xml`,
      colors,
      ui: uiBlock(ctx),
      icons: {
        ColorPalette: {
          [PLATFORM_ICON_STROKE[isDark ? 'dark' : 'light']]: 'icon-stroke',
        },
      },
    };
  }

  /* ------------------------------------------------------ colour scheme */

  const bare = (hex) => hex.replace('#', '').toUpperCase();

  function schemeColors(ctx) {
    const { v, isDark, s, u, g } = ctx;
    const gutter = v.editorBackground;
    const { frame } = grounds(ctx);

    return {
      CARET_COLOR: s.identifier,
      CARET_ROW_COLOR: v.currentLine,
      CONSOLE_BACKGROUND_KEY: v.editorBackground,
      GUTTER_BACKGROUND: gutter,
      EDITOR_GUTTER_BACKGROUND: gutter,
      NOTIFICATION_BACKGROUND: mixDown(ctx, u.accent),
      SELECTION_BACKGROUND: mix(v.editorBackground, u.accent, isDark ? 0.3 : 0.24),
      SELECTION_BACKGROUND_INACTIVE: v.currentLine,
      LINE_NUMBERS_COLOR: s.lineNumber,
      LINE_NUMBER_ON_CARET_ROW_COLOR: u.lineNumberActive || u.accent,
      INDENT_GUIDE: u.border,
      SELECTED_INDENT_GUIDE: u.dim,
      VISUAL_INDENT_GUIDE: u.border,
      MATCHED_BRACES_INDENT_GUIDE_COLOR: u.dim,
      STRING_CONTENT_INDENT_GUIDE: mix(v.editorBackground, s.string, 0.4),
      DOC_COMMENT_GUIDE: mix(v.editorBackground, s.comment, 0.5),
      DOC_COMMENT_LINK: s.function,
      RIGHT_MARGIN_COLOR: u.border,
      TEARLINE_COLOR: u.border,
      SELECTED_TEARLINE_COLOR: u.dim,
      METHOD_SEPARATORS_COLOR: u.border,
      DIFF_SEPARATORS_BACKGROUND: u.border,
      DIFF_SEPARATOR_WAVE: u.dim,
      FOLDED_TEXT_BORDER_COLOR: u.dim,
      WHITESPACES: u.dim,
      ANNOTATIONS_COLOR: s.comment,
      ANNOTATIONS_LAST_COMMIT_COLOR: s.identifier,
      DOCUMENTATION_COLOR: frame,
      LOOKUP_COLOR: frame,
      RECENT_LOCATIONS_SELECTION: v.currentLine,
      HINT_BORDER: u.border,
      INFORMATION_HINT: frame,
      QUESTION_HINT: frame,
      ERROR_HINT: mixDown(ctx, u.error),
      PROMOTION_PANE: frame,
      READONLY_FRAGMENT_BACKGROUND: v.currentLine,
      RECURSIVE_CALL_ATTRIBUTES: mix(v.editorBackground, u.warning, 0.2),
      INLINE_REFACTORING_SETTINGS_DEFAULT: alpha(u.dim, 0.55),
      INLINE_REFACTORING_SETTINGS_FOCUSED: alpha(u.dim, 0.75),
      INLINE_REFACTORING_SETTINGS_HOVERED: alpha(u.dim, 0.75),

      /* diff gutter and inline diff */
      ADDED_LINES_COLOR: mix(v.editorBackground, u.success, 0.3),
      MODIFIED_LINES_COLOR: mix(v.editorBackground, u.accent, 0.3),
      DELETED_LINES_COLOR: mix(v.editorBackground, u.error, 0.3),
      WHITESPACES_MODIFIED_LINES_COLOR: mix(v.editorBackground, u.warning, 0.35),
      IGNORED_ADDED_LINES_BORDER_COLOR: mix(v.editorBackground, u.success, 0.45),
      IGNORED_MODIFIED_LINES_BORDER_COLOR: mix(v.editorBackground, u.accent, 0.45),
      IGNORED_DELETED_LINES_BORDER_COLOR: mix(v.editorBackground, u.error, 0.45),

      /* file status colours come from the git scale, not from ui.* */
      FILESTATUS_ADDED: g.added,
      FILESTATUS_COPIED: g.added,
      FILESTATUS_addedOutside: g.added,
      FILESTATUS_MODIFIED: g.modified,
      FILESTATUS_NOT_CHANGED_IMMEDIATE: g.modified,
      FILESTATUS_NOT_CHANGED_RECURSIVE: g.modified,
      FILESTATUS_modifiedOutside: g.modified,
      FILESTATUS_RENAMED: g.submodule,
      FILESTATUS_DELETED: g.deleted,
      FILESTATUS_IDEA_FILESTATUS_DELETED_FROM_FILE_SYSTEM: g.deleted,
      FILESTATUS_UNKNOWN: g.untracked,
      FILESTATUS_MERGED: g.conflicting,
      FILESTATUS_IDEA_FILESTATUS_MERGED_WITH_CONFLICTS: g.conflicting,
      FILESTATUS_IDEA_FILESTATUS_MERGED_WITH_BOTH_CONFLICTS: g.conflicting,
      FILESTATUS_IDEA_FILESTATUS_MERGED_WITH_PROPERTY_CONFLICTS: g.conflicting,
      FILESTATUS_changelistConflict: g.conflicting,
      FILESTATUS_IDEA_FILESTATUS_IGNORED: g.ignored,

      /* the annotate gutter's alternating bands */
      VCS_ANNOTATIONS_COLOR_1: mix(v.editorBackground, u.success, 0.16),
      VCS_ANNOTATIONS_COLOR_2: mix(v.editorBackground, u.warning, 0.16),
      VCS_ANNOTATIONS_COLOR_3: mix(v.editorBackground, u.accent, 0.16),
      VCS_ANNOTATIONS_COLOR_4: mix(v.editorBackground, s.number, 0.16),
      VCS_ANNOTATIONS_COLOR_5: mix(v.editorBackground, u.error, 0.16),

      /* coverage stripes */
      LINE_FULL_COVERAGE: mix(v.editorBackground, u.success, 0.4),
      LINE_PARTIAL_COVERAGE: mix(v.editorBackground, u.warning, 0.4),
      LINE_NONE_COVERAGE: mix(v.editorBackground, u.error, 0.4),

      /* the block terminal's prompt blocks are plain colours, not attributes */
      BLOCK_TERMINAL_BLOCK_BACKGROUND_START: v.currentLine,
      BLOCK_TERMINAL_BLOCK_BACKGROUND_END: v.currentLine,
      BLOCK_TERMINAL_HOVERED_BLOCK_BACKGROUND_START: alpha(u.fgStrong, isDark ? 0.05 : 0.04),
      BLOCK_TERMINAL_HOVERED_BLOCK_BACKGROUND_END: alpha(u.fgStrong, 0.02),
      BLOCK_TERMINAL_SELECTED_BLOCK_BACKGROUND: mix(v.editorBackground, u.accent, 0.2),
      BLOCK_TERMINAL_SELECTED_BLOCK_STROKE_COLOR: u.accent,
      BLOCK_TERMINAL_INACTIVE_SELECTED_BLOCK_BACKGROUND: v.currentLine,
      BLOCK_TERMINAL_INACTIVE_SELECTED_BLOCK_STROKE_COLOR: u.dim,
      BLOCK_TERMINAL_ERROR_BLOCK_STROKE_COLOR: u.error,
      BLOCK_TERMINAL_PROMPT_SEPARATOR_COLOR: u.border,

      'ScrollBar.Mac.thumbColor': alpha(u.dim, 0.6),
      'ScrollBar.Mac.hoverThumbColor': alpha(u.dim, 0.85),
      'ActionButton.hoverBackground': alpha(u.fgStrong, isDark ? 0.07 : 0.06),
      'ActionButton.pressedBackground': alpha(u.fgStrong, isDark ? 0.12 : 0.1),
      'Table.hoverBackground': v.currentLine,
    };
  }

  function schemeAttributes(ctx) {
    const { v, isDark, s, u, g } = ctx;
    const bg = v.editorBackground;
    const out = {};
    const put = (name, props) => { out[name] = props; };

    /* the role table drives the syntax bulk */
    for (const [name, role] of Object.entries(SCHEME_ROLES)) {
      if (role === null) { put(name, {}); continue; }
      const fg = s[role];
      if (!fg) continue;
      put(name, name === 'TEXT' ? { FOREGROUND: fg, BACKGROUND: bg } : { FOREGROUND: fg });
    }

    /* --------------------------------------------- editor state and marks */
    put('MATCHED_BRACE_ATTRIBUTES', { BACKGROUND: mix(bg, u.accent, 0.22), EFFECT_TYPE: 0 });
    put('UNMATCHED_BRACE_ATTRIBUTES', { FOREGROUND: u.error, EFFECT_COLOR: u.error, EFFECT_TYPE: 2 });
    put('IDENTIFIER_UNDER_CARET_ATTRIBUTES', { BACKGROUND: mix(bg, u.accent, 0.18) });
    put('WRITE_IDENTIFIER_UNDER_CARET_ATTRIBUTES', { BACKGROUND: mix(bg, u.warning, 0.2) });
    put('SEARCH_RESULT_ATTRIBUTES', { BACKGROUND: mix(bg, u.accent, 0.34) });
    put('WRITE_SEARCH_RESULT_ATTRIBUTES', { BACKGROUND: mix(bg, u.warning, 0.34) });
    put('TEXT_SEARCH_RESULT_ATTRIBUTES', { BACKGROUND: mix(bg, u.accent, 0.24) });
    put('DEFAULT_HIGHLIGHTED_REFERENCE', { BACKGROUND: mix(bg, u.accent, 0.18) });
    put('FOLDED_TEXT_ATTRIBUTES', { FOREGROUND: s.comment, BACKGROUND: v.currentLine });
    put('INJECTED_LANGUAGE_FRAGMENT', { BACKGROUND: mix(bg, u.accent, 0.07) });
    put('BREAKPOINT_ATTRIBUTES', { BACKGROUND: mix(bg, u.error, 0.24) });
    put('EXECUTIONPOINT_ATTRIBUTES', { BACKGROUND: mix(bg, u.accent, 0.3), FOREGROUND: u.fgStrong });
    put('NOT_TOP_FRAME_ATTRIBUTES', { BACKGROUND: mix(bg, u.success, 0.2) });
    put('BOOKMARKS_ATTRIBUTES', { BACKGROUND: mix(bg, u.warning, 0.16) });
    put('LIVE_TEMPLATE_ATTRIBUTES', { EFFECT_COLOR: u.accent, EFFECT_TYPE: 5 });
    put('LIVE_TEMPLATE_INACTIVE_SEGMENT', { FOREGROUND: s.comment });
    put('TEMPLATE_VARIABLE_ATTRIBUTES', { FOREGROUND: s.parameter || s.identifier });
    put('CODE_LENS_BORDER_COLOR', { FOREGROUND: u.border });
    put('DEFAULT_INVALID_STRING_ESCAPE', { FOREGROUND: s.string, EFFECT_COLOR: u.error, EFFECT_TYPE: 2 });

    /* ------------------------------------------------------- inspections */
    put('ERRORS_ATTRIBUTES', { EFFECT_COLOR: u.error, EFFECT_TYPE: 2, ERROR_STRIPE_COLOR: u.error });
    put('WARNING_ATTRIBUTES', { EFFECT_COLOR: u.warning, EFFECT_TYPE: 2, ERROR_STRIPE_COLOR: u.warning });
    put('INFO_ATTRIBUTES', { EFFECT_COLOR: u.success, EFFECT_TYPE: 2, ERROR_STRIPE_COLOR: u.success });
    put('WEAK_WARNING_ATTRIBUTES', { EFFECT_COLOR: u.warning, EFFECT_TYPE: 2, ERROR_STRIPE_COLOR: u.warning });
    put('TEXT_STYLE_ERROR', { EFFECT_COLOR: u.error, EFFECT_TYPE: 2 });
    put('TEXT_STYLE_WARNING', { EFFECT_COLOR: u.warning, EFFECT_TYPE: 2 });
    put('TYPO', { EFFECT_COLOR: u.success, EFFECT_TYPE: 2 });
    put('BAD_CHARACTER', { FOREGROUND: u.error, EFFECT_COLOR: u.error, EFFECT_TYPE: 2 });
    put('WRONG_REFERENCES_ATTRIBUTES', { FOREGROUND: u.error });
    put('Unresolved reference access', { FOREGROUND: u.error, EFFECT_COLOR: u.error, EFFECT_TYPE: 2 });
    put('RUNTIME_ERROR', { EFFECT_COLOR: u.error, EFFECT_TYPE: 2 });
    put('NOT_USED_ELEMENT_ATTRIBUTES', { FOREGROUND: s.comment });
    put('DEPRECATED_ATTRIBUTES', { EFFECT_COLOR: s.comment, EFFECT_TYPE: 1 });
    put('MARKED_FOR_REMOVAL_ATTRIBUTES', { EFFECT_COLOR: u.error, EFFECT_TYPE: 1 });
    // The VS Code theme has no TODO rule, so a TODO renders as an ordinary
    // comment there. Matching that costs the amber highlight IntelliJ ships by
    // default, which is the trade the theme asks for.
    put('TODO_DEFAULT_ATTRIBUTES', { FOREGROUND: s.comment });
    put('MATCHED_TAG_NAME', { BACKGROUND: mix(bg, u.accent, 0.16) });

    /* ------------------------------------------------------------ inlays */
    put('INLAY_DEFAULT', { FOREGROUND: s.comment, BACKGROUND: alpha(u.dim, 0.25) });
    put('INLAY_TEXT_WITHOUT_BACKGROUND', { FOREGROUND: s.comment });
    put('INLINE_PARAMETER_HINT', { FOREGROUND: s.comment, BACKGROUND: alpha(u.dim, 0.25) });
    put('INLINE_PARAMETER_HINT_CURRENT', { FOREGROUND: u.fgMuted, BACKGROUND: alpha(u.accent, 0.28) });
    put('INLINE_PARAMETER_HINT_HIGHLIGHTED', { FOREGROUND: u.fgMuted, BACKGROUND: alpha(u.accent, 0.2) });
    put('INLINE_SUGGESTION', { FOREGROUND: s.comment });
    put('DEBUGGER_INLINED_VALUES', { FOREGROUND: s.comment });
    put('DEBUGGER_INLINED_VALUES_MODIFIED', { FOREGROUND: u.warning });
    put('DEBUGGER_INLINED_VALUES_EXECUTION_LINE', { FOREGROUND: u.accent });

    /* --------------------------------------------------------- hyperlinks */
    put('HYPERLINK_ATTRIBUTES', { FOREGROUND: s.function, EFFECT_COLOR: s.function, EFFECT_TYPE: 1 });
    put('FOLLOWED_HYPERLINK_ATTRIBUTES', { FOREGROUND: s.function, EFFECT_COLOR: s.function, EFFECT_TYPE: 1 });
    put('INACTIVE_HYPERLINK_ATTRIBUTES', { FOREGROUND: s.comment, EFFECT_COLOR: s.comment, EFFECT_TYPE: 1 });
    put('CTRL_CLICKABLE', { FOREGROUND: s.function, EFFECT_COLOR: s.function, EFFECT_TYPE: 1 });
    put('DOC_TIPS_SHORTCUT', { FOREGROUND: u.fgMuted });

    /* ------------------------------------------------------------ console */
    put('CONSOLE_NORMAL_OUTPUT', { FOREGROUND: s.identifier });
    put('CONSOLE_SYSTEM_OUTPUT', { FOREGROUND: u.fgMuted });
    put('CONSOLE_USER_INPUT', { FOREGROUND: s.string });
    put('CONSOLE_ERROR_OUTPUT', { FOREGROUND: u.error });
    put('CONSOLE_RANGE_TO_EXECUTE', { BACKGROUND: v.currentLine });
    put('LOG_ERROR_OUTPUT', { FOREGROUND: u.error });
    put('LOG_WARNING_OUTPUT', { FOREGROUND: u.warning });
    put('LOG_INFO_OUTPUT', { FOREGROUND: s.identifier });
    put('LOG_VERBOSE_OUTPUT', { FOREGROUND: s.comment });
    put('LOG_DEBUG_OUTPUT', { FOREGROUND: s.type });
    put('LOG_EXPIRED_ENTRY', { FOREGROUND: s.lineNumber });

    /* The ANSI block is the same one the VS Code terminal and the iTerm presets
     * use, so a run window matches an integrated terminal matches iTerm. */
    const ansi = ctx.ansi;
    const SLOTS = {
      BLACK: 'ansiBlack', RED: 'ansiRed', GREEN: 'ansiGreen', YELLOW: 'ansiYellow',
      BLUE: 'ansiBlue', MAGENTA: 'ansiMagenta', CYAN: 'ansiCyan', WHITE: 'ansiWhite',
    };
    // The block terminal carries all sixteen slots; the console highlighter only
    // has bright variants for the six hues, not for black and white.
    const CONSOLE_HAS_BRIGHT = ['RED', 'GREEN', 'YELLOW', 'BLUE', 'MAGENTA', 'CYAN'];
    for (const [slot, key] of Object.entries(SLOTS)) {
      const bright = ansi['ansiBright' + key.slice(4)];
      put(`CONSOLE_${slot}_OUTPUT`, { FOREGROUND: ansi[key] });
      put(`BLOCK_TERMINAL_${slot}`, { FOREGROUND: ansi[key] });
      put(`BLOCK_TERMINAL_${slot}_BRIGHT`, { FOREGROUND: bright });
      if (CONSOLE_HAS_BRIGHT.includes(slot)) {
        put(`CONSOLE_${slot}_BRIGHT_OUTPUT`, { FOREGROUND: bright });
      }
    }
    put('CONSOLE_DARKGRAY_OUTPUT', { FOREGROUND: ansi.ansiBrightBlack });
    put('CONSOLE_GRAY_OUTPUT', { FOREGROUND: u.fgMuted });

    /* the block terminal's own chrome -- prompt blocks, not text */
    put('BLOCK_TERMINAL_DEFAULT_FOREGROUND', { FOREGROUND: s.identifier });
    put('BLOCK_TERMINAL_DEFAULT_BACKGROUND', { BACKGROUND: bg });
    put('BLOCK_TERMINAL_COMMAND', { FOREGROUND: u.fgStrong });
    put('BLOCK_TERMINAL_SEARCH_ENTRY', { BACKGROUND: mix(bg, u.accent, 0.34) });
    put('BLOCK_TERMINAL_CURRENT_SEARCH_ENTRY', { BACKGROUND: mix(bg, u.warning, 0.4) });

    /* ------------------------------------------- attributes the parent colours */
    for (const [name, role] of Object.entries(PARENT_FOREGROUND)) {
      if (s[role]) put(name, { FOREGROUND: s[role] });
    }
    put('CUSTOM_INVALID_STRING_ESCAPE_ATTRIBUTES', {
      FOREGROUND: s.string, EFFECT_COLOR: u.error, EFFECT_TYPE: 2,
    });
    put('TODO_ATTRIBUTES', { FOREGROUND: s.comment });
    for (const [name, role] of Object.entries(PARENT_FOREGROUND_UI)) {
      if (name === 'TODO_ATTRIBUTES') continue;
      put(name, { FOREGROUND: u[role] });
    }
    for (const name of PARENT_PROMPT_KEYS) put(name, { FOREGROUND: s.number });

    for (const [name, spec] of Object.entries(PARENT_BACKGROUND)) {
      const tint = spec.on === null ? bg : mix(bg, s[spec.on] || u[spec.on], spec.t);
      put(name, spec.fg ? { FOREGROUND: s[spec.fg], BACKGROUND: tint } : { BACKGROUND: tint });
    }

    // Coverage stripes carry both a colours entry and an attribute; the attribute
    // is what the editor actually paints in the gutter.
    put('LINE_FULL_COVERAGE', { FOREGROUND: mix(bg, u.success, 0.55) });
    put('LINE_PARTIAL_COVERAGE', { FOREGROUND: mix(bg, u.warning, 0.55) });
    put('LINE_NONE_COVERAGE', { FOREGROUND: mix(bg, u.error, 0.55) });

    COLLAB_HUES.forEach((status, i) => {
      put(`CodeWithMe.USER_${i + 1}_MARKER`, { BACKGROUND: g[status] });
      put(`CodeWithMe.USER_${i + 1}_SELECTION`, { BACKGROUND: mix(bg, g[status], 0.28) });
    });

    /* --------------------------------------------------------- breadcrumbs */
    put('BREADCRUMBS_DEFAULT', { FOREGROUND: u.fgMuted });
    put('BREADCRUMBS_INACTIVE', { FOREGROUND: s.lineNumber });
    put('BREADCRUMBS_HOVERED', { FOREGROUND: u.fgStrong, BACKGROUND: v.currentLine });
    put('BREADCRUMBS_CURRENT', { FOREGROUND: u.fgStrong, BACKGROUND: v.currentLine });

    /* ---------------------------------------------------------- rainbow */
    const rainbow = [s.string, s.keyword, s.type, s.parameter || s.number, s.number];
    rainbow.forEach((c, i) => put(`RAINBOW_COLOR${i}`, { FOREGROUND: c }));

    return out;
  }

  /** EFFECT_TYPE ids the IDE understands, for reference: 0 boxed, 1 underline,
   *  2 wave, 3 strikeout, 4 bold underline, 5 dotted. */
  function colorScheme(ctx) {
    const { v, isDark } = ctx;
    const lines = [];
    lines.push(`<scheme name="${v.label}" version="142" parent_scheme="${isDark ? 'Darcula' : 'Default'}">`);
    lines.push('  <metaInfo>');
    lines.push('    <property name="created">Chalkdraw</property>');
    lines.push('    <property name="originalScheme">Chalkdraw</property>');
    lines.push('  </metaInfo>');

    lines.push('  <colors>');
    for (const [k, val] of Object.entries(schemeColors(ctx))) {
      lines.push(`    <option name="${k}" value="${bare(val)}" />`);
    }
    lines.push('  </colors>');

    lines.push('  <attributes>');
    for (const [name, props] of Object.entries(schemeAttributes(ctx))) {
      const keys = Object.keys(props);
      if (!keys.length) {
        lines.push(`    <option name="${name}">`);
        lines.push('      <value>');
        lines.push('        <option name="FONT_TYPE" value="0" />');
        lines.push('      </value>');
        lines.push('    </option>');
        continue;
      }
      lines.push(`    <option name="${name}">`);
      lines.push('      <value>');
      for (const p of keys) {
        const val = props[p];
        lines.push(`        <option name="${p}" value="${typeof val === 'number' ? val : bare(val)}" />`);
      }
      // tokens.rules.italics / tokens.rules.bold: none anywhere. Overriding a
      // foreground does not clear the parent's FONT_TYPE, so it is stated on
      // every attribute rather than only on the ones known to inherit a slant.
      if (!('FONT_TYPE' in props)) lines.push('        <option name="FONT_TYPE" value="0" />');
      lines.push('      </value>');
      lines.push('    </option>');
    }
    lines.push('  </attributes>');
    lines.push('</scheme>');
    return lines.join('\n') + '\n';
  }

  /* ---------------------------------------------------------- plugin.xml */

  /**
   * `targetUi` is deliberately left off every provider. The IDE's theme list is
   * the union of the NEW, CLASSIC and UNSPECIFIED groups plus ISLANDS when the
   * new UI is on, so an unspecified theme is the only way to appear exactly once
   * in every mode. The islands layout is opted into by `Islands: 1` in the ui
   * block instead, which the IDE ignores under the classic UI.
   */
  function pluginXml({ version, variants, sinceBuild, description, changeNotes }) {
    const providers = variants
      .map((k) => `    <themeProvider id="chalkdraw-${k}" path="/themes/chalkdraw-${k}.theme.json"/>`)
      .join('\n');

    return [
      '<idea-plugin>',
      '  <id>com.michaelvolakis.chalkdraw</id>',
      '  <name>Chalkdraw</name>',
      `  <version>${version}</version>`,
      '  <vendor url="https://github.com/mihavo/chalkdraw">Michael Volakis</vendor>',
      `  <idea-version since-build="${sinceBuild}"/>`,
      '  <description><![CDATA[',
      description,
      '  ]]></description>',
      '  <change-notes><![CDATA[',
      changeNotes,
      '  ]]></change-notes>',
      '  <depends>com.intellij.modules.platform</depends>',
      '  <extensions defaultExtensionNs="com.intellij">',
      providers,
      '  </extensions>',
      '</idea-plugin>',
      '',
    ].join('\n');
  }

  /* ------------------------------------------------------------- checks */

  /**
   * The two grounds have to be far enough apart that the card edges read, and
   * the ink has to clear AA on the island. Both are reported, never fixed here.
   */
  function checkJetBrains(ctx) {
    const warnings = [];
    const { v, s, u } = ctx;
    const { island, frame, authored, moved } = grounds(ctx);

    if (moved) {
      const before = Math.abs(lightness(authored) - lightness(island));
      const after = Math.abs(lightness(frame) - lightness(island));
      warnings.push(
        `frame moved ${authored} -> ${frame} for card separation ` +
          `(oklch dL ${before.toFixed(4)} -> ${after.toFixed(4)})`
      );
    }
    const ink = contrast(s.identifier, island);
    if (ink < 4.5) warnings.push(`identifier on the island is ${ink.toFixed(2)}:1, below AA`);
    const frameInk = contrast(u.fgMuted, frame);
    if (frameInk < 3) {
      warnings.push(`muted ink on the frame is ${frameInk.toFixed(2)}:1, below the UI floor`);
    }

    // Anything the parent scheme colours and this one does not is a JetBrains
    // colour showing through in a Chalkdraw editor.
    const covered = new Set(Object.keys(schemeAttributes(ctx)));
    const leaks = parentKeys.filter((k) => !covered.has(k));
    if (leaks.length) {
      warnings.push(
        `${leaks.length} parent-scheme colours not overridden: ${leaks.slice(0, 8).join(', ')}` +
          (leaks.length > 8 ? ', …' : '')
      );
    }
    return warnings;
  }

  /** Exposed so the build can report what the two grounds ended up being. */
  function jetbrainsGrounds(ctx) {
    return grounds(ctx);
  }

  return { themeJson, colorScheme, pluginXml, checkJetBrains, jetbrainsGrounds };
};
