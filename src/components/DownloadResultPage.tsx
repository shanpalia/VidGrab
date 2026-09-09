import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Edit2,
  Folder,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Music,
  Film,
  Image as ImageIcon,
  Check,
  Share2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  FolderDown,
  HardDrive
} from 'lucide-react';
import { MediaMetadata, MediaFormat, FormatsResponse, DownloadedFile } from '../types';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';
import { MediaPreviewModal } from './MediaPreviewModal';
import { RenameModal } from './RenameModal';
import { LocationModal } from './LocationModal';

interface DownloadResultPageProps {
  metadata: MediaMetadata;
  onBack: () => void;
  onViewFiles: () => void;
  onStartDownload: (format: MediaFormat, customTitle: string, downloadLocation: string) => void;
}

export const DownloadResultPage: React.FC<DownloadResultPageProps> = ({
  metadata,
  onBack,
  onViewFiles,
  onStartDownload,
}) => {
  const [formats, setFormats] = useState<FormatsResponse | null>(null);
  const [loadingFormats, setLoadingFormats] = useState(true);
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState(metadata.title);
  const [downloadLocation, setDownloadLocation] = useState('/storage/emulated/0/Download/VidGrab/');

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);

  // Fetch real formats from backend
  useEffect(() => {
    let mounted = true;
    async function loadFormats() {
      setLoadingFormats(true);
      try {
        const response = await ApiService.getFormats(
          metadata.durationSeconds || 180,
          metadata.availableQualities || [],
          metadata.url
        );
        if (mounted) {
          setFormats(response);

          // Select first practical quality default:
          // Prefer 720p HD MP4, or 1080p, or first available video, or audio if video empty
          const defaultVideo =
            response.videoFormats.find((v) => v.id === '720p') ||
            response.videoFormats.find((v) => v.id === '1080p') ||
            response.videoFormats[0];

          if (defaultVideo) {
            setSelectedFormatId(defaultVideo.id);
          } else if (response.audioFormats.length > 0) {
            setSelectedFormatId(response.audioFormats[0].id);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setFormatError('Could not load formats from server. Using fallback default.');
        }
      } finally {
        if (mounted) setLoadingFormats(false);
      }
    }
    loadFormats();

    // Load initial user settings
    const settings = StorageService.getSettings();
    if (settings.downloadLocation) {
      setDownloadLocation(settings.downloadLocation);
    }

    return () => {
      mounted = false;
    };
  }, [metadata]);

  // Find currently selected format object
  const currentFormat =
    formats?.videoFormats.find((f) => f.id === selectedFormatId) ||
    formats?.audioFormats.find((f) => f.id === selectedFormatId) ||
    formats?.imageFormats?.find((f) => f.id === selectedFormatId);

  // Handler for starting the download - navigates to dedicated Download Progress page
  const handleStartDownload = () => {
    if (!currentFormat) return;
    onStartDownload(currentFormat, customTitle, downloadLocation);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-32">
      {/* Top Bar with Back Button & VidGrab Branding */}
      <div className="flex items-center justify-between py-3 mb-4 border-b border-gray-100">
        <button
          id="back-to-home-button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 hover:text-red-600 transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-sm sm:text-base font-black tracking-tight text-gray-950 font-display">
            VID<span className="text-red-600">GRAB</span>
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            • Result
          </span>
        </div>

        <div className="w-12 text-right">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Online
          </span>
        </div>
      </div>

      {/* Media Preview Area & Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-200/80 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Thumbnail with Play Button */}
          <div
            id="media-thumbnail-preview-button"
            onClick={() => setIsPreviewOpen(true)}
            className="relative w-full sm:w-36 h-36 sm:h-24 rounded-2xl overflow-hidden bg-gray-900 shrink-0 cursor-pointer group shadow-2xs"
          >
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 flex items-center justify-center transition-colors">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 ml-0.5 fill-white" />
              </div>
            </div>
            {metadata.duration && (
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {metadata.duration}
              </div>
            )}
          </div>

          {/* Media Info and Action Links */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-200/60">
                {metadata.source}
              </span>
              {metadata.views && (
                <span className="text-[11px] text-gray-500 font-medium">
                  {metadata.views} views
                </span>
              )}
            </div>

            {/* Title with Rename Button */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <h1 className="text-base sm:text-lg font-bold text-gray-950 leading-snug line-clamp-2">
                {customTitle}
              </h1>
              <button
                id="rename-media-button"
                onClick={() => setIsRenameOpen(true)}
                className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
                title="Rename file title"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            {/* Download Location Box with Change button and Storage Indicator */}
            <div className="pt-2.5 border-t border-gray-100 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-700 min-w-0">
                  <Folder className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="text-gray-500 font-semibold shrink-0">Path:</span>
                  <span className="font-mono font-bold text-gray-800 truncate text-[11px]">{downloadLocation}</span>
                </div>
                <button
                  id="change-location-button"
                  onClick={() => setIsLocationOpen(true)}
                  className="px-2 py-0.5 rounded bg-gray-100 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold text-[11px] uppercase tracking-wide cursor-pointer shrink-0 ml-2 transition-colors border border-gray-200/80"
                >
                  CHANGE
                </button>
              </div>

              {/* Available Storage Bar */}
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3 h-3 text-gray-400" />
                  <span className="font-semibold text-emerald-600">98.3 GB FREE</span>
                  <span>/</span>
                  <span>219.8 GB</span>
                </div>
                <div className="w-20 sm:w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '55%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Format Selection Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200/80 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm sm:text-base font-black text-gray-950 tracking-tight flex items-center gap-2">
            <span>Select Media Format</span>
            <span className="text-xs font-normal text-gray-500">(Tap any option)</span>
          </h2>
          <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200/60">
            {currentFormat ? `${currentFormat.label}` : 'None Selected'}
          </span>
        </div>

        {loadingFormats ? (
          <div className="py-12 text-center text-gray-500">
            <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Analyzing available streams & bitrates...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section 1: AUDIO / MUSIC */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <Music className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  🎵 AUDIO / MUSIC
                </h3>
              </div>

              {/* Two-column grid as requested */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {formats?.audioFormats.map((audio) => {
                  const isSelected = selectedFormatId === audio.id;
                  return (
                    <div
                      key={audio.id}
                      id={`format-audio-${audio.id}`}
                      onClick={() => setSelectedFormatId(audio.id)}
                      className={`p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between cursor-pointer select-none ${
                        isSelected
                          ? 'border-red-500 bg-red-50/50 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Red Radio Indicator */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'border-red-600 bg-white' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-red-600" />}
                        </div>

                        <div>
                          <p
                            className={`text-xs sm:text-sm font-bold leading-tight ${
                              isSelected ? 'text-red-950' : 'text-gray-900'
                            }`}
                          >
                            {audio.label}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {audio.codec} • {audio.bitrate}
                          </p>
                        </div>
                      </div>

                      {/* Estimated File Size */}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {audio.size}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: VIDEO */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <Film className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  🎬 VIDEO
                </h3>
              </div>

              {/* Video options list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {formats?.videoFormats.map((video) => {
                  const isSelected = selectedFormatId === video.id;
                  return (
                    <div
                      key={video.id}
                      id={`format-video-${video.id}`}
                      onClick={() => setSelectedFormatId(video.id)}
                      className={`p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between cursor-pointer select-none ${
                        isSelected
                          ? 'border-red-500 bg-red-50/50 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Red Radio Indicator */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'border-red-600 bg-white' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-red-600" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <p
                              className={`text-xs sm:text-sm font-bold leading-tight ${
                                isSelected ? 'text-red-950' : 'text-gray-900'
                              }`}
                            >
                              {video.label}
                            </p>
                            {video.isHd && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-600 text-white tracking-wider">
                                HD
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {video.codec} • {video.ext.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {/* Estimated File Size */}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {video.size}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: IMAGE (where actually available) */}
            {formats?.imageFormats && formats.imageFormats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <ImageIcon className="w-4 h-4 text-red-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                    🖼️ IMAGE
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {formats.imageFormats.map((image) => {
                    const isSelected = selectedFormatId === image.id;
                    return (
                      <div
                        key={image.id}
                        id={`format-image-${image.id}`}
                        onClick={() => setSelectedFormatId(image.id)}
                        className={`p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between cursor-pointer select-none ${
                          isSelected
                            ? 'border-red-500 bg-red-50/50 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Red Radio Indicator */}
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-red-600 bg-white' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-red-600" />}
                          </div>

                          <div>
                            <p
                              className={`text-xs sm:text-sm font-bold leading-tight ${
                                isSelected ? 'text-red-950' : 'text-gray-900'
                              }`}
                            >
                              {image.label}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {image.codec} • {image.ext.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        {/* Estimated File Size */}
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                            isSelected ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {image.size}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Format Error Notice if any */}
      {formatError && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{formatError}</span>
        </div>
      )}

      {/* Large Fixed / Sticky Rounded Download Button as requested */}
      <div className="fixed bottom-14 md:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button
            id="start-download-button"
            onClick={handleStartDownload}
            disabled={!selectedFormatId || loadingFormats}
            className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-black text-base tracking-wide flex items-center justify-center gap-2.5 shadow-xl shadow-red-600/40 transition-all active:scale-98 cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5 stroke-[3]" />
            <span>
              DOWNLOAD {currentFormat ? `(${currentFormat.label} • ${currentFormat.size})` : ''}
            </span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <MediaPreviewModal
        metadata={metadata}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      <RenameModal
        currentName={customTitle}
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        onSave={(newName) => setCustomTitle(newName)}
      />

      <LocationModal
        currentLocation={downloadLocation}
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        onSelect={(newLocation) => setDownloadLocation(newLocation)}
      />
    </div>
  );
};
