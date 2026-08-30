#!/usr/bin/env node
'use strict';

/**
 * Try a new string ink, locally.
 *
 *   npm run string -- '#65a173'                set it everywhere, rebuild, install
 *   npm run string -- '#65a173' --dry          show what would change, touch nothing
 *   npm run string -- '#65a173' --paper '#1e753c'   pin Paper by hand
 *   npm run string -- --show                   report the current strings and metrics
 *   npm run string -- --revert                 discard local edits, restore last commit
 *
 * Sets syntax.dark.string, shared by Deep, Flat and Cool. Paper is a light
 * ground, so a dark-tuned string ink usually lands far below the 4.5:1 AA bar
 * there; rather than carry a colour nobody can read, Paper gets a hue-matched
 * equivalent re-solved for lightness, unless --paper pins one explicitly.
 *
 * Import paths are untouched: every palette declares its own importPath, so the
 * quoted module path in `import ("bytes")` keeps its colour when strings move.
 *
 * Never commits. Revert with --revert or `git checkout -- src/chalkdraw-tokens.json`.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { contrast, oklch, forGround, hueGap } = require('./color');

const ROOT = path.join(__dirname, '..');
const TOKENS = path.join(ROOT, 'src', 'chalkdraw-tokens.json');

/** Paper's other accents sit in this band; the derived string ink joins them. */
const PAPER_TARGET_CONTRAST = 4.6;

const PALETTE_OF = { deep: 'dark', flat: 'dark', paper: 'light', cool: 'dark' };
const NEIGHBOURS = ['importPath', 'number', 'type', 'identifier', 'keyword', 'comment'];

function report(tokens) {
  for (const [variant, pk] of Object.entries(PALETTE_OF)) {
    const s = tokens.syntax[pk];
    const bg = tokens.variants[variant].editorBackground;
    const c = contrast(s.string, bg);
    const flag = c < 4.5 ? '  <- below AA' : '';
    console.log(
      `\n  ${variant.padEnd(6)} string ${s.string}  on ${bg}  ${c.toFixed(2)}:1${flag}` +
        `   imports ${s.importPath}`
    );
    // A string ink that reads as one of its neighbours is the failure that only
    // shows up in real code, so the separations are printed rather than assumed.
    // Weight alone is not the test: on Paper every accent sits in the same 4.6:1
    // band by design, so they all look identical by ratio and are told apart by
    // hue. A role is only confusable when it is close on both axes.
    const close = NEIGHBOURS.map((role) => [role, contrast(s.string, s[role]), hueGap(s.string, s[role])])
      .filter(([, v, dh]) => v < 1.4 && dh < 30)
      .sort((a, b) => a[2] - b[2]);
    for (const [role, v, dh] of close) {
      console.log(
        `         vs ${role.padEnd(11)} ${s[role]}  ${v.toFixed(2)}:1  ${Math.round(dh)}deg apart  <- close`
      );
    }
  }
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
    execFileSync('code', ['--uninstall-extension', 'michaelvolakis.chalkdraw'], { cwd: ROOT, stdio: 'ignore' });
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
  const was = tokens.syntax.dark.string;
  execFileSync('git', ['checkout', '--', 'src/chalkdraw-tokens.json'], { cwd: ROOT, stdio: 'inherit' });
  const restored = JSON.parse(fs.readFileSync(TOKENS, 'utf8'));
  const vsix = rebuildAndInstall();
  console.log(`\n  discarded ${was}, restored the committed string ${restored.syntax.dark.string}`);
  console.log(`  installed ${vsix} — reload VS Code\n`);
  process.exit(0);
}

if (args.includes('--show') || args.length === 0) {
  report(tokens);
  console.log("\n  usage: npm run string -- '#65a173' [--paper '#1e753c'] [--dry]\n");
  process.exit(0);
}

const dry = args.includes('--dry');
const paperAt = args.indexOf('--paper');
const paperPinned = paperAt === -1 ? null : norm(args[paperAt + 1], 'for --paper');
// Everything that is not a flag and not --paper's own value.
const paperValueAt = paperAt === -1 ? -1 : paperAt + 1;
const positional = args.filter((a, i) => !a.startsWith('--') && i !== paperValueAt);
if (positional.length === 0) {
  console.error("  no colour given. usage: npm run string -- '#65a173' [--paper '#1e753c'] [--dry]");
  process.exit(1);
}
const ink = norm(positional[0], null);

const paperBg = tokens.variants.paper.editorBackground;
const paperOk = contrast(ink, paperBg) >= 4.5;
const paperInk = paperPinned || (paperOk ? ink : forGround(ink, paperBg, PAPER_TARGET_CONTRAST));

console.log(`\n  dark/cool  ${tokens.syntax.dark.string}  ->  ${ink}`);
console.log(`  paper      ${tokens.syntax.light.string}  ->  ${paperInk}`);
if (paperPinned) {
  console.log('             (pinned with --paper)');
} else if (!paperOk) {
  console.log(
    `             ${ink} is only ${contrast(ink, paperBg).toFixed(2)}:1 on ${paperBg}, so Paper` +
      ` keeps hue ${Math.round(oklch(ink).H)}deg and re-solves lightness`
  );
}

// Cool shares the dark syntax palette, so one write covers all three dark variants.
tokens.syntax.dark.string = ink;
tokens.syntax.light.string = paperInk;

if (dry) {
  report(tokens);
  console.log('\n  --dry: nothing written\n');
  process.exit(0);
}

fs.writeFileSync(TOKENS, JSON.stringify(tokens, null, 2) + '\n');

const vsix = rebuildAndInstall();

report(tokens);
console.log(`\n  installed ${vsix} — reload VS Code to see it`);
console.log('  revert with:  npm run string -- --revert\n');
