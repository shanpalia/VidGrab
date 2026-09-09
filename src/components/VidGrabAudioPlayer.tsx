import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Share2,
  Edit2,
  Trash2,
  FolderOpen,
  ChevronDown,
  X,
  Music,
  Disc3,
  Sparkles
} from 'lucide-react';
import { DownloadedFile } from '../types';
import { StorageService } from '../services/storage';
import { MediaStorage } from '../services/mediaStorage';
import { RenameModal } from './RenameModal';

interface VidGrabAudioPlayerProps {
  file: DownloadedFile;
  onClose: () => void;
  onMinimize?: () => void;
  onFileUpdated?: () => void;
  onDeleteFile?: (fileId: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const VidGrabAudioPlayer: React.FC<VidGrabAudioPlayerProps> = ({
  file,
  onClose,
  onMinimize,
  onFileUpdated,
  onDeleteFile,
  onNext,
  onPrev,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [isRenameOpen, setIsRenameOpen] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<DownloadedFile>(file);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string>('');
  const [mediaLoadError, setMediaLoadError] = useState<string>('');

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const resolveAudio = async () => {
      setMediaLoadError('');
      if (currentFile.mediaBlobKey) {
        const blob = await MediaStorage.getBlob(currentFile.mediaBlobKey);
        if (blob && !cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setResolvedAudioUrl(objectUrl);
          return;
        }
      }
      if (!cancelled) setResolvedAudioUrl(currentFile.mediaBlobUrl || '');
    };

    void resolveAudio();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [currentFile.id, currentFile.mediaBlobKey, currentFile.mediaBlobUrl]);

  const audioSrc = resolvedAudioUrl;

  useEffect(() => {
    if (!audioRef.current || !audioSrc) return;
    audioRef.current.load();
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      setIsPlaying(false);
    });
  }, [audioSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      audioRef.current.playbackRate = playbackSpeed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const seekRelative = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration || 9999);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
    showToast(`Speed: ${speed}x`);
  };

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
      text: `VidGrab Music: ${currentFile.fileName}`,
      url: currentFile.originalUrl,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!');
      } catch {}
    } else {
      navigator.clipboard.writeText(currentFile.originalUrl || currentFile.title);
      showToast('Audio link copied to clipboard!');
    }
  };

  const handleOpenFile = () => {
    if (audioSrc) {
      window.open(audioSrc, '_blank');
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
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-950 via-slate-900 to-black text-white flex flex-col justify-between overflow-y-auto select-none animate-fadeIn">
      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        autoPlay
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={() => {
          setMediaLoadError('This downloaded audio could not be opened. The saved file may be incomplete or use an unsupported codec.');
          setIsPlaying(false);
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (onNext) onNext();
        }}
      />

      {mediaLoadError && (
        <div className="mx-4 mb-2 bg-red-950/90 border border-red-800 rounded-2xl p-3 text-center">
          <p className="text-sm font-bold text-white">Unable to play audio</p>
          <p className="text-xs text-red-200 mt-1">{mediaLoadError}</p>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl border border-gray-700 pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* TOP HEADER */}
      <div className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <button
          onClick={onMinimize || onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white"
          title="Minimize to Mini Player"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest font-black text-red-500">
            VIDGRAB AUDIO PLAYER
          </p>
          <p className="text-xs text-gray-400 font-semibold truncate max-w-xs">
            {currentFile.source} • {currentFile.formatLabel}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-red-600 transition-colors cursor-pointer text-white"
          title="Close Player"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* MAIN AUDIO STAGE & ALBUM ARTWORK */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">
        {/* Vinyl / Cover Disc with dynamic spin when playing */}
        <div className="relative mb-8 group">
          <div
            className={`w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden shadow-2xl border-4 border-gray-800 relative flex items-center justify-center bg-gray-900 transition-transform duration-700 ${
              isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''
            }`}
          >
            <img
              src={currentFile.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'}
              alt={currentFile.title}
              className="w-full h-full object-cover"
            />
            {/* Center Vinyl Spindle Hole */}
            <div className="absolute w-12 h-12 rounded-full bg-black border-4 border-gray-700 shadow-inner flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-red-600" />
            </div>
          </div>

          {/* Floating Sound Waves Tag */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-900/90 border border-gray-700 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-red-400 flex items-center gap-1.5 shadow-lg">
            <Music className="w-3 h-3" />
            <span>Lossless Studio Audio</span>
          </div>
        </div>

        {/* Track Title & Artist */}
        <div className="w-full mb-6">
          <h1 className="text-lg sm:text-xl font-black text-white line-clamp-2 leading-snug">
            {currentFile.title || currentFile.fileName}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 font-semibold">
            {currentFile.artist || currentFile.source || 'VidGrab Music'}
          </p>
        </div>

        {/* TIMELINE / SEEK BAR */}
        <div className="w-full mb-4">
          <div className="relative flex items-center mb-1">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* MAIN PLAYBACK CONTROLS (⏮  ↶10  ▶/❚❚  10↷  ⏭) */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6">
          {/* Previous Track */}
          <button
            onClick={onPrev || (() => seekRelative(-30))}
            className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Previous Track"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          {/* Rewind 10s */}
          <button
            onClick={() => seekRelative(-10)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center relative"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[9px] font-black absolute">10</span>
          </button>

          {/* Big Play / Pause Button */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl shadow-red-600/40 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-white" />
            ) : (
              <Play className="w-8 h-8 fill-white ml-1" />
            )}
          </button>

          {/* Forward 10s */}
          <button
            onClick={() => seekRelative(10)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center relative"
            title="Forward 10 seconds"
          >
            <RotateCw className="w-5 h-5" />
            <span className="text-[9px] font-black absolute">10</span>
          </button>

          {/* Next Track */}
          <button
            onClick={onNext || (() => seekRelative(30))}
            className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Volume & Playback Speed Bar */}
        <div className="w-full flex items-center justify-between px-2 pt-2 border-t border-white/10">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          {/* Speed Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              {playbackSpeed}x Speed
            </button>
            {showSpeedMenu && (
              <div className="absolute right-0 bottom-full mb-2 bg-gray-900 border border-gray-800 rounded-xl py-1.5 shadow-2xl z-40 text-xs font-semibold divide-y divide-gray-800 min-w-24">
                {[0.75, 1, 1.25, 1.5].map((s) => (
                  <button
                    key={s}
                    onClick={() => changeSpeed(s)}
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
        </div>
      </div>

      {/* FOOTER FILE DETAILS & ACTION BUTTONS */}
      <div className="p-4 bg-black/80 border-t border-white/10 shrink-0">
        <div className="max-w-md mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="min-w-0">
            <p className="font-bold text-white truncate">{currentFile.fileName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Format: <span className="text-gray-200">{currentFile.formatLabel}</span> • Size:{' '}
              <span className="text-gray-200">{currentFile.size}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold transition-colors cursor-pointer flex items-center gap-1.5 text-white"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={() => setIsRenameOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold transition-colors cursor-pointer flex items-center gap-1.5 text-white"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Rename</span>
            </button>

            <button
              onClick={handleOpenFile}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold transition-colors cursor-pointer flex items-center gap-1.5 text-white"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Open</span>
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
