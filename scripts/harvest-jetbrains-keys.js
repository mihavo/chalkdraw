#!/usr/bin/env node
'use strict';

/**
 * Regenerate src/jetbrains-parent-keys.json from an installed JetBrains IDE.
 *
 *   node scripts/harvest-jetbrains-keys.js [/path/to/IDE.app]
 *
 * A Chalkdraw editor scheme names Darcula (dark) or Default (light) as its
 * parent, so every attribute those schemes colour and Chalkdraw does not shows
 * through in a JetBrains colour. Two places define them:
 *
 *   DefaultColorSchemesManager.xml  the Default and Darcula schemes themselves
 *   <additionalTextAttributes>      per-plugin add-ons registered against a
 *                                   scheme by name -- this is where the Java
 *                                   plugin puts INSTANCE_FIELD_ATTRIBUTES, and
 *                                   they are easy to miss because they live in
 *                                   <list> files rather than <scheme> files
 *
 * The result is a flat list of names. src/jetbrains.js has to cover all of them;
 * the build reports any it does not.
 *
 * Requires `unzip` on the path. Nothing else in the build depends on an IDE
 * being installed -- this script is run by hand when the platform moves.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const APP = process.argv[2] || path.join(os.homedir(), 'Applications', 'IntelliJ IDEA.app');
const CONTENTS = path.join(APP, 'Contents');
const OUT = path.join(__dirname, '..', 'src', 'jetbrains-parent-keys.json');

if (!fs.existsSync(CONTENTS)) {
  console.error(`No IDE at ${APP}. Pass the path to one as the first argument.`);
  process.exit(1);
}

const jars = [];
const collect = (dir, depth) => {
  if (depth < 0 || !fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collect(p, depth - 1);
    else if (e.name.endsWith('.jar')) jars.push(p);
  }
};
collect(path.join(CONTENTS, 'lib'), 1);
collect(path.join(CONTENTS, 'plugins'), 3);

const read = (jar, entry) => {
  try {
    return execFileSync('unzip', ['-p', jar, entry], {
      maxBuffer: 1 << 26,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString('utf8');
  } catch {
    return null;
  }
};
const list = (jar) => {
  try {
    return execFileSync('unzip', ['-Z1', jar], {
      maxBuffer: 1 << 26,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString('utf8')
      .split('\n');
  } catch {
    return [];
  }
};

/**
 * Names of every <option> that sets a colour, a font style or an effect.
 *
 * FONT_TYPE matters as much as FOREGROUND here. Darcula gives
 * STATIC_METHOD_ATTRIBUTES italics and no colour at all, so a colour-only sweep
 * walks straight past it and every static call comes out italic in a theme whose
 * first rule is that nothing is.
 */
function colouredOptions(xml) {
  const names = new Set();
  // <option name="X"> ... <value> ... <option name="FOREGROUND" .../> ... </option>
  //
  // The negative lookahead skips self-closing options. Without it the scan runs
  // from a <colors> entry into the next attribute's body and picks up keys that
  // are colours, not attributes.
  const re = /<option\b(?![^>]*\/>)[^>]*\bname="([^"]+)"[^>]*>([\s\S]*?)<\/option>/g;
  let m;
  while ((m = re.exec(xml))) {
    const [, name, body] = m;
    if (/name="(FOREGROUND|BACKGROUND)"\s+value="[^"]+"/.test(body)) names.add(name);
    // FONT_TYPE 0 is plain text and inherits harmlessly; 1/2/3 are bold, italic
    // and both, and each has to be cleared.
    if (/name="FONT_TYPE"\s+value="[1-3]"/.test(body)) names.add(name);
    if (/name="EFFECT_TYPE"\s+value="[1-9]"/.test(body)) names.add(name);
  }
  return names;
}

const keys = new Set();
let ideBuild = 'unknown';
try {
  ideBuild = fs.readFileSync(path.join(CONTENTS, 'Resources', 'build.txt'), 'utf8').trim().slice(0, 20);
} catch { /* the IDE may not ship build.txt; the list is still valid */ }

/* the two bundled schemes */
for (const jar of jars) {
  const xml = read(jar, 'DefaultColorSchemesManager.xml');
  if (!xml) continue;
  for (const n of colouredOptions(xml)) keys.add(n);
  break;
}

/* every additionalTextAttributes file registered against Default or Darcula */
const wanted = new Set();
for (const jar of jars) {
  for (const entry of list(jar)) {
    if (!entry.endsWith('.xml')) continue;
    const xml = read(jar, entry);
    if (!xml || !xml.includes('<additionalTextAttributes')) continue;
    const re = /<additionalTextAttributes\b[^>]*>/g;
    let m;
    while ((m = re.exec(xml))) {
      const scheme = /scheme="([^"]+)"/.exec(m[0]);
      const file = /file="([^"]+)"/.exec(m[0]);
      if (file && scheme && (scheme[1] === 'Darcula' || scheme[1] === 'Default')) {
        wanted.add(path.basename(file[1]));
      }
    }
  }
}
for (const jar of jars) {
  for (const entry of list(jar)) {
    if (!wanted.has(path.basename(entry))) continue;
    const xml = read(jar, entry);
    if (xml) for (const n of colouredOptions(xml)) keys.add(n);
  }
}

/* FOREGROUND and BACKGROUND are option names themselves; drop the noise */
for (const drop of ['FOREGROUND', 'BACKGROUND', 'EFFECT_COLOR', 'ERROR_STRIPE_COLOR', 'FONT_TYPE', 'EFFECT_TYPE']) {
  keys.delete(drop);
}

fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      $comment:
        'Attributes the bundled Default/Darcula schemes (and every additionalTextAttributes file registered against them) give a colour, a font style or an effect to. A Chalkdraw scheme that does not override one of these inherits a JetBrains colour. Regenerate with scripts/harvest-jetbrains-keys.js.',
      ideBuild,
      keys: [...keys].sort(),
    },
    null,
    1
  ) + '\n'
);
console.log(`✓ ${path.relative(path.join(__dirname, '..'), OUT)} — ${keys.size} keys from ${ideBuild}`);
