import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Lock,
  MoreVertical,
  Home,
  Download,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Bell,
  Play,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Film,
  Compass,
  X,
  AlertCircle,
  Globe,
  Sparkles,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { MediaMetadata } from '../types';
import { ApiService } from '../services/api';

interface InAppBrowserProps {
  initialUrl: string;
  onClose: () => void;
  onOpenDownloadPage: (metadata: MediaMetadata) => void;
}

interface YouTubeVideoItem {
  id: string;
  title: string;
  channel: string;
  channelAvatar?: string;
  views: string;
  publishedAt: string;
  duration: string;
  thumbnail: string;
  url: string;
  videoUrl?: string;
}

// YouTube category chips
const YT_CHIPS = ['All', 'Trending', 'Music', 'Tech', 'Gaming', 'News', 'Podcasts', '4K HDR'];

// Fallback high-definition videos for initial immediate rendering
const INITIAL_YT_VIDEOS: YouTubeVideoItem[] = [
  {
    id: 'fTKqtvXjkvo',
    title: 'Top Hits 2026 ~ Trending Songs 2026 ~ Top Songs 2026 Top Music 🎶🎧',
    channel: 'Revive Music',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    views: '54M views',
    publishedAt: '3 weeks ago',
    duration: '04:18',
    thumbnail: 'https://i.ytimg.com/vi/fTKqtvXjkvo/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=fTKqtvXjkvo',
  },
  {
    id: 'colors-of-wildlife-4k',
    title: 'Colors of Wildlife in 4K HDR • Atmospheric Spatial Audio',
    channel: 'National Fauna',
    channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    views: '1.2M views',
    publishedAt: '1 month ago',
    duration: '04:18',
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.youtube.com/watch?v=colors-of-wildlife-4k',
  },
  {
    id: 'tokyo-sunset-timelapse',
    title: 'Tokyo Sunset Skyline & Shinjuku Night Walk • 4K 60FPS',
    channel: 'TokyoWalkers',
    channelAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
    views: '3.4M views',
    publishedAt: '2 weeks ago',
    duration: '15:00',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.youtube.com/watch?v=tokyo-sunset-timelapse',
  },
  {
    id: 'ps3-nostalgia-games',
    title: 'Top 50 Legendary PS3 Games That Defined a Generation (4K Gameplay)',
    channel: 'RetroGamer HQ',
    channelAvatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80',
    views: '2.8M views',
    publishedAt: '3 months ago',
    duration: '28:40',
    thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.youtube.com/watch?v=ps3-nostalgia-games',
  },
  {
    id: 'arijit-singh-live-melodies',
    title: 'Arijit Singh Best Romantic & Soulful Songs Collection (Official Studio Quality)',
    channel: 'Bollywood Melodies',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    views: '18.9M views',
    publishedAt: '2 months ago',
    duration: '45:12',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.youtube.com/watch?v=arijit-singh-live-melodies',
  },
];

