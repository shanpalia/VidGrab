import React, { useState } from 'react';
import {
  Globe,
  ArrowLeft,
  ExternalLink,
  Youtube,
  Instagram,
  Facebook,
  Music2,
  Share2,
  Twitter,
  Pin,
  Search,
  CheckCircle2,
  Zap,
  Sparkles,
  Play,
  Film,
  Music
} from 'lucide-react';

interface SupportedPlatformItem {
  id: string;
  name: string;
  category: 'video' | 'social' | 'audio';
  officialUrl: string;
  maxQuality: string;
  formats: string[];
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgLight: string;
  sampleUrl: string;
}

export const SUPPORTED_PLATFORMS_DATA: SupportedPlatformItem[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'video',
    officialUrl: 'https://www.youtube.com',
    maxQuality: '4K 60FPS / 1080P HD',
    formats: ['MP4', 'MP3', 'M4A', 'WEBM'],
    description: 'Videos, Shorts, Live clips, and full soundtracks',
    icon: Youtube,
    color: 'text-red-600',
    bgLight: 'bg-red-50 border-red-200/80',
    sampleUrl: 'https://www.youtube.com/watch?v=colors-of-wildlife-4k',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    officialUrl: 'https://www.instagram.com',
    maxQuality: '1080P Full HD',
    formats: ['MP4', 'MP3', 'JPG'],
    description: 'Reels, Carousel videos, Stories, and IGTV clips',
    icon: Instagram,
    color: 'text-pink-600',
    bgLight: 'bg-pink-50 border-pink-200/80',
    sampleUrl: 'https://www.instagram.com/reel/tokyo-sunset-timelapse',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'social',
    officialUrl: 'https://www.facebook.com',
    maxQuality: '1080P HD',
    formats: ['MP4', 'MP3'],
    description: 'Facebook Watch, public Reels, and page feeds',
    icon: Facebook,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50 border-blue-200/80',
    sampleUrl: 'https://www.facebook.com/watch?v=artisan-sourdough-recipe',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'video',
    officialUrl: 'https://www.tiktok.com',
    maxQuality: '1080P HD (No Watermark)',
    formats: ['MP4', 'MP3'],
    description: 'Trending sound clips, dance routines, and tutorials',
    icon: Music2,
    color: 'text-gray-900',
    bgLight: 'bg-slate-50 border-slate-200/80',
    sampleUrl: 'https://www.tiktok.com/@dance_vibes_daily/video/trending-neon',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'social',
    officialUrl: 'https://web.whatsapp.com',
    maxQuality: '720P HD',
    formats: ['MP4', 'M4A'],
    description: 'Shared video statuses, broadcast media clips',
    icon: Share2,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50 border-emerald-200/80',
    sampleUrl: 'https://whatsapp.com/status/shared-media-clip-2025',
  },
  {
    id: 'x',
    name: 'X / Twitter',
    category: 'social',
    officialUrl: 'https://x.com',
    maxQuality: '1080P HD',
    formats: ['MP4', 'GIF', 'MP3'],
    description: 'X timeline videos, thread clips, and spaces audio',
    icon: Twitter,
    color: 'text-black',
    bgLight: 'bg-gray-50 border-gray-200/80',
    sampleUrl: 'https://x.com/FutureTechLab/status/189283746192837',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    category: 'social',
    officialUrl: 'https://www.pinterest.com',
    maxQuality: '720P / 1080P HD',
    formats: ['MP4', 'JPG', 'PNG'],
    description: 'Idea Pins, video recipes, DIY craft timelapses',
    icon: Pin,
    color: 'text-red-700',
    bgLight: 'bg-red-50 border-red-200/80',
    sampleUrl: 'https://www.pinterest.com/pin/minimalist-room-decor-849302',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    category: 'social',
    officialUrl: 'https://www.reddit.com',
    maxQuality: '1080P HD Audio Muxed',
    formats: ['MP4', 'MP3'],
    description: 'Subreddit video posts, discussions, and memes',
    icon: Globe,
    color: 'text-orange-600',
    bgLight: 'bg-orange-50 border-orange-200/80',
    sampleUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    category: 'video',
    officialUrl: 'https://vimeo.com',
    maxQuality: '4K Ultra HD',
    formats: ['MP4', 'MP3'],
    description: 'Cinematic films, creative portfolio showreels',
    icon: Film,
    color: 'text-sky-600',
    bgLight: 'bg-sky-50 border-sky-200/80',
    sampleUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    category: 'audio',
    officialUrl: 'https://soundcloud.com',
    maxQuality: '320 kbps HQ Audio',
    formats: ['MP3', 'M4A', 'FLAC'],
    description: 'Music tracks, DJ mixes, podcasts, and indie drops',
    icon: Music,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50 border-amber-200/80',
    sampleUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  },
  {
    id: 'dailymotion',
    name: 'Dailymotion',
    category: 'video',
    officialUrl: 'https://www.dailymotion.com',
    maxQuality: '1080P HD',
    formats: ['MP4', 'MP3'],
    description: 'News reports, sports highlights, and music clips',
    icon: Film,
    color: 'text-blue-700',
    bgLight: 'bg-blue-50 border-blue-200/80',
    sampleUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  },
  {
    id: 'web-media',
    name: 'Direct Web Media',
    category: 'video',
    officialUrl: 'https://commondatastorage.googleapis.com',
    maxQuality: 'Direct Bitstream Original',
    formats: ['MP4', 'MP3', 'M4A', 'WEBM', 'OGG'],
    description: 'Any public HTTP/HTTPS direct media link or podcast URL',
    icon: Globe,
    color: 'text-purple-600',
    bgLight: 'bg-purple-50 border-purple-200/80',
    sampleUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
];

