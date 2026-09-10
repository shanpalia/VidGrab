type ViteEnv = { VITE_PALIAAPK_HUB_STORE_URL?: string };

const env = (import.meta as ImportMeta & { env?: ViteEnv }).env;

export const PALIAAPK_HUB_STORE_URL = (env?.VITE_PALIAAPK_HUB_STORE_URL || '').trim();

export function openPaliaApkHubStore(): boolean {
  if (!PALIAAPK_HUB_STORE_URL) return false;
  window.open(PALIAAPK_HUB_STORE_URL, '_blank', 'noopener,noreferrer');
  return true;
}
