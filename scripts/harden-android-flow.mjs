import fs from 'node:fs';

const appPath = 'src/App.tsx';
const app = fs.readFileSync(appPath, 'utf8');
const pagePatterns = [
  /<HomePage\b[\s\S]*?\/>/,
  /<MusicPage\b[\s\S]*?\/>/,
  /<VideoPage\b[\s\S]*?\/>/,
  /<SupportedPlatformsPage\b[\s\S]*?\/>/,
  /<DownloadResultPage\b[\s\S]*?\n\s*\/>/,
  /<DownloadProgressPage\b[\s\S]*?\n\s*\/>/,
  /<MyFilesPage\b[\s\S]*?\/>/,
  /<HistoryPage\b[\s\S]*?\/>/,
  /<MorePage\s*\/>/
];
let hardenedApp = app;
for (const pattern of pagePatterns) {
  hardenedApp = hardenedApp.replace(pattern, (match) => {
    if (match.includes('vidgrab-screen-shell')) return match;
    return `<div className="vidgrab-screen-shell">${match}</div>`;
  });
}
fs.writeFileSync(appPath, hardenedApp);

const browserPath = 'src/components/InAppBrowser.tsx';
let browser = fs.readFileSync(browserPath, 'utf8');
// Search must never silently replace real zero-result searches with unrelated demo videos.
browser = browser.replace(
  'setYtSearchResults(results.length > 0 ? results : INITIAL_YT_VIDEOS);',
  'setYtSearchResults(results);'
);
browser = browser.replace(
  'setYtSearchResults(INITIAL_YT_VIDEOS);\n            setYtSearchLoading(false);',
  'setYtSearchResults([]);\n            setYtSearchLoading(false);'
);
browser = browser.replace(
  'const [ytSearchResults, setYtSearchResults] = useState<YouTubeVideoItem[]>([]);',
  'const [ytSearchResults, setYtSearchResults] = useState<YouTubeVideoItem[]>([]);'
);
fs.writeFileSync(browserPath, browser);

const cssPath = 'src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.vidgrab-screen-shell')) {
  css += `\n\n/* Final Android shell hardening: page content never inherits a desktop width,\n   never creates horizontal overflow, and browser/screens share one coordinate system. */\n.vidgrab-screen-shell {\n  width: 100%;\n  min-width: 0;\n  max-width: 100%;\n  overflow-x: clip;\n}\n\n.vidgrab-app-main {\n  width: 100%;\n  min-width: 0;\n  max-width: 100%;\n  overflow-x: clip;\n}\n\n@media (max-width: 767px) {\n  .vidgrab-screen-shell {\n    width: 100%;\n    max-width: 100%;\n    min-height: 0;\n    margin: 0;\n    padding: 0;\n    overflow-x: clip;\n  }\n\n  .vidgrab-app-main {\n    min-height: calc(100dvh - 56px);\n    padding-bottom: calc(72px + env(safe-area-inset-bottom));\n  }\n\n  .vidgrab-browser-safe {\n    width: 100%;\n    max-width: 100%;\n    min-height: calc(100dvh - 56px);\n    overflow-x: clip;\n    padding-bottom: calc(72px + env(safe-area-inset-bottom));\n  }\n\n  .vidgrab-app-main input,\n  .vidgrab-app-main textarea,\n  .vidgrab-app-main select,\n  .vidgrab-browser-safe input,\n  .vidgrab-browser-safe textarea,\n  .vidgrab-browser-safe select {\n    font-size: 16px;\n  }\n}\n`;
  fs.writeFileSync(cssPath, css);
}
