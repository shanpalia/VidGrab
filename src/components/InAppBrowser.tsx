import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Lock, MoreVertical, Home, Download, Share2, ExternalLink, Copy, Search, Play, Globe } from 'lucide-react';
import { MediaMetadata } from '../types';
import { ApiService } from '../services/api';

interface InAppBrowserProps {
  initialUrl: string;
  onClose: () => void;
  onOpenDownloadPage: (metadata: MediaMetadata) => void;
}

const normaliseUrl = (value: string) => {
  const v = value.trim();
  if (!v) return 'https://www.youtube.com/';
  if (/^https?:\/\//i.test(v)) return v;
  if (v.includes('.') && !v.includes(' ')) return `https://${v}`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(v)}`;
};

const isYoutubeUrl = (url: string) => /(^|\.)youtube\.com|youtu\.be/i.test(url);
const extractVideoId = (url: string) => {
  try {
    const u = new URL(url);
    if (u.searchParams.get('v')) return u.searchParams.get('v') || '';
    const parts = u.pathname.split('/').filter(Boolean);
    const i = parts.findIndex((p) => p === 'shorts' || p === 'embed');
    if (i >= 0) return parts[i + 1] || '';
    if (u.hostname.includes('youtu.be')) return parts[0] || '';
  } catch {}
  return '';
};
const isYoutubeSearch = (url: string) => isYoutubeUrl(url) && /[?&]search_query=/i.test(url);

export const InAppBrowser: React.FC<InAppBrowserProps> = ({ initialUrl, onClose, onOpenDownloadPage }) => {
  const first = normaliseUrl(initialUrl);
  const [history, setHistory] = useState([first]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [inputUrl, setInputUrl] = useState(first);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [detectedMedia, setDetectedMedia] = useState<MediaMetadata | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  const activeUrl = history[historyIndex] || first;
  const youtube = isYoutubeUrl(activeUrl);
  const youtubeSearch = isYoutubeSearch(activeUrl);
  const videoId = extractVideoId(activeUrl);
  const youtubeWatch = youtube && !!videoId;

  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const navigateTo = (value: string) => {
    const next = normaliseUrl(value);
    setHistory((old) => [...old.slice(0, historyIndex + 1), next]);
    setHistoryIndex((old) => old + 1);
    setInputUrl(next);
    setMenuOpen(false);
  };

  useEffect(() => {
    setInputUrl(activeUrl);
    setBlocked(false);
    setDetectedMedia(null);
    let cancelled = false;
    if (youtubeWatch) {
      setLoading(true);
      ApiService.getMetadata(activeUrl).then((meta) => { if (!cancelled) setDetectedMedia(meta); }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    } else if (!youtube) {
      setLoading(true);
      ApiService.checkFrameEmbeddable(activeUrl).then((r) => { if (!cancelled) setBlocked(!r.embeddable); }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    } else {
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [activeUrl, youtube, youtubeWatch]);

  const runSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    // Do not call a CORS-sensitive public API. The real YouTube search page is
    // loaded inside the app browser, so its results come directly from YouTube.
    navigateTo(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`);
  };

  const triggerGrab = async () => {
    if (!youtubeWatch && !detectedMedia) { showToast('Open a video or paste a media URL first.'); return; }
    setGrabbing(true);
    try {
      const response = await ApiService.grab(activeUrl);
      if (response.downloadable && response.metadata) onOpenDownloadPage(response.metadata);
      else if (detectedMedia) onOpenDownloadPage(detectedMedia);
      else showToast(response.message || 'No downloadable media found.');
    } catch {
      if (detectedMedia) onOpenDownloadPage(detectedMedia); else showToast('Unable to analyze this media.');
    } finally { setGrabbing(false); }
  };

  const copyUrl = async () => { try { await navigator.clipboard.writeText(activeUrl); showToast('URL copied'); } catch { showToast('Could not copy URL'); } setMenuOpen(false); };
  const shareUrl = async () => { try { if (navigator.share) await navigator.share({ title: 'VidGrab', url: activeUrl }); else await navigator.clipboard.writeText(activeUrl); } catch {} setMenuOpen(false); };

  return (
    <div className="vidgrab-browser-safe flex flex-col w-full h-full min-h-0 bg-white overflow-hidden relative">
      {toast && <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[100] rounded-full bg-gray-900 text-white px-4 py-2 text-xs font-bold shadow-xl">{toast}</div>}
      <div className="shrink-0 bg-white border-b border-gray-200 px-2 py-2 flex items-center gap-1.5 shadow-sm">
        <button onClick={() => historyIndex > 0 && setHistoryIndex((i) => i - 1)} disabled={historyIndex === 0} className="p-2 rounded-full disabled:text-gray-300 text-gray-800"><ArrowLeft className="w-5 h-5" /></button>
        <button onClick={() => historyIndex < history.length - 1 && setHistoryIndex((i) => i + 1)} disabled={historyIndex >= history.length - 1} className="p-2 rounded-full disabled:text-gray-300 text-gray-800"><ArrowRight className="w-5 h-5" /></button>
        <button onClick={() => { setLoading(true); window.setTimeout(() => setLoading(false), 300); }} className="p-2 rounded-full text-gray-800"><RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
        <form onSubmit={(e) => { e.preventDefault(); navigateTo(inputUrl); }} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2 border border-gray-200 focus-within:bg-white focus-within:border-red-400">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <input value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} className="w-full min-w-0 bg-transparent outline-none text-sm text-gray-900 truncate" placeholder="Search or enter URL" />
          </div>
        </form>
        <button onClick={() => setMenuOpen((v) => !v)} className="p-2 rounded-full text-gray-800"><MoreVertical className="w-5 h-5" /></button>
        {menuOpen && <div className="absolute right-2 top-12 z-[90] w-52 rounded-xl border bg-white shadow-2xl py-1 text-sm"><button onClick={copyUrl} className="w-full px-4 py-3 flex gap-3 items-center"><Copy className="w-4 h-4" />Copy URL</button><button onClick={shareUrl} className="w-full px-4 py-3 flex gap-3 items-center"><Share2 className="w-4 h-4" />Share</button><button onClick={() => { window.open(activeUrl, '_blank', 'noopener,noreferrer'); setMenuOpen(false); }} className="w-full px-4 py-3 flex gap-3 items-center"><ExternalLink className="w-4 h-4" />Open externally</button><button onClick={onClose} className="w-full px-4 py-3 flex gap-3 items-center text-red-600"><Home className="w-4 h-4" />Back to VidGrab</button></div>}
      </div>
      {loading && <div className="h-0.5 shrink-0 bg-red-500 animate-pulse" />}

      <div className="flex-1 min-h-0 overflow-hidden bg-white relative">
        {blocked ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center"><Globe className="w-12 h-12 text-gray-300" /><h2 className="mt-4 font-black">This site blocks embedded pages</h2><p className="mt-2 text-sm text-gray-500">The site's security policy does not allow it to be embedded inside VidGrab.</p><button onClick={() => window.open(activeUrl, '_blank', 'noopener,noreferrer')} className="mt-5 px-5 py-3 rounded-full bg-red-600 text-white font-bold">Open site</button></div>
        ) : (
          <iframe src={activeUrl} title="VidGrab Browser" className="w-full h-full border-0 bg-white" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" />
        )}
        {youtubeWatch && <button onClick={triggerGrab} disabled={grabbing} className="absolute right-4 bottom-4 z-40 rounded-full bg-red-600 text-white px-5 py-3 font-black shadow-2xl flex items-center gap-2"><Download className="w-5 h-5" />{grabbing ? 'SCANNING…' : 'GRAB'}</button>}
        {youtubeSearch && <div className="absolute left-3 right-3 top-3 z-30 pointer-events-none"><div className="pointer-events-auto max-w-md mx-auto bg-white/95 backdrop-blur rounded-full border shadow-lg p-1 flex gap-1"><Search className="w-5 h-5 ml-3 my-auto text-gray-500" /><form className="flex-1 flex" onSubmit={(e) => { e.preventDefault(); const input = (e.currentTarget.elements.namedItem('q') as HTMLInputElement); runSearch(input.value); }}><input name="q" defaultValue={new URL(activeUrl).searchParams.get('search_query') || ''} className="flex-1 min-w-0 bg-transparent outline-none px-2 text-sm" /><button className="rounded-full bg-red-600 text-white px-4 py-2 font-bold text-sm">Search</button></form></div></div>}
      </div>
    </div>
  );
};
