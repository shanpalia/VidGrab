import fs from 'node:fs';

const appPath = 'src/App.tsx';
const app = fs.readFileSync(appPath, 'utf8');
const pagePatterns = [
  /<HomePage\b[\s\S]*?\/>/, /<MusicPage\b[\s\S]*?\/>/, /<VideoPage\b[\s\S]*?\/>/,
  /<SupportedPlatformsPage\b[\s\S]*?\/>/, /<DownloadResultPage\b[\s\S]*?\n\s*\/>/,
  /<DownloadProgressPage\b[\s\S]*?\n\s*\/>/, /<MyFilesPage\b[\s\S]*?\/>/,
  /<HistoryPage\b[\s\S]*?\/>/, /<MorePage\s*\/>/
];
let hardenedApp = app;
for (const pattern of pagePatterns) hardenedApp = hardenedApp.replace(pattern, (match) => match.includes('vidgrab-screen-shell') ? match : `<div className="vidgrab-screen-shell">${match}</div>`);

if (!hardenedApp.includes('VIDGRAB_BROWSER_NAV_FIX_V1')) {
  hardenedApp = hardenedApp.replace(
    '<main className="flex-1 vidgrab-app-main">',
    '<main data-fix="VIDGRAB_BROWSER_NAV_FIX_V1" className={activeTab === \'browser\' ? \'flex-1 min-h-0 vidgrab-browser-main\' : \'flex-1 vidgrab-app-main\'}>'
  );
  const bottomNavStart = hardenedApp.indexOf('      <BottomNav\n');
  if (bottomNavStart >= 0) {
    const bottomNavEnd = hardenedApp.indexOf('\n      />\n    </div>\n  );', bottomNavStart);
    if (bottomNavEnd >= 0) {
      const bottomNavBlock = hardenedApp.slice(bottomNavStart, bottomNavEnd + '\n      />'.length);
      hardenedApp = hardenedApp.replace(bottomNavBlock, `{activeTab !== 'browser' && (\n${bottomNavBlock}\n      )}`);
    }
  }
}
fs.writeFileSync(appPath, hardenedApp);

const browserPath = 'src/components/InAppBrowser.tsx';
let browser = fs.readFileSync(browserPath, 'utf8');
browser = browser.replace('setYtSearchResults(results.length > 0 ? results : INITIAL_YT_VIDEOS);', 'setYtSearchResults(results);');
browser = browser.replace('setYtSearchResults(INITIAL_YT_VIDEOS);\n            setYtSearchLoading(false);', 'setYtSearchResults([]);\n            setYtSearchLoading(false);');
if (!browser.includes('VIDGRAB_BROWSER_BOTTOM_NAV_REMOVED_V1')) {
  const navStartMarker = '      {/* ========================================================= */}\n      {/* 5. BOTTOM BROWSER CONTROLS';
  const navStart = browser.indexOf(navStartMarker);
  const rootEndMarker = '\n    </div>\n  );\n};';
  const rootEnd = navStart >= 0 ? browser.indexOf(rootEndMarker, navStart) : -1;
  if (navStart >= 0 && rootEnd >= 0) browser = browser.slice(0, navStart) + '      {/* VIDGRAB_BROWSER_BOTTOM_NAV_REMOVED_V1 */}\n' + browser.slice(rootEnd);
}
fs.writeFileSync(browserPath, browser);

const apiPath = 'src/services/api.ts';
let api = fs.readFileSync(apiPath, 'utf8');

if (!api.includes('VIDGRAB_INVIDIOUS_FAST_V2')) {
  const marker = "    const instances = ['https://pipedapi.kavin.rocks','https://pipedapi.leptons.xyz','https://pipedapi.nosebs.ru','https://pipedapi.adminforge.de','https://api.piped.yt'];";
  const fastBlock = [
    '    /* VIDGRAB_INVIDIOUS_FAST_V2 */',
    "    const invidiousFastInstances = ['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com','https://invidious.tiekoetter.com'];",
    '    const invidiousRequests = invidiousFastInstances.map(async (base) => {',
    "      const endpoint = base + '/api/v1/search?q=' + encodeURIComponent(q) + '&type=video&region=IN&hl=en-US';",
    "      const res = await fetch(endpoint, { signal: AbortSignal.timeout(4500) });",
    "      if (!res.ok) throw new Error('HTTP ' + res.status);",
    '      const data = await res.json();',
    '      return (Array.isArray(data) ? data : []).filter((item: any) => item?.type === \'video\' && item?.videoId).slice(0, 20).map((item: any) => {',
    '        const thumbs = Array.isArray(item.videoThumbnails) ? item.videoThumbnails : [];',
    "        const thumb = thumbs.length ? thumbs[thumbs.length - 1]?.url : '';",
    '        return { id: item.videoId, title: item.title || \'YouTube Video\', channel: item.author || \'YouTube\', views: item.viewCount ? String(item.viewCount) + \' views\' : \'\', publishedAt: item.publishedText || \'\', duration: item.lengthSeconds ? String(item.lengthSeconds) : \'\', thumbnail: thumb || (\'https://i.ytimg.com/vi/\' + item.videoId + \'/hqdefault.jpg\'), url: \'https://www.youtube.com/watch?v=\' + item.videoId, videoUrl: \'https://www.youtube.com/watch?v=\' + item.videoId };',
    '      });',
    '    });',
    '    const settled = await Promise.allSettled(invidiousRequests);',
    '    for (const result of settled) if (result.status === \'fulfilled\' && result.value.length) return result.value;',
    '',
    marker,
  ].join('\n');
  if (api.includes(marker)) api = api.replace(marker, fastBlock);
}

