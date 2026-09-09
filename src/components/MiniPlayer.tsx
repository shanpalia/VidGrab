import React from 'react';
import { Play, Pause, X, Maximize2, Music, Film } from 'lucide-react';
import { DownloadedFile } from '../types';

interface MiniPlayerProps {
  file: DownloadedFile;
  isPlaying: boolean;
  onTogglePlay: (e: React.MouseEvent) => void;
  onMaximize: () => void;
  onClose: (e: React.MouseEvent) => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  file,
  isPlaying,
  onTogglePlay,
  onMaximize,
  onClose,
}) => {
  return (
    <div
      onClick={onMaximize}
      className="fixed bottom-16 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 bg-gray-950/95 backdrop-blur-md border border-gray-800 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-3 text-white cursor-pointer select-none hover:border-red-500/60 transition-all group animate-slideUp"
    >
      {/* Thumbnail + Playing Indicator */}
      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-900 shrink-0 border border-gray-800">
        <img
          src={file.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80'}
          alt={file.title}
          className={`w-full h-full object-cover ${
            file.type === 'audio' && isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''
          }`}
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          {file.type === 'audio' ? (
            <Music className="w-4 h-4 text-white/90" />
          ) : (
            <Film className="w-4 h-4 text-white/90" />
          )}
        </div>
      </div>

      {/* Title & Category Info */}
      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
          {file.title || file.fileName}
        </h4>
        <p className="text-[10px] text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
          <span className="text-red-500 font-bold uppercase">{file.type}</span>
          <span>•</span>
          <span>{file.formatLabel || file.size}</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">{isPlaying ? 'Playing' : 'Paused'}</span>
        </p>
      </div>

      {/* Actions (Play/Pause, Expand, Dismiss) */}
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Play/Pause Toggle */}
        <button
          onClick={onTogglePlay}
          className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>

        {/* Maximize Button */}
        <button
          onClick={onMaximize}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          title="Open Full Player"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          title="Stop & Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
