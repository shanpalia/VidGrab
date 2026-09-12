import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Lock, MoreVertical, Home, Download, Share2, ExternalLink, Copy, Search, Bell, Play, AlertCircle, Globe } from 'lucide-react';
import { MediaMetadata } from '../types';
import { ApiService } from '../services/api';
import { YouTubeSearchService, YouTubeSearchItem } from '../services/youtubeSearch';

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
const isYoutubeSearchUrl = (url: string) => isYoutubeUrl(url) && /[?&]search_query=/i.test(url);
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

export const InAppBrowser: React.FC<InAppBrowserProps> = ({ initialUrl, onClose, onOpenDownloadPage }) => {
  const [history, setHistory] = useState<string[]>([normaliseUrl(initialUrl)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [inputUrl, setInputUrl] = useState(normaliseUrl(initialUrl));
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState<YouTubeSearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [frameBlocked, setFrameBlocked] = useState(false);
  const [detectedMedia, setDetectedMedia] = useState<MediaMetadata | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  const activeUrl = history[historyIndex] || normaliseUrl(initialUrl);
  const youtube = isYoutubeUrl(activeUrl);
  const youtubeSearch = isYoutubeSearchUrl(activeUrl);
  const videoId = extractVideoId(activeUrl);
  const youtubeWatch = youtube && !!videoId;

  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2500); };

  const navigateTo = (value: string) => {
    const next = normaliseUrl(value);
    setHistory((old) => [...old.slice(0, historyIndex + 1), next]);
    setHistoryIndex((old) => old + 1);
    setInputUrl(next);
    setMenuOpen(false);
  };

  const runSearch = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setSearchInput(q); setSearchError(''); setSearchLoading(true); setLoading(true);
    try {
      const found = await YouTubeSearchService.search(q);
      setResults(found);
      if (!found.length) setSearchError('No YouTube results were returned. Tap Retry to search again.');
      navigateTo(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`);
    } catch {
      setResults([]); setSearchError('YouTube search is temporarily unavailable.');
      navigateTo(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`);
    } finally { setSearchLoading(false); setLoading(false); }
  };

  useEffect(() => {
    setInputUrl(activeUrl);
    let cancelled = false;
    setFrameBlocked(false); setDetectedMedia(null);

    if (youtubeSearch) {
      const q = new URL(activeUrl).searchParams.get('search_query') || '';
      setSearchInput(q); setSearchLoading(true); setSearchError(''); setLoading(true);
      YouTubeSearchService.search(q)
        .then((items) => { if (!cancelled) { setResults(items); if (!items.length) setSearchError('No results found.'); } })
        .catch(() => { if (!cancelled) { setResults([]); setSearchError('Search failed.'); } })
        .finally(() => { if (!cancelled) { setSearchLoading(false); setLoading(false); } });
      return () => { cancelled = true; };
    }

    if (youtubeWatch) {
      setLoading(true);
      ApiService.getMetadata(activeUrl).then((meta) => { if (!cancelled) setDetectedMedia(meta); }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }

    if (youtube) { setLoading(false); return () => { cancelled = true; }; }

    setLoading(true);
    ApiService.checkFrameEmbeddable(activeUrl).then((r) => { if (!cancelled) setFrameBlocked(!r.embeddable); }).catch(() => { if (!cancelled) setFrameBlocked(false); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeUrl, youtube, youtubeSearch, youtubeWatch]);

  const triggerGrab = async () => {
    if (!youtubeWatch && !detectedMedia) { showToast('Open a video or paste a direct media URL first.'); return; }
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
  const retrySearch = () => { if (searchInput.trim()) runSearch(searchInput); };
  const pageTitle = useMemo(() => youtubeWatch ? 'YouTube video' : youtubeSearch ? `Search: ${searchInput}` : activeUrl.replace(/^https?:\/\//, '').split('/')[0], [activeUrl, youtubeSearch, youtubeWatch, searchInput]);

  return (
    <div className="vidgrab-browser-safe flex flex-col w-full h-full min-h-0 bg-white overflow-hidden relative">
      {toast && <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[100] rounded-full bg-gray-900 text-white px-4 py-2 text-xs font-bold shadow-xl">{toast}</div>}

      <div className="shrink-0 bg-white border-b border-gray-200 px-2 py-2 flex items-center gap-1.5 shadow-sm">
        <button onClick={() => historyIndex > 0 && setHistoryIndex((i) => i - 1)} disabled={historyIndex === 0} className="p-2 rounded-full disabled:text-gray-300 text-gray-800"><ArrowLeft className="w-5 h-5" /></button>
        <button onClick={() => historyIndex < history.length - 1 && setHistoryIndex((i) => i + 1)} disabled={historyIndex >= history.length - 1} className="p-2 rounded-full disabled:text-gray-300 text-gray-800"><ArrowRight className="w-5 h-5" /></button>
        <button onClick={() => { setLoading(true); window.setTimeout(() => setLoading(false), 350); }} className="p-2 rounded-full text-gray-800"><RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
        <form onSubmit={(e) => { e.preventDefault(); navigateTo(inputUrl); }} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2 border border-gray-200 focus-within:bg-white focus-within:border-red-400">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" /><input value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} className="w-full min-w-0 bg-transparent outline-none text-sm text-gray-900 truncate" placeholder="Search or enter URL" />
          </div>
        </form>
        <button onClick={() => setMenuOpen((v) => !v)} className="p-2 rounded-full text-gray-800"><MoreVertical className="w-5 h-5" /></button>
        {menuOpen && <div className="absolute right-2 top-12 z-[90] w-52 rounded-xl border bg-white shadow-2xl py-1 text-sm"><button onClick={copyUrl} className="w-full px-4 py-3 flex gap-3 items-center"><Copy className="w-4 h-4" />Copy URL</button><button onClick={shareUrl} className="w-full px-4 py-3 flex gap-3 items-center"><Share2 className="w-4 h-4" />Share</button><button onClick={() => { window.open(activeUrl, '_blank', 'noopener,noreferrer'); setMenuOpen(false); }} className="w-full px-4 py-3 flex gap-3 items-center"><ExternalLink className="w-4 h-4" />Open externally</button><button onClick={onClose} className="w-full px-4 py-3 flex gap-3 items-center text-red-600"><Home className="w-4 h-4" />Back to VidGrab</button></div>}
      </div>

      {loading && <div className="h-0.5 shrink-0 bg-red-500 animate-pulse" />}

      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
        {youtube ? (
          <div className="min-h-full bg-white">
            <div className="sticky top-0 z-20 bg-white border-b px-3 py-2 flex items-center justify-between"><div className="flex items-center gap-2 font-black"><span className="w-7 h-5 rounded bg-red-600 flex items-center justify-center"><Play className="w-3 h-3 fill-white text-white" /></span>YouTube<span className="text-[9px] text-red-600 bg-red-50 px-1.5 rounded">IN-APP</span></div><Bell className="w-5 h-5 text-gray-600" /></div>
            <form onSubmit={(e) => { e.preventDefault(); runSearch(searchInput); }} className="p-3 border-b bg-white flex gap-2"><div className="flex-1 flex items-center gap-2 border rounded-full px-3 py-2 bg-gray-50"><Search className="w-4 h-4 text-gray-400" /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search YouTube" className="w-full bg-transparent outline-none text-sm" /></div><button className="px-4 rounded-full bg-red-600 text-white font-bold text-sm">Search</button></form>

            {youtubeSearch ? (
              <div>
                <div className="px-4 py-3 border-b text-sm text-gray-600">Search results for <b className="text-gray-900">“{searchInput}”</b></div>
                {searchLoading ? <div className="py-16 text-center"><div className="w-9 h-9 mx-auto border-3 border-red-200 border-t-red-600 rounded-full animate-spin" /><p className="mt-4 text-sm font-semibold text-gray-500">Searching YouTube…</p></div> : results.length ? <div className="divide-y">{results.map((item) => <button key={item.id} onClick={() => navigateTo(item.url)} className="w-full text-left p-3 flex gap-3 hover:bg-gray-50"><div className="relative w-40 sm:w-52 aspect-video shrink-0 rounded-lg overflow-hidden bg-gray-200"><img src={item.thumbnail} className="w-full h-full object-cover" alt="" /><span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">{item.duration}</span></div><div className="min-w-0 pt-1"><h3 className="font-bold text-sm leading-snug line-clamp-2">{item.title}</h3><p className="mt-2 text-xs text-gray-500">{item.channel} • {item.views} • {item.publishedAt}</p><p className="mt-3 text-xs font-bold text-red-600">Tap to watch • GRAB</p></div></button>)}</div> : <div className="py-16 text-center px-6"><AlertCircle className="w-10 h-10 mx-auto text-gray-300" /><p className="mt-3 font-bold text-gray-700">{searchError || 'No results found'}</p><button onClick={retrySearch} className="mt-4 px-5 py-2 rounded-full bg-red-600 text-white text-sm font-bold">Retry</button></div>}
              </div>
            ) : youtubeWatch ? (
              <div><div className="aspect-video bg-black"><iframe src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`} className="w-full h-full border-0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen title="YouTube video" /></div><div className="p-4 bg-white"><h1 className="text-lg font-black">{detectedMedia?.title || 'YouTube video'}</h1><p className="mt-2 text-xs text-gray-500">{detectedMedia?.author || 'YouTube'}</p><button onClick={triggerGrab} disabled={grabbing} className="mt-4 w-full rounded-full bg-red-600 text-white py-3 font-black flex justify-center gap-2"><Download className="w-5 h-5" />{grabbing ? 'SCANNING…' : 'GRAB / DOWNLOAD'}</button></div></div>
            ) : <div className="p-6 text-center"><Search className="w-10 h-10 mx-auto text-gray-300" /><h2 className="mt-3 font-black text-lg">Search YouTube</h2><p className="mt-1 text-sm text-gray-500">Enter a video name above to get real YouTube results.</p></div>}
          </div>
        ) : frameBlocked ? (
          <div className="min-h-full flex flex-col items-center justify-center p-6 text-center"><Globe className="w-12 h-12 text-gray-300" /><h2 className="mt-4 font-black">This site blocks embedded pages</h2><p className="mt-2 text-sm text-gray-500">VidGrab cannot bypass the site's X-Frame/CSP security from an iframe.</p><button onClick={() => window.open(activeUrl, '_blank', 'noopener,noreferrer')} className="mt-5 px-5 py-3 rounded-full bg-red-600 text-white font-bold">Open site</button></div>
        ) : <iframe src={activeUrl} title={pageTitle} className="w-full h-full min-h-[calc(100dvh-120px)] border-0 bg-white" allow="autoplay; encrypted-media; picture-in-picture" />}
      </div>

      {(youtubeWatch || detectedMedia) && <button onClick={triggerGrab} disabled={grabbing} className="absolute right-4 bottom-4 z-40 rounded-full bg-red-600 text-white px-5 py-3 font-black shadow-2xl flex items-center gap-2"><Download className="w-5 h-5" />{grabbing ? 'SCANNING…' : 'GRAB'}</button>}
    </div>
  );
};
