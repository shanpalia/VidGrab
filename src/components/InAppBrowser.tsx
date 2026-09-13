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
const getYoutubeQuery = (url: string) => {
  try { return new URL(url).searchParams.get('search_query') || ''; } catch { return ''; }
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
  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
  const [searchText, setSearchText] = useState(getYoutubeQuery(first));

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
    setSearchText(getYoutubeQuery(activeUrl));
    setBlocked(false);
    setDetectedMedia(null);
    setYoutubeResults([]);
    let cancelled = false;
    if (youtubeSearch) {
      const q = getYoutubeQuery(activeUrl);
      if (!q) return;
      setLoading(true);
      ApiService.getYouTubeSearch(q).then((items) => { if (!cancelled) setYoutubeResults(Array.isArray(items) ? items : []); }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    } else if (youtubeWatch) {
      setLoading(true);
      ApiService.getMetadata(activeUrl).then((meta) => { if (!cancelled) setDetectedMedia(meta); }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    } else if (!youtube) {
      setLoading(true);
      ApiService.checkFrameEmbeddable(activeUrl).then((r) => { if (!cancelled) setBlocked(!r.embeddable); }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    } else {
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [activeUrl, youtube, youtubeSearch, youtubeWatch]);

  useEffect(() => {
    const handler = () => {
      if (historyIndex > 0) setHistoryIndex((i) => i - 1);
      else onClose();
    };
    (window as any).VidGrabAndroidBack = handler;
    window.addEventListener('vidgrab-android-back', handler);
    return () => {
      delete (window as any).VidGrabAndroidBack;
      window.removeEventListener('vidgrab-android-back', handler);
    };
  }, [historyIndex, onClose]);

  const runSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    navigateTo(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`);
  };

  const openYoutubeResult = (item: any) => {
    const url = item?.url || item?.videoUrl || (item?.id ? `https://www.youtube.com/watch?v=${item.id}` : '');
    if (url) navigateTo(url);
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

  const youtubeEmbedUrl = youtubeWatch ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1` : '';

  return (
    <div className="vidgrab-browser-safe flex flex-col w-full h-full min-h-0 bg-white overflow-hidden relative">
      {toast && <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[100] rounded-full bg-gray-900 text-white px-4 py-2 text-xs font-bold shadow-xl">{toast}</div>}
      <div className="shrink-0 bg-white border-b border-gray-200 px-2 py-2 flex items-center gap-1.5 shadow-sm">
        <button onClick={() => historyIndex > 0 ? setHistoryIndex((i) => i - 1) : onClose()} className="p-2 rounded-full text-gray-800"><ArrowLeft className="w-5 h-5" /></button>
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

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-white relative">
        {youtubeSearch ? (
          <div className="min-h-full bg-slate-50 p-3 pb-8">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl border shadow-sm p-3 mb-3 sticky top-0 z-20">
                <form onSubmit={(e) => { e.preventDefault(); runSearch(searchText); }} className="flex gap-2 items-center">
                  <Search className="w-5 h-5 text-gray-500 shrink-0" />
                  <input value={searchText} onChange={(e) => setSearchText(e.target.value)} className="flex-1 min-w-0 outline-none text-base" placeholder="Search YouTube" />
                  <button className="rounded-full bg-red-600 text-white px-4 py-2 font-bold text-sm">Search</button>
                </form>
              </div>
              {youtubeResults.length ? youtubeResults.map((item, index) => (
                <button key={`${item?.id || item?.url || 'result'}-${index}`} onClick={() => openYoutubeResult(item)} className="w-full text-left bg-white rounded-2xl border shadow-sm mb-3 overflow-hidden flex gap-3 p-2 hover:bg-gray-50">
                  <div className="w-36 sm:w-48 aspect-video rounded-xl overflow-hidden bg-gray-100 shrink-0"><img src={item?.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
                  <div className="py-1 min-w-0"><h3 className="font-black text-gray-900 line-clamp-2">{item?.title || 'YouTube Video'}</h3><p className="text-sm text-gray-500 mt-1">{item?.channel || 'YouTube'}</p><p className="text-xs text-gray-400 mt-1">{item?.views || ''} {item?.duration ? `• ${item.duration}` : ''}</p><span className="inline-flex items-center gap-1 mt-3 text-red-600 text-xs font-black"><Play className="w-3.5 h-3.5" />OPEN</span></div>
                </button>
              )) : !loading ? <div className="rounded-2xl bg-white border p-8 text-center text-gray-500">No YouTube results found. Try another search.</div> : <div className="py-12 text-center text-gray-500">Loading YouTube results…</div>}
            </div>
          </div>
        ) : youtubeWatch ? (
          <div className="w-full min-h-full bg-black flex flex-col">
            <div className="w-full aspect-video shrink-0 bg-black"><iframe src={youtubeEmbedUrl} title="YouTube video" className="w-full h-full border-0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /></div>
            <div className="bg-white p-4 min-h-32"><h2 className="font-black text-lg">YouTube video</h2><p className="text-sm text-gray-500 mt-1">Use GRAB to download this public video.</p></div>
          </div>
        ) : blocked ? (
          <div className="h-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center"><Globe className="w-12 h-12 text-gray-300" /><h2 className="mt-4 font-black">This site blocks embedded pages</h2><p className="mt-2 text-sm text-gray-500">The site's security policy does not allow it to be embedded inside VidGrab.</p><button onClick={() => window.open(activeUrl, '_blank', 'noopener,noreferrer')} className="mt-5 px-5 py-3 rounded-full bg-red-600 text-white font-bold">Open site</button></div>
        ) : (
          <iframe src={activeUrl} title="VidGrab Browser" className="w-full h-full min-h-[70vh] border-0 bg-white" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" />
        )}
        {youtubeWatch && <button onClick={triggerGrab} disabled={grabbing} className="fixed right-4 bottom-5 z-40 rounded-full bg-red-600 text-white px-5 py-3 font-black shadow-2xl flex items-center gap-2"><Download className="w-5 h-5" />{grabbing ? 'SCANNING…' : 'GRAB'}</button>}
      </div>
    </div>
  );
};
