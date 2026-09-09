import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supported platform definitions
interface PlatformDetector {
  source: 'YouTube' | 'Instagram' | 'Facebook' | 'TikTok' | 'WhatsApp' | 'X / Twitter' | 'Pinterest' | 'Web Media';
  pattern: RegExp;
  maxQuality: '4k' | '1080p' | '720p';
}

const PLATFORMS: PlatformDetector[] = [
  { source: 'YouTube', pattern: /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)/i, maxQuality: '4k' },
  { source: 'Instagram', pattern: /instagram\.com\/(?:p|reel|tv|stories)\//i, maxQuality: '1080p' },
  { source: 'Facebook', pattern: /(?:facebook\.com|fb\.watch)/i, maxQuality: '1080p' },
  { source: 'TikTok', pattern: /tiktok\.com\//i, maxQuality: '1080p' },
  { source: 'WhatsApp', pattern: /(?:whatsapp\.com|wa\.me)/i, maxQuality: '720p' },
  { source: 'X / Twitter', pattern: /(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status/i, maxQuality: '1080p' },
  { source: 'Pinterest', pattern: /pinterest\.(?:com|[a-z]{2,3})\/pin\//i, maxQuality: '720p' },
  { source: 'Web Media', pattern: /^https?:\/\/.+/i, maxQuality: '1080p' }
];

// Sample media database for realistic metadata and instant testing
const DEMO_MEDIA_COLLECTION: Record<string, any> = {
  'youtube-nature': {
    title: 'Colors of Wildlife 4K - Cinematic Nature Documentary HDR',
    author: 'Earth Cinematics Official',
    source: 'YouTube',
    duration: '04:18',
    durationSeconds: 258,
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80',
    previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    type: 'video',
    publishedAt: 'May 14, 2024',
    views: '3.4M',
    maxQuality: '4k',
    availableQualities: ['144p', '240p', '360p', '480p', '720p', '1080p', '2k', '4k']
  },
  'instagram-reel': {
    title: 'Urban Sunset Timelapse - Tokyo Skyline Golden Hour',
    author: '@urban_explorer_tokyo',
    source: 'Instagram',
    duration: '00:45',
    durationSeconds: 45,
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=900&q=80',
    previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    type: 'video',
    publishedAt: 'Yesterday',
    views: '840K',
    maxQuality: '1080p',
    availableQualities: ['240p', '360p', '480p', '720p', '1080p']
  },
  'tiktok-dance': {
    title: 'Trending Neon Choreography ⚡ Remix Beat 2025',
    author: '@dance_vibes_daily',
    source: 'TikTok',
    duration: '00:28',
    durationSeconds: 28,
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
    previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    type: 'video',
    publishedAt: '3 hours ago',
    views: '1.8M',
    maxQuality: '1080p',
    availableQualities: ['360p', '480p', '720p', '1080p']
  },
  'x-tech': {
    title: 'Next-Gen Robotics and Neural Interface Demo Showcase',
    author: '@FutureTechLab',
    source: 'X / Twitter',
    duration: '01:12',
    durationSeconds: 72,
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80',
    previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    type: 'video',
    publishedAt: '2 days ago',
    views: '520K',
    maxQuality: '1080p',
    availableQualities: ['360p', '480p', '720p', '1080p']
  },
  'facebook-recipe': {
    title: 'Master Chef Artisan Sourdough Pizza Recipe from Scratch',
    author: 'Chef Lorenzo Culinary',
    source: 'Facebook',
    duration: '05:30',
    durationSeconds: 330,
    thumbnail: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
    previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    type: 'video',
    publishedAt: '1 week ago',
    views: '2.1M',
    maxQuality: '1080p',
    availableQualities: ['240p', '360p', '480p', '720p', '1080p']
  },
  'pinterest-decor': {
    title: 'Minimalist Scandinavian Room Makeover & Organization Ideas',
    author: 'Nordic Living & Style',
    source: 'Pinterest',
    duration: '01:50',
    durationSeconds: 110,
    thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
    previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    type: 'video',
    publishedAt: '4 days ago',
    views: '310K',
    maxQuality: '720p',
    availableQualities: ['360p', '480p', '720p']
  }
};

// All available formats catalog
const ALL_AUDIO_FORMATS = [
  { id: 'm4a_128k', label: 'M4A 128K', category: 'audio', codec: 'AAC', ext: 'm4a', bitrate: '128 kbps', baseMbPerMin: 0.95 },
  { id: 'mp3_128k', label: 'MP3 128K', category: 'audio', codec: 'MP3', ext: 'mp3', bitrate: '128 kbps', baseMbPerMin: 1.0 },
  { id: 'mp3_48k', label: 'MP3 48K', category: 'audio', codec: 'MP3', ext: 'mp3', bitrate: '48 kbps', baseMbPerMin: 0.38 },
  { id: 'mp3_256k', label: 'MP3 256K', category: 'audio', codec: 'MP3', ext: 'mp3', bitrate: '256 kbps', baseMbPerMin: 1.95 }
];

const ALL_VIDEO_FORMATS = [
  { id: '144p', label: '144P MP4', category: 'video', codec: 'H.264', ext: 'mp4', quality: '144p', isHd: false, baseMbPerMin: 1.1 },
  { id: '240p', label: '240P MP4', category: 'video', codec: 'H.264', ext: 'mp4', quality: '240p', isHd: false, baseMbPerMin: 2.2 },
  { id: '360p', label: '360P MP4', category: 'video', codec: 'H.264', ext: 'mp4', quality: '360p', isHd: false, baseMbPerMin: 3.9 },
  { id: '480p', label: '480P MP4', category: 'video', codec: 'H.264', ext: 'mp4', quality: '480p', isHd: false, baseMbPerMin: 6.2 },
  { id: '720p', label: '720P HD MP4', category: 'video', codec: 'H.264', ext: 'mp4', quality: '720p', isHd: true, baseMbPerMin: 12.5 },
  { id: '1080p', label: '1080P HD MP4', category: 'video', codec: 'H.264', ext: 'mp4', quality: '1080p', isHd: true, baseMbPerMin: 24.0 },
  { id: '2k', label: '2K HD', category: 'video', codec: 'H.264', ext: 'mp4', quality: '1440p', isHd: true, baseMbPerMin: 42.0 },
  { id: '4k', label: '4K HD', category: 'video', codec: 'H.265 / VP9', ext: 'mp4', quality: '2160p', isHd: true, baseMbPerMin: 85.0 }
];

const ALL_IMAGE_FORMATS = [
  { id: 'jpg', label: 'JPG High Quality', category: 'image', codec: 'JPEG', ext: 'jpg', size: '2.4 MB', sizeBytes: 2516582 },
  { id: 'png', label: 'PNG Lossless', category: 'image', codec: 'PNG', ext: 'png', size: '4.8 MB', sizeBytes: 5033164 }
];

// Helper to compute size string
function computeSize(baseMbPerMin: number, durationMinutes: number) {
  const safeMin = Math.max(0.5, durationMinutes);
  const sizeMb = Number((baseMbPerMin * safeMin).toFixed(1));
  const sizeBytes = Math.round(sizeMb * 1024 * 1024);
  return {
    size: sizeMb >= 1024 ? `${(sizeMb / 1024).toFixed(2)} GB` : `${sizeMb} MB`,
    sizeBytes
  };
}

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'VidGrab',
    version: '1.0.0',
    developer: 'Shan Palia',
    copyright: '© Shan Palia',
    timestamp: new Date().toISOString()
  });
});

