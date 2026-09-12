import fs from 'node:fs';

function replaceMethod(source, signature, replacement) {
  const start = source.indexOf(signature);
  if (start < 0) return source;
  const braceStart = source.indexOf('{', start);
  if (braceStart < 0) return source;
  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;
  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inString = true; quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(0, start) + replacement + source.slice(i + 1);
    }
  }
  return source;
}

// 1) Remove the browser's duplicate bottom navigation. App.tsx owns the only app navigation.
const browserPath = 'src/components/InAppBrowser.tsx';
let browser = fs.readFileSync(browserPath, 'utf8');
if (!browser.includes('VIDGRAB_BROWSER_BOTTOM_NAV_REMOVED_V3')) {
  const marker = '      {/* ========================================================= */}\n      {/* 5. BOTTOM BROWSER CONTROLS (SECTION 14)';
  const start = browser.indexOf(marker);
  const end = start >= 0 ? browser.indexOf('\n      </div>\n    </div>\n  );\n};', start) : -1;
  if (start >= 0 && end >= 0) {
    browser = browser.slice(0, start) + '      {/* VIDGRAB_BROWSER_BOTTOM_NAV_REMOVED_V3 */}\n' + browser.slice(end);
  }
}
// Never use demo results after a real search failure.
browser = browser.replace(/setYtSearchResults\(results\.length > 0 \? results : INITIAL_YT_VIDEOS\);/g, 'setYtSearchResults(results);');
browser = browser.replace(/setYtSearchResults\(INITIAL_YT_VIDEOS\);\n\s*setYtSearchLoading\(false\);/g, 'setYtSearchResults([]);\n            setYtSearchLoading(false);');
browser = browser.replace('{ytSearchResults.length} videos found', "{ytSearchLoading ? 'Searching…' : `${ytSearchResults.length} videos found`}");
fs.writeFileSync(browserPath, browser);

// 2) Replace the entire public search implementation with a single, deterministic multi-instance race.
const apiPath = 'src/services/api.ts';
let api = fs.readFileSync(apiPath, 'utf8');
const publicSearch = `  static async getYouTubeSearchFromPublicApi(query: string): Promise<any[]> {
    const q = query.trim();
    if (!q) return [];
    const instances = [
      'https://yewtu.be',
      'https://inv.nadeko.net',
      'https://inv.tux.pizza',
      'https://invidious.protokolla.fi',
      'https://invidious.private.coffee',
      'https://yt.drgnz.club',
      'https://iv.datura.network',
      'https://inv.us.projectsegfau.lt',
      'https://inv.in.projectsegfau.lt',
      'https://invidious.privacyredirect.com',
      'https://invidious.incogniweb.net'
    ];
    const request = async (base: string) => {
      const url = base + '/api/v1/search?q=' + encodeURIComponent(q) + '&page=1&sort=relevance&type=video&region=IN&hl=en-US';
      const response = await fetch(url, { signal: AbortSignal.timeout(5500) });
      if (!response.ok) throw new Error('HTTP_' + response.status);
      const data = await response.json();
      const rows = Array.isArray(data) ? data : [];
      const results = rows.filter((item: any) => item?.type === 'video' && item?.videoId).slice(0, 20).map((item: any) => {
        const thumbs = Array.isArray(item.videoThumbnails) ? item.videoThumbnails : [];
        const thumb = thumbs.length ? thumbs[thumbs.length - 1]?.url : '';
        return {
          id: item.videoId,
          title: item.title || 'YouTube Video',
          channel: item.author || 'YouTube',
          views: item.viewCount != null ? String(item.viewCount) + ' views' : '',
          publishedAt: item.publishedText || '',
          duration: item.lengthSeconds ? String(item.lengthSeconds) : '',
          thumbnail: thumb || ('https://i.ytimg.com/vi/' + item.videoId + '/hqdefault.jpg'),
          url: 'https://www.youtube.com/watch?v=' + item.videoId,
          videoUrl: 'https://www.youtube.com/watch?v=' + item.videoId,
        };
      });
      if (!results.length) throw new Error('EMPTY_RESULTS');
      return results;
    };
    try {
      return await Promise.any(instances.map((base) => request(base)));
    } catch {}

    // Last-resort YouTube HTML proxy parsing for instances that are temporarily unavailable.
    const targets = [
      'https://www.youtube.com/results?search_query=' + encodeURIComponent(q),
      'https://m.youtube.com/results?search_query=' + encodeURIComponent(q)
    ];
    const proxies = [
      'https://api.allorigins.win/get?url=',
      'https://corsproxy.io/?url='
    ];
    for (const target of targets) for (const prefix of proxies) {
      try {
        const response = await fetch(prefix + encodeURIComponent(target), { signal: AbortSignal.timeout(7000) });
        if (!response.ok) continue;
        const payload = await response.json();
        const html = String(payload?.contents || payload?.data || '');
        const marker = html.indexOf('ytInitialData');
        if (marker < 0) continue;
        const start = html.indexOf('{', marker);
        if (start < 0) continue;
        let depth = 0, inString = false, escaped = false, end = -1;
        for (let i = start; i < html.length; i++) {
          const ch = html[i];
          if (inString) {
            if (escaped) escaped = false;
            else if (ch === '\\\\') escaped = true;
            else if (ch === '"') inString = false;
          } else if (ch === '"') inString = true;
          else if (ch === '{') depth++;
          else if (ch === '}' && --depth === 0) { end = i + 1; break; }
        }
        if (end < 0) continue;
        const root = JSON.parse(html.slice(start, end));
        const out: any[] = [];
        const seen = new Set<string>();
        const text = (node: any) => node?.simpleText || (Array.isArray(node?.runs) ? node.runs.map((r: any) => r?.text || '').join('') : '');
        const walk = (node: any) => {
          if (!node || out.length >= 20) return;
          if (Array.isArray(node)) { for (const item of node) walk(item); return; }
          if (typeof node !== 'object') return;
          const v = node.videoRenderer;
          if (v?.videoId && !seen.has(v.videoId)) {
            seen.add(v.videoId);
            const thumbs = v.thumbnail?.thumbnails || [];
            out.push({ id: v.videoId, title: text(v.title) || 'YouTube Video', channel: text(v.ownerText) || 'YouTube', views: text(v.viewCountText) || '', publishedAt: text(v.publishedTimeText) || '', duration: text(v.lengthText) || '', thumbnail: thumbs.length ? thumbs[thumbs.length - 1]?.url : ('https://i.ytimg.com/vi/' + v.videoId + '/hqdefault.jpg'), url: 'https://www.youtube.com/watch?v=' + v.videoId, videoUrl: 'https://www.youtube.com/watch?v=' + v.videoId });
          }
          for (const value of Object.values(node)) walk(value);
        };
        walk(root);
        if (out.length) return out;
      } catch {}
    }
    return [];
  }`;

