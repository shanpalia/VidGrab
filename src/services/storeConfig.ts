type ViteEnv = {
  VITE_PALIAAPK_HUB_STORE_URL?: string;
};

const env = (import.meta as ImportMeta & { env?: ViteEnv }).env;

// PaliaAPK HUB fallback. A build-time env value can override this later
// if the Vibe Player listing is moved to a dedicated product URL.
export const PALIAAPK_HUB_STORE_URL = (
  env?.VITE_PALIAAPK_HUB_STORE_URL || 'https://shanpalia.github.io/H'
).trim();

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
