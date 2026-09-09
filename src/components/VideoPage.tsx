import React, { useState } from 'react';
import {
  Film,
  Play,
  Download,
  Search,
  Sparkles,
  Clock,
  Eye,
  Globe,
  Radio,
  Sliders
} from 'lucide-react';

interface VideoPageProps {
  onOpenDownloadPage: (url: string) => void;
  onOpenBrowser: (url: string) => void;
}

const VIDEO_ITEMS = [
  {
    id: 'vid-1',
    title: 'Colors of Wildlife in 4K HDR & Spatial Audio',
    channel: 'Earth Cinema Lab',
    source: 'YouTube',
    resolution: '4K HD • 60 FPS',
    duration: '04:18',
    views: '1.2M',
    url: 'https://www.youtube.com/watch?v=colors-of-wildlife-4k',
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
    category: '4K',
  },
  {
    id: 'vid-2',
    title: 'Tokyo Sunset Skyline Timelapse Beat',
    channel: 'Metropolis Vision',
    source: 'Instagram',
    resolution: '1080P HD',
    duration: '00:58',
    views: '840K',
    url: 'https://www.instagram.com/reel/tokyo-sunset-timelapse',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
    category: 'Shorts',
  },
  {
    id: 'vid-3',
    title: 'Next-Gen Robotics Showcase Tech Demo',
    channel: 'Future Tech Lab',
    source: 'X / Twitter',
    resolution: '720P HD',
    duration: '02:15',
    views: '410K',
    url: 'https://x.com/FutureTechLab/status/189283746192837',
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80',
    category: 'Tech',
  },
  {
    id: 'vid-4',
    title: 'Artisan Sourdough Baking Masterclass',
    channel: 'Bakery Guild',
    source: 'Facebook',
    resolution: '1080P HD',
    duration: '03:40',
    views: '620K',
    url: 'https://www.facebook.com/watch?v=artisan-sourdough-recipe',
    thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    category: 'Trending',
  },
];

const CATEGORIES = ['All', '4K', 'Shorts', 'Tech', 'Trending'];

export const VideoPage: React.FC<VideoPageProps> = ({
  onOpenDownloadPage,
  onOpenBrowser,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = VIDEO_ITEMS.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.channel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold mb-2">
            <Film className="w-3.5 h-3.5" />
            <span>VidGrab Video Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
            High Definition Video Streams
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Grab videos in up to 4K, 2K, 1080P HD, 720P, and mobile-optimized 360P.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-gray-200 outline-none focus:border-red-500 font-medium"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
          >
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
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 ml-0.5 fill-white" />
                </div>
              </div>
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-bold text-white">
                {item.source}
              </div>
              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-red-600 text-[10px] font-black text-white">
                {item.resolution}
              </div>
              <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1">
                <Clock className="w-3 h-3" /> {item.duration}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3
                  onClick={() => onOpenBrowser(item.url)}
                  className="text-sm font-bold text-gray-950 line-clamp-2 hover:text-red-600 transition-colors cursor-pointer"
                >
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <span>{item.channel}</span>
                  <span>•</span>
                  <span>{item.views} views</span>
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onOpenBrowser(item.url)}
                  className="text-xs font-bold text-gray-700 hover:text-gray-950 flex items-center gap-1 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Browse Page</span>
                </button>

                <button
                  onClick={() => onOpenDownloadPage(item.url)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
