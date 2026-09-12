import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const apiFile = path.join(root, 'src/services/api.ts');
const browserFile = path.join(root, 'src/components/InAppBrowser.tsx');

function patch(file, transform) {
  if (!fs.existsSync(file)) return;
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after !== before) fs.writeFileSync(file, after);
}

patch(apiFile, (text) => {
  // Add Invidious as an additional real-search fallback after the existing Piped fallback.
  if (!text.includes('invidious.privacydev.net')) {
    text = text.replace(
      "      'https://api.piped.yt',\n",
      "      'https://api.piped.yt',\n      'https://yewtu.be',\n      'https://yt.artemislena.eu',\n      'https://invidious.privacydev.net',\n      'https://inv.tux.pizza',\n"
    );
  }

  const pipedLoop = /    for \(const base of instances\) \{[\s\S]*?    \}\n\n    try \{\n      const target = 'https:\/\/www\.youtube\.com\/results\?search_query='/;
  if (pipedLoop.test(text) && !text.includes("base + '/api/v1/search?q='")) {
    const replacement = `    for (const base of instances) {\n      try {\n        const isInvidious = base.includes('yewtu.be') || base.includes('artemislena') || base.includes('privacydev') || base.includes('tux.pizza');\n        const endpoint = isInvidious\n          ? base + '/api/v1/search?q=' + encodeURIComponent(q) + '&type=video&page=1&region=IN'\n          : base + '/search?q=' + encodeURIComponent(q) + '&filter=videos';\n        const res = await fetch(endpoint, { signal: AbortSignal.timeout(7000) });\n        if (!res.ok) continue;\n        const data = await res.json();\n        const rawItems = isInvidious\n          ? (Array.isArray(data) ? data : [])\n          : (Array.isArray(data?.items) ? data.items : []);\n        const results = rawItems\n          .filter((item) => isInvidious ? item?.type === 'video' && item?.videoId : item?.type === 'stream' && item?.url)\n          .slice(0, 20)\n          .map((item) => {\n            const id = isInvidious ? item.videoId : (item.id || String(item.url).match(/[?&]v=([^&]+)/)?.[1] || '');\n            if (!id) return null;\n            const thumbs = isInvidious ? (item.videoThumbnails || []) : [];\n            const thumb = isInvidious\n              ? (thumbs[thumbs.length - 1]?.url || 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg')\n              : (item.thumbnail || 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg');\n            return {\n              id,\n              title: item.title || 'YouTube Video',\n              channel: isInvidious ? (item.author || 'YouTube') : (item.uploaderName || 'YouTube'),\n              views: item.viewCount ? String(item.viewCount) + ' views' : (item.views ? String(item.views) + ' views' : ''),\n              publishedAt: item.publishedText || (item.uploadedDate ? String(item.uploadedDate) : ''),\n              duration: item.lengthSeconds ? String(Math.floor(item.lengthSeconds / 60)).padStart(2, '0') + ':' + String(item.lengthSeconds % 60).padStart(2, '0') : (item.duration ? String(item.duration) : ''),\n              thumbnail: thumb,\n              url: 'https://www.youtube.com/watch?v=' + id,\n              videoUrl: 'https://www.youtube.com/watch?v=' + id,\n            };\n          })\n          .filter(Boolean);\n        if (results.length > 0) return results;\n      } catch {\n        // Continue to the next public search provider.\n      }\n    }\n\n    try {\n      const target = 'https://www.youtube.com/results?search_query='`;
    text = text.replace(pipedLoop, replacement);
  }
  return text;
});

patch(browserFile, (text) => text
  .replace(/setYtSearchResults\(results\.length > 0 \? results : INITIAL_YT_VIDEOS\);/g, 'setYtSearchResults(results);')
  .replace(/setYtSearchResults\(INITIAL_YT_VIDEOS\);/g, 'setYtSearchResults([]);')
);

console.log('[fix-youtube-search] real multi-provider YouTube search patched');
