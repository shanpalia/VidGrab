const DB_NAME = 'vidgrab-media-storage';
const DB_VERSION = 1;
const STORE_NAME = 'blobs';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported on this device.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open media storage.'));
  });
}

/**
 * Persists the actual downloaded Blob separately from localStorage.
 * Blob URLs are temporary and cannot be restored after a reload, while
 * IndexedDB can keep the real bytes for later in-app playback.
 */
export class MediaStorage {
  static async saveBlob(fileId: string, blob: Blob): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(blob, fileId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Unable to save downloaded media.'));
      tx.onabort = () => reject(tx.error || new Error('Media storage transaction aborted.'));
    });
    db.close();
  }

  static async getBlob(fileId: string): Promise<Blob | null> {
    try {
      const db = await openDb();
      const blob = await new Promise<Blob | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(fileId);
        request.onsuccess = () => resolve((request.result as Blob | undefined) || null);
        request.onerror = () => reject(request.error || new Error('Unable to read media storage.'));
      });
      db.close();
      return blob;
    } catch {
      return null;
    }
  }

  static async deleteBlob(fileId: string): Promise<void> {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(fileId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {
      // Best-effort cleanup. The metadata file can still be removed.
    }
  }
}
