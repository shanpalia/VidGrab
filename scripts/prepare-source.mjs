import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function replaceOnce(file, find, replace, label) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return;
  const text = fs.readFileSync(full, 'utf8');
  if (text.includes(replace)) return;
  if (!text.includes(find)) {
    console.warn(`[prepare-source] pattern not found: ${label}`);
    return;
  }
  fs.writeFileSync(full, text.replace(find, replace));
  console.log(`[prepare-source] patched ${label}`);
}

const youtubeSearchFallback = `
  // APK fallback: fetch the public YouTube search HTML through a CORS proxy,
  // then extract the same videoRenderer records YouTube renders in search.
  static async getYouTubeSearchFromPublicPage(query: string): Promise<any[]> {
    const target = \`https://www.youtube.com/results?search_query=\${encodeURIComponent(query.trim())}\`;
    const proxy = \`https://api.allorigins.win/get?url=\${encodeURIComponent(target)}\`;
    const res = await fetch(proxy, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error('YouTube search proxy failed');
    const data = await res.json();
    const html = String(data.contents || '');
    if (!html) return [];

    const markerCandidates = ['var ytInitialData = ', 'ytInitialData = ', 'window["ytInitialData"] = '];
    let markerIndex = -1;
    let markerLength = 0;
    for (const marker of markerCandidates) {
      const index = html.indexOf(marker);
      if (index !== -1 && (markerIndex === -1 || index < markerIndex)) {
        markerIndex = index;
        markerLength = marker.length;
      }
    }
    if (markerIndex === -1) return [];

    const start = html.indexOf('{', markerIndex + markerLength);
    if (start === -1) return [];
    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;
    for (let i = start; i < html.length; i++) {
      const ch = html[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') { inString = true; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { end = i + 1; break; }
      }
    }
    if (end === -1) return [];

    let rootData: any;
    try { rootData = JSON.parse(html.slice(start, end)); } catch { return []; }

    const out: any[] = [];
    const seen = new Set<string>();
    const textOf = (node: any): string => {
      if (!node) return '';
      if (typeof node.simpleText === 'string') return node.simpleText;
      if (Array.isArray(node.runs)) return node.runs.map((r: any) => r?.text || '').join('');
      return '';
    };
    const walk = (node: any) => {
      if (!node || out.length >= 20) return;
      if (Array.isArray(node)) { for (const item of node) walk(item); return; }
      if (typeof node !== 'object') return;
      const video = node.videoRenderer;
      if (video?.videoId && !seen.has(video.videoId)) {
        seen.add(video.videoId);
        const thumbs = video.thumbnail?.thumbnails || [];
        const thumb = thumbs.length ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
        out.push({
          id: video.videoId,
          title: textOf(video.title) || `YouTube Video (${video.videoId})`,
          channel: textOf(video.ownerText) || textOf(video.longBylineText) || 'YouTube',
          views: textOf(video.viewCountText) || '',
          publishedAt: textOf(video.publishedTimeText) || '',
          duration: textOf(video.lengthText) || '',
          thumbnail: thumb,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
        });
      }
      for (const value of Object.values(node)) walk(value);
    };
    walk(rootData);
    return out;
  }
`;

replaceOnce(
  'src/services/api.ts',
  `  // 7. Real YouTube Search Results - GET /api/youtube/search\n  static async getYouTubeSearch(query: string): Promise<any[]> {\n    if (!query.trim()) return [];\n    try {\n      const res = await fetch(\`/api/youtube/search?q=\${encodeURIComponent(query.trim())}\`);\n      const data = await res.json();\n      return data.results || [];\n    } catch {\n      return [];\n    }\n  }`,
  `  // 7. Real YouTube Search Results - backend first, APK-safe public-page fallback\n${youtubeSearchFallback}\n  static async getYouTubeSearch(query: string): Promise<any[]> {\n    if (!query.trim()) return [];\n    try {\n      const res = await fetch(\`/api/youtube/search?q=\${encodeURIComponent(query.trim())}\`, { signal: AbortSignal.timeout(7000) });\n      const data = await res.json();\n      if (Array.isArray(data.results) && data.results.length > 0) return data.results;\n    } catch {\n      // Standalone APK has no Express server; use the public-page fallback below.\n    }\n    try {\n      return await this.getYouTubeSearchFromPublicPage(query);\n    } catch {\n      return [];\n    }\n  }`,
  'YouTube search fallback'
);

replaceOnce(
  'src/components/InAppBrowser.tsx',
  'setYtSearchResults(results.length > 0 ? results : INITIAL_YT_VIDEOS);',
  'setYtSearchResults(results);',
  'remove fake YouTube search results'
);

console.log('[prepare-source] source preparation complete');
