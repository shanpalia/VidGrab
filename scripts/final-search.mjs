import fs from 'node:fs';

const file = 'src/services/api.ts';
let source = fs.readFileSync(file, 'utf8');

function findMethod(text, signature) {
  const start = text.indexOf(signature);
  if (start < 0) return null;
  const brace = text.indexOf('{', start);
  if (brace < 0) return null;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = brace; i < text.length; i += 1) {
    const c = text[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) return { start, end: i + 1 };
    }
  }
  return null;
}

const searchMethod = `  static async getYouTubeSearchFromPublicApi(query: string): Promise<any[]> {
    const q = query.trim();
    if (!q) return [];

    // Invidious exposes the public YouTube search data without requiring an API key.
    // Multiple instances are tried in parallel so one dead instance cannot leave the
    // Android app stuck on "Fetching YouTube search results...".
    const instances = [
      'https://inv.nadeko.net',
      'https://yewtu.be',
      'https://inv.tux.pizza',
      'https://invidious.protokolla.fi',
      'https://invidious.private.coffee',
      'https://yt.drgnz.club',
      'https://iv.datura.network',
      'https://inv.us.projectsegfau.lt'
    ];

    const fetchInstance = async (base: string) => {
      const res = await fetch(
        base + '/api/v1/search?q=' + encodeURIComponent(q) + '&type=video',
        { signal: AbortSignal.timeout(6500), headers: { Accept: 'application/json' } }
      );
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Invalid search response');
      return data
        .filter((item: any) => item?.type === 'video' && item?.videoId)
        .slice(0, 20)
        .map((item: any) => {
          const thumbs = Array.isArray(item.videoThumbnails) ? item.videoThumbnails : [];
          const thumb = thumbs.length ? thumbs[thumbs.length - 1]?.url : '';
          return {
            id: item.videoId,
            title: item.title || 'YouTube Video',
            channel: item.author || 'YouTube',
            views: item.viewCount ? String(item.viewCount) + ' views' : '',
            publishedAt: item.publishedText || '',
            duration: item.lengthSeconds ? String(item.lengthSeconds) : '',
            thumbnail: thumb || 'https://i.ytimg.com/vi/' + item.videoId + '/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=' + item.videoId,
            videoUrl: 'https://www.youtube.com/watch?v=' + item.videoId
          };
        });
    };

    try {
      const results = await Promise.any(instances.map(fetchInstance));
      if (results.length) return results;
    } catch {}

    // Last fallback: fetch the actual YouTube results page through public CORS proxies
    // and extract ytInitialData.videoRenderer entries. No demo/fake results are used.
    const target = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?url='
    ];
    for (const prefix of proxies) {
      try {
        const res = await fetch(prefix + encodeURIComponent(target), { signal: AbortSignal.timeout(12000) });
        if (!res.ok) continue;
        const html = await res.text();
        const marker = html.indexOf('ytInitialData');
        if (marker < 0) continue;
        const start = html.indexOf('{', marker);
        if (start < 0) continue;
        let depth = 0;
        let quote = false;
        let escaped = false;
        let end = -1;
        for (let i = start; i < html.length; i += 1) {
          const c = html[i];
          if (quote) {
            if (escaped) escaped = false;
            else if (c === '\\') escaped = true;
            else if (c === '"') quote = false;
            continue;
          }
          if (c === '"') quote = true;
          else if (c === '{') depth += 1;
          else if (c === '}' && --depth === 0) { end = i + 1; break; }
        }
        if (end < 0) continue;
        let root;
        try { root = JSON.parse(html.slice(start, end)); } catch { continue; }
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
            out.push({
              id: v.videoId,
              title: text(v.title) || 'YouTube Video',
              channel: text(v.ownerText) || 'YouTube',
              views: text(v.viewCountText) || '',
              publishedAt: text(v.publishedTimeText) || '',
              duration: text(v.lengthText) || '',
              thumbnail: thumbs.length ? thumbs[thumbs.length - 1].url : 'https://i.ytimg.com/vi/' + v.videoId + '/hqdefault.jpg',
              url: 'https://www.youtube.com/watch?v=' + v.videoId,
              videoUrl: 'https://www.youtube.com/watch?v=' + v.videoId
            });
          }
          for (const value of Object.values(node)) walk(value);
        };
        walk(root);
        if (out.length) return out;
      } catch {}
    }
    return [];
  }`;

const publicMethod = findMethod(source, '  static async getYouTubeSearchFromPublicApi(');
if (!publicMethod) throw new Error('getYouTubeSearchFromPublicApi method not found');
source = source.slice(0, publicMethod.start) + searchMethod + source.slice(publicMethod.end);

const search = findMethod(source, '  static async getYouTubeSearch(query: string): Promise<any[]>');
if (!search) throw new Error('getYouTubeSearch method not found');
const searchReplacement = `  static async getYouTubeSearch(query: string): Promise<any[]> {
    const q = query.trim();
    if (!q) return [];
    // Use the same real public providers in the standalone Android build.
    // There is deliberately no hardcoded/demo fallback.
    return this.getYouTubeSearchFromPublicApi(q);
  }`;
source = source.slice(0, search.start) + searchReplacement + source.slice(search.end);

fs.writeFileSync(file, source);
console.log('[search] final real YouTube provider patch applied');