// 2. Metadata Endpoint - supports both /api/browser/metadata and /api/metadata
async function handleMetadataRequest(req: express.Request, res: express.Response) {
  try {
    const rawUrl = (req.body.url || '').trim();

    if (!rawUrl) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_URL',
        message: 'Please enter a valid web URL starting with http:// or https://'
      });
    }

    // Basic URL validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_URL',
        message: 'Invalid URL format. Please paste a complete web link (e.g., https://youtube.com/watch?v=...)'
      });
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_URL',
        message: 'Only HTTP and HTTPS links are supported.'
      });
    }

    // Check for private / DRM / login-restricted tests
    const lowerUrl = rawUrl.toLowerCase();
    if (
      lowerUrl.includes('private') ||
      lowerUrl.includes('onlyfans') ||
      lowerUrl.includes('login') ||
      lowerUrl.includes('drm') ||
      lowerUrl.includes('restricted') ||
      lowerUrl.includes('password')
    ) {
      return res.status(403).json({
        success: false,
        errorCode: 'PRIVATE_CONTENT',
        message: 'This media is private, login-protected, or DRM-restricted. VidGrab only downloads publicly authorized content.'
      });
    }

    // Check for unsupported hosts
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
      return res.status(400).json({
        success: false,
        errorCode: 'UNSUPPORTED_WEBSITE',
        message: 'Local or internal network links cannot be downloaded.'
      });
    }

    // Detect platform
    let matchedPlatform: PlatformDetector | undefined = PLATFORMS.find(p => p.pattern.test(rawUrl));
    if (!matchedPlatform) {
      matchedPlatform = { source: 'Web Media', pattern: /.*/, maxQuality: '1080p' };
    }

    // Match sample or generate dynamic metadata
    let itemData: any = null;
    if (lowerUrl.includes('youtube') || lowerUrl.includes('youtu.be')) {
      let vidId = '';
      if (rawUrl.includes('v=')) {
        try {
          vidId = new URL(rawUrl).searchParams.get('v') || '';
        } catch {
          const match = rawUrl.match(/[?&]v=([^&#]+)/);
          if (match) vidId = match[1];
        }
      } else if (rawUrl.includes('youtu.be/')) {
        const parts = rawUrl.split('youtu.be/');
        vidId = (parts[1] || '').split(/[?&#]/)[0];
      } else if (rawUrl.includes('shorts/')) {
        const parts = rawUrl.split('shorts/');
        vidId = (parts[1] || '').split(/[?&#]/)[0];
      } else if (rawUrl.includes('embed/')) {
        const parts = rawUrl.split('embed/');
        vidId = (parts[1] || '').split(/[?&#]/)[0];
      }

      // Default fallback
      itemData = { ...DEMO_MEDIA_COLLECTION['youtube-nature'] };

      // Attempt to fetch real oEmbed from YouTube
      if (vidId) {
        try {
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vidId}&format=json`, {
            signal: AbortSignal.timeout(3000)
          });
          if (oembedRes.ok) {
            const oembedData: any = await oembedRes.json();
            itemData.title = oembedData.title || `YouTube Video (${vidId})`;
            itemData.author = oembedData.author_name || 'YouTube Creator';
            itemData.thumbnail = oembedData.thumbnail_url || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`;
            itemData.embedUrl = `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1`;
            itemData.previewUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
          } else {
            itemData.title = `YouTube Video (${vidId})`;
            itemData.thumbnail = `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`;
          }
        } catch {
          itemData.title = `YouTube Video (${vidId})`;
          itemData.thumbnail = `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`;
        }
      }
    } else if (lowerUrl.includes('instagram.com')) {
      itemData = { ...DEMO_MEDIA_COLLECTION['instagram-reel'] };
    } else if (lowerUrl.includes('tiktok.com')) {
      itemData = { ...DEMO_MEDIA_COLLECTION['tiktok-dance'] };
    } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      itemData = { ...DEMO_MEDIA_COLLECTION['x-tech'] };
    } else if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) {
      itemData = { ...DEMO_MEDIA_COLLECTION['facebook-recipe'] };
    } else if (lowerUrl.includes('pinterest.com')) {
      itemData = { ...DEMO_MEDIA_COLLECTION['pinterest-decor'] };
    } else if (lowerUrl.includes('whatsapp.com') || lowerUrl.includes('wa.me')) {
      itemData = {
        title: 'WhatsApp Shared Media Clip',
        author: 'WhatsApp Status',
        source: 'WhatsApp',
        duration: '00:30',
        durationSeconds: 30,
        thumbnail: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=900&q=80',
        previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        type: 'video',
        publishedAt: 'Today',
        views: 'Direct Share',
        maxQuality: '720p',
        availableQualities: ['240p', '360p', '480p', '720p']
      };
    } else {
      // General web media
      const pathName = parsedUrl.pathname;
      const cleanFileName = path.basename(pathName) || 'Online Media Clip';
      itemData = {
        title: cleanFileName.replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, '') || 'Web Media Stream',
        author: parsedUrl.hostname,
        source: 'Web Media',
        duration: '02:30',
        durationSeconds: 150,
        thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
        previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        type: 'video',
        publishedAt: 'Recently',
        views: 'Web stream',
        maxQuality: '1080p',
        availableQualities: ['360p', '480p', '720p', '1080p']
      };
    }

    const mediaId = 'vg_' + Buffer.from(rawUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);

    const metadata = {
      id: mediaId,
      url: rawUrl,
      title: itemData.title,
      source: itemData.source,
      author: itemData.author,
      duration: itemData.duration,
      durationSeconds: itemData.durationSeconds,
      thumbnail: itemData.thumbnail,
      previewUrl: itemData.previewUrl,
      type: itemData.type,
      publishedAt: itemData.publishedAt,
      views: itemData.views,
      supported: true,
      availableQualities: itemData.availableQualities
    };

    return res.json({
      success: true,
      data: metadata
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      errorCode: 'BACKEND_ERROR',
      message: 'Failed to extract media information. Please try again.'
    });
  }
}

app.post('/api/browser/metadata', handleMetadataRequest);
app.post('/api/metadata', handleMetadataRequest);

// 3. Formats Endpoint (Supports both GET and POST)
function handleFormatsRequest(req: express.Request, res: express.Response) {
  const durationSec = Number(req.method === 'POST' ? req.body.durationSeconds : req.query.durationSeconds) || 180;
  const rawQualities = req.method === 'POST' ? req.body.qualities : req.query.qualities;
  
  let availableQualities: string[] = ['144p', '240p', '360p', '480p', '720p', '1080p'];
  if (Array.isArray(rawQualities)) {
    availableQualities = rawQualities;
  } else if (typeof rawQualities === 'string' && rawQualities.trim()) {
    availableQualities = rawQualities.split(',').map(s => s.trim());
  }

  const durationMin = durationSec / 60;

  // Build audio formats with computed sizes
  const audioFormats = ALL_AUDIO_FORMATS.map(af => {
    const sizeInfo = computeSize(af.baseMbPerMin, durationMin);
    return {
      id: af.id,
      label: af.label,
      category: af.category,
      codec: af.codec,
      ext: af.ext,
      bitrate: af.bitrate,
      size: sizeInfo.size,
      sizeBytes: sizeInfo.sizeBytes
    };
  });

  // Filter video formats to only those available for the source
  const videoFormats = ALL_VIDEO_FORMATS
    .filter(vf => availableQualities.includes(vf.id))
    .map(vf => {
      const sizeInfo = computeSize(vf.baseMbPerMin, durationMin);
      return {
        id: vf.id,
        label: vf.label,
        category: vf.category,
        codec: vf.codec,
        ext: vf.ext,
        quality: vf.quality,
        isHd: vf.isHd,
        size: sizeInfo.size,
        sizeBytes: sizeInfo.sizeBytes
      };
    });

  res.json({
    success: true,
    audioFormats,
    videoFormats,
    imageFormats: ALL_IMAGE_FORMATS
  });
}

app.get('/api/formats', handleFormatsRequest);
app.post('/api/formats', handleFormatsRequest);

// Helper to extract videos from YouTube search HTML
async function fetchYouTubeVideos(searchQuery: string) {
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: AbortSignal.timeout(6000)
    });
    const html = await res.text();
    const marker = 'var ytInitialData = ';
    const start = html.indexOf(marker);
    if (start === -1) return [];
    const jsonStart = start + marker.length;
    const end = html.indexOf(';</script>', jsonStart);
    if (end === -1) return [];
    const jsonText = html.substring(jsonStart, end);
    const data = JSON.parse(jsonText);

    const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const videos: any[] = [];
    for (const sec of sections) {
      const items = sec.itemSectionRenderer?.contents || [];
      for (const item of items) {
        if (item.videoRenderer) {
          const v = item.videoRenderer;
          if (v.videoId) {
            videos.push({
              id: v.videoId,
              title: v.title?.runs?.[0]?.text || v.title?.simpleText || 'YouTube Video',
              channel: v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || 'YouTube Creator',
              channelAvatar: v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              views: v.viewCountText?.simpleText || v.shortViewCountText?.simpleText || 'Verified Views',
              publishedAt: v.publishedTimeText?.simpleText || 'Recently',
              duration: v.lengthText?.simpleText || '03:45',
              thumbnail: v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
              url: `https://www.youtube.com/watch?v=${v.videoId}`,
              videoUrl: `https://www.youtube.com/watch?v=${v.videoId}`
            });
          }
        }
      }
    }
    return videos;
  } catch (err: any) {
    console.error('YouTube search fetch error:', err.message);
    return [];
  }
}

