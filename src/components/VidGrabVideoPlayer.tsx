import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Share2,
  Edit2,
  Trash2,
  FolderOpen,
  ChevronDown,
  X,
  Settings,
  Film
} from 'lucide-react';
import { DownloadedFile } from '../types';
import { StorageService } from '../services/storage';
import { MediaStorage } from '../services/mediaStorage';
import { RenameModal } from './RenameModal';

interface VidGrabVideoPlayerProps {
  file: DownloadedFile;
  onClose: () => void;
  onMinimize?: () => void;
  onFileUpdated?: () => void;
  onDeleteFile?: (fileId: string) => void;
}

export const VidGrabVideoPlayer: React.FC<VidGrabVideoPlayerProps> = ({
  file,
  onClose,
  onMinimize,
  onFileUpdated,
  onDeleteFile,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isRenameOpen, setIsRenameOpen] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<DownloadedFile>(file);
  const [toastMessage, setToastMessage] = useState<string>('');

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string>('');
  const [mediaLoadError, setMediaLoadError] = useState<string>('');

  // A Blob URL is temporary. Prefer the persisted IndexedDB bytes for real downloads.
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const resolveMedia = async () => {
      setMediaLoadError('');
      if (currentFile.mediaBlobKey) {
        const blob = await MediaStorage.getBlob(currentFile.mediaBlobKey);
        if (blob && !cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setResolvedMediaUrl(objectUrl);
          return;
        }
      }
      if (!cancelled) setResolvedMediaUrl(currentFile.mediaBlobUrl || '');
    };

    void resolveMedia();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [currentFile.id, currentFile.mediaBlobKey, currentFile.mediaBlobUrl]);

  const rawSrc = resolvedMediaUrl || '';
  const isYouTubeEmbed =
    !currentFile.mediaBlobKey &&
    (rawSrc.includes('youtube.com') || rawSrc.includes('youtu.be') || rawSrc.includes('embed'));

  const getYouTubeEmbedUrl = (url: string) => {
    let vidId = 'colors-of-wildlife-4k';
    if (url.includes('v=')) {
      vidId = url.split('v=')[1]?.split('&')[0] || vidId;
    } else if (url.includes('youtu.be/')) {
      vidId = url.split('youtu.be/')[1]?.split('?')[0] || vidId;
    } else if (url.includes('embed/')) {
      vidId = url.split('embed/')[1]?.split('?')[0] || vidId;
    }
    return `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&enablejsapi=1`;
  };

  const videoSrc = isYouTubeEmbed ? getYouTubeEmbedUrl(rawSrc) : rawSrc;

  const resetControlsTimer = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current && !isYouTubeEmbed) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [videoSrc, isYouTubeEmbed]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
    resetControlsTimer();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      videoRef.current.playbackRate = playbackSpeed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    resetControlsTimer();
  };

  const seekRelative = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration || 9999);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimer();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
    resetControlsTimer();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
    resetControlsTimer();
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
    showToast(`Speed: ${speed}x`);
    resetControlsTimer();
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
    resetControlsTimer();
  };

  // Format time (00:12)
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const mm = m < 10 ? `0${m}` : `${m}`;
    const ss = s < 10 ? `0${s}` : `${s}`;
    return `${mm}:${ss}`;
  };

  // Action handlers
  const handleShare = async () => {
    const shareData = {
      title: currentFile.title,
      text: `VidGrab Video: ${currentFile.fileName}`,
      url: currentFile.originalUrl,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!');
      } catch {}
    } else {
      navigator.clipboard.writeText(currentFile.originalUrl || currentFile.title);
      showToast('Video link copied to clipboard!');
    }
  };

  const handleOpenFile = () => {
    if (videoSrc) {
      window.open(videoSrc, '_blank');
    }
  };

  const handleDelete = () => {
    if (confirm(`Delete "${currentFile.fileName}" from your downloads?`)) {
      StorageService.deleteFile(currentFile.id);
      if (onDeleteFile) onDeleteFile(currentFile.id);
      if (onFileUpdated) onFileUpdated();
      onClose();
    }
  };

  const handleRenameConfirm = (newTitle: string) => {
    const updated = StorageService.renameFile(currentFile.id, newTitle);
    if (updated) {
      setCurrentFile(updated);
      if (onFileUpdated) onFileUpdated();
      showToast('File renamed.');
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden select-none animate-fadeIn"
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
    >
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl border border-gray-700 pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* TOP HEADER / CONTROLS (Fade with inactivity) */}
      <div
        className={`bg-gradient-to-b from-black/90 via-black/50 to-transparent p-4 flex items-center justify-between transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMinimize || onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors cursor-pointer text-white"
            title="Back / Minimize"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold truncate max-w-xs sm:max-w-md">
              {currentFile.fileName || currentFile.title}
            </h2>
            <p className="text-[11px] text-gray-400 flex items-center gap-2">
              <span className="text-red-500 font-black">VIDGRAB PLAYER</span>
              <span>•</span>
              <span>{currentFile.formatLabel || '1080P HD'}</span>
              <span>•</span>
              <span>{currentFile.size}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Speed Selector Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSpeedMenu(!showSpeedMenu);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors cursor-pointer"
            >
              {playbackSpeed}x
            </button>
            {showSpeedMenu && (
              <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-800 rounded-xl py-1.5 shadow-2xl z-40 text-xs font-semibold divide-y divide-gray-800 min-w-24">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={(e) => {
                      e.stopPropagation();
                      changeSpeed(s);
                    }}
                    className={`w-full px-3 py-1.5 text-left hover:bg-red-600 hover:text-white transition-colors cursor-pointer ${
                      playbackSpeed === s ? 'text-red-500 font-bold' : 'text-gray-300'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-red-600 backdrop-blur-md transition-colors cursor-pointer text-white"
            title="Close Player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* VIDEO STAGE & CENTER PLAY BUTTON */}
      <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
        {!videoSrc && !isYouTubeEmbed && (
          <div className="text-center px-6 max-w-md">
            <Film className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <p className="font-bold text-white">Preparing video…</p>
            <p className="text-xs text-gray-400 mt-1">Loading the saved VidGrab file.</p>
          </div>
        )}
        {mediaLoadError && (
          <div className="absolute bottom-6 left-4 right-4 z-40 bg-red-950/90 border border-red-800 rounded-2xl p-4 text-center">
            <p className="text-sm font-bold text-white">Unable to play video</p>
            <p className="text-xs text-red-200 mt-1">{mediaLoadError}</p>
          </div>
        )}
        {videoSrc && isYouTubeEmbed ? (
          <iframe
            src={videoSrc}
            title={currentFile.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={currentFile.thumbnail}
            autoPlay
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              setMediaLoadError('This downloaded video could not be opened. The saved file may be incomplete or use an unsupported codec.');
              setIsPlaying(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="max-h-full max-w-full object-contain cursor-pointer"
          />
        ) : null}

        {/* Big Center Play/Pause Indicator (shows on hover or pause) */}
        {(!isPlaying || showControls) && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl hover:scale-105 transition-transform pointer-events-auto cursor-pointer">
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-white text-white" />
              ) : (
                <Play className="w-8 h-8 fill-white text-white ml-1" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS & TIMELINE (Fade with inactivity) */}
      <div
        className={`bg-gradient-to-t from-black via-black/80 to-transparent pt-6 pb-4 px-4 sm:px-6 transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Seek bar */}
        <div className="mb-3 flex items-center gap-3">
          <span className="text-xs font-mono font-semibold text-gray-300 shrink-0">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none"
            />
          </div>
          <span className="text-xs font-mono font-semibold text-gray-400 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Primary Controls Row */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-gray-300 hover:text-white"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-red-500" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          {/* Center Playback Controls: ↶10, ▶/❚❚, 10↷ */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => seekRelative(-10)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-95 cursor-pointer text-white flex items-center justify-center"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="text-[10px] font-black absolute">10</span>
            </button>

            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-lg shadow-red-600/40"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-0.5" />
              )}
            </button>

            <button
              onClick={() => seekRelative(10)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-95 cursor-pointer text-white flex items-center justify-center"
              title="Forward 10 seconds"
            >
              <RotateCw className="w-5 h-5" />
              <span className="text-[10px] font-black absolute">10</span>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-gray-300 hover:text-white"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Below Player File Details & Action Strip */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-300">
          <div className="min-w-0">
            <p className="font-bold text-white truncate">
              {currentFile.fileName}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Format: <span className="font-mono text-gray-300">{currentFile.formatLabel}</span> • Size:{' '}
              <span className="font-mono text-gray-300">{currentFile.size}</span> • Path:{' '}
              <span className="font-mono text-gray-400">{currentFile.location}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={() => setIsRenameOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Rename</span>
            </button>

            <button
              onClick={handleOpenFile}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Open File</span>
            </button>

            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rename Modal */}
      <RenameModal
        isOpen={isRenameOpen}
        initialTitle={currentFile.title}
        onClose={() => setIsRenameOpen(false)}
        onConfirm={handleRenameConfirm}
      />
    </div>
  );
};
