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
browser = browser.replace(
  'setYtSearchResults(results.length > 0 ? results : INITIAL_YT_VIDEOS);',
  'setYtSearchResults(results);'
);
browser = browser.replace(
  'setYtSearchResults(INITIAL_YT_VIDEOS);\n            setYtSearchLoading(false);',
  'setYtSearchResults([]);\n            setYtSearchLoading(false);'
);
fs.writeFileSync(browserPath, browser);

const apiPath = 'src/services/api.ts';
let api = fs.readFileSync(apiPath, 'utf8');
if (!api.includes('VIDGRAB_INVIDIOUS_FALLBACK_V1')) {
  const marker = "    const instances = ['https://pipedapi.kavin.rocks','https://pipedapi.leptons.xyz','https://pipedapi.nosebs.ru','https://pipedapi.adminforge.de','https://api.piped.yt'];";
  const replacement = `    /* VIDGRAB_INVIDIOUS_FALLBACK_V1 */
    const invidiousInstances = ['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com','https://invidious.tiekoetter.com','https://invidious.f5.si'];
    for (const base of invidiousInstances) {
      try {
        const endpoint = base + '/api/v1/search?q=' + encodeURIComponent(q) + '&type=video&region=IN&hl=en-US';
        const res = await fetch(endpoint, { signal: AbortSignal.timeout(7000) });
        if (!res.ok) continue;
        const data = await res.json();
        const results = (Array.isArray(data) ? data : [])
          .filter((item: any) => item?.type === 'video' && item?.videoId)
          .slice(0, 20)
          .map((item: any) => {
            const thumbs = Array.isArray(item.videoThumbnails) ? item.videoThumbnails : [];
            const thumb = thumbs.length ? thumbs[thumbs.length - 1]?.url : '';
            return {
              id: item.videoId,
              title: item.title || 'YouTube Video',
              channel: item.author || 'YouTube',
              views: item.viewCount ? `${item.viewCount} views` : '',
              publishedAt: item.publishedText || '',
              duration: item.lengthSeconds ? String(item.lengthSeconds) : '',
              thumbnail: thumb || ('https://i.ytimg.com/vi/' + item.videoId + '/hqdefault.jpg'),
              url: 'https://www.youtube.com/watch?v=' + item.videoId,
              videoUrl: 'https://www.youtube.com/watch?v=' + item.videoId,
            };
          });
        if (results.length) return results;
      } catch {}
    }

${marker}`;
  if (api.includes(marker)) api = api.replace(marker, replacement);
  fs.writeFileSync(apiPath, api);
}

const cssPath = 'src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.vidgrab-screen-shell')) {
  css += `\n\n.vidgrab-screen-shell {\n  width: 100%;\n  min-width: 0;\n  max-width: 100%;\n  overflow-x: clip;\n}\n\n.vidgrab-app-main {\n  width: 100%;\n  min-width: 0;\n  max-width: 100%;\n  overflow-x: clip;\n}\n\n@media (max-width: 767px) {\n  .vidgrab-screen-shell {\n    width: 100%;\n    max-width: 100%;\n    min-height: 0;\n    margin: 0;\n    padding: 0;\n    overflow-x: clip;\n  }\n\n  .vidgrab-app-main {\n    min-height: calc(100dvh - 56px);\n    padding-bottom: calc(72px + env(safe-area-inset-bottom));\n  }\n\n  .vidgrab-browser-safe {\n    width: 100%;\n    max-width: 100%;\n    min-height: calc(100dvh - 56px);\n    overflow-x: clip;\n    padding-bottom: calc(72px + env(safe-area-inset-bottom));\n  }\n\n  .vidgrab-app-main input,\n  .vidgrab-app-main textarea,\n  .vidgrab-app-main select,\n  .vidgrab-browser-safe input,\n  .vidgrab-browser-safe textarea,\n  .vidgrab-browser-safe select {\n    font-size: 16px;\n  }\n}\n`;
  fs.writeFileSync(cssPath, css);
}