export const InAppBrowser: React.FC<InAppBrowserProps> = ({
  initialUrl,
  onClose,
  onOpenDownloadPage,
}) => {
  const formatInitial = (url: string) => {
    let u = url.trim();
    if (!u.startsWith('http://') && !u.startsWith('https://')) {
      u = `https://${u}`;
    }
    return u;
  };

  // Browser Navigation & History Stack
  const [history, setHistory] = useState<string[]>([formatInitial(initialUrl)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [inputUrl, setInputUrl] = useState(formatInitial(initialUrl));
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // YouTube Specific State
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

  // Active downloadable media detection
  const [detectedMedia, setDetectedMedia] = useState<MediaMetadata | null>(null);
  const [isGrabbing, setIsGrabbing] = useState(false);

  // Non-embeddable website blocking state
  const [frameBlocked, setFrameBlocked] = useState(false);

  const activeUrl = history[historyIndex] || formatInitial(initialUrl);

  const isYouTube = activeUrl.includes('youtube.com') || activeUrl.includes('youtu.be');
  const isYouTubeWatch = isYouTube && (activeUrl.includes('watch?v=') || activeUrl.includes('/shorts/') || activeUrl.includes('/embed/'));
  const isYouTubeSearch = isYouTube && activeUrl.includes('search_query=');

  // Helper to extract YouTube video ID from URL
  const extractVideoId = (url: string): string => {
    try {
      if (url.includes('v=')) {
        const u = new URL(url);
        return u.searchParams.get('v') || 'colors-of-wildlife-4k';
      }
      if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1].split(/[?&#]/)[0];
      }
      if (url.includes('shorts/')) {
        return url.split('shorts/')[1].split(/[?&#]/)[0];
      }
      if (url.includes('embed/')) {
        return url.split('embed/')[1].split(/[?&#]/)[0];
      }
    } catch {
      const match = url.match(/[?&]v=([^&#]+)/);
      if (match) return match[1];
    }
    return 'colors-of-wildlife-4k';
  };

  const currentVideoId = isYouTubeWatch ? extractVideoId(activeUrl) : '';

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Synchronize URL input with active history URL
  useEffect(() => {
    setInputUrl(activeUrl);
  }, [activeUrl]);

  // Handle URL change: frame check, YouTube search, or Grab detection
  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    // 1. If activeUrl is YouTube Search: execute actual search
    if (isYouTubeSearch) {
      setDetectedMedia(null);
      setFrameBlocked(false);
      try {
        const parsed = new URL(activeUrl);
        const query = parsed.searchParams.get('search_query') || '';
        setYtSearchInput(query);
        setYtSearchLoading(true);
        ApiService.getYouTubeSearch(query).then((results) => {
          if (isCurrent) {
            setYtSearchResults(results.length > 0 ? results : INITIAL_YT_VIDEOS);
            setYtSearchLoading(false);
            setIsLoading(false);
          }
        }).catch(() => {
          if (isCurrent) {
            setYtSearchResults(INITIAL_YT_VIDEOS);
            setYtSearchLoading(false);
            setIsLoading(false);
          }
        });
      } catch {
        setIsLoading(false);
      }
      return;
    }

    // 2. If activeUrl is YouTube Watch Page: detect media and fetch real metadata
    if (isYouTubeWatch) {
      setFrameBlocked(false);
      ApiService.getMetadata(activeUrl)
        .then((meta) => {
          if (isCurrent) {
            setDetectedMedia(meta);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isCurrent) {
            // Fallback metadata for watch
            setDetectedMedia({
              id: currentVideoId,
              url: activeUrl,
              title: `YouTube Video (${currentVideoId})`,
              source: 'YouTube',
              author: 'YouTube Creator',
              duration: '04:18',
              durationSeconds: 258,
              thumbnail: `https://i.ytimg.com/vi/${currentVideoId}/hqdefault.jpg`,
              previewUrl: `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1`,
              type: 'video',
              supported: true,
              availableQualities: ['144p', '240p', '360p', '480p', '720p', '1080p', '2k', '4k'],
            });
            setIsLoading(false);
          }
        });
      return;
    }

    // 3. If activeUrl is YouTube Home/Explore: no single video Grab
    if (isYouTube) {
      setDetectedMedia(null);
      setFrameBlocked(false);
      ApiService.getYouTubeFeed(ytSelectedChip.toLowerCase()).then((feed) => {
        if (isCurrent) {
          if (feed.length > 0) setYtVideos(feed);
          setIsLoading(false);
        }
      }).catch(() => {
        if (isCurrent) setIsLoading(false);
      });
      return;
    }

    // 4. Other websites: check frame embeddability
    ApiService.checkFrameEmbeddable(activeUrl)
      .then((res) => {
        if (isCurrent) {
          setFrameBlocked(!res.embeddable);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setFrameBlocked(true);
          setIsLoading(false);
        }
      });

    // Also check if URL is direct media
    const isDirect = /\.(mp4|mp3|m4a|webm|mov|jpg|jpeg|png|webp)(\?|$)/i.test(activeUrl);
    if (isDirect) {
      ApiService.getMetadata(activeUrl).then((m) => {
        if (isCurrent) setDetectedMedia(m);
      }).catch(() => {});
    } else {
      setDetectedMedia(null);
    }

    return () => {
      isCurrent = false;
    };
  }, [activeUrl, isYouTubeSearch, isYouTubeWatch, isYouTube, currentVideoId, ytSelectedChip]);

  // Live YouTube search suggestions with debouncing
  useEffect(() => {
    if (!ytSearchInput.trim()) {
      setYtSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const suggestions = await ApiService.getYouTubeSuggestions(ytSearchInput);
        setYtSuggestions(suggestions);
      } catch {
        setYtSuggestions([]);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [ytSearchInput]);

  // Navigate to a new URL inside the VidGrab Browser
  const navigateTo = (newUrl: string) => {
    let formatted = newUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      if (formatted.includes('.') && !formatted.includes(' ')) {
        formatted = `https://${formatted}`;
      } else {
        // Query search
        formatted = `https://m.youtube.com/results?search_query=${encodeURIComponent(formatted)}`;
      }
    }

    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(formatted);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setShowYtSuggestions(false);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      navigateTo(inputUrl);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    showToast('URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
    setIsMenuOpen(false);
  };

  const handleShare = async () => {
    setIsMenuOpen(false);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VidGrab In-App Browser',
          url: activeUrl,
        });
        return;
      } catch {
        // User cancelled or failed
      }
    }
    handleCopyUrl();
  };

  const handleExternalOpen = () => {
    window.open(activeUrl, '_blank', 'noopener,noreferrer');
    setIsMenuOpen(false);
  };

  // Trigger Grab on detected media
  const handleTriggerGrab = async () => {
    if (!detectedMedia && !isYouTubeWatch) {
      showToast('No downloadable media detected.');
      return;
    }

    setIsGrabbing(true);
    try {
      const res = await ApiService.grab(activeUrl);
      if (res.downloadable && res.metadata) {
        showToast('✓ Media Grabbed! Opening download options...');
        setTimeout(() => {
          onOpenDownloadPage(res.metadata!);
        }, 300);
      } else if (detectedMedia) {
        showToast('✓ Media Grabbed!');
        onOpenDownloadPage(detectedMedia);
      } else {
        showToast(res.message || 'No downloadable media detected.');
      }
    } catch {
      if (detectedMedia) {
        onOpenDownloadPage(detectedMedia);
      } else {
        showToast('No downloadable media detected.');
      }
    } finally {
      setIsGrabbing(false);
    }
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  // Active video watch item
  const currentVideoItem: YouTubeVideoItem =
    ytVideos.find((v) => v.id === currentVideoId) ||
    ytSearchResults.find((v) => v.id === currentVideoId) ||
    INITIAL_YT_VIDEOS.find((v) => v.id === currentVideoId) || {
      id: currentVideoId || 'sample',
      title: detectedMedia?.title || `YouTube Video (${currentVideoId})`,
      channel: detectedMedia?.author || 'YouTube Creator',
      channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      views: detectedMedia?.views || '1.5M views',
      publishedAt: detectedMedia?.publishedAt || 'Recently',
      duration: detectedMedia?.duration || '04:18',
      thumbnail: detectedMedia?.thumbnail || `https://i.ytimg.com/vi/${currentVideoId}/hqdefault.jpg`,
      url: activeUrl,
    };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto bg-white border-x border-gray-200 shadow-2xl overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BROWSER BAR (Back, Forward, Refresh, Omnibox, Menu) */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2 shadow-xs shrink-0 z-40">
        {/* Navigation Controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            id="browser-btn-back"
            onClick={handleBack}
            disabled={!canGoBack}
            className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            id="browser-btn-forward"
            onClick={handleForward}
            disabled={!canGoForward}
            className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Forward"
          >
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            id="browser-btn-refresh"
            onClick={handleRefresh}
            className={`p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer ${
              isLoading ? 'animate-spin text-red-600' : ''
            }`}
            title="Refresh"
          >
            <RotateCw className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Address Bar / Omnibox */}
        <form onSubmit={handleUrlSubmit} className="flex-1 min-w-0">
          <div className="relative flex items-center bg-gray-100 rounded-full px-3 py-1.5 border border-gray-200 focus-within:border-red-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500/10 transition-all">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mr-2" />
            <input
              id="browser-address-input"
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Search YouTube or enter URL"
              className="w-full bg-transparent text-xs sm:text-sm text-gray-900 font-medium outline-none truncate"
            />
            {inputUrl !== activeUrl && (
              <button
                type="submit"
                className="ml-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-bold shrink-0 hover:bg-red-700 transition-colors cursor-pointer"
              >
                GO
              </button>
            )}
          </div>
        </form>

        {/* Browser Menu Button */}
        <div className="flex items-center gap-1 shrink-0 relative">
          <button
            id="browser-btn-menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Browser Menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Browser Overflow Menu */}
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 text-xs font-semibold text-gray-700 animate-fadeIn">
              <button
                onClick={handleCopyUrl}
                className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={handleShare}
                className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Link</span>
              </button>
              <button
                onClick={handleExternalOpen}
                className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 text-left transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Chrome / Tab</span>
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={onClose}
                className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-red-50 text-red-600 text-left transition-colors cursor-pointer font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit VidGrab Browser</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Progress Line */}
      {isLoading && (
        <div className="w-full h-1 bg-red-100 overflow-hidden shrink-0">
          <div className="w-full h-full bg-red-600 origin-left animate-pulse" />
        </div>
      )}

      {/* BROWSER CONTENT VIEWPORT */}
      <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col relative">
        {/* ========================================================= */}
        {/* 1. YOUTUBE IN-APP MOBILE WEB EXPERIENCE                   */}
        {/* ========================================================= */}
        {isYouTube ? (
          <div className="flex-1 flex flex-col bg-white min-h-full">
            {/* YouTube Mobile Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between shadow-2xs">
              <button
                onClick={() => navigateTo('https://m.youtube.com')}
                className="flex items-center gap-1 cursor-pointer"
              >
                <div className="w-7 h-5 rounded-md bg-red-600 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                </div>
                <span className="font-black text-base text-gray-950 tracking-tighter">
                  YouTube
                </span>
                <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 rounded ml-1">
                  IN-APP
                </span>
              </button>

              <div className="flex items-center gap-1 text-gray-700">
                <button
                  onClick={() => setYtIsSearching(!ytIsSearching)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Search YouTube"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                  <Bell className="w-4 h-4" />
                </button>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs ml-1">
                  V
                </div>
              </div>
            </div>

            {/* YouTube Search Input & Real Google Suggestions */}
            {(ytIsSearching || isYouTubeSearch) && (
              <div className="p-2.5 bg-gray-50 border-b border-gray-200 relative z-20">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (ytSearchInput.trim()) {
                      navigateTo(`https://m.youtube.com/results?search_query=${encodeURIComponent(ytSearchInput.trim())}`);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3" />
                    <input
                      type="text"
                      value={ytSearchInput}
                      onChange={(e) => {
                        setYtSearchInput(e.target.value);
                        setShowYtSuggestions(true);
                      }}
                      onFocus={() => setShowYtSuggestions(true)}
                      placeholder="Search YouTube (e.g. Arijit Singh, PS3 games)..."
                      className="w-full bg-white rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-gray-900 border border-gray-300 outline-none focus:border-red-500 font-medium shadow-xs"
                    />
                    {ytSearchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setYtSearchInput('');
                          setYtSuggestions([]);
                        }}
                        className="absolute right-2.5 text-gray-400 hover:text-gray-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs cursor-pointer"
                  >
                    Search
                  </button>
                </form>

                {/* Real Google/YouTube Search Autocomplete Suggestions */}
                {showYtSuggestions && ytSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-xl z-50 divide-y divide-gray-100 max-h-72 overflow-y-auto">
                    {ytSuggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setYtSearchInput(sug);
                          setShowYtSuggestions(false);
                          navigateTo(`https://m.youtube.com/results?search_query=${encodeURIComponent(sug)}`);
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 text-xs sm:text-sm text-gray-900 font-medium transition-colors cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{sug}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* A. YOUTUBE SEARCH RESULTS VIEW */}
            {isYouTubeSearch ? (
              <div className="flex-1 overflow-y-auto pb-32">
                <div className="p-3 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600">
                  <p>
                    Search results for:{' '}
                    <strong className="text-gray-950">"{ytSearchInput}"</strong>
                  </p>
                  <span className="text-[11px] text-gray-500 font-semibold">
                    {ytSearchResults.length} videos found
                  </span>
                </div>

                {ytSearchLoading ? (
                  <div className="p-8 text-center text-gray-500 space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin mx-auto" />
                    <p className="text-xs font-semibold">Fetching YouTube search results...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {ytSearchResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigateTo(item.url || `https://www.youtube.com/watch?v=${item.id}`)}
                        className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer group flex flex-col sm:flex-row gap-3"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-full sm:w-52 aspect-video rounded-xl overflow-hidden bg-gray-900 shrink-0 shadow-xs">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                          />
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] font-bold text-white">
                            {item.duration || '04:18'}
                          </span>
                        </div>

                        {/* Video Information */}
                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-gray-950 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                              <span className="font-semibold text-gray-700">{item.channel}</span>
                              <span>•</span>
                              <span>{item.views}</span>
                              <span>•</span>
                              <span>{item.publishedAt}</span>
                            </p>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">
                              4K / HD
                            </span>
                            <span className="text-[11px] text-red-600 font-bold group-hover:underline">
                              Watch inside VidGrab →
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : isYouTubeWatch ? (
              /* B. YOUTUBE VIDEO WATCH PAGE VIEW */
              <div className="flex-1 overflow-y-auto pb-32">
                {/* Embedded Video Player */}
                <div className="sticky top-0 z-20 aspect-video bg-black shadow-md">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&enablejsapi=1&rel=0`}
                    title={currentVideoItem.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>

                {/* Video Info Strip */}
                <div className="p-4 space-y-3 bg-white">
                  <h1 className="text-base sm:text-lg font-black text-gray-950 leading-tight">
                    {currentVideoItem.title}
                  </h1>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {currentVideoItem.views} • {currentVideoItem.publishedAt}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 font-bold text-[10px] border border-red-200">
                      4K HDR Ready
                    </span>
                  </div>

                  {/* YouTube Action Buttons */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
                    <button
                      onClick={() => setIsLiked(!isLiked)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                        isLiked
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-600' : ''}`} />
                      <span>{isLiked ? 'Liked' : 'Like'}</span>
                    </button>

                    <button className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer shrink-0">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={handleShare}
                      className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-200 transition-colors cursor-pointer shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>

                    {/* In-strip VidGrab Quick Action */}
                    <button
                      onClick={handleTriggerGrab}
                      className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-black flex items-center gap-1.5 hover:bg-red-700 transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>GRAB</span>
                    </button>
                  </div>

                  {/* Channel Strip */}
                  <div className="flex items-center justify-between py-3 border-y border-gray-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={currentVideoItem.channelAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={currentVideoItem.channel}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-black text-gray-900 truncate">
                          {currentVideoItem.channel}
                        </p>
                        <p className="text-[11px] text-gray-500">Official Channel • Verified</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsSubscribed(!isSubscribed)}
                      className={`px-4 py-1.5 rounded-full text-xs font-black transition-colors cursor-pointer ${
                        isSubscribed ? 'bg-gray-100 text-gray-800' : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </button>
                  </div>

                  {/* Expandable Description */}
                  <div
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700 cursor-pointer hover:bg-gray-100/80 transition-colors border border-gray-100"
                  >
                    <div className="flex items-center justify-between font-bold text-gray-900 mb-1">
                      <span>Description</span>
                      {descExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                    <p className={`leading-relaxed ${descExpanded ? '' : 'line-clamp-2'}`}>
                      Enjoy high definition media playback inside VidGrab. You can download audio in M4A/MP3, video in up to 4K resolution, or extract high-res thumbnail covers anytime by tapping GRAB.
                    </p>
                  </div>

                  {/* Up Next & Related Videos */}
                  <div className="pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                      Up Next & Recommendations
                    </h3>
                    <div className="space-y-3">
                      {INITIAL_YT_VIDEOS.filter((v) => v.id !== currentVideoId).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => navigateTo(item.url)}
                          className="flex gap-3 cursor-pointer group p-1 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div className="relative w-36 aspect-video rounded-xl overflow-hidden bg-gray-900 shrink-0">
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[10px] font-bold text-white">
                              {item.duration}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-gray-950 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-1">{item.channel}</p>
                            <p className="text-[10px] text-gray-400">{item.views}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* C. YOUTUBE HOME FEED VIEW */
              <div className="flex-1 overflow-y-auto pb-32">
                {/* Topic Pills */}
                <div className="sticky top-10 z-20 bg-white/95 backdrop-blur-xs border-b border-gray-200 px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {YT_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setYtSelectedChip(chip)}
                      className={`px-3.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        ytSelectedChip === chip
                          ? 'bg-gray-900 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Video Cards Feed */}
                <div className="divide-y divide-gray-100">
                  {ytVideos.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigateTo(item.url || `https://www.youtube.com/watch?v=${item.id}`)}
                      className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      {/* Video Thumbnail */}
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 mb-3 shadow-xs">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                          <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 ml-0.5 fill-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-bold text-white">
                          {item.duration || '04:18'}
                        </div>
                      </div>

                      {/* Video Metadata */}
                      <div className="flex gap-3">
                        <img
                          src={item.channelAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                          alt={item.channel}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-gray-950 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                            <span className="font-semibold text-gray-700">{item.channel}</span>
                            <span>•</span>
                            <span>{item.views}</span>
                            <span>•</span>
                            <span>{item.publishedAt}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : frameBlocked ? (
          /* ========================================================= */
          /* 2. SECURITY-COMPLIANT WEBSITE FALLBACK (SECTION 16)       */
          /* When target website blocks iframe via X-Frame-Options/CSP */
          /* ========================================================= */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50">
            <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-4 shadow-sm">
              <Globe className="w-8 h-8" />
            </div>

            <h2 className="text-lg font-black text-gray-950 mb-2">
              This website does not allow in-app browsing.
            </h2>
            <p className="text-xs text-gray-500 max-w-md mb-6 leading-relaxed">
              The external domain <strong className="text-gray-800">{activeUrl}</strong> enforces web security policies (X-Frame-Options or CSP) restricting frame embedding.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
              <button
                onClick={handleExternalOpen}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>OPEN EXTERNALLY</span>
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK TO VIDGRAB</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* 3. GENERAL EMBEDDABLE WEB PAGE VIEW                       */
          /* ========================================================= */
          <div className="flex-1 flex flex-col h-full bg-white">
            <iframe
              src={activeUrl}
              title="In-App Web View"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              className="w-full flex-1 border-0"
            />
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. FLOATING DOWNLOAD / GRAB ACTION BUTTON (SECTIONS 8, 9)  */}
      {/* Appears ONLY when eligible downloadable media is detected  */}
      {/* ========================================================= */}
      {(detectedMedia || isYouTubeWatch) && (
        <div className="absolute bottom-16 right-4 z-40 animate-bounce-short">
          <button
            id="browser-floating-grab-btn"
            onClick={handleTriggerGrab}
            disabled={isGrabbing}
            className="py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-sm tracking-wide flex items-center gap-2.5 shadow-2xl shadow-red-600/50 border-2 border-white/20 transition-all cursor-pointer"
          >
            <Download className="w-5 h-5 stroke-[3]" />
            <span>{isGrabbing ? 'SCANNING...' : 'GRAB'}</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. BOTTOM BROWSER CONTROLS (SECTION 14)                   */}
      {/* ←  →  HOME  DOWNLOAD  ⋮                                   */}
      {/* ========================================================= */}
      <div className="bg-white border-t border-gray-200 py-2.5 px-6 flex items-center justify-between text-gray-700 shrink-0 z-30 shadow-xs">
        <button
          onClick={handleBack}
          disabled={!canGoBack}
          className="flex flex-col items-center gap-0.5 disabled:text-gray-300 hover:text-gray-950 transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span className="text-[9px] font-bold">Back</span>
        </button>

        <button
          onClick={handleForward}
          disabled={!canGoForward}
          className="flex flex-col items-center gap-0.5 disabled:text-gray-300 hover:text-gray-950 transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Forward"
        >
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          <span className="text-[9px] font-bold">Forward</span>
        </button>

        <button
          onClick={onClose}
          className="flex flex-col items-center gap-0.5 text-gray-800 hover:text-red-600 transition-colors cursor-pointer"
          title="Home"
        >
          <Home className="w-4 h-4 stroke-[2.5]" />
          <span className="text-[9px] font-bold">HOME</span>
        </button>

        <button
          onClick={handleTriggerGrab}
          disabled={!detectedMedia && !isYouTubeWatch}
          className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
            detectedMedia || isYouTubeWatch
              ? 'text-red-600 font-bold hover:text-red-700'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title={detectedMedia || isYouTubeWatch ? 'Download media' : 'No downloadable media detected'}
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span className="text-[9px] font-bold">DOWNLOAD</span>
        </button>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex flex-col items-center gap-0.5 hover:text-gray-950 transition-colors cursor-pointer"
          title="More options"
        >
          <MoreVertical className="w-4 h-4" />
          <span className="text-[9px] font-bold">MENU</span>
        </button>
      </div>
    </div>
  );
};
