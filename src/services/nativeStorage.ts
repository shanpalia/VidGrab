/*
 * Native Android storage bridge for VidGrab.
 *
 * When the Capacitor Android build injects window.VidGrabNative, downloaded
 * media is persisted in the public Downloads/VidGrab folders through Android
 * MediaStore. In a normal browser, this module falls back to the existing
 * IndexedDB/browser download behavior.
 */

declare global {
  interface Window {
    VidGrabNative?: {
      saveFile: (category: string, fileName: string, mimeType: string, base64: string) => string;
      deleteFile: (uri: string) => boolean;
      shareFile: (uri: string, mimeType: string, title: string) => boolean;
      openFile: (uri: string, mimeType: string) => boolean;
      getDownloadRoot: () => string;
      ensureFolders: () => boolean;
    };
  }
}

export type NativeSaveResult = {
  uri: string;
  location: string;
};

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary);
}

function mimeFor(ext: string, type: string): string {
  if (type === 'audio') {
    if (ext === 'mp3') return 'audio/mpeg';
    if (ext === 'm4a') return 'audio/mp4';
    if (ext === 'wav') return 'audio/wav';
    if (ext === 'ogg') return 'audio/ogg';
  }
  if (type === 'image') {
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'gif') return 'image/gif';
    return 'image/jpeg';
  }
  if (ext === 'webm') return 'video/webm';
  return 'video/mp4';
}

export class NativeStorage {
  static ensureFolders(): boolean {
    if (!this.isAndroidBridgeAvailable || !window.VidGrabNative) return false;
    return !!window.VidGrabNative.ensureFolders();
  }

  static get isAndroidBridgeAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.VidGrabNative;
  }

  static async saveBlob(blob: Blob, fileName: string, category: string, ext: string): Promise<NativeSaveResult | null> {
    if (!this.isAndroidBridgeAvailable || !window.VidGrabNative) return null;

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const base64 = toBase64(bytes);
    const mimeType = blob.type || mimeFor(ext, category);
    const uri = window.VidGrabNative.saveFile(category, fileName, mimeType, base64);
    if (!uri) throw new Error('Android could not save the downloaded file.');

    const root = window.VidGrabNative.getDownloadRoot();
    return { uri, location: `${root}/${category}` };
  }

  static delete(uri?: string): boolean {
    if (!uri || !this.isAndroidBridgeAvailable || !window.VidGrabNative) return false;
    return !!window.VidGrabNative.deleteFile(uri);
  }

  static open(uri: string | undefined, mimeType: string): boolean {
    if (!uri || !this.isAndroidBridgeAvailable || !window.VidGrabNative) return false;
    return !!window.VidGrabNative.openFile(uri, mimeType);
  }

  static share(uri: string | undefined, mimeType: string, title: string): boolean {
    if (!uri || !this.isAndroidBridgeAvailable || !window.VidGrabNative) return false;
    return !!window.VidGrabNative.shareFile(uri, mimeType, title);
  }
}
