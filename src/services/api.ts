import { MediaMetadata, FormatsResponse, DownloadProgressInfo, DownloadStatus } from '../types';

export interface ApiErrorResponse {
  success: false;
  errorCode: string;
  message: string;
}

export interface InitDownloadParams {
  formatId: string;
  fileName?: string;
  customTitle?: string;
  url?: string;
  mediaId?: string;
  durationSeconds?: number;
  thumbnail?: string;
  type?: string;
  previewUrl?: string;
}

export interface InitDownloadResponse {
  success: boolean;
  downloadId: string;
  fileName: string;
  ext: string;
  formatLabel: string;
  mediaType: 'video' | 'audio' | 'image';
  totalBytes: number;
  fileSizeStr: string;
  contentType: string;
  fileUrl: string;
  progressUrl: string;
}

export class ApiService {
  static async getMetadata(url: string): Promise<MediaMetadata> {
    try {
      const response = await fetch('/api/metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || this.mapErrorCode(data.errorCode || 'BACKEND_ERROR'));
      return data.data;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) throw new Error('Download service is not configured.');
      throw err;
    }
  }

  static async getFormats(durationSeconds = 180, availableQualities: string[] = [], url?: string): Promise<FormatsResponse> {
    try {
      const response = await fetch('/api/formats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ durationSeconds, qualities: availableQualities, url }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to retrieve available formats.');
      return { audioFormats: data.audioFormats || [], videoFormats: data.videoFormats || [], imageFormats: data.imageFormats || [] };
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) throw new Error('Download service is not configured.');
      throw new Error(err.message || 'Error fetching format choices.');
    }
  }

  static async initDownload(params: InitDownloadParams): Promise<InitDownloadResponse> {
    const response = await fetch('/api/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || this.mapErrorCode(data.errorCode || 'DOWNLOAD_ERROR'));
    return data;
  }

  static async getProgress(downloadId: string): Promise<DownloadProgressInfo> {
    const response = await fetch(`/api/download/${encodeURIComponent(downloadId)}/progress`);
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to check download progress.');
    return { downloadId: data.downloadId, status: data.status, percent: data.percent, downloadedBytes: data.downloadedBytes, totalBytes: data.totalBytes, speed: data.speed, fileName: data.fileName, formatLabel: data.formatLabel, ext: data.ext, type: data.mediaType, thumbnail: data.thumbnail, errorMessage: data.errorMessage };
  }

  static async cancelDownload(downloadId: string): Promise<boolean> {
    try { const response = await fetch(`/api/download/${encodeURIComponent(downloadId)}/cancel`, { method: 'POST' }); return response.ok; } catch { return false; }
  }

  static async downloadFileStream(downloadId: string, signal?: AbortSignal, onProgress?: (info: { percent: number; downloadedBytes: number; totalBytes: number; speed: string; status: DownloadStatus }) => void): Promise<{ blob: Blob; contentType: string }> {
    const response = await fetch(`/api/download/${encodeURIComponent(downloadId)}/file`, { signal });
    if (!response.ok) {
      let errText = 'Failed to retrieve media file from server.';
      try { const j = await response.json(); errText = j.message || errText; } catch {}
      throw new Error(errText);
    }
    const contentType = response.headers.get('Content-Type') || 'video/mp4';
    const contentLengthHeader = response.headers.get('Content-Length');
    const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
    if (!response.body) {
      const blob = await response.blob();
      onProgress?.({ percent: 100, downloadedBytes: totalBytes || blob.size, totalBytes: totalBytes || blob.size, speed: '0 B/s', status: 'completed' });
      return { blob, contentType };
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let downloadedBytes = 0;
    let lastSampleTime = performance.now();
    let lastSampleBytes = 0;
    let currentSpeedStr = '0 B/s';
    while (true) {
      if (signal?.aborted) throw new Error('DOWNLOAD_CANCELLED');
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        downloadedBytes += value.length;
        const now = performance.now();
        const timeDiffSec = (now - lastSampleTime) / 1000;
        if (timeDiffSec >= 0.25) {
          currentSpeedStr = this.formatSpeed((downloadedBytes - lastSampleBytes) / timeDiffSec);
          lastSampleTime = now;
          lastSampleBytes = downloadedBytes;
        }
        const percent = totalBytes > 0 ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100)) : -1;
        onProgress?.({ percent, downloadedBytes, totalBytes, speed: currentSpeedStr, status: percent >= 100 ? 'converting' : 'downloading' });
      }
    }
    const finalBlob = new Blob(chunks, { type: contentType });
    onProgress?.({ percent: 100, downloadedBytes: totalBytes || finalBlob.size, totalBytes: totalBytes || finalBlob.size, speed: currentSpeedStr, status: 'completed' });
    return { blob: finalBlob, contentType };
  }

  static formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec <= 0 || !isFinite(bytesPerSec)) return '0 B/s';
    if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)} B/s`;
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    if (bytesPerSec < 1024 * 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    return `${(bytesPerSec / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
  }

  static formatBytes(bytes: number): string {
    if (bytes <= 0 || !isFinite(bytes)) return '0 MB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  static mapErrorCode(code: string): string {
    switch (code) {
      case 'INVALID_URL': return 'Please enter a valid video or media link starting with http:// or https://';
      case 'UNSUPPORTED_WEBSITE': return 'This website is not currently supported. Try links from YouTube, Instagram, TikTok, Facebook, WhatsApp, X, or Pinterest.';
      case 'PRIVATE_CONTENT': return 'This media is private, login-protected, or DRM-restricted. VidGrab only processes publicly authorized content.';
      case 'NO_MEDIA': return 'No downloadable video or audio streams were found at this link.';
      case 'BACKEND_ERROR': return 'VidGrab backend service is temporarily busy. Please try again.';
      case 'CONVERSION_ERROR': return 'Unable to convert media into the requested format. Please choose another quality.';
      case 'DOWNLOAD_ERROR': return 'Download interrupted. Please check your connection and retry.';
      case 'DOWNLOAD_CANCELLED': return 'Download was cancelled by user.';
      default: return 'An unexpected error occurred. Please try again.';
    }
  }

  static async grab(url: string): Promise<{ downloadable: boolean; message: string; metadata?: MediaMetadata; formats?: FormatsResponse }> {
    try { const response = await fetch('/api/grab', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }); return await response.json(); }
    catch { return { downloadable: false, message: 'No downloadable media detected.' }; }
  }

  static async getYouTubeSuggestions(query: string): Promise<string[]> {
    if (!query.trim()) return [];
    try { const res = await fetch(`/api/youtube/suggestions?q=${encodeURIComponent(query.trim())}`); const data = await res.json(); return data.suggestions || []; } catch { return []; }
  }

  // Real search for standalone APKs: backend -> Piped instances -> YouTube HTML proxies.
  static async getYouTubeSearchFromPublicApi(query: string): Promise<any[]> {
    const q = query.trim();
    if (!q) return [];
    const instances = ['https://pipedapi.kavin.rocks','https://pipedapi.leptons.xyz','https://pipedapi.nosebs.ru','https://pipedapi.adminforge.de','https://api.piped.yt'];
    for (const base of instances) {
      try {
        const res = await fetch(`${base}/search?q=${encodeURIComponent(q)}&filter=videos`, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        const results = items.filter((item: any) => item?.type === 'stream' && item?.id).slice(0, 20).map((item: any) => ({
          id: item.id,
          title: item.title || 'YouTube Video',
          channel: item.uploaderName || 'YouTube',
          views: item.views ? `${item.views} views` : '',
          publishedAt: item.uploadedDate ? String(item.uploadedDate) : '',
          duration: item.duration ? String(item.duration) : '',
          thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${item.id}`,
          videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
        }));
        if (results.length) return results;
      } catch {}
    }
    const targets = [
      `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
      `https://m.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    ];
    const proxies = ['https://api.allorigins.win/get?url=', 'https://corsproxy.io/?url='];
    for (const target of targets) for (const prefix of proxies) {
      try {
        const res = await fetch(prefix + encodeURIComponent(target), { signal: AbortSignal.timeout(12000) });
        if (!res.ok) continue;
        const data = await res.json();
        const html = String(data.contents || data.data || '');
        const marker = html.indexOf('ytInitialData');
        if (marker < 0) continue;
        const start = html.indexOf('{', marker);
        if (start < 0) continue;
        let depth = 0, inString = false, escaped = false, end = -1;
        for (let i = start; i < html.length; i++) {
          const ch = html[i];
          if (inString) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === '"') inString = false; continue; }
          if (ch === '"') inString = true;
          else if (ch === '{') depth++;
          else if (ch === '}' && --depth === 0) { end = i + 1; break; }
        }
        if (end < 0) continue;
        let root: any; try { root = JSON.parse(html.slice(start, end)); } catch { continue; }
        const out: any[] = [], seen = new Set<string>();
        const text = (node: any) => node?.simpleText || (Array.isArray(node?.runs) ? node.runs.map((r: any) => r?.text || '').join('') : '');
        const walk = (node: any) => {
          if (!node || out.length >= 20) return;
          if (Array.isArray(node)) { node.forEach(walk); return; }
          if (typeof node !== 'object') return;
          const v = node.videoRenderer;
          if (v?.videoId && !seen.has(v.videoId)) {
            seen.add(v.videoId);
            const thumbs = v.thumbnail?.thumbnails || [];
            out.push({ id: v.videoId, title: text(v.title) || 'YouTube Video', channel: text(v.ownerText) || 'YouTube', views: text(v.viewCountText) || '', publishedAt: text(v.publishedTimeText) || '', duration: text(v.lengthText) || '', thumbnail: thumbs.length ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`, url: `https://www.youtube.com/watch?v=${v.videoId}`, videoUrl: `https://www.youtube.com/watch?v=${v.videoId}` });
          }
          Object.values(node).forEach(walk);
        };
        walk(root);
        if (out.length) return out;
      } catch {}
    }
    return [];
  }

  static async getYouTubeSearch(query: string): Promise<any[]> {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query.trim())}`, { signal: AbortSignal.timeout(7000) });
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length) return data.results;
    } catch {}
    return this.getYouTubeSearchFromPublicApi(query);
  }

  static async getYouTubeFeed(category: string = 'all'): Promise<any[]> {
    try { const res = await fetch(`/api/youtube/feed?category=${encodeURIComponent(category)}`); const data = await res.json(); return data.results || []; } catch { return []; }
  }

  static async checkFrameEmbeddable(url: string): Promise<{ embeddable: boolean; reason?: string }> {
    try { const res = await fetch(`/api/browser/frame-check?url=${encodeURIComponent(url)}`); return await res.json(); } catch { return { embeddable: false, reason: 'network_restriction' }; }
  }
}
