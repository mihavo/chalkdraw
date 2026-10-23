#!/usr/bin/env node
'use strict';

/**
 * Package jetbrains/plugin/ into an installable plugin archive.
 *
 * A JetBrains theme plugin has no code, so there is nothing to compile and no
 * reason to pull in Gradle: the distributable is a zip whose one entry is a jar
 * of resources.
 *
 *   chalkdraw-<version>.zip
 *     Chalkdraw/lib/chalkdraw.jar
 *       META-INF/plugin.xml
 *       themes/chalkdraw-*.theme.json
 *       themes/chalkdraw-*.xml
 *
 * Install it with Settings -> Plugins -> the gear -> Install Plugin from Disk.
 *
 * Run `npm run build` first; this script only packs what the build wrote.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'jetbrains', 'plugin');
const STAGE = path.join(ROOT, 'jetbrains', 'build');

const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const zipName = `chalkdraw-${version}.zip`;
const out = path.join(ROOT, 'jetbrains', zipName);

if (!fs.existsSync(path.join(SRC, 'META-INF', 'plugin.xml'))) {
  console.error('jetbrains/plugin is empty — run `npm run build` first.');
  process.exit(1);
}

const zip = (cwd, args) => execFileSync('zip', ['-q', '-r', '-X', ...args], { cwd, stdio: 'inherit' });

fs.rmSync(STAGE, { recursive: true, force: true });
fs.rmSync(out, { force: true });
fs.mkdirSync(path.join(STAGE, 'Chalkdraw', 'lib'), { recursive: true });

// A jar is a zip; the IDE reads the theme and scheme straight out of it.
zip(SRC, [path.join(STAGE, 'Chalkdraw', 'lib', 'chalkdraw.jar'), 'META-INF', 'themes']);
zip(STAGE, [out, 'Chalkdraw']);
fs.rmSync(STAGE, { recursive: true, force: true });

const kb = (fs.statSync(out).size / 1024).toFixed(1);
console.log(`✓ ${path.relative(ROOT, out)} — ${kb} kB`);