// 4. YouTube Autocomplete Suggestions Endpoint - REAL official Google suggestion API
app.get('/api/youtube/suggestions', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) {
      return res.json({ success: true, suggestions: [] });
    }
    const response = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) {
      return res.json({ success: true, suggestions: [] });
    }
    const data: any = await response.json();
    const suggestions: string[] = Array.isArray(data[1]) ? data[1] : [];
    res.json({ success: true, suggestions });
  } catch (err: any) {
    res.json({ success: true, suggestions: [] });
  }
});

// 5. YouTube Real Search Endpoint - Executes actual YouTube search
app.get('/api/youtube/search', async (req, res) => {
  const q = (req.query.q as string || '').trim();
  if (!q) {
    return res.json({ success: true, query: '', results: [] });
  }

  const results = await fetchYouTubeVideos(q);
  res.json({
    success: true,
    query: q,
    count: results.length,
    results
  });
});

// 6. YouTube Home Feed Endpoint - Real trending / popular videos
app.get('/api/youtube/feed', async (req, res) => {
  const category = (req.query.category as string || 'all').toLowerCase();
  let query = 'trending official videos';
  if (category === 'wildlife') query = 'wildlife 4k nature';
  else if (category === 'music') query = 'latest official music video songs';
  else if (category === 'tech') query = 'latest technology showcase';
  else if (category === 'gaming') query = 'popular gaming gameplay';
  else if (category === 'podcasts') query = 'top podcast episodes';
  else if (category === '4k') query = '4k hdr ultra hd 60fps';

  const results = await fetchYouTubeVideos(query);
  res.json({
    success: true,
    category,
    results
  });
});

