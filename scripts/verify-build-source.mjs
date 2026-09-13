import fs from 'node:fs';

const homePath = 'src/components/HomePage.tsx';
if (!fs.existsSync(homePath)) {
  throw new Error(`[verify] Missing ${homePath}. Refusing to build a stale/incomplete source tree.`);
}

const home = fs.readFileSync(homePath, 'utf8');
const required = ['Paste. Grab. Watch.', 'VidGrab workflow'];
const forbidden = ['Colors of Wildlife', 'DISCOVERY_FEED'];

const missing = required.filter((text) => !home.includes(text));
const stale = forbidden.filter((text) => home.includes(text));

if (missing.length || stale.length) {
  const details = [
    missing.length ? `missing required markers: ${missing.join(', ')}` : '',
    stale.length ? `found stale markers: ${stale.join(', ')}` : '',
  ].filter(Boolean).join('; ');
  throw new Error(`[verify] Refusing to build: ${details}. Codemagic must build the latest VidGrab main source.`);
}

console.log('[verify] VidGrab source is the current HomePage; stale demo UI is not present.');
