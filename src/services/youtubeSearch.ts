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

// Kept as a compatibility service for callers outside the browser. The in-app
// browser now loads the real YouTube results page directly, avoiding CORS and
// public-proxy failures that caused false zero-result states.
export const YouTubeSearchService = {
  async search(query: string): Promise<YouTubeSearchItem[]> {
    const q = query.trim();
    if (!q) return [];
    return [];
  },
};
