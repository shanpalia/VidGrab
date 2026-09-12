import fs from 'node:fs';

const apiPath = 'src/services/api.ts';
let api = fs.readFileSync(apiPath, 'utf8');

if (!api.includes('VIDGRAB_SEARCH_RACE_V1')) {
  const start = api.indexOf('  static async getYouTubeSearch(query: string): Promise<any[]> {');
  const end = api.indexOf('\n  static async getYouTubeFeed', start);
  if (start >= 0 && end > start) {
    const replacement = `  /* VIDGRAB_SEARCH_RACE_V1 */
  static async getYouTubeSearch(query: string): Promise<any[]> {
    const q = query.trim();
    if (!q) return [];

    const backendSearch = (async () => {
      try {
        const res = await fetch('/api/youtube/search?q=' + encodeURIComponent(q), { signal: AbortSignal.timeout(6500) });
        const data = await res.json();
        return Array.isArray(data.results) ? data.results : [];
      } catch {
        return [];
      }
    })();

    const publicSearch = Promise.race([
      this.getYouTubeSearchFromPublicApi(q).catch(() => []),
      new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 12000)),
    ]);

    const candidates = await Promise.all([backendSearch, publicSearch]);
    for (const results of candidates) {
      if (Array.isArray(results) && results.length) return results;
    }
    return [];
  }
`;
    api = api.slice(0, start) + replacement + api.slice(end);
    fs.writeFileSync(apiPath, api);
  }
}

const browserPath = 'src/components/InAppBrowser.tsx';
let browser = fs.readFileSync(browserPath, 'utf8');
if (!browser.includes('VIDGRAB_SEARCH_EMPTY_STATE_V1')) {
  browser = browser.replace(
    '<span className="text-[11px] text-gray-500 font-semibold">\n                    {ytSearchResults.length} videos found\n                  </span>',
    '<span className="text-[11px] text-gray-500 font-semibold">\n                    {ytSearchLoading ? \'Searching…\' : ytSearchResults.length ? `${ytSearchResults.length} videos found` : \'No videos found\'}\n                  </span>\n                  {/* VIDGRAB_SEARCH_EMPTY_STATE_V1 */}'
  );
  fs.writeFileSync(browserPath, browser);
}
