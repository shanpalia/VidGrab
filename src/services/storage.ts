import { DownloadedFile, HistoryItem } from '../types';

const FILES_KEY = 'vidgrab_downloaded_files';
const HISTORY_KEY = 'vidgrab_download_history';
const SETTINGS_KEY = 'vidgrab_settings';

export interface UserSettings {
  downloadLocation: string;
  defaultQuality: string;
  autoPlayPreviews: boolean;
  notifyOnComplete: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  downloadLocation: '/storage/emulated/0/Download/VidGrab/',
  defaultQuality: '720p',
  autoPlayPreviews: true,
  notifyOnComplete: true,
};

// Seed sample files for initial presentation
const SEED_FILES: DownloadedFile[] = [
  {
    id: 'seed-1',
    mediaId: 'vid-demo-1',
    originalUrl: 'https://www.youtube.com/watch?v=sample-nature',
    fileName: 'Colors_of_Wildlife_Cinematic.mp4',
    title: 'Colors of Wildlife 4K - Cinematic Nature Documentary HDR',
    source: 'YouTube',
    formatId: '1080p',
    formatLabel: '1080P HD MP4',
    ext: 'mp4',
    type: 'video',
    size: '88.3 MB',
    sizeBytes: 92600000,
    downloadedAt: '2026-09-08',
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80',
    mediaBlobUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    location: '/storage/emulated/0/Download/VidGrab/Video/',
    duration: '04:18',
  },
  {
    id: 'seed-2',
    mediaId: 'vid-demo-2',
    originalUrl: 'https://www.instagram.com/reel/sample-sunset',
    fileName: 'Tokyo_Skyline_Golden_Hour.mp3',
    title: 'Urban Sunset Timelapse - Tokyo Skyline Golden Hour',
    source: 'Instagram',
    formatId: 'mp3_256k',
    formatLabel: 'MP3 256K',
    ext: 'mp3',
    type: 'audio',
    size: '8.1 MB',
    sizeBytes: 8493465,
    downloadedAt: '2026-09-07',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=900&q=80',
    mediaBlobUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    location: '/storage/emulated/0/Download/VidGrab/Audio/',
    duration: '03:45',
    artist: 'Lofi Beat Collective',
  },
  {
    id: 'seed-3',
    mediaId: 'vid-demo-3',
    originalUrl: 'https://www.tiktok.com/@dance/sample',
    fileName: 'Neon_Choreography_Remix.mp4',
    title: 'Trending Neon Choreography ⚡ Remix Beat 2026',
    source: 'TikTok',
    formatId: '720p',
    formatLabel: '720P HD MP4',
    ext: 'mp4',
    type: 'video',
    size: '24.2 MB',
    sizeBytes: 25375539,
    downloadedAt: '2026-09-05',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
    mediaBlobUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    location: '/storage/emulated/0/Download/VidGrab/Video/',
    duration: '00:45',
  }
];

const SEED_HISTORY: HistoryItem[] = [
  {
    id: 'hist-1',
    url: 'https://www.youtube.com/watch?v=sample-nature',
    title: 'Colors of Wildlife 4K - Cinematic Nature Documentary HDR',
    source: 'YouTube',
    formatLabel: '1080P HD MP4',
    ext: 'mp4',
    type: 'video',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80',
    fileSize: '88.3 MB',
    status: 'completed',
  },
  {
    id: 'hist-2',
    url: 'https://www.instagram.com/reel/sample-sunset',
    title: 'Urban Sunset Timelapse - Tokyo Skyline Golden Hour',
    source: 'Instagram',
    formatLabel: 'MP3 256K',
    ext: 'mp3',
    type: 'audio',
    timestamp: new Date(Date.now() - 3600000 * 26).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=900&q=80',
    fileSize: '8.1 MB',
    status: 'completed',
  },
  {
    id: 'hist-3',
    url: 'https://www.tiktok.com/@dance/sample',
    title: 'Trending Neon Choreography ⚡ Remix Beat 2025',
    source: 'TikTok',
    formatLabel: '720P HD MP4',
    ext: 'mp4',
    type: 'video',
    timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
    fileSize: '24.2 MB',
    status: 'completed',
  }
];

export class StorageService {
  // Files
  static getFiles(): DownloadedFile[] {
    try {
      const data = localStorage.getItem(FILES_KEY);
      if (!data) {
        localStorage.setItem(FILES_KEY, JSON.stringify([]));
        return [];
      }
      const parsed: DownloadedFile[] = JSON.parse(data);
      // Never replace a user's real media with a demo/fallback URL.
      // Real downloaded bytes are stored in IndexedDB and referenced by mediaBlobKey.
      return parsed;
    } catch {
      return [];
    }
  }

  static saveFile(file: DownloadedFile): void {
    const files = this.getFiles();
    const updated = [file, ...files.filter(f => f.id !== file.id)];
    localStorage.setItem(FILES_KEY, JSON.stringify(updated));
  }

  static deleteFile(fileId: string): void {
    const files = this.getFiles();
    const updated = files.filter(f => f.id !== fileId);
    localStorage.setItem(FILES_KEY, JSON.stringify(updated));
  }

  static renameFile(fileId: string, newTitle: string): DownloadedFile | null {
    const files = this.getFiles();
    let updatedFile: DownloadedFile | null = null;
    const updated = files.map(f => {
      if (f.id === fileId) {
        const ext = f.ext || 'mp4';
        const cleanName = newTitle.replace(/[^a-zA-Z0-9 _-]/g, '_');
        updatedFile = {
          ...f,
          title: newTitle,
          fileName: `${cleanName}.${ext}`
        };
        return updatedFile;
      }
      return f;
    });
    localStorage.setItem(FILES_KEY, JSON.stringify(updated));
    return updatedFile;
  }

  // History
  static getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      if (!data) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static addHistory(item: HistoryItem): void {
    const history = this.getHistory();
    const updated = [item, ...history.filter(h => h.id !== item.id)];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated.slice(0, 50)));
  }

  static deleteHistoryItem(id: string): void {
    const history = this.getHistory();
    const updated = history.filter(h => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }

  static clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
  }

  // Settings
  static getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static updateSettings(partial: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  }
}