api = replaceMethod(api, '  static async getYouTubeSearchFromPublicApi(query: string): Promise<any[]>', publicSearch);
const searchMethod = `  static async getYouTubeSearch(query: string): Promise<any[]> {
    const q = query.trim();
    if (!q) return [];
    try {
      const results = await this.getYouTubeSearchFromPublicApi(q);
      return Array.isArray(results) ? results : [];
    } catch {
      return [];
    }
  }`;
api = replaceMethod(api, '  static async getYouTubeSearch(query: string): Promise<any[]>', searchMethod);
fs.writeFileSync(apiPath, api);

// 3) Add a final native viewport patch after all generated Android code has been copied.
const androidPatchPath = 'scripts/patch-android.mjs';
let androidPatch = fs.readFileSync(androidPatchPath, 'utf8');
if (!androidPatch.includes('VIDGRAB_ANDROID_INSETS_V6')) {
  androidPatch = androidPatch.replace(
    'if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n            getWindow().setDecorFitsSystemWindows(true);\n        }',
    'if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n            getWindow().setDecorFitsSystemWindows(false);\n        }'
  );
  androidPatch = androidPatch.replace(
    'bridge.getWebView().setPadding(0, 0, 0, 0);',
    `bridge.getWebView().setPadding(0, 0, 0, 0);\n            // VIDGRAB_ANDROID_INSETS_V6: WebView content always starts below the Android status bar/cutout.\n            bridge.getWebView().setOnApplyWindowInsetsListener((view, insets) -> {\n                int top = 0;\n                int bottom = 0;\n                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n                    android.graphics.Insets bars = insets.getInsets(android.view.WindowInsets.Type.statusBars() | android.view.WindowInsets.Type.displayCutout() | android.view.WindowInsets.Type.navigationBars());\n                    top = bars.top;\n                    bottom = bars.bottom;\n                } else {\n                    top = insets.getSystemWindowInsetTop();\n                    bottom = insets.getSystemWindowInsetBottom();\n                }\n                view.setPadding(0, top, 0, bottom);\n                return insets;\n            });\n            bridge.getWebView().requestApplyInsets();`
  );
  fs.writeFileSync(androidPatchPath, androidPatch);
}

console.log('[finalize-v3] browser nav, real YouTube search and Android insets finalized');
