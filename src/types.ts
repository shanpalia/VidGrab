export type MediaType = 'video' | 'audio' | 'image';

export type PlatformSource = 
  | 'YouTube'
  | 'Instagram'
  | 'Facebook'
  | 'TikTok'
  | 'WhatsApp'
  | 'X / Twitter'
  | 'Pinterest'
  | 'Web Media';

export interface MediaMetadata {
  id: string;
  url: string;
  title: string;
  source: PlatformSource;
  author?: string;
  duration?: string;
  durationSeconds?: number;
  thumbnail: string;
  previewUrl?: string;
  embedUrl?: string;
  type: MediaType;
  publishedAt?: string;
  views?: string;
  description?: string;
  supported: boolean;
  availableQualities: string[];
}

export interface MediaFormat {
  id: string;
  label: string;
  category: 'audio' | 'video' | 'image';
  codec: string;
  ext: string;
  quality?: string;
  bitrate?: string;
  size: string;
  sizeBytes: number;
  isHd?: boolean;
}

export interface FormatsResponse {
  audioFormats: MediaFormat[];
  videoFormats: MediaFormat[];
  imageFormats?: MediaFormat[];
}

export interface DownloadedFile {
  id: string;
  mediaId: string;
  originalUrl: string;
  fileName: string;
  title: string;
  source: PlatformSource;
  formatId: string;
  formatLabel: string;
  ext: string;
  type: MediaType;
  size: string;
  sizeBytes: number;
  downloadedAt: string;
  thumbnail: string;
  mediaBlobUrl?: string;
  /** IndexedDB key for the actual downloaded bytes. Blob URLs are not persistent. */
  mediaBlobKey?: string;
  /** Android MediaStore content URI for the real file, when running in the native app. */
  nativeFileUri?: string;
  location: string;
  duration?: string;
  artist?: string;
  quality?: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  source: PlatformSource;
  formatLabel: string;
  ext: string;
  type: MediaType;
  timestamp: string;
  thumbnail: string;
  fileSize: string;
  status: 'completed' | 'failed' | 'cancelled';
  errorMessage?: string;
}

export type DownloadStatus = 
  | 'idle'
  | 'preparing'
  | 'downloading'
  | 'converting'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface DownloadProgressInfo {
  downloadId: string;
  status: DownloadStatus;
  percent: number; // -1 if calculating / indeterminate
  downloadedBytes: number;
  totalBytes: number;
  speed: string;
  fileName: string;
  formatLabel: string;
  ext: string;
  type: MediaType;
  thumbnail: string;
  errorMessage?: string;
}

export type ActiveNavTab = 'home' | 'music' | 'video' | 'files' | 'me' | 'browser' | 'result' | 'progress' | 'platforms' | 'history';
