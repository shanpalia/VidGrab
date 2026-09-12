type ViteEnv = {
  VITE_PALIAAPK_HUB_STORE_URL?: string;
};

const env = (import.meta as ImportMeta & { env?: ViteEnv }).env;

// Keep the URL configurable rather than inventing a PaliaAPK HUB listing URL.
export const PALIAAPK_HUB_STORE_URL = (env?.VITE_PALIAAPK_HUB_STORE_URL || '').trim();

export function openPaliaApkHubStore(): boolean {
  const url = PALIAAPK_HUB_STORE_URL;
  if (!url) return false;

  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) return false;
    window.open(parsed.toString(), '_blank', 'noopener,noreferrer');
    return true;
  } catch {
    return false;
  }
}