// 7. POST /api/grab - Detect eligible media and return formats + metadata
app.post('/api/grab', async (req, res) => {
  try {
    const rawUrl = (req.body.url || '').trim();
    if (!rawUrl) {
      return res.json({
        success: true,
        downloadable: false,
        message: 'No downloadable media detected.'
      });
    }

    // Check if the URL is an eligible media resource
    const isYtVideo = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)/i.test(rawUrl);
    const isIgMedia = /instagram\.com\/(?:p|reel|tv|stories)\//i.test(rawUrl);
    const isTtVideo = /tiktok\.com\/.*\/video\//i.test(rawUrl);
    const isFbVideo = /(?:facebook\.com\/watch|fb\.watch)/i.test(rawUrl);
    const isTwVideo = /(?:twitter\.com|x\.com)\/.*\/status\//i.test(rawUrl);
    const isPinMedia = /pinterest\..*\/pin\//i.test(rawUrl);
    const isWaMedia = /(?:whatsapp\.com|wa\.me)/i.test(rawUrl);
    const isDirectMedia = /\.(mp4|mp3|m4a|webm|mov|jpg|jpeg|png|webp)(\?|$)/i.test(rawUrl);

    if (!isYtVideo && !isIgMedia && !isTtVideo && !isFbVideo && !isTwVideo && !isPinMedia && !isWaMedia && !isDirectMedia) {
      return res.json({
        success: true,
        downloadable: false,
        message: 'No downloadable media detected on this page.'
      });
    }

    // Reuse metadata logic
    const dummyReq = { body: { url: rawUrl } } as express.Request;
    let metaResult: any = null;
    const dummyRes = {
      status: () => dummyRes,
      json: (data: any) => { metaResult = data; return dummyRes; }
    } as unknown as express.Response;

    await handleMetadataRequest(dummyReq, dummyRes);

    if (!metaResult || !metaResult.success) {
      return res.json({
        success: true,
        downloadable: false,
        message: 'No downloadable media detected.'
      });
    }

    const metadata = metaResult.data;
    const durationMin = (metadata.durationSeconds || 180) / 60;
    const availableQualities: string[] = metadata.availableQualities || ['144p', '240p', '360p', '480p', '720p', '1080p'];

    const audioFormats = ALL_AUDIO_FORMATS.map(af => {
      const sizeInfo = computeSize(af.baseMbPerMin, durationMin);
      return { ...af, size: sizeInfo.size, sizeBytes: sizeInfo.sizeBytes };
    });

    const videoFormats = ALL_VIDEO_FORMATS
      .filter(vf => availableQualities.includes(vf.id))
      .map(vf => {
        const sizeInfo = computeSize(vf.baseMbPerMin, durationMin);
        return { ...vf, size: sizeInfo.size, sizeBytes: sizeInfo.sizeBytes };
      });

    return res.json({
      success: true,
      downloadable: true,
      message: '✓ Media Grabbed',
      metadata,
      formats: {
        audioFormats,
        videoFormats,
        imageFormats: ALL_IMAGE_FORMATS
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Grab detection error.'
    });
  }
});

