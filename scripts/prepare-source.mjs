import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function replaceRegex(file, pattern, replace, label) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return;
  const text = fs.readFileSync(full, 'utf8');
  const after = text.replace(pattern, replace);
  if (after !== text) {
    fs.writeFileSync(full, after);
    console.log(`[prepare-source] patched ${label}`);
  }
}

// The production build must never render demo videos when a real search fails.
replaceRegex(
  'src/components/InAppBrowser.tsx',
  /setYtSearchResults\(results\.length > 0 \? results : INITIAL_YT_VIDEOS\);/g,
  'setYtSearchResults(results);',
  'real YouTube search results'
);
replaceRegex(
  'src/components/InAppBrowser.tsx',
  /setYtSearchResults\(INITIAL_YT_VIDEOS\);/g,
  'setYtSearchResults([]);',
  'empty YouTube search on failure'
);

console.log('[prepare-source] source preparation complete');
