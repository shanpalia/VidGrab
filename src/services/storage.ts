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

export class StorageService {
  static getFiles(): DownloadedFile[] {
    try {
      const data = localStorage.getItem(FILES_KEY);
      if (!data) {
        localStorage.setItem(FILES_KEY, JSON.stringify([]));
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveFile(file: DownloadedFile): void {
    const files = this.getFiles();
    localStorage.setItem(FILES_KEY, JSON.stringify([file, ...files.filter(f => f.id !== file.id)]));
  }

  static deleteFile(fileId: string): void {
    localStorage.setItem(FILES_KEY, JSON.stringify(this.getFiles().filter(f => f.id !== fileId)));
  }

  static renameFile(fileId: string, newTitle: string): DownloadedFile | null {
    const files = this.getFiles();
    let updatedFile: DownloadedFile | null = null;
    const updated = files.map(f => {
      if (f.id !== fileId) return f;
      const ext = f.ext || 'mp4';
      const cleanName = newTitle.replace(/[^a-zA-Z0-9 _-]/g, '_');
      updatedFile = { ...f, title: newTitle, fileName: `${cleanName}.${ext}` };
      return updatedFile;
    });
    localStorage.setItem(FILES_KEY, JSON.stringify(updated));
    return updatedFile;
  }

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
    localStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...history.filter(h => h.id !== item.id)].slice(0, 50)));
  }

  static deleteHistoryItem(id: string): void {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.getHistory().filter(h => h.id !== id)));
  }

  static clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
  }

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
    const updated = { ...this.getSettings(), ...partial };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  }
}
