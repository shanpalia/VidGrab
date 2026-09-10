import React, { useState } from 'react';
import {
  Search,
  Clipboard,
  ArrowRight,
  Youtube,
  Instagram,
  Facebook,
  Music2,
  Share2,
  Twitter,
  Pin,
  Globe,
  Film,
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  Download,
  MoreVertical,
  X,
  ExternalLink,
  ShieldCheck,
  Radio,
  Image as ImageIcon
} from 'lucide-react';
import { PlatformSource } from '../types';

interface HomePageProps {
  onOpenBrowser: (url: string) => void;
  onOpenDownloadPage: (url: string) => void;
  onOpenMoreSites: () => void;
}

// 8 Platform Shortcuts
const PLATFORMS: Array<{
  id: string;
  name: string;
  source: PlatformSource;
  browserUrl: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgLight: string;
  badge?: string;
  description: string;
}> = [
  {
    id: 'youtube',
    name: 'YouTube',
    source: 'YouTube',
    browserUrl: 'https://m.youtube.com',
    icon: Youtube,
    color: 'text-red-600',
    bgLight: 'bg-red-50 hover:bg-red-100/80 border-red-200/70',
    badge: '4K HD',
    description: 'Open YouTube in VidGrab Browser',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    source: 'WhatsApp',
    browserUrl: 'https://web.whatsapp.com',
    icon: Share2,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200/70',
    badge: 'Status',
    description: 'Open WhatsApp Media in VidGrab Browser',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    source: 'Instagram',
    browserUrl: 'https://www.instagram.com',
    icon: Instagram,
    color: 'text-pink-600',
    bgLight: 'bg-pink-50 hover:bg-pink-100/80 border-pink-200/70',
    badge: 'Reels',
    description: 'Open Instagram in VidGrab Browser',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    source: 'Facebook',
    browserUrl: 'https://m.facebook.com',
    icon: Facebook,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50 hover:bg-blue-100/80 border-blue-200/70',
    badge: 'Watch',
    description: 'Open Facebook in VidGrab Browser',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    source: 'TikTok',
    browserUrl: 'https://www.tiktok.com',
    icon: Music2,
    color: 'text-slate-900',
    bgLight: 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80',
    badge: 'HD',
    description: 'Open TikTok in VidGrab Browser',
  },
  {
    id: 'twitter',
    name: 'X',
    source: 'X / Twitter',
    browserUrl: 'https://x.com',
    icon: Twitter,
    color: 'text-gray-950',
    bgLight: 'bg-gray-50 hover:bg-gray-100/80 border-gray-200/80',
    badge: 'Video',
    description: 'Open X in VidGrab Browser',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    source: 'Pinterest',
    browserUrl: 'https://www.pinterest.com',
    icon: Pin,
    color: 'text-red-700',
    bgLight: 'bg-red-50 hover:bg-red-100/80 border-red-200/70',
    badge: 'Pins',
    description: 'Open Pinterest in VidGrab Browser',
  },
  {
    id: 'more-sites',
    name: 'Sites',
    source: 'Web Media',
    browserUrl: '',
    icon: Globe,
    color: 'text-purple-600',
    bgLight: 'bg-purple-50 hover:bg-purple-100/80 border-purple-200/70',
    badge: '1000+',
    description: 'View all supported media sources',
  },
];

// Required Category Chips
const MEDIA_CHIPS = ['Shorts', 'All', 'Music', 'T-Series', 'Lo-fi', 'Video', 'Image', 'HD', '4K'];

