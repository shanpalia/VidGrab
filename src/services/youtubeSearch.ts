export interface YouTubeSearchItem {
  id: string;
  title: string;
  channel: string;
  views: string;
  publishedAt: string;
  duration: string;
  thumbnail: string;
  url: string;
}

// Official public instances listed by Invidious documentation. The app races them
// instead of waiting on one broken endpoint.
const OFFICIAL_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://yt.chocolatemoo53.com',
  'https://invidious.tiekoetter.com',
];

function formatDuration(total: number) {
  if (!Number.isFinite(total) || total <= 0) return '';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function mapInvidious(rows: any[]): YouTubeSearchItem[] {
  return rows.filter((item) => item?.type === 'video' && item?.videoId).slice(0, 30).map((item) => {
    const thumbs = Array.isArray(item.videoThumbnails) ? item.videoThumbnails : [];
    return {
      id: item.videoId,
      title: item.title || 'YouTube Video',
      channel: item.author || 'YouTube',
      views: item.viewCount != null ? Number(item.viewCount).toLocaleString('en-IN') + ' views' : '',
      publishedAt: item.publishedText || '',
      duration: item.lengthSeconds ? formatDuration(Number(item.lengthSeconds)) : '',
      thumbnail: thumbs.length ? (thumbs[thumbs.length - 1]?.url || '') : `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${item.videoId}`,
    };
  });
}

function parseJina(markdown: string): YouTubeSearchItem[] {
  const out: YouTubeSearchItem[] = [];
  const seen = new Set<string>();
  const linkRe = /\[[^\]]+\]\((?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})[^)]*\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(markdown)) && out.length < 20) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const before = markdown.slice(Math.max(0, match.index - 180), match.index);
    const lines = before.split('\n').filter(Boolean);
    const title = lines.length ? lines[lines.length - 1].replace(/^[-*#>\s]+/, '').trim() : `YouTube Video (${id})`;
    out.push({ id, title: title || `YouTube Video (${id})`, channel: 'YouTube', views: '', publishedAt: '', duration: '', thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, url: `https://www.youtube.com/watch?v=${id}` });
  }
  return out;
}

export const YouTubeSearchService = {
  async search(query: string): Promise<YouTubeSearchItem[]> {
    const q = query.trim();
    if (!q) return [];

    const request = async (base: string) => {
      const url = `${base}/api/v1/search?q=${encodeURIComponent(q)}&page=1&sort=relevance&type=video&region=IN&hl=en-US`;
      const response = await fetch(url, { signal: AbortSignal.timeout(6500), headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const results = mapInvidious(await response.json());
      if (!results.length) throw new Error('EMPTY');
      return results;
    };

    try { return await Promise.any(OFFICIAL_INSTANCES.map(request)); } catch {}

    // Last-resort public reader when every official instance is temporarily unavailable.
    for (const host of ['https://r.jina.ai/http://www.youtube.com/results?search_query=', 'https://r.jina.ai/https://www.youtube.com/results?search_query=']) {
      try {
        const response = await fetch(host + encodeURIComponent(q), { signal: AbortSignal.timeout(10000), headers: { Accept: 'text/plain' } });
        if (!response.ok) continue;
        const results = parseJina(await response.text());
        if (results.length) return results;
      } catch {}
    }
    return [];
  },
};
