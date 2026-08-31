#!/usr/bin/env node
'use strict';

/**
 * Try a new Flat editor background, locally.
 *
 *   npm run flat -- '#1e1f22'                    set it, rebuild, package, install
 *   npm run flat -- '#1e1f22' --dry              show what would change, touch nothing
 *   npm run flat -- '#1e1f22' --chrome '#181818' pin the panel colour by hand
 *   npm run flat -- --show                       report the current shells
 *   npm run flat -- --revert                     discard local edits, restore last commit
 *
 * Flat's three shells are one family, not three independent choices: the panels
 * sit a fixed step below the editor and the active line a fixed step above it.
 * Given a new editor background this derives the other two by holding those
 * steps, so the variant keeps its character instead of needing all three
 * re-picked by eye.
 *
 * Chalkdraw Flat only. Deep inverts the relationship (its editor is the darker
 * surface) and Cool carries a third shell for the status bar, so neither can use
 * these offsets.
 *
 * Never commits. Revert with --revert or `git checkout -- src/chalkdraw-tokens.json`.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { contrast, oklch, oklchToHex } = require('./color');

const ROOT = path.join(__dirname, '..');
const TOKENS = path.join(ROOT, 'src', 'chalkdraw-tokens.json');

/**
 * Measured from the shipping Flat palette (#1E1F22 / #181818 / #2A2C31).
 *
 * Lightness moves by a fixed amount rather than a ratio -- the steps have to
 * stay visible at any editor lightness, and a ratio collapses them as the
 * background approaches black. Chroma is a multiple of the editor's, so a
 * tinted editor produces tinted shells: the panels are pinned at 0 (they are
 * neutral grey by design) and the active line runs slightly warmer in chroma
 * than the editor it sits on.
 *
 * Feeding today's editor colour back through this reproduces the other two
 * exactly, which is the property that makes it safe to re-derive them.
 */
const SHELLS = {
  chromeBackground: { dL: -0.0304, chroma: 0.0 },
  currentLine: { dL: +0.0536, chroma: 1.611 },
};

/* ------------------------------------------------------------------ report */

function report(v) {
  const e = oklch(v.editorBackground);
  const rows = [
    ['editor', v.editorBackground],
    ['panels', v.chromeBackground],
    ['active line', v.currentLine],
  ];
  for (const [label, hex] of rows) {
    const o = oklch(hex);
    console.log(
      `  ${label.padEnd(12)} ${hex}   L ${o.L.toFixed(4)}  C ${o.C.toFixed(4)}` +
        (label === 'editor' ? '' : `   dL ${(o.L - e.L >= 0 ? '+' : '') + (o.L - e.L).toFixed(4)}`)
    );
  }
  // The two separations that decide whether the chrome reads as layered at all.
  console.log(
    `\n  panels vs editor      ${contrast(v.chromeBackground, v.editorBackground).toFixed(3)}:1` +
      `\n  active line vs editor ${contrast(v.currentLine, v.editorBackground).toFixed(3)}:1`
  );
}

/* -------------------------------------------------------------------- main */

const args = process.argv.slice(2);
const tokens = JSON.parse(fs.readFileSync(TOKENS, 'utf8'));

function rebuildAndInstall() {
  const run = (cmd, a, opts = {}) => execFileSync(cmd, a, { cwd: ROOT, stdio: 'inherit', ...opts });
  run('npm', ['run', 'build']);
  for (const old of fs.readdirSync(ROOT).filter((n) => n.endsWith('.vsix'))) {
    fs.unlinkSync(path.join(ROOT, old));
  }
  run('npx', ['--yes', '@vscode/vsce', 'package']);
  const vsix = fs.readdirSync(ROOT).find((n) => n.endsWith('.vsix'));
  try {
    execFileSync('code', ['--uninstall-extension', 'michaelvolakis.chalkdraw'], {
      cwd: ROOT,
      stdio: 'ignore',
    });
  } catch {}
  run('code', ['--install-extension', path.join(ROOT, vsix)]);
  return vsix;
}