// Rich Media Discovery Feed Items
const DISCOVERY_FEED = [
  {
    id: 'feed-1',
    title: 'Colors of Wildlife in 4K HDR & Spatial Audio',
    source: 'YouTube',
    sourceColor: 'text-red-600 bg-red-50 border-red-200',
    duration: '04:18',
    category: '4K',
    quality: '4K 60FPS • 88 MB',
    url: 'https://www.youtube.com/watch?v=colors-of-wildlife-4k',
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
    views: '1.2M',
  },
  {
    id: 'feed-2',
    title: 'Tokyo Sunset Skyline Timelapse Beat',
    source: 'Instagram',
    sourceColor: 'text-pink-600 bg-pink-50 border-pink-200',
    duration: '00:58',
    category: 'Shorts',
    quality: '1080P HD • 8.1 MB',
    url: 'https://www.instagram.com/reel/tokyo-sunset-timelapse',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
    views: '840K',
  },
  {
    id: 'feed-3',
    title: 'Trending Neon Choreography ⚡ Lossless Audio',
    source: 'TikTok',
    sourceColor: 'text-slate-900 bg-slate-100 border-slate-200',
    duration: '00:45',
    category: 'Music',
    quality: 'MP3 320K • 4.2 MB',
    url: 'https://www.tiktok.com/@dance_vibes_daily/video/trending-neon',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    views: '2.4M',
  },
  {
    id: 'feed-4',
    title: 'Next-Gen Robotics Showcase Tech Demo',
    source: 'X',
    sourceColor: 'text-gray-950 bg-gray-100 border-gray-200',
    duration: '02:15',
    category: 'HD',
    quality: '720P HD MP4',
    url: 'https://x.com/FutureTechLab/status/189283746192837',
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80',
    views: '410K',
  },
  {
    id: 'feed-5',
    title: 'Artisan Sourdough Baking Masterclass',
    source: 'Facebook',
    sourceColor: 'text-blue-600 bg-blue-50 border-blue-200',
    duration: '03:40',
    category: 'Video',
    quality: '1080P HD • 34 MB',
    url: 'https://www.facebook.com/watch?v=artisan-sourdough-recipe',
    thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    views: '620K',
  },
  {
    id: 'feed-6',
    title: 'Minimalist Scandinavian Room Makeover Ideas',
    source: 'Pinterest',
    sourceColor: 'text-red-700 bg-red-50 border-red-200',
    duration: '01:50',
    category: 'Image',
    quality: 'JPG / PNG • 2.4 MB',
    url: 'https://www.pinterest.com/pin/minimalist-room-decor-849302',
    thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    views: '310K',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  onOpenBrowser,
  onOpenDownloadPage,
  onOpenMoreSites,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [selectedChip, setSelectedChip] = useState('All');
  const [toastMessage, setToastMessage] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Next Button Modal state
  const [pendingModal, setPendingModal] = useState<{
    isOpen: boolean;
    url: string;
    detectedPlatform: string;
    platformIcon: React.ComponentType<{ className?: string }>;
  }>({
    isOpen: false,
    url: '',
    detectedPlatform: 'Web Page',
    platformIcon: Globe,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrlInput(text.trim());
          showToast('Pasted from clipboard!');
          return;
        }
      }
    } catch {
      // Fallback
    }
    const fallback = prompt('Paste your media URL:');
    if (fallback) {
      setUrlInput(fallback.trim());
    }
  };

  // Detect platform name and icon from URL or search query
  const detectPlatformInfo = (raw: string) => {
    const lower = raw.toLowerCase();
    if (lower.includes('youtube') || lower.includes('youtu.be')) {
      return { name: 'YouTube', icon: Youtube };
    }
    if (lower.includes('instagram')) {
      return { name: 'Instagram', icon: Instagram };
    }
    if (lower.includes('whatsapp') || lower.includes('wa.me')) {
      return { name: 'WhatsApp', icon: Share2 };
    }
    if (lower.includes('facebook') || lower.includes('fb.watch')) {
      return { name: 'Facebook', icon: Facebook };
    }
    if (lower.includes('tiktok')) {
      return { name: 'TikTok', icon: Music2 };
    }
    if (lower.includes('twitter') || lower.includes('x.com')) {
      return { name: 'X', icon: Twitter };
    }
    if (lower.includes('pinterest')) {
      return { name: 'Pinterest', icon: Pin };
    }
    return { name: 'Web Media', icon: Globe };
  };

  // Next button click handler
  const handleNextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = urlInput.trim();
    if (!clean) return;

    // Validate and format target URL
    let formattedUrl = clean;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.includes('.') && !clean.includes(' ')) {
        formattedUrl = `https://${clean}`;
      } else {
        // Query search
        formattedUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(clean)}`;
      }
    }

    const platformInfo = detectPlatformInfo(formattedUrl);

    // Show modern popup/modal: "Open this page in VidGrab?"
    setPendingModal({
      isOpen: true,
      url: formattedUrl,
      detectedPlatform: platformInfo.name,
      platformIcon: platformInfo.icon,
    });
  };

  const handleConfirmOpenPage = () => {
    const target = pendingModal.url;
    setPendingModal((prev) => ({ ...prev, isOpen: false }));
    onOpenBrowser(target);
  };

  const handleCancelModal = () => {
    setPendingModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handlePlatformClick = (platform: typeof PLATFORMS[0]) => {
    if (platform.id === 'more-sites') {
      onOpenMoreSites();
      return;
    }

    // Open INSIDE VidGrab's browser view as requested
    onOpenBrowser(platform.browserUrl);
  };

  // Filter feed items based on active chip
  const filteredFeed = DISCOVERY_FEED.filter((item) => {
    if (selectedChip === 'All') return true;
    if (selectedChip === 'Shorts') return item.category === 'Shorts';
    if (selectedChip === 'Music') return item.category === 'Music';
    if (selectedChip === 'Video') return item.category === 'Video' || item.category === '4K' || item.category === 'HD';
    if (selectedChip === 'Image') return item.category === 'Image';
    if (selectedChip === 'HD') return item.category === 'HD' || item.category === '4K';
    if (selectedChip === '4K') return item.category === '4K';
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Header Section with Original VidGrab Wordmark & Shan Palia Credit */}
      <div className="text-center mb-6">
        <div className="flex flex-col items-center justify-center">
          <img
            src="/vidgrab-icon.png"
            alt="VidGrab logo"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover shadow-lg mb-3"
          />
          <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight font-display">
            VID<span className="text-red-600">GRAB</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            By <span className="font-bold text-gray-800">PaliaAPK HUB</span> • Developer by Shan Palia
          </p>
        </div>
      </div>

      {/* TOP ADDRESS BAR (Large rounded address bar with NEXT → and NO Grab button) */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xl shadow-red-950/5 border border-gray-200 mb-8 transition-shadow hover:shadow-2xl">
        <form onSubmit={handleNextSubmit} className="flex items-center gap-2">
          {/* Address input container */}
          <div className="relative flex-1 flex items-center bg-gray-50 rounded-2xl border border-gray-200/90 focus-within:border-red-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500/10 transition-all">
            <div className="pl-4 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="home-address-input"
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="🔍 Search or enter URL"
              className="w-full py-3.5 px-3 bg-transparent text-sm sm:text-base text-gray-900 font-medium placeholder-gray-400 outline-none"
            />

            {/* Paste Button inside URL Bar */}
            <button
              id="paste-url-btn"
              type="button"
              onClick={handlePaste}
              className="mr-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-100 hover:text-red-600 transition-colors shadow-2xs active:scale-95 cursor-pointer shrink-0"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Paste</span>
            </button>
          </div>

          {/* NEXT → Button (Strictly NO Grab button) */}
          <button
            id="address-next-btn"
            type="submit"
            disabled={!urlInput.trim()}
            className="px-6 sm:px-8 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-red-600/30 transition-all active:scale-98 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <span>NEXT</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </form>
      </div>

      {/* HORIZONTAL CATEGORY CHIPS (Directly below URL bar as in reference) */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {MEDIA_CHIPS.map((chip) => {
            const isSelected = selectedChip === chip;
            return (
              <button
                key={chip}
                id={`discovery-chip-${chip.toLowerCase()}`}
                onClick={() => setSelectedChip(chip)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-xs scale-102'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* PLATFORM SHORTCUTS ON HOME (YouTube, WhatsApp, Instagram, Facebook, TikTok, X, Pinterest, Sites/More) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <span>Platform Shortcuts</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          </h2>
          <span className="text-[11px] text-gray-500 font-medium">Tap to open in VidGrab browser</span>
        </div>

        {/* 8 Platform Cards Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            return (
              <button
                key={platform.id}
                id={`platform-shortcut-${platform.id}`}
                onClick={() => handlePlatformClick(platform)}
                className={`p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer select-none group active:scale-95 shadow-2xs hover:shadow-md ${platform.bgLight}`}
                title={platform.description}
              >
                <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xs mb-1.5 group-hover:scale-110 transition-transform ${platform.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-900 leading-tight truncate w-full">
                  {platform.name}
                </span>
                {platform.badge && (
                  <span className="mt-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white/90 text-gray-600 border border-gray-200/60 hidden sm:inline-block">
                    {platform.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MEDIA DISCOVERY FEED */}
      <div className="mb-10">
        <div className="flex items-center justify-between gap-3 mb-4 px-1">
          <div>
            <h2 className="text-sm sm:text-base font-black text-gray-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-600" />
              <span>Media Discovery Feed</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Browse public videos, shorts, audio, and images. Tap any item to inspect or download.
            </p>
          </div>
        </div>

        {/* Discovery Feed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeed.map((item) => (
            <div
              key={item.id}
              id={`feed-item-${item.id}`}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => onOpenBrowser(item.url)}
                className="relative aspect-video bg-gray-900 cursor-pointer overflow-hidden"
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                  <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-white" />
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-bold text-white">
                  {item.duration}
                </div>

                {/* Source Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 text-gray-900 shadow-xs">
                  {item.source}
                </div>
              </div>

              {/* Details & Actions */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    onClick={() => onOpenBrowser(item.url)}
                    className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500">
                    <span className="font-semibold text-gray-700">{item.quality}</span>
                    <span>•</span>
                    <span>{item.views} views</span>
                  </div>
                </div>

                {/* Action Row: Download Icon + More Menu */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <button
                    id={`feed-browse-${item.id}`}
                    onClick={() => onOpenBrowser(item.url)}
                    className="text-xs font-bold text-gray-600 hover:text-gray-950 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Browse in VidGrab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5 relative">
                    {/* Direct Download Button */}
                    <button
                      id={`feed-download-${item.id}`}
                      onClick={() => onOpenDownloadPage(item.url)}
                      className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="Open VidGrab Download Page"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Download</span>
                    </button>

                    {/* More Menu Trigger */}
                    <button
                      id={`feed-more-${item.id}`}
                      onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === item.id && (
                      <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30 text-xs font-semibold text-gray-700">
                        <button
                          onClick={() => {
                            onOpenBrowser(item.url);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5 text-red-600" />
                          <span>Open in Browser</span>
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.url);
                            showToast('Link copied to clipboard!');
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* POPUP MODAL: "Open this page in VidGrab?" */}
      {pendingModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center animate-scaleUp">
            {/* Platform Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200/70 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <pendingModal.platformIcon className="w-7 h-7" />
            </div>

            {/* Modal Title strictly as requested */}
            <h3 className="text-lg font-black text-gray-950 tracking-tight">
              Open this page in VidGrab?
            </h3>

            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              VidGrab will open <span className="font-bold text-gray-800">{pendingModal.detectedPlatform}</span> inside the embedded browser view and scan for downloadable media.
            </p>

            {/* URL Display Pill */}
            <div className="mt-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200/80 text-[11px] font-mono text-gray-700 truncate max-w-full">
              {pendingModal.url}
            </div>

            {/* Action Buttons: CANCEL & OPEN PAGE */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                id="modal-cancel-btn"
                type="button"
                onClick={handleCancelModal}
                className="py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors cursor-pointer"
              >
                CANCEL
              </button>

              <button
                id="modal-open-page-btn"
                type="button"
                onClick={handleConfirmOpenPage}
                className="py-3 px-4 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-700 shadow-md shadow-red-600/30 transition-all cursor-pointer"
              >
                OPEN PAGE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
