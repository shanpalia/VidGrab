import React, { useState } from 'react';
import { X, Play, Pause, Volume2, Film, Music, Image as ImageIcon, Sparkles } from 'lucide-react';
import { MediaMetadata } from '../types';

interface MediaPreviewModalProps {
  metadata: MediaMetadata;
  isOpen: boolean;
  onClose: () => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({ metadata, isOpen, onClose }) => {
  if (!isOpen) return null;

  const isAudio = metadata.type === 'audio';
  const isImage = metadata.type === 'image';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-md bg-red-600/20 text-red-500 shrink-0">
              {isAudio ? (
                <Music className="w-4 h-4" />
              ) : isImage ? (
                <ImageIcon className="w-4 h-4" />
              ) : (
                <Film className="w-4 h-4" />
              )}
            </span>
            <span className="text-sm font-semibold truncate max-w-xs sm:max-w-md">
              {metadata.title}
            </span>
          </div>
          <button
            id="close-preview-modal-button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Player Area */}
        <div className="relative min-h-[260px] max-h-[70vh] bg-black flex items-center justify-center p-2">
          {isImage ? (
            /* Image Viewer */
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={metadata.previewUrl || metadata.thumbnail}
                alt={metadata.title}
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
              />
            </div>
          ) : isAudio ? (
            /* Audio Player with Cover Art */
            <div className="w-full max-w-md py-6 px-4 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-xl mb-4 border border-gray-800">
                <img
                  src={metadata.thumbnail}
                  alt={metadata.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-sm font-bold text-white line-clamp-1 mb-1">{metadata.title}</h4>
              <p className="text-xs text-gray-400 mb-4">{metadata.source} • Audio Stream</p>
              <audio
                src={
                  (metadata.previewUrl && !metadata.previewUrl.includes('soundhelix') && !metadata.previewUrl.includes('youtube'))
                    ? metadata.previewUrl
                    : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                }
                controls
                autoPlay
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
                  if (target.src !== fallback) {
                    target.src = fallback;
                    target.load();
                    target.play().catch(() => {});
                  }
                }}
                className="w-full"
              />
            </div>
          ) : (metadata.previewUrl && (metadata.previewUrl.includes('youtube') || metadata.previewUrl.includes('embed'))) ? (
            /* YouTube Iframe Embed */
            <iframe
              src={
                metadata.previewUrl.includes('embed')
                  ? metadata.previewUrl
                  : `https://www.youtube-nocookie.com/embed/${metadata.id || 'colors-of-wildlife-4k'}?autoplay=1`
              }
              title={metadata.title}
              className="w-full h-full min-h-[320px] rounded-lg border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            /* Video Player */
            <video
              src={
                (metadata.previewUrl && !metadata.previewUrl.includes('youtube') && !metadata.previewUrl.includes('embed'))
                  ? metadata.previewUrl
                  : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
              }
              poster={metadata.thumbnail}
              autoPlay
              controls
              playsInline
              onError={(e) => {
                const target = e.currentTarget;
                const fallback = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
                if (target.src !== fallback) {
                  target.src = fallback;
                  target.load();
                  target.play().catch(() => {});
                }
              }}
              className="w-full h-full max-h-[60vh] object-contain rounded-lg"
            />
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="p-3.5 bg-gray-900/90 flex items-center justify-between text-xs text-gray-400 border-t border-gray-800">
          <div>
            <span className="text-gray-200 font-medium">{metadata.source}</span>
            {metadata.duration && <span className="mx-2">•</span>}
            {metadata.duration && <span>{metadata.duration}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-gray-800 text-red-400 font-bold font-mono text-[10px]">
              VidGrab Built-In Player
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
