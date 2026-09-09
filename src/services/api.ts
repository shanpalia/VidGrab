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
  // 1. Fetch media metadata - POST /api/metadata
  static async getMetadata(url: string): Promise<MediaMetadata> {
    try {
      const response = await fetch('/api/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.message || this.mapErrorCode(data.errorCode || 'BACKEND_ERROR');
        throw new Error(errorMsg);
      }

      return data.data;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Download service is not configured.');
      }
      throw err;
    }
  }

  // 2. Fetch formats tailored to media - POST /api/formats
  static async getFormats(durationSeconds = 180, availableQualities: string[] = [], url?: string): Promise<FormatsResponse> {
    try {
      const response = await fetch('/api/formats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          durationSeconds,
          qualities: availableQualities,
          url,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to retrieve available formats.');
      }

      return {
        audioFormats: data.audioFormats || [],
        videoFormats: data.videoFormats || [],
        imageFormats: data.imageFormats || [],
      };
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Download service is not configured.');
      }
      throw new Error(err.message || 'Error fetching format choices.');
    }
  }

  // 3. Initialize download session - POST /api/download
  static async initDownload(params: InitDownloadParams): Promise<InitDownloadResponse> {
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const msg = data.message || this.mapErrorCode(data.errorCode || 'DOWNLOAD_ERROR');
      throw new Error(msg);
    }

    return data;
  }

  // 4. Get download progress - GET /api/download/:id/progress
  static async getProgress(downloadId: string): Promise<DownloadProgressInfo> {
    const response = await fetch(`/api/download/${encodeURIComponent(downloadId)}/progress`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to check download progress.');
    }

    return {
      downloadId: data.downloadId,
      status: data.status,
      percent: data.percent,
      downloadedBytes: data.downloadedBytes,
      totalBytes: data.totalBytes,
      speed: data.speed,
      fileName: data.fileName,
      formatLabel: data.formatLabel,
      ext: data.ext,
      type: data.mediaType,
      thumbnail: data.thumbnail,
      errorMessage: data.errorMessage,
    };
  }

  // 5. Cancel download - POST /api/download/:id/cancel
  static async cancelDownload(downloadId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/download/${encodeURIComponent(downloadId)}/cancel`, {
        method: 'POST',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // 6. Download file stream - GET /api/download/:id/file with real chunk progress & speed calculation
  static async downloadFileStream(
    downloadId: string,
    signal?: AbortSignal,
    onProgress?: (info: {
      percent: number;
      downloadedBytes: number;
      totalBytes: number;
      speed: string;
      status: DownloadStatus;
    }) => void
  ): Promise<{ blob: Blob; contentType: string }> {
    const fileUrl = `/api/download/${encodeURIComponent(downloadId)}/file`;
    const response = await fetch(fileUrl, { signal });

    if (!response.ok) {
      let errText = 'Failed to retrieve media file from server.';
      try {
        const j = await response.json();
        errText = j.message || errText;
      } catch {
        // fallback
      }
      throw new Error(errText);
    }

    const contentType = response.headers.get('Content-Type') || 'video/mp4';
    const contentLengthHeader = response.headers.get('Content-Length');
    const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

    if (!response.body) {
      const blob = await response.blob();
      if (onProgress) {
        onProgress({
          percent: 100,
          downloadedBytes: totalBytes || blob.size,
          totalBytes: totalBytes || blob.size,
          speed: '0 B/s',
          status: 'completed',
        });
      }
      return { blob, contentType };
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let downloadedBytes = 0;
    let lastSampleTime = performance.now();
    let lastSampleBytes = 0;
    let currentSpeedStr = '0 B/s';

    while (true) {
      if (signal?.aborted) {
        throw new Error('DOWNLOAD_CANCELLED');
      }

      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        chunks.push(value);
        downloadedBytes += value.length;

        const now = performance.now();
        const timeDiffSec = (now - lastSampleTime) / 1000;

        // Update speed calculation dynamically
        if (timeDiffSec >= 0.25) {
          const byteDiff = downloadedBytes - lastSampleBytes;
          const bytesPerSec = byteDiff / timeDiffSec;
          currentSpeedStr = this.formatSpeed(bytesPerSec);
          lastSampleTime = now;
          lastSampleBytes = downloadedBytes;
        }

        const percent = totalBytes > 0 
          ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100))
          : -1;

        if (onProgress) {
          onProgress({
            percent,
            downloadedBytes,
            totalBytes,
            speed: currentSpeedStr,
            status: percent >= 100 ? 'converting' : 'downloading',
          });
        }
      }
    }

    const finalBlob = new Blob(chunks, { type: contentType });

    if (onProgress) {
      onProgress({
        percent: 100,
        downloadedBytes: totalBytes || finalBlob.size,
        totalBytes: totalBytes || finalBlob.size,
        speed: currentSpeedStr,
        status: 'completed',
      });
    }

    return { blob: finalBlob, contentType };
  }

  // Format speed into dynamically chosen units: B/s, KB/s, MB/s, GB/s
  static formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec <= 0 || !isFinite(bytesPerSec)) return '0 B/s';
    if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)} B/s`;
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    if (bytesPerSec < 1024 * 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    return `${(bytesPerSec / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
  }

  // Format bytes into readable format
  static formatBytes(bytes: number): string {
    if (bytes <= 0 || !isFinite(bytes)) return '0 MB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  // Friendly error code translation
  static mapErrorCode(code: string): string {
    switch (code) {
      case 'INVALID_URL':
        return 'Please enter a valid video or media link starting with http:// or https://';
      case 'UNSUPPORTED_WEBSITE':
        return 'This website is not currently supported. Try links from YouTube, Instagram, TikTok, Facebook, WhatsApp, X, or Pinterest.';
      case 'PRIVATE_CONTENT':
        return 'This media is private, login-protected, or DRM-restricted. VidGrab only processes publicly authorized content.';
      case 'NO_MEDIA':
        return 'No downloadable video or audio streams were found at this link.';
      case 'BACKEND_ERROR':
        return 'VidGrab backend service is temporarily busy. Please try again.';
      case 'CONVERSION_ERROR':
        return 'Unable to convert media into the requested format. Please choose another quality.';
      case 'DOWNLOAD_ERROR':
        return 'Download interrupted. Please check your connection and retry.';
      case 'DOWNLOAD_CANCELLED':
        return 'Download was cancelled by user.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // 5. Detect and Grab Media - POST /api/grab
  static async grab(url: string): Promise<{
    downloadable: boolean;
    message: string;
    metadata?: MediaMetadata;
    formats?: FormatsResponse;
  }> {
    try {
      const response = await fetch('/api/grab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      return data;
    } catch {
      return {
        downloadable: false,
        message: 'No downloadable media detected.',
      };
    }
  }

  // 6. Real Google/YouTube Search Suggestions - GET /api/youtube/suggestions
  static async getYouTubeSuggestions(query: string): Promise<string[]> {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`/api/youtube/suggestions?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      return data.suggestions || [];
    } catch {
      return [];
    }
  }

  // 7. Real YouTube Search Results - GET /api/youtube/search
  static async getYouTubeSearch(query: string): Promise<any[]> {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      return data.results || [];
    } catch {
      return [];
    }
  }

  // 8. Real YouTube Home Feed - GET /api/youtube/feed
  static async getYouTubeFeed(category: string = 'all'): Promise<any[]> {
    try {
      const res = await fetch(`/api/youtube/feed?category=${encodeURIComponent(category)}`);
      const data = await res.json();
      return data.results || [];
    } catch {
      return [];
    }
  }

  // 9. Frame Security Check - GET /api/browser/frame-check
  static async checkFrameEmbeddable(url: string): Promise<{ embeddable: boolean; reason?: string }> {
    try {
      const res = await fetch(`/api/browser/frame-check?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      return data;
    } catch {
      return { embeddable: false, reason: 'network_restriction' };
    }
  }
}