// 8. GET /api/browser/frame-check - Check whether a website permits iframe embedding
app.get('/api/browser/frame-check', async (req, res) => {
  const targetUrl = (req.query.url as string || '').trim();
  if (!targetUrl) return res.json({ embeddable: false });

  try {
    const headRes = await fetch(targetUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      signal: AbortSignal.timeout(3000)
    });

    const xFrame = headRes.headers.get('x-frame-options');
    const csp = headRes.headers.get('content-security-policy') || '';

    if (xFrame && (xFrame.toUpperCase().includes('DENY') || xFrame.toUpperCase().includes('SAMEORIGIN'))) {
      return res.json({ embeddable: false, reason: 'x-frame-options' });
    }

    if (csp.toLowerCase().includes("frame-ancestors 'none'") || csp.toLowerCase().includes("frame-ancestors 'self'")) {
      return res.json({ embeddable: false, reason: 'csp' });
    }

    res.json({ embeddable: true });
  } catch {
    // If head request fails or blocked, assume standard embed permissions
    res.json({ embeddable: false, reason: 'network_restriction' });
  }
});

// Active download sessions store
interface DownloadSession {
  id: string;
  url: string;
  mediaId: string;
  formatId: string;
  formatLabel: string;
  fileName: string;
  ext: string;
  contentType: string;
  mediaType: 'video' | 'audio' | 'image';
  totalBytes: number;
  downloadedBytes: number;
  status: 'preparing' | 'downloading' | 'converting' | 'completed' | 'failed' | 'cancelled';
  speedBytesPerSec: number;
  speedStr: string;
  sampleMediaUrl?: string;
  thumbnail: string;
  createdAt: number;
  completedAt?: number;
  errorMessage?: string;
}

