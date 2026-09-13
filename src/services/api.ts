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
  /** Never call response.json() blindly: reverse proxies and failed API routes can return HTML. */
  private static async readJson(response: Response): Promise<any> {
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const text = await response.text();
    const trimmed = text.trim();
    if (!trimmed) throw new Error('VidGrab service returned an empty response. Please try again.');
    if (trimmed.startsWith('<') || contentType.includes('text/html')) {
      throw new Error(response.ok ? 'VidGrab service returned an invalid response. Please try again.' : `VidGrab service is unavailable (HTTP ${response.status}).`);
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error('VidGrab service returned invalid data. Please try again.');
    }
  }

  static async getMetadata(url: string): Promise<MediaMetadata> {
    try {
      const response = await fetch('/api/metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await this.readJson(response);
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
      const data = await this.readJson(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to retrieve available formats.');
      return { audioFormats: data.audioFormats || [], videoFormats: data.videoFormats || [], imageFormats: data.imageFormats || [] };
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) throw new Error('Download service is not configured.');
      throw new Error(err.message || 'Error fetching format choices.');
    }
  }

  static async initDownload(params: InitDownloadParams): Promise<InitDownloadResponse> {
    const response = await fetch('/api/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
    const data = await this.readJson(response);
    if (!response.ok || !data.success) throw new Error(data.message || this.mapErrorCode(data.errorCode || 'DOWNLOAD_ERROR'));
    return data;
  }

  static async getProgress(downloadId: string): Promise<DownloadProgressInfo> {
    const response = await fetch(`/api/download/${encodeURIComponent(downloadId)}/progress`);
    const data = await this.readJson(response);
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
      try { const j = await this.readJson(response); errText = j.message || errText; } catch {}
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
    try { const response = await fetch('/api/grab', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }); return await this.readJson(response); }
    catch { return { downloadable: false, message: 'No downloadable media detected.' }; }
  }

  static async getYouTubeSuggestions(query: string): Promise<string[]> {
    if (!query.trim()) return [];
    try { const res = await fetch(`/api/youtube/suggestions?q=${encodeURIComponent(query.trim())}`); const data = await this.readJson(res); return data.suggestions || []; } catch { return []; }
  }

  static async getYouTubeSearchFromPublicApi(query: string): Promise<any[]> {
    const q = query.trim();
    if (!q) return [];
    const instances = ['https://pipedapi.kavin.rocks','https://pipedapi.leptons.xyz','https://pipedapi.nosebs.ru','https://pipedapi.adminforge.de','https://api.piped.yt'];
    for (const base of instances) {
      try {
        const res = await fetch(`${base}/search?q=${encodeURIComponent(q)}&filter=videos`, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const data = await this.readJson(res);
        const items = Array.isArray(data?.items) ? data.items : [];
        const results = items.filter((item: any) => item?.type === 'stream' && item?.id).slice(0, 20).map((item: any) => ({ id: item.id, title: item.title || 'YouTube Video', channel: item.uploaderName || 'YouTube', views: item.views ? `${item.views} views` : '', publishedAt: item.uploadedDate ? String(item.uploadedDate) : '', duration: item.duration ? String(item.duration) : '', thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`, url: `https://www.youtube.com/watch?v=${item.id}`, videoUrl: `https://www.youtube.com/watch?v=${item.id}` }));
        if (results.length) return results;
      } catch {}
    }
    return [];
  }

  static async getYouTubeSearch(query: string): Promise<any[]> {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query.trim())}`, { signal: AbortSignal.timeout(7000) });
      const data = await this.readJson(res);
      if (Array.isArray(data.results) && data.results.length) return data.results;
    } catch {}
    return this.getYouTubeSearchFromPublicApi(query);
  }

  static async getYouTubeFeed(category: string = 'all'): Promise<any[]> {
    try { const res = await fetch(`/api/youtube/feed?category=${encodeURIComponent(category)}`); const data = await this.readJson(res); return data.results || []; } catch { return []; }
  }

  static async checkFrameEmbeddable(url: string): Promise<{ embeddable: boolean; reason?: string }> {
    try { const res = await fetch(`/api/browser/frame-check?url=${encodeURIComponent(url)}`); return await this.readJson(res); } catch { return { embeddable: false, reason: 'network_restriction' }; }
  }
}