const norm = (raw, label) => {
  const v = ('#' + String(raw).replace(/^#/, '')).toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(v)) {
    console.error(`  '${raw}' is not a 6-digit hex colour${label ? ` (${label})` : ''}`);
    process.exit(1);
  }
  return v;
};

if (args.includes('--revert')) {
  const was = tokens.variants.flat.editorBackground;
  execFileSync('git', ['checkout', '--', 'src/chalkdraw-tokens.json'], { cwd: ROOT, stdio: 'inherit' });
  const restored = JSON.parse(fs.readFileSync(TOKENS, 'utf8'));
  const vsix = rebuildAndInstall();
  console.log(`\n  discarded ${was}, restored the committed ${restored.variants.flat.editorBackground}`);
  console.log(`  installed ${vsix} — reload VS Code\n`);
  process.exit(0);
}

if (args.includes('--show') || args.length === 0) {
  console.log('\n  Chalkdraw Flat\n');
  report(tokens.variants.flat);
  console.log("\n  usage: npm run flat -- '#1e1f22' [--chrome '#181818'] [--dry]\n");
  process.exit(0);
}

const dry = args.includes('--dry');
const chromeAt = args.indexOf('--chrome');
const chromePinned = chromeAt === -1 ? null : norm(args[chromeAt + 1], 'for --chrome');
const chromeValueAt = chromeAt === -1 ? -1 : chromeAt + 1;
const positional = args.filter((a, i) => !a.startsWith('--') && i !== chromeValueAt);
if (positional.length === 0) {
  console.error("  no colour given. usage: npm run flat -- '#1e1f22' [--chrome '#181818'] [--dry]");
  process.exit(1);
}

const editor = norm(positional[0], null);
const e = oklch(editor);
const derive = ({ dL, chroma }) => oklchToHex({ L: e.L + dL, C: e.C * chroma, H: e.H });

const next = {
  editorBackground: editor,
  chromeBackground: chromePinned || derive(SHELLS.chromeBackground),
  currentLine: derive(SHELLS.currentLine),
};

const before = tokens.variants.flat;
console.log(`\n  editor       ${before.editorBackground}  ->  ${next.editorBackground}`);
console.log(
  `  panels       ${before.chromeBackground}  ->  ${next.chromeBackground}` +
    (chromePinned ? '   (pinned with --chrome)' : `   (editor ${SHELLS.chromeBackground.dL} in L)`)
);
console.log(
  `  active line  ${before.currentLine}  ->  ${next.currentLine}   (editor +${SHELLS.currentLine.dL} in L)`
);

// A background this light stops reading as a dark theme, and one this dark
// leaves no room below it for the panels.
const l = oklch(editor).L;
if (l > 0.45) console.log('\n  note: that is light for a dark variant (oklch L ' + l.toFixed(3) + ')');
if (l < 0.15) console.log('\n  note: very dark — the panels step below it will be near black');
// The panels are pinned neutral because that is what Flat ships. A visibly
// tinted editor over grey panels reads as a mismatch rather than a family, so
// say so rather than quietly emitting it.
if (!chromePinned && e.C > 0.02) {
  console.log(
    `\n  note: the editor is tinted (C ${e.C.toFixed(3)}) but Flat's panels are neutral by` +
      ` design, so they come out grey. Use --chrome to pin a tinted panel colour.`
  );
}

Object.assign(tokens.variants.flat, next);

if (dry) {
  console.log('');
  report(tokens.variants.flat);
  console.log('\n  --dry: nothing written\n');
  process.exit(0);
}

fs.writeFileSync(TOKENS, JSON.stringify(tokens, null, 2) + '\n');

const vsix = rebuildAndInstall();

console.log('');
report(tokens.variants.flat);
console.log(`\n  installed ${vsix} — reload VS Code to see it`);
console.log('  revert with:  npm run flat -- --revert\n');
