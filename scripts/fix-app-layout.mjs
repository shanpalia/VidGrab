import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function patch(file, transform, label) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) throw new Error(`[layout] missing ${file}`);
  const before = fs.readFileSync(full, 'utf8');
  const after = transform(before);
  if (after === before) {
    console.log(`[layout] ${label}: already applied`);
    return;
  }
  fs.writeFileSync(full, after);
  console.log(`[layout] ${label}: applied`);
}

// The Home page already has a compact native Android header. Remove the old
// second, oversized web-page-style brand hero so the address bar and shortcuts
// start near the top like a normal downloader app.
patch('src/components/HomePage.tsx', (text) => text.replace(
  /\n      \{\/\* Top Header Section with Original VidGrab Wordmark & Shan Palia Credit \*\/\}[\s\S]*?\n      \{\/\* TOP ADDRESS BAR/s,
  '\n      {/* TOP ADDRESS BAR',
), 'remove duplicate Home hero');

// Give every in-app browser viewport the same mobile safe-area treatment and
// prevent platform pages from visually starting underneath the camera/status bar.
patch('src/components/InAppBrowser.tsx', (text) => text.replace(
  /return \(\n\s*<div className="([^"]*h-\[calc\(100vh-4rem\)\][^"]*)">/,
  (match, classes) => `return (\n    <div className="${classes} vidgrab-browser-safe">`,
), 'safe-area browser viewport');

// Platform browser chrome: keep the address/navigation controls visible below
// the system area and keep the page viewport above the bottom gesture area.
patch('src/index.css', (text) => {
  if (text.includes('.vidgrab-browser-safe')) return text;
  return `${text}\n\n@media (max-width: 767px) {\n  .vidgrab-browser-safe {\n    min-height: calc(100dvh - 1px);\n    padding-bottom: max(12px, env(safe-area-inset-bottom));\n  }\n}\n`;
}, 'browser safe-area CSS');

console.log('[layout] app layout preparation complete');