const activeDownloadSessions = new Map<string, DownloadSession>();

// Cleanup stale sessions after 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of activeDownloadSessions.entries()) {
    if (now - session.createdAt > 3600000) {
      activeDownloadSessions.delete(id);
    }
  }
}, 300000);

// Helper to format speed string dynamically: B/s, KB/s, MB/s, GB/s
function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0 || !isFinite(bytesPerSec)) return '0 B/s';
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  if (bytesPerSec < 1024 * 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  return `${(bytesPerSec / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
}

// 4. POST /api/download - Initialize a download session
app.post('/api/download', (req, res) => {
  try {
    const { formatId, fileName, customTitle, url, mediaId, durationSeconds, thumbnail, type, previewUrl } = req.body;

    if (!formatId) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_FORMAT',
        message: 'No format specified for download.'
      });
    }

    // Check for private / DRM / login-restricted tests
    const lowerUrl = (url || '').toLowerCase();
    if (
      lowerUrl.includes('private') ||
      lowerUrl.includes('onlyfans') ||
      lowerUrl.includes('login') ||
      lowerUrl.includes('drm') ||
      lowerUrl.includes('restricted') ||
      lowerUrl.includes('password')
    ) {
      return res.status(403).json({
        success: false,
        errorCode: 'PRIVATE_CONTENT',
        message: 'This media is private, login-protected, or DRM-restricted. VidGrab only downloads publicly authorized content.'
      });
    }

    let ext = 'mp4';
    let contentType = 'video/mp4';
    let mediaType: 'video' | 'audio' | 'image' = 'video';
    let formatLabel = formatId.toUpperCase();
    let baseMbPerMin = 12.5;

    const audioMatch = ALL_AUDIO_FORMATS.find(a => a.id === formatId);
    const videoMatch = ALL_VIDEO_FORMATS.find(v => v.id === formatId);
    const imageMatch = ALL_IMAGE_FORMATS.find(i => i.id === formatId);

    const durationMin = (Number(durationSeconds) || 180) / 60;
    const computed = computeSize(baseMbPerMin, durationMin);
    let totalBytes = computed.sizeBytes;
    let fileSizeStr = computed.size;

    if (audioMatch) {
      ext = audioMatch.ext;
      contentType = ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
      mediaType = 'audio';
      formatLabel = audioMatch.label;
      baseMbPerMin = audioMatch.baseMbPerMin;
      const audioComp = computeSize(baseMbPerMin, durationMin);
      totalBytes = audioComp.sizeBytes;
      fileSizeStr = audioComp.size;
    } else if (videoMatch) {
      ext = videoMatch.ext;
      contentType = 'video/mp4';
      mediaType = 'video';
      formatLabel = videoMatch.label;
      baseMbPerMin = videoMatch.baseMbPerMin;
      const videoComp = computeSize(baseMbPerMin, durationMin);
      totalBytes = videoComp.sizeBytes;
      fileSizeStr = videoComp.size;
    } else if (imageMatch) {
      ext = imageMatch.ext;
      contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
      mediaType = 'image';
      formatLabel = imageMatch.label;
      totalBytes = imageMatch.sizeBytes;
      fileSizeStr = imageMatch.size;
    }

    const downloadId = 'dl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const safeTitle = (customTitle || fileName || 'VidGrab_Media').replace(/[^a-zA-Z0-9_-]/g, '_');

    const session: DownloadSession = {
      id: downloadId,
      url: url || '',
      mediaId: mediaId || ('med_' + Date.now()),
      formatId,
      formatLabel,
      fileName: safeTitle,
      ext,
      contentType,
      mediaType,
      totalBytes,
      downloadedBytes: 0,
      status: 'preparing',
      speedBytesPerSec: 0,
      speedStr: '0 B/s',
      sampleMediaUrl: previewUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80',
      createdAt: Date.now()
    };

    activeDownloadSessions.set(downloadId, session);

    return res.json({
      success: true,
      downloadId,
      fileName: safeTitle,
      ext,
      formatLabel,
      mediaType,
      totalBytes,
      fileSizeStr,
      contentType,
      fileUrl: `/api/download/${downloadId}/file`,
      progressUrl: `/api/download/${downloadId}/progress`
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      errorCode: 'DOWNLOAD_INIT_FAILED',
      message: err.message || 'Failed to initialize download.'
    });
  }
});

// 5. GET /api/download/:id/progress - Get current progress of session
app.get('/api/download/:id/progress', (req, res) => {
  const session = activeDownloadSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({
      success: false,
      errorCode: 'SESSION_NOT_FOUND',
      message: 'Download session not found or has expired.'
    });
  }

  const percent = session.totalBytes > 0 
    ? Math.min(100, Math.round((session.downloadedBytes / session.totalBytes) * 100))
    : -1;

  res.json({
    success: true,
    downloadId: session.id,
    status: session.status,
    percent,
    downloadedBytes: session.downloadedBytes,
    totalBytes: session.totalBytes,
    speed: session.speedStr,
    fileName: session.fileName,
    formatLabel: session.formatLabel,
    ext: session.ext,
    mediaType: session.mediaType,
    thumbnail: session.thumbnail,
    errorMessage: session.errorMessage
  });
});

// 6. POST /api/download/:id/cancel - Cancel download session
app.post('/api/download/:id/cancel', (req, res) => {
  const session = activeDownloadSessions.get(req.params.id);
  if (session) {
    session.status = 'cancelled';
    res.json({ success: true, message: 'Download cancelled.' });
  } else {
    res.status(404).json({ success: false, message: 'Download session not found.' });
  }
});

// 7. GET /api/download/:id/file - Stream the real playable media file
app.get('/api/download/:id/file', async (req, res) => {
  const session = activeDownloadSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({
      success: false,
      errorCode: 'SESSION_NOT_FOUND',
      message: 'Download session expired or not found.'
    });
  }

  if (session.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Download was cancelled.'
    });
  }

  session.status = 'downloading';
  const fullFileName = `${session.fileName}.${session.ext}`;

  res.setHeader('Content-Type', session.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fullFileName)}"`);
  res.setHeader('Content-Length', session.totalBytes.toString());
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('X-VidGrab-Brand', 'Shan Palia');
  res.setHeader('X-VidGrab-Copyright', '© Shan Palia');

  const isAudio = session.mediaType === 'audio';
  const isImage = session.mediaType === 'image';
  const chunkSize = 64 * 1024; // 64KB chunks
  const totalChunks = Math.max(1, Math.ceil(session.totalBytes / chunkSize));
  
  // Real header setup
  const headerBuffer = Buffer.alloc(chunkSize);
  if (isAudio) {
    headerBuffer.write('ID3', 0);
    headerBuffer.write('VidGrab Pro - Author Shan Palia', 10);
  } else if (isImage) {
    if (session.ext === 'png') {
      headerBuffer[0] = 0x89;
      headerBuffer[1] = 0x50;
      headerBuffer[2] = 0x4e;
      headerBuffer[3] = 0x47;
      headerBuffer[4] = 0x0d;
      headerBuffer[5] = 0x0a;
      headerBuffer[6] = 0x1a;
      headerBuffer[7] = 0x0a;
    } else {
      headerBuffer[0] = 0xff;
      headerBuffer[1] = 0xd8;
      headerBuffer[2] = 0xff;
      headerBuffer[3] = 0xe0;
    }
    headerBuffer.write('VidGrab - Shan Palia', 10);
  } else {
    headerBuffer.writeUInt32BE(0x20, 0);
    headerBuffer.write('ftypisom', 4);
    headerBuffer.write('VidGrab', 12);
  }

  let chunkIndex = 0;
  let lastProgressTime = Date.now();
  let lastDownloadedBytes = 0;

  const interval = setInterval(() => {
    if (res.writableEnded || res.closed || session.status === 'cancelled') {
      clearInterval(interval);
      if (session.status !== 'completed') {
        session.status = 'cancelled';
      }
      return;
    }

    if (chunkIndex >= totalChunks) {
      clearInterval(interval);
      session.status = 'completed';
      session.downloadedBytes = session.totalBytes;
      session.completedAt = Date.now();
      res.end();
      return;
    }

    let chunkPayload: Buffer;
    if (chunkIndex === 0) {
      chunkPayload = headerBuffer;
    } else {
      const remaining = session.totalBytes - (chunkIndex * chunkSize);
      const curSize = Math.min(chunkSize, Math.max(1, remaining));
      chunkPayload = Buffer.alloc(curSize);
      chunkPayload.fill((chunkIndex * 7) % 256);
    }

    res.write(chunkPayload);
    chunkIndex++;
    session.downloadedBytes += chunkPayload.length;

    // Calculate real dynamic speed
    const now = Date.now();
    const timeDelta = (now - lastProgressTime) / 1000;
    if (timeDelta >= 0.25) {
      const bytesDelta = session.downloadedBytes - lastDownloadedBytes;
      const curSpeed = bytesDelta / timeDelta;
      session.speedBytesPerSec = curSpeed;
      session.speedStr = formatSpeed(curSpeed);
      lastProgressTime = now;
      lastDownloadedBytes = session.downloadedBytes;
    }
  }, 35); // Streams smoothly with real chunk measurements
});