// Do not inject a second const declaration when the fast Invidious block is already present.
if (!api.includes('VIDGRAB_INVIDIOUS_FAST_V2') && !api.includes('VIDGRAB_INVIDIOUS_FALLBACK_V1')) {
  const marker = "    const instances = ['https://pipedapi.kavin.rocks','https://pipedapi.leptons.xyz','https://pipedapi.nosebs.ru','https://pipedapi.adminforge.de','https://api.piped.yt'];";
  const replacement = [
    '    /* VIDGRAB_INVIDIOUS_FALLBACK_V1 */',
    "    const invidiousFallbackInstances = ['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com','https://invidious.tiekoetter.com','https://invidious.f5.si'];",
    '    for (const base of invidiousFallbackInstances) {', '      try {',
    "        const endpoint = base + '/api/v1/search?q=' + encodeURIComponent(q) + '&type=video&region=IN&hl=en-US';",
    "        const res = await fetch(endpoint, { signal: AbortSignal.timeout(7000) });", '        if (!res.ok) continue;', '        const data = await res.json();',
    '        const results = (Array.isArray(data) ? data : []).filter((item: any) => item?.type === \'video\' && item?.videoId).slice(0, 20).map((item: any) => ({',
    '          id: item.videoId, title: item.title || \'YouTube Video\', channel: item.author || \'YouTube\', views: item.viewCount ? String(item.viewCount) + \' views\' : \'\', publishedAt: item.publishedText || \'\', duration: item.lengthSeconds ? String(item.lengthSeconds) : \'\', thumbnail: (Array.isArray(item.videoThumbnails) && item.videoThumbnails.length ? item.videoThumbnails[item.videoThumbnails.length - 1]?.url : \'\') || (\'https://i.ytimg.com/vi/\' + item.videoId + \'/hqdefault.jpg\'), url: \'https://www.youtube.com/watch?v=\' + item.videoId, videoUrl: \'https://www.youtube.com/watch?v=\' + item.videoId',
    '        }));', '        if (results.length) return results;', '      } catch {}', '    }', '', marker
  ].join('\n');
  if (api.includes(marker)) api = api.replace(marker, replacement);
}
fs.writeFileSync(apiPath, api);

const cssPath = 'src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.vidgrab-screen-shell')) {
  css += '\n\n.vidgrab-screen-shell { width: 100%; min-width: 0; max-width: 100%; overflow-x: clip; }\n.vidgrab-app-main { width: 100%; min-width: 0; max-width: 100%; overflow-x: clip; }\n@media (max-width: 767px) {\n  .vidgrab-screen-shell { width: 100%; max-width: 100%; min-height: 0; margin: 0; padding: 0; overflow-x: clip; }\n  .vidgrab-app-main { min-height: calc(100dvh - 56px); padding-bottom: calc(72px + env(safe-area-inset-bottom)); }\n  .vidgrab-browser-main { width: 100%; min-width: 0; height: 100%; min-height: 0; overflow: hidden; padding: 0 !important; }\n  .vidgrab-browser-safe { width: 100%; max-width: 100%; min-height: 0; height: 100%; overflow-x: clip; padding-bottom: 0 !important; }\n  .vidgrab-app-main input, .vidgrab-app-main textarea, .vidgrab-app-main select, .vidgrab-browser-safe input, .vidgrab-browser-safe textarea, .vidgrab-browser-safe select { font-size: 16px; }\n}\n';
  fs.writeFileSync(cssPath, css);
}