interface SupportedPlatformsPageProps {
  onBack: () => void;
  onSelectSample: (url: string) => void;
}

export const SupportedPlatformsPage: React.FC<SupportedPlatformsPageProps> = ({
  onBack,
  onSelectSample,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'video' | 'social' | 'audio'>('all');

  const filtered = SUPPORTED_PLATFORMS_DATA.filter((p) => {
    const matchCat = filter === 'all' || p.category === filter;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.formats.some((f) => f.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleOpenPlatform = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 animate-fadeIn">
      {/* Top Breadcrumb & Back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          id="back-from-platforms-btn"
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:border-red-300 text-gray-700 hover:text-red-600 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-red-400 mb-3">
            <Globe className="w-3.5 h-3.5" />
            <span>GLOBAL MEDIA COMPATIBILITY</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Supported Platforms & Sites
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-2 leading-relaxed">
            VidGrab supports direct URL extraction from over 1,000+ public websites. Tap any platform to launch its official app or website, copy any video/music link, and paste back into VidGrab.
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200/80 mb-6 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search platform by name or format (e.g. YouTube, MP3, 4K)..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 overflow-x-auto">
          {(['all', 'video', 'social', 'audio'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                filter === cat ? 'bg-white text-red-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              id={`platform-detail-${item.id}`}
              className="bg-white rounded-2xl p-5 border border-gray-200/80 hover:border-red-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${item.bgLight}`}>
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-950 tracking-tight flex items-center gap-1.5">
                        {item.name}
                      </h3>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        {item.maxQuality}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  {item.description}
                </p>

                {/* Formats badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.formats.map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-mono font-bold"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons: Open Official & Try Demo */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  id={`open-official-${item.id}`}
                  onClick={() => handleOpenPlatform(item.officialUrl)}
                  className="flex-1 py-2 px-3 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  title={`Open official ${item.name} website/app`}
                >
                  <span>Open {item.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>

                <button
                  id={`try-sample-${item.id}`}
                  onClick={() => onSelectSample(item.sampleUrl)}
                  className="py-2 px-3 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Test download with sample URL"
                >
                  <Play className="w-3 h-3 fill-red-600" />
                  <span>Test URL</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
