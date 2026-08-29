#!/usr/bin/env node
'use strict';

/**
 * Try a new dark identifier ink, locally.
 *
 *   npm run ink -- '#abc6cf'          set the ink, rebuild, package, install
 *   npm run ink -- '#abc6cf' --dry    show what would change, touch nothing
 *   npm run ink -- --show             report the current ink and its metrics
 *   npm run ink -- --revert           discard local edits, restore last commit
 *
 * Sets syntax.dark.identifier and syntax.dark.field, recomputes the derived
 * punctuation and line number, regenerates themes/*.json and the Neovim
 * palette, then packages and installs the .vsix.
 *
 * Never commits. Revert with --revert or `git checkout -- src/chalkdraw-tokens.json`.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TOKENS = path.join(ROOT, 'src', 'chalkdraw-tokens.json');
const BUILD = path.join(ROOT, 'src', 'build.js');

/* ------------------------------------------------------------------ colour */

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
const hex = (r) =>
  '#' + r.map((v) => Math.round(v).toString(16).padStart(2, '0').toUpperCase()).join('');

const lum = (h) => {
  const c = rgb(h).map((x) => {
    const n = x / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hue = (h) => {
  const [r, g, b] = rgb(h).map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const d = mx - Math.min(r, g, b);
  if (!d) return null;
  let H = mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  return Math.round((H + 360) % 360);
};
const hueTxt = (h) => (hue(h) === null ? 'neutral' : `${hue(h)}deg`);

/**
 * Read the derivation factors from build.js so this script cannot drift from
 * the build. Duplicating the numbers here is exactly the bug it would hide.
 */
function factors() {
  const src = fs.readFileSync(BUILD, 'utf8');
  const m = src.match(/const INK_DERIVATION = \{([^}]*)\}/);
  if (!m) throw new Error('could not find INK_DERIVATION in src/build.js');
  const out = {};
  for (const [, k, v] of m[1].matchAll(/(\w+)\s*:\s*([\d.]+)/g)) out[k] = Number(v);
  return out;
}

/* ------------------------------------------------------------------ report */

function report(tokens) {
  const d = tokens.syntax.dark;
  const bg = tokens.variants.deep.editorBackground;
  const bgFlat = tokens.variants.flat.editorBackground;
  const ink = d.identifier;

  console.log(`\n  ink          ${ink}   hue ${hueTxt(ink)}`);
  console.log(`  punctuation  ${d.punctuation}   line number ${d.lineNumber}`);
  console.log(`\n  contrast vs Deep ${bg}   ${contrast(ink, bg).toFixed(2)}:1`);
  console.log(`  contrast vs Flat ${bgFlat}   ${contrast(ink, bgFlat).toFixed(2)}:1`);

  console.log('\n  separation from the accents (low = reads as the same weight)');
  for (const role of ['keyword', 'type', 'function', 'string', 'number', 'comment']) {
    const c = contrast(ink, d[role]);
    const warn = c < 1.25 ? '  <- very close' : '';
    console.log(`    ${role.padEnd(10)} ${d[role]}  ${c.toFixed(2)}:1  hue ${hueTxt(d[role]).padEnd(8)}${warn}`);
  }

  // The design rule the ink most often breaks.
  const cPunct = contrast(d.punctuation, bg);
  const cComment = contrast(d.comment, bg);
  console.log(
    `\n  comment ${cComment.toFixed(2)}:1 vs punctuation ${cPunct.toFixed(2)}:1  ` +
      (cComment > cPunct ? '(rule holds)' : '(rule inverted: punctuation is louder than comments)')
  );
}

/* -------------------------------------------------------------------- main */

const args = process.argv.slice(2);
const tokens = JSON.parse(fs.readFileSync(TOKENS, 'utf8'));

/** Rebuild, repackage and reinstall, so the editor matches the token file. */
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

if (args.includes('--revert')) {
  // Restores the last committed ink, which is not necessarily the one you were
  // last trying -- uncommitted experiments are discarded by design.
  const wasUncommitted = tokens.syntax.dark.identifier;
  execFileSync('git', ['checkout', '--', 'src/chalkdraw-tokens.json'], { cwd: ROOT, stdio: 'inherit' });
  const restored = JSON.parse(fs.readFileSync(TOKENS, 'utf8'));
  const vsix = rebuildAndInstall();
  console.log(`\n  discarded ${wasUncommitted}, restored the committed ink ${restored.syntax.dark.identifier}`);
  console.log(`  installed ${vsix} — reload VS Code\n`);
  process.exit(0);
}

if (args.includes('--show') || args.length === 0) {
  report(tokens);
  console.log("\n  usage: npm run ink -- '#abc6cf' [--dry]\n");
  process.exit(0);
}

const raw = args.find((a) => !a.startsWith('--'));
const ink = ('#' + String(raw).replace(/^#/, '')).toUpperCase();
if (!/^#[0-9A-F]{6}$/.test(ink)) {
  console.error(`  '${raw}' is not a 6-digit hex colour (expected e.g. #ABC6CF)`);
  process.exit(1);
}

const dry = args.includes('--dry');
const before = tokens.syntax.dark.identifier;
const f = factors();

tokens.syntax.dark.identifier = ink;
tokens.syntax.dark.field = ink; // the build requires these to stay equal
for (const [role, factor] of Object.entries(f)) {
  tokens.syntax.dark[role] = hex(rgb(ink).map((v) => v * factor));
}

console.log(`\n  ${before}  ->  ${ink}`);
for (const [role, factor] of Object.entries(f)) {
  console.log(`  ${role} (x ${factor})  ->  ${tokens.syntax.dark[role]}`);
}

if (dry) {
  report(tokens);
  console.log('\n  --dry: nothing written\n');
  process.exit(0);
}

fs.writeFileSync(TOKENS, JSON.stringify(tokens, null, 2) + '\n');

const vsix = rebuildAndInstall();

report(tokens);
console.log(`\n  installed ${vsix} — reload VS Code to see it`);
console.log('  revert with:  npm run ink -- --revert\n');
