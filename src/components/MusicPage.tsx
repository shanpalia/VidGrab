import React, { useState } from 'react';
import {
  Music,
  Headphones,
  Download,
  Play,
  Pause,
  Sparkles,
  Search,
  Disc3,
  Clock,
  CheckCircle2,
  Volume2
} from 'lucide-react';

interface MusicPageProps {
  onOpenDownloadPage: (url: string) => void;
  onOpenBrowser: (url: string) => void;
}

const MUSIC_TRACKS = [
  {
    id: 'track-1',
    title: 'Midnight Lo-Fi Chill Beats & Rain',
    artist: 'ChillHop Vibes',
    source: 'YouTube Music',
    duration: '03:45',
    format: 'MP3 320K / M4A',
    size: '8.6 MB',
    url: 'https://www.youtube.com/watch?v=midnight-lofi-chill',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    genre: 'Lo-Fi',
  },
  {
    id: 'track-2',
    title: 'Neon Horizon Synthwave Odyssey',
    artist: 'RetroFuture Lab',
    source: 'SoundCloud',
    duration: '04:12',
    format: 'MP3 256K',
    size: '9.8 MB',
    url: 'https://www.youtube.com/watch?v=neon-horizon-synthwave',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    genre: 'Electronic',
  },
  {
    id: 'track-3',
    title: 'Acoustic Morning Breeze & Guitar',
    artist: 'Serene Strings',
    source: 'YouTube',
    duration: '02:50',
    format: 'M4A 128K',
    size: '5.2 MB',
    url: 'https://www.youtube.com/watch?v=acoustic-morning-guitar',
    thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    genre: 'Acoustic',
  },
  {
    id: 'track-4',
    title: 'Deep Focus Ambient Piano Harmony',
    artist: 'Study & Work Hub',
    source: 'Web Media',
    duration: '05:10',
    format: 'MP3 320K',
    size: '12.1 MB',
    url: 'https://www.youtube.com/watch?v=deep-focus-piano',
    thumbnail: 'https://images.unsplash.com/photo-1520523839898-507127053e14?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    genre: 'Classical',
  },
];

const GENRES = ['All', 'Lo-Fi', 'Electronic', 'Acoustic', 'Classical'];

export const MusicPage: React.FC<MusicPageProps> = ({
  onOpenDownloadPage,
  onOpenBrowser,
}) => {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  const togglePlay = (id: string) => {
    if (currentPlayingId === id) {
      setCurrentPlayingId(null);
    } else {
      setCurrentPlayingId(id);
    }
  };

  const filtered = MUSIC_TRACKS.filter((track) => {
    const matchesGenre = selectedGenre === 'All' || track.genre === selectedGenre;
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold mb-2">
            <Music className="w-3.5 h-3.5" />
            <span>VidGrab Audio Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
            Music & Audio Streams
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Extract lossless MP3 320K, MP3 256K, and M4A audio tracks seamlessly.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audio streams..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-gray-200 outline-none focus:border-red-500 font-medium"
          />
        </div>
      </div>

      {/* Genre Filter Chips */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedGenre === g
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Tracks List */}
      <div className="space-y-3">
        {filtered.map((track) => {
          const isPlaying = currentPlayingId === track.id;
          return (
            <div
              key={track.id}
              className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Thumbnail with Play Toggle */}
                <div
                  onClick={() => togglePlay(track.id)}
                  className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-900 shrink-0 cursor-pointer group shadow-2xs"
                >
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isPlaying ? 'opacity-100' : 'group-hover:opacity-100 opacity-80'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5 fill-white" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Track Details */}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                    {track.genre} • {track.format}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 truncate mt-1">
                    {track.title}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    <span>{track.artist}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {track.duration}
                    </span>
                    <span>•</span>
                    <span>{track.size}</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <button
                  onClick={() => onOpenBrowser(track.url)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Browse
                </button>
                <button
                  onClick={() => onOpenDownloadPage(track.url)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Download Audio</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Embedded audio player element when playing */}
      {currentPlayingId && (
        <div className="fixed bottom-14 md:bottom-6 left-0 right-0 z-40 px-4">
          <div className="max-w-md mx-auto bg-gray-950 text-white rounded-2xl p-3.5 shadow-2xl border border-white/10 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">
                  {MUSIC_TRACKS.find((t) => t.id === currentPlayingId)?.title}
                </p>
                <p className="text-[10px] text-gray-400">Playing Audio Stream Preview</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setCurrentPlayingId(null)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Stop
              </button>
              <button
                onClick={() => {
                  const t = MUSIC_TRACKS.find((m) => m.id === currentPlayingId);
                  if (t) onOpenDownloadPage(t.url);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-black text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3 h-3 stroke-[2.5]" />
                Grab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
