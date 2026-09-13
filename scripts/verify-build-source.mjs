import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceFiles = [];
const skip = new Set(['node_modules', '.git', 'dist', 'android']);
const extensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.css', '.html', '.json']);

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name))) sourceFiles.push(full);
  }
}

walk(path.join(root, 'src'));
walk(path.join(root, 'scripts'));

const homePath = path.join(root, 'src/components/HomePage.tsx');
if (!fs.existsSync(homePath)) throw new Error('[verify] Missing current HomePage source.');
const home = fs.readFileSync(homePath, 'utf8');

const required = ['Paste. Grab. Watch.', 'VidGrab workflow'];
const forbidden = [
  'Colors of Wildlife',
  'DISCOVERY_FEED',
  'Tokyo Sunset Timelapse',
  'Top Trending Mix',
  'Morning Motivation',
  'City Lights Hyperlapse'
];

const missing = required.filter((text) => !home.includes(text));
const stale = [];
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const marker of forbidden) {
    if (text.includes(marker)) stale.push(`${marker} in ${path.relative(root, file)}`);
  }
}

if (missing.length || stale.length) {
  const details = [
    missing.length ? `missing required markers: ${missing.join(', ')}` : '',
    stale.length ? `stale demo content: ${stale.join('; ')}` : '',
  ].filter(Boolean).join('; ');
  throw new Error(`[verify] Refusing to build: ${details}`);
}

console.log('[verify] Current VidGrab source verified: no stale demo content.');
