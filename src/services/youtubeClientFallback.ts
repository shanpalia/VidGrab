type YouTubeResult = {
  id: string;
  title: string;
  channel: string;
  channelAvatar?: string;
  views: string;
  publishedAt: string;
  duration: string;
  thumbnail: string;
  url: string;
  videoUrl: string;
};

const PROXY_BASES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?url=',
];

function textFrom(node: any): string {
  if (!node) return '';
  if (typeof node.simpleText === 'string') return node.simpleText;
  if (Array.isArray(node.runs)) return node.runs.map((r: any) => r?.text || '').join('');
  return '';
}

function extractJsonObject(source: string, markerIndex: number): any | null {
  const firstBrace = source.indexOf('{', markerIndex);
  if (firstBrace < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = firstBrace; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(source.slice(firstBrace, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function extractInitialData(html: string): any | null {
  const scriptMatch = html.match(/<script[^>]+id=["']ytInitialData["'][^>]*>([\s\S]*?)<\/script>/i);
  if (scriptMatch?.[1]) {
    try {
      return JSON.parse(scriptMatch[1].trim());
    } catch {
      // Continue to assignment-based extraction.
    }
  }

  for (const marker of ['var ytInitialData = ', 'ytInitialData = ', 'window["ytInitialData"] = ']) {
    const index = html.indexOf(marker);
    if (index >= 0) {
      const data = extractJsonObject(html, index + marker.length);
      if (data) return data;
    }
  }
  return null;
}

function collectVideoRenderers(root: any): any[] {
  const found: any[] = [];
  const seen = new Set<any>();
  const walk = (node: any) => {
    if (!node || typeof node !== 'object' || found.length >= 30 || seen.has(node)) return;
    seen.add(node);
    if (node.videoRenderer?.videoId) found.push(node.videoRenderer);
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
    } else {
      for (const value of Object.values(node)) walk(value);
    }
  };
  walk(root);
  return found;
}

function mapResults(data: any): YouTubeResult[] {
  return collectVideoRenderers(data).map((v) => {
    const id = String(v.videoId);
    const thumbnails = v.thumbnail?.thumbnails || [];
    const avatar = v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails || [];
    return {
      id,
      title: textFrom(v.title) || 'YouTube Video',
      channel: textFrom(v.ownerText) || textFrom(v.shortBylineText) || 'YouTube Creator',
      channelAvatar: avatar.at(-1)?.url,
      views: textFrom(v.viewCountText) || textFrom(v.shortViewCountText) || 'Views unavailable',
      publishedAt: textFrom(v.publishedTimeText) || 'Recently',
      duration: textFrom(v.lengthText) || '—',
      thumbnail: thumbnails.at(-1)?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${id}`,
      videoUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  });
}

async function proxyText(targetUrl: string): Promise<string> {
  let lastError: unknown;
  for (const base of PROXY_BASES) {
    try {
      const res = await fetch(base + encodeURIComponent(targetUrl), {
        headers: { Accept: 'text/plain,text/html,application/json,*/*' },
      });
      if (res.ok) return await res.text();
      lastError = new Error(`Proxy HTTP ${res.status}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('YouTube proxy unavailable');
}

export async function searchYouTubePublic(query: string): Promise<YouTubeResult[]> {
  const q = query.trim();
  if (!q) return [];
  const target = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  const html = await proxyText(target);
  const data = extractInitialData(html);
  return data ? mapResults(data) : [];
}

export async function suggestYouTubePublic(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];
  const target = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`;
  const raw = await proxyText(target);
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data?.[1]) ? data[1].filter((x: unknown): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function installYouTubeApiFallback(): Promise<void> {
  if (typeof window === 'undefined' || !window.fetch) return;
  const nativeFetch = window.fetch.bind(window);
  const patched = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (!url.includes('/api/youtube/')) return nativeFetch(input, init);

    try {
      const response = await nativeFetch(input, init);
      if (response.ok) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          if ((url.includes('/api/youtube/search') || url.includes('/api/youtube/feed')) && Array.isArray(data?.results) && data.results.length) return response;
          if (url.includes('/api/youtube/suggestions') && Array.isArray(data?.suggestions) && data.suggestions.length) return response;
        } catch {
          // Fall through to the public fallback.
        }
      }
    } catch {
      // Fall through to the public fallback.
    }

    try {
      const parsed = new URL(url, window.location.origin);
      const q = parsed.searchParams.get('q') || '';
      if (url.includes('/api/youtube/suggestions')) {
        const suggestions = await suggestYouTubePublic(q);
        return new Response(JSON.stringify({ success: true, suggestions }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const query = q || parsed.searchParams.get('category') || 'trending official videos';
      const results = await searchYouTubePublic(query);
      return new Response(JSON.stringify({ success: true, query, count: results.length, results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('YouTube public fallback failed:', error);
      return new Response(JSON.stringify({ success: true, results: [], suggestions: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
  window.fetch = patched as typeof window.fetch;
}
