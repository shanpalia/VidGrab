import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(process.cwd(), 'dist');
if (!fs.existsSync(dist)) throw new Error('[verify-output] dist directory is missing.');

const forbidden = [
  'Colors of Wildlife',
  'DISCOVERY_FEED',
  'Tokyo Sunset Timelapse',
  'Top Trending Mix',
  'Morning Motivation',
  'City Lights Hyperlapse'
];
const required = ['Paste. Grab. Watch.', 'VidGrab workflow'];

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|css|html)$/.test(entry.name)) files.push(full);
  }
}
walk(dist);

const texts = files.map((file) => ({ file, text: fs.readFileSync(file, 'utf8') }));
const stale = [];
for (const { file, text } of texts) {
  for (const marker of forbidden) {
    if (text.includes(marker)) stale.push(`${marker} in ${path.relative(process.cwd(), file)}`);
  }
}
const all = texts.map((x) => x.text).join('\n');
const missing = required.filter((marker) => !all.includes(marker));

if (stale.length || missing.length) {
  throw new Error(`[verify-output] Refusing Android packaging: ${stale.length ? `stale demo content found (${stale.join('; ')})` : ''}${missing.length ? ` missing required UI (${missing.join(', ')})` : ''}`);
}

console.log('[verify-output] Final Vite bundle contains current VidGrab UI and no stale demo content.');
