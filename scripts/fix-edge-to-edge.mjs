import fs from 'node:fs';
import path from 'node:path';

const mainActivity = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'MainActivity.java');
if (!fs.existsSync(mainActivity)) throw new Error('MainActivity.java not found');

const text = fs.readFileSync(mainActivity, 'utf8');

if (!text.includes('VIDGRAB_ANDROID_SAFE_AREA_V7')) {
  throw new Error('MainActivity.java is missing the VIDGRAB_ANDROID_SAFE_AREA_V7 safe-area patch.');
}
if (!text.includes('VIDGRAB_ANDROID_INSETS_V7')) {
  throw new Error('MainActivity.java is missing the VIDGRAB_ANDROID_INSETS_V7 WindowInsets patch.');
}
if (!text.includes('setDecorFitsSystemWindows(false)')) {
  throw new Error('MainActivity.java is missing the V7 edge-to-edge window configuration.');
}

let depth = 0;
let inString = false;
let escaped = false;
let inLineComment = false;
let inBlockComment = false;
for (let i = 0; i < text.length; i += 1) {
  const c = text[i];
  const n = text[i + 1];
  if (inLineComment) { if (c === '\n') inLineComment = false; continue; }
  if (inBlockComment) { if (c === '*' && n === '/') { inBlockComment = false; i += 1; } continue; }
  if (inString) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') inString = false; continue; }
  if (c === '/' && n === '/') { inLineComment = true; i += 1; continue; }
  if (c === '/' && n === '*') { inBlockComment = true; i += 1; continue; }
  if (c === '"') { inString = true; continue; }
  if (c === '{') depth += 1;
  if (c === '}') { depth -= 1; if (depth < 0) throw new Error('Generated MainActivity.java has an extra closing brace.'); }
}
if (inString || inBlockComment || depth !== 0) throw new Error(`Generated MainActivity.java has unbalanced syntax (brace depth: ${depth}).`);

console.log('VidGrab Android V7 safe-area and WindowInsets patch verified successfully.');