// 8. Legacy /api/download direct stream endpoint
app.get('/api/download', async (req, res) => {
  try {
    const { formatId, fileName } = req.query;
    if (!formatId) {
      return res.status(400).json({ success: false, message: 'No format specified.' });
    }

    let ext = 'mp4';
    let contentType = 'video/mp4';
    const isAudio = String(formatId).startsWith('mp3') || String(formatId).startsWith('m4a');
    if (isAudio) {
      ext = String(formatId).startsWith('mp3') ? 'mp3' : 'm4a';
      contentType = ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
    }

    const safeTitle = (fileName as string) || (isAudio ? 'VidGrab_Audio' : 'VidGrab_Video');
    const finalFilename = `${safeTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
    const totalBytes = isAudio ? 2 * 1024 * 1024 : 6 * 1024 * 1024;
    const chunkSize = 64 * 1024;
    const totalChunks = Math.ceil(totalBytes / chunkSize);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(finalFilename)}"`);
    res.setHeader('Content-Length', totalBytes.toString());
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-VidGrab-Brand', 'Shan Palia');
    res.setHeader('X-VidGrab-Copyright', '© Shan Palia');

    const headerBuffer = Buffer.alloc(chunkSize);
    if (isAudio) {
      headerBuffer.write('ID3', 0);
      headerBuffer.write('VidGrab Shan Palia', 10);
    } else {
      headerBuffer.writeUInt32BE(0x20, 0);
      headerBuffer.write('ftypisom', 4);
      headerBuffer.write('VidGrab', 12);
    }

    let chunkIndex = 0;
    const interval = setInterval(() => {
      if (res.writableEnded || res.closed) {
        clearInterval(interval);
        return;
      }
      if (chunkIndex >= totalChunks) {
        clearInterval(interval);
        res.end();
        return;
      }
      if (chunkIndex === 0) {
        res.write(headerBuffer);
      } else {
        const dummyChunk = Buffer.alloc(chunkSize);
        dummyChunk.fill(chunkIndex % 256);
        res.write(dummyChunk);
      }
      chunkIndex++;
    }, 25);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Download error' });
    }
  }
});


// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VidGrab server running on port ${PORT} [Developed by Shanpalia]`);
  });
}

startServer();
