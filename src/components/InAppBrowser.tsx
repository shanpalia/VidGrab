import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Lock, MoreVertical, Home, Download, Share2,
  ExternalLink, Copy, Check, Search, Bell, Play, ThumbsUp, ThumbsDown,
  MessageSquare, ChevronDown, ChevronUp, Film, Compass, X, AlertCircle, Globe,
  Sparkles, Radio, CheckCircle2
} from 'lucide-react';
import { MediaMetadata } from '../types';
import { ApiService } from '../services/api';

interface InAppBrowserProps {
  initialUrl: string;
  onClose: () => void;
  onOpenDownloadPage: (metadata: MediaMetadata) => void;
}

interface YouTubeVideoItem {
  id: string; title: string; channel: string; channelAvatar?: string; views: string;
  publishedAt: string; duration: string; thumbnail: string; url: string; videoUrl?: string;
}

const YT_CHIPS = ['All', 'Trending', 'Music', 'Tech', 'Gaming', 'News', 'Podcasts', '4K HDR'];
const INITIAL_YT_VIDEOS: YouTubeVideoItem[] = [];

export const InAppBrowser: React.FC<InAppBrowserProps> = ({ initialUrl, onClose, onOpenDownloadPage }) => {
  const formatInitial = (url: string) => url.trim().startsWith('http://') || url.trim().startsWith('https://') ? url.trim() : `https://${url.trim()}`;
  const [history, setHistory] = useState<string[]>([formatInitial(initialUrl)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [inputUrl, setInputUrl] = useState(formatInitial(initialUrl));
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [ytSelectedChip, setYtSelectedChip] = useState('All');
  const [ytVideos, setYtVideos] = useState<YouTubeVideoItem[]>(INITIAL_YT_VIDEOS);
  const [ytIsSearching, setYtIsSearching] = useState(false);
  const [ytSearchInput, setYtSearchInput] = useState('');
  const [ytSuggestions, setYtSuggestions] = useState<string[]>([]);
  const [showYtSuggestions, setShowYtSuggestions] = useState(false);
  const [ytSearchResults, setYtSearchResults] = useState<YouTubeVideoItem[]>([]);
  const [ytSearchLoading, setYtSearchLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [detectedMedia, setDetectedMedia] = useState<MediaMetadata | null>(null);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [frameBlocked, setFrameBlocked] = useState(false);
  const activeUrl = history[historyIndex] || formatInitial(initialUrl);
  const isYouTube = activeUrl.includes('youtube.com') || activeUrl.includes('youtu.be');
  const isYouTubeWatch = isYouTube && (activeUrl.includes('watch?v=') || activeUrl.includes('/shorts/') || activeUrl.includes('/embed/'));
  const isYouTubeSearch = isYouTube && activeUrl.includes('search_query=');

  const extractVideoId = (url: string): string => {
    try {
      const u = new URL(url);
      return u.searchParams.get('v') || (u.pathname.includes('/shorts/') ? u.pathname.split('/shorts/')[1].split('/')[0] : '') || (u.hostname === 'youtu.be' ? u.pathname.slice(1).split('/')[0] : '');
    } catch { return ''; }
  };
  const currentVideoId = isYouTubeWatch ? extractVideoId(activeUrl) : '';
  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

  useEffect(() => { setInputUrl(activeUrl); }, [activeUrl]);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    if (isYouTubeSearch) {
      setDetectedMedia(null); setFrameBlocked(false);
      try {
        const query = new URL(activeUrl).searchParams.get('search_query') || '';
        setYtSearchInput(query); setYtSearchLoading(true);
        ApiService.getYouTubeSearch(query).then((results) => {
          if (!isCurrent) return;
          setYtSearchResults(Array.isArray(results) ? results : []);
          setYtSearchLoading(false); setIsLoading(false);
        }).catch(() => {
          if (!isCurrent) return;
          setYtSearchResults([]); setYtSearchLoading(false); setIsLoading(false);
        });
      } catch { setYtSearchResults([]); setYtSearchLoading(false); setIsLoading(false); }
      return () => { isCurrent = false; };
    }
    if (isYouTubeWatch) {
      setFrameBlocked(false);
      ApiService.getMetadata(activeUrl).then((meta) => { if (isCurrent) { setDetectedMedia(meta); setIsLoading(false); } }).catch(() => {
        if (!isCurrent) return;
        setDetectedMedia({ id: currentVideoId, url: activeUrl, title: `YouTube Video (${currentVideoId})`, source: 'YouTube', author: 'YouTube Creator', duration: '', durationSeconds: 0, thumbnail: currentVideoId ? `https://i.ytimg.com/vi/${currentVideoId}/hqdefault.jpg` : '', previewUrl: currentVideoId ? `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1` : '', type: 'video', supported: true, availableQualities: ['144p','240p','360p','480p','720p','1080p'] });
        setIsLoading(false);
      });
      return () => { isCurrent = false; };
    }
    if (isYouTube) {
      setDetectedMedia(null); setFrameBlocked(false);
      ApiService.getYouTubeFeed(ytSelectedChip.toLowerCase()).then((feed) => { if (isCurrent) { setYtVideos(Array.isArray(feed) ? feed : []); setIsLoading(false); } }).catch(() => { if (isCurrent) { setYtVideos([]); setIsLoading(false); } });
      return () => { isCurrent = false; };
    }
    ApiService.checkFrameEmbeddable(activeUrl).then((res) => { if (isCurrent) { setFrameBlocked(!res.embeddable); setIsLoading(false); } }).catch(() => { if (isCurrent) { setFrameBlocked(true); setIsLoading(false); } });
    const isDirect = /\.(mp4|mp3|m4a|webm|mov|jpg|jpeg|png|webp)(\?|$)/i.test(activeUrl);
    if (isDirect) ApiService.getMetadata(activeUrl).then((m) => { if (isCurrent) setDetectedMedia(m); }).catch(() => {}); else setDetectedMedia(null);
    return () => { isCurrent = false; };
  }, [activeUrl, isYouTubeSearch, isYouTubeWatch, isYouTube, currentVideoId, ytSelectedChip]);

  useEffect(() => {
    if (!ytSearchInput.trim()) { setYtSuggestions([]); return; }
    const timer = setTimeout(async () => { try { setYtSuggestions(await ApiService.getYouTubeSuggestions(ytSearchInput)); } catch { setYtSuggestions([]); } }, 250);
    return () => clearTimeout(timer);
  }, [ytSearchInput]);

  const navigateTo = (newUrl: string) => {
    let formatted = newUrl.trim();
    if (!/^https?:\/\//i.test(formatted)) formatted = formatted.includes('.') && !formatted.includes(' ') ? `https://${formatted}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(formatted)}`;
    const next = history.slice(0, historyIndex + 1); next.push(formatted); setHistory(next); setHistoryIndex(next.length - 1); setShowYtSuggestions(false);
  };
  const handleUrlSubmit = (e: React.FormEvent) => { e.preventDefault(); if (inputUrl.trim()) navigateTo(inputUrl); };
  const handleBack = () => { if (historyIndex > 0) setHistoryIndex(historyIndex - 1); };
  const handleForward = () => { if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1); };
  const handleRefresh = () => { setIsLoading(true); setTimeout(() => setIsLoading(false), 400); };
  const handleCopyUrl = () => { navigator.clipboard.writeText(activeUrl); setCopied(true); showToast('URL copied to clipboard!'); setTimeout(() => setCopied(false), 2000); setIsMenuOpen(false); };
  const handleShare = async () => { setIsMenuOpen(false); if (navigator.share) { try { await navigator.share({ title: 'VidGrab In-App Browser', url: activeUrl }); return; } catch {} } handleCopyUrl(); };
  const handleExternalOpen = () => { window.open(activeUrl, '_blank', 'noopener,noreferrer'); setIsMenuOpen(false); };
  const handleTriggerGrab = async () => {
    if (!detectedMedia && !isYouTubeWatch) { showToast('No downloadable media detected.'); return; }
    setIsGrabbing(true);
    try { const res = await ApiService.grab(activeUrl); if (res.downloadable && res.metadata) { showToast('✓ Media Grabbed! Opening download options...'); setTimeout(() => onOpenDownloadPage(res.metadata!), 300); } else if (detectedMedia) { showToast('✓ Media Grabbed!'); onOpenDownloadPage(detectedMedia); } else showToast(res.message || 'No downloadable media detected.'); }
    catch { if (detectedMedia) onOpenDownloadPage(detectedMedia); else showToast('No downloadable media detected.'); }
    finally { setIsGrabbing(false); }
  };
  const canGoBack = historyIndex > 0; const canGoForward = historyIndex < history.length - 1;
  const currentVideoItem = ytVideos.find(v => v.id === currentVideoId) || ytSearchResults.find(v => v.id === currentVideoId) || { id: currentVideoId, title: detectedMedia?.title || 'YouTube Video', channel: detectedMedia?.author || 'YouTube', views: detectedMedia?.views || '', publishedAt: detectedMedia?.publishedAt || '', duration: detectedMedia?.duration || '', thumbnail: detectedMedia?.thumbnail || (currentVideoId ? `https://i.ytimg.com/vi/${currentVideoId}/hqdefault.jpg` : ''), url: activeUrl };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto bg-white border-x border-gray-200 shadow-2xl overflow-hidden relative" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {toastMessage && <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400"/><span>{toastMessage}</span></div>}
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2 shadow-xs shrink-0 z-40" style={{ paddingTop: 'max(8px, env(safe-area-inset-top, 0px))' }}>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={handleBack} disabled={!canGoBack} className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 disabled:text-gray-300" title="Back"><ArrowLeft className="w-4 h-4"/></button>
          <button onClick={handleForward} disabled={!canGoForward} className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 disabled:text-gray-300" title="Forward"><ArrowRight className="w-4 h-4"/></button>
          <button onClick={handleRefresh} className={`p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 ${isLoading ? 'animate-spin text-red-600' : ''}`} title="Refresh"><RotateCw className="w-4 h-4"/></button>
        </div>
        <form onSubmit={handleUrlSubmit} className="flex-1 min-w-0"><div className="relative flex items-center bg-gray-100 rounded-full px-3 py-1.5 border border-gray-200 focus-within:border-red-500 focus-within:bg-white"><Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mr-2"/><input id="browser-address-input" type="text" value={inputUrl} onChange={e=>setInputUrl(e.target.value)} placeholder="Search YouTube or enter URL" className="w-full bg-transparent text-xs sm:text-sm text-gray-900 font-medium outline-none truncate"/>{inputUrl !== activeUrl && <button type="submit" className="ml-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-bold">GO</button>}</div></form>
        <div className="flex items-center gap-1 shrink-0 relative"><button onClick={()=>setIsMenuOpen(!isMenuOpen)} className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100"><MoreVertical className="w-4 h-4"/></button>{isMenuOpen && <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border py-1.5 z-50 text-xs font-semibold"><button onClick={handleCopyUrl} className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 text-left"><Copy className="w-4 h-4"/><span>{copied?'Link Copied!':'Copy Link'}</span></button><button onClick={handleShare} className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 text-left"><Share2 className="w-4 h-4"/><span>Share Link</span></button><button onClick={handleExternalOpen} className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 text-left"><ExternalLink className="w-4 h-4"/><span>Open in Chrome / Tab</span></button><div className="my-1 border-t"/><button onClick={onClose} className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-red-50 text-red-600 text-left"><ArrowLeft className="w-4 h-4"/><span>Exit VidGrab Browser</span></button></div>}</div>
      </div>
      {isLoading && <div className="w-full h-1 bg-red-100 overflow-hidden shrink-0"><div className="w-full h-full bg-red-600 animate-pulse"/></div>}
      <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col relative">
        {isYouTube ? <div className="flex-1 flex flex-col bg-white min-h-full">
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between"><button onClick={()=>navigateTo('https://m.youtube.com')} className="flex items-center gap-1"><div className="w-7 h-5 rounded-md bg-red-600 flex items-center justify-center"><Play className="w-3.5 h-3.5 fill-white text-white"/></div><span className="font-black text-base">YouTube</span><span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 rounded ml-1">IN-APP</span></button><div className="flex items-center gap-1"><button onClick={()=>setYtIsSearching(!ytIsSearching)} className="p-1.5 rounded-full hover:bg-gray-100"><Search className="w-4 h-4"/></button><button className="p-1.5 rounded-full hover:bg-gray-100"><Bell className="w-4 h-4"/></button><div className="w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">V</div></div></div>
          {(ytIsSearching || isYouTubeSearch) && <div className="p-2.5 bg-gray-50 border-b border-gray-200 relative z-20"><form onSubmit={e=>{e.preventDefault(); if(ytSearchInput.trim()) navigateTo(`https://www.youtube.com/results?search_query=${encodeURIComponent(ytSearchInput.trim())}`);}} className="relative"><div className="flex items-center bg-white border border-gray-300 rounded-full px-3 py-2"><Search className="w-4 h-4 text-gray-400 mr-2"/><input value={ytSearchInput} onChange={e=>{setYtSearchInput(e.target.value);setShowYtSuggestions(true)}} onFocus={()=>setShowYtSuggestions(true)} placeholder="Search YouTube" className="flex-1 outline-none text-sm"/><button type="submit" className="text-xs font-bold text-red-600">Search</button></div>{showYtSuggestions && ytSuggestions.length>0 && <div className="absolute left-2 right-2 top-12 bg-white border rounded-xl shadow-lg z-50 overflow-hidden">{ytSuggestions.slice(0,6).map((s,i)=><button key={`${s}-${i}`} type="button" onClick={()=>{setYtSearchInput(s);setShowYtSuggestions(false);navigateTo(`https://www.youtube.com/results?search_query=${encodeURIComponent(s)}`)}} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50">{s}</button>)}</div>}</form></div>}
          <div className="flex gap-2 overflow-x-auto px-3 py-2 border-b bg-white">{YT_CHIPS.map(chip=><button key={chip} onClick={()=>setYtSelectedChip(chip)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${ytSelectedChip===chip?'bg-gray-900 text-white':'bg-gray-100 text-gray-700'}`}>{chip}</button>)}</div>
          {isYouTubeSearch ? <div className="p-3">{ytSearchLoading ? <div className="py-12 text-center text-sm text-gray-500">Searching YouTube…</div> : ytSearchResults.length===0 ? <div className="py-12 text-center"><Search className="w-10 h-10 mx-auto text-gray-300 mb-3"/><p className="font-bold text-gray-700">No videos found</p><p className="text-xs text-gray-500 mt-1">Try another search.</p></div> : <div className="space-y-3">{ytSearchResults.map(v=><button key={v.id} onClick={()=>navigateTo(v.url)} className="w-full text-left bg-white rounded-xl border overflow-hidden hover:shadow-md"><div className="flex gap-3 p-2"><img src={v.thumbnail} className="w-36 h-20 object-cover rounded-lg bg-gray-200"/><div className="min-w-0 flex-1"><p className="font-bold text-sm line-clamp-2">{v.title}</p><p className="text-xs text-gray-500 mt-1">{v.channel}</p><p className="text-[11px] text-gray-400 mt-1">{v.views}{v.duration?` • ${v.duration}`:''}</p></div></div></button>)}</div>}</div> : isYouTubeWatch ? <div className="bg-white"><div className="aspect-video bg-black"><iframe title="YouTube player" src={`https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&rel=0`} className="w-full h-full border-0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/></div><div className="p-4"><h2 className="font-bold text-lg">{currentVideoItem.title}</h2><p className="text-sm text-gray-500 mt-1">{currentVideoItem.channel}</p><button onClick={handleTriggerGrab} disabled={isGrabbing} className="mt-4 w-full rounded-xl bg-red-600 text-white py-3 font-bold flex items-center justify-center gap-2"><Download className="w-5 h-5"/>{isGrabbing?'Grabbing…':'Grab / Download'}</button></div></div> : <div className="p-4 text-center text-sm text-gray-500">{frameBlocked ? 'This website cannot be embedded here. Use the address bar or download a direct media link.' : 'Loading page…'}</div>}
      </div>
    </div>
  );
};
