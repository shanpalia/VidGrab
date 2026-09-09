import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Share2,
  Trash2,
  FolderDown,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Film,
  Music,
  Folder,
  DownloadCloud,
  FileCheck,
  Ban
} from 'lucide-react';
import {
  MediaMetadata,
  MediaFormat,
  DownloadedFile,
  DownloadStatus
} from '../types';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';
import { MediaStorage } from '../services/mediaStorage';
import { VidGrabVideoPlayer } from './VidGrabVideoPlayer';
import { VidGrabAudioPlayer } from './VidGrabAudioPlayer';
import { VidGrabImageViewer } from './VidGrabImageViewer';
import { NativeStorage } from '../services/nativeStorage';

interface DownloadProgressPageProps {
  metadata: MediaMetadata;
  selectedFormat: MediaFormat;
  customTitle: string;
  downloadLocation: string;
  onBack: () => void;
  onViewFiles: () => void;
  onRedownload: () => void;
  onPlayDownloadedFile?: (file: DownloadedFile) => void;
}

export const DownloadProgressPage: React.FC<DownloadProgressPageProps> = ({
  metadata,
  selectedFormat,
  customTitle,
  downloadLocation,
  onBack,
  onViewFiles,
  onRedownload,
  onPlayDownloadedFile,
}) => {
  const [status, setStatus] = useState<DownloadStatus>('preparing');
  const [percent, setPercent] = useState<number>(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(selectedFormat.sizeBytes || 0);
  const [speed, setSpeed] = useState<string>('0 B/s');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [completedFile, setCompletedFile] = useState<DownloadedFile | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const downloadIdRef = useRef<string>('');
  const isStartedRef = useRef<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Start real download
  const startDownload = async () => {
    // Reset state
    setStatus('preparing');
    setPercent(0);
    setDownloadedBytes(0);
    setSpeed('0 B/s');
    setErrorMessage(null);
    setCompletedFile(null);
    setBlobUrl(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 1. Initialize session on backend: POST /api/download
      const initRes = await ApiService.initDownload({
        formatId: selectedFormat.id,
        fileName: customTitle,
        customTitle,
        url: metadata.url,
        mediaId: metadata.id,
        durationSeconds: metadata.durationSeconds,
        thumbnail: metadata.thumbnail,
        type: selectedFormat.category,
        previewUrl: metadata.previewUrl,
      });

      downloadIdRef.current = initRes.downloadId;
      if (initRes.totalBytes > 0) {
        setTotalBytes(initRes.totalBytes);
      }

      setStatus('downloading');

      // 2. Stream real file bytes: GET /api/download/:id/file
      const { blob } = await ApiService.downloadFileStream(
        initRes.downloadId,
        controller.signal,
        (progressInfo) => {
          setStatus(progressInfo.status);
          setPercent(progressInfo.percent);
          setDownloadedBytes(progressInfo.downloadedBytes);
          if (progressInfo.totalBytes > 0) {
            setTotalBytes(progressInfo.totalBytes);
          }
          setSpeed(progressInfo.speed);
        }
      );

      // 3. Conversion / Assembling finalization
      setStatus('converting');
      setPercent(100);

      // Create a temporary URL for this session AND persist the actual bytes.
      // Object URLs are not durable across reloads, so My Files uses IndexedDB.
      const createdBlobUrl = URL.createObjectURL(blob);
      setBlobUrl(createdBlobUrl);

      const finalFileName = `${customTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.${selectedFormat.ext}`;
      const fileId = 'file_' + Date.now();

      // Persist the real downloaded bytes before declaring the file complete.
      // Android builds use MediaStore through the native bridge so the file is
      // physically stored under Downloads/VidGrab/<category>. Browser builds
      // keep the IndexedDB copy and use the normal browser download fallback.
      await MediaStorage.saveBlob(fileId, blob);
      const nativeSaved = await NativeStorage.saveBlob(
        blob,
        finalFileName,
        selectedFormat.category === 'audio' ? 'Audio' : selectedFormat.category === 'image' ? 'Image' : 'Video',
        selectedFormat.ext
      );

      if (!nativeSaved) {
        const anchor = document.createElement('a');
        anchor.href = createdBlobUrl;
        anchor.download = finalFileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }

      // 4. Save metadata to My Files
      const newFile: DownloadedFile = {
        id: fileId,
        mediaId: metadata.id,
        originalUrl: metadata.url,
        fileName: finalFileName,
        title: customTitle,
        source: metadata.source,
        formatId: selectedFormat.id,
        formatLabel: selectedFormat.label,
        ext: selectedFormat.ext,
        type: selectedFormat.category,
        size: selectedFormat.size,
        sizeBytes: selectedFormat.sizeBytes,
        downloadedAt: new Date().toISOString(),
        thumbnail: metadata.thumbnail,
        mediaBlobUrl: createdBlobUrl,
        mediaBlobKey: fileId,
        nativeFileUri: nativeSaved?.uri,
        location: nativeSaved?.location || downloadLocation,
      };

      StorageService.saveFile(newFile);

      // Record successful history
      StorageService.addHistory({
        id: 'hist_' + Date.now(),
        url: metadata.url,
        title: customTitle,
        source: metadata.source,
        formatLabel: selectedFormat.label,
        ext: selectedFormat.ext,
        type: selectedFormat.category,
        timestamp: new Date().toISOString(),
        thumbnail: metadata.thumbnail,
        fileSize: selectedFormat.size,
        status: 'completed',
      });

      setCompletedFile(newFile);
      setStatus('completed');
      showToast('✓ Download complete! Saved to your device.');
    } catch (err: any) {
      if (err.message === 'DOWNLOAD_CANCELLED' || controller.signal.aborted) {
        setStatus('cancelled');
        // Record cancelled history
        StorageService.addHistory({
          id: 'hist_' + Date.now(),
          url: metadata.url,
          title: customTitle,
          source: metadata.source,
          formatLabel: selectedFormat.label,
          ext: selectedFormat.ext,
          type: selectedFormat.category,
          timestamp: new Date().toISOString(),
          thumbnail: metadata.thumbnail,
          fileSize: selectedFormat.size,
          status: 'cancelled',
        });
      } else {
        const errorText = err.message || 'Download failed. Please check connection.';
        setErrorMessage(errorText);
        setStatus('failed');
        // Record failed history
        StorageService.addHistory({
          id: 'hist_' + Date.now(),
          url: metadata.url,
          title: customTitle,
          source: metadata.source,
          formatLabel: selectedFormat.label,
          ext: selectedFormat.ext,
          type: selectedFormat.category,
          timestamp: new Date().toISOString(),
          thumbnail: metadata.thumbnail,
          fileSize: selectedFormat.size,
          status: 'failed',
          errorMessage: errorText,
        });
      }
    }
  };

  useEffect(() => {
    if (!isStartedRef.current) {
      isStartedRef.current = true;
      startDownload();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle Cancel
  const handleCancel = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (downloadIdRef.current) {
      ApiService.cancelDownload(downloadIdRef.current);
    }
    setStatus('cancelled');
    showToast('Download cancelled.');
  };

  // Handle Share
  const handleShare = async () => {
    const fileToShare = completedFile;
    const shareData = {
      title: customTitle,
      text: `Downloaded ${customTitle} with VidGrab Pro (${selectedFormat.label})`,
      url: metadata.url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!');
      } catch {
        // User dismissed
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${customTitle} - ${metadata.url}`);
        showToast('Link copied to clipboard!');
      } catch {
        showToast('Ready: ' + customTitle);
      }
    }
  };

  // Handle Open File
  const handleOpenFile = () => {
    if (completedFile?.nativeFileUri) {
      const mime = completedFile.type === 'video' ? `video/${completedFile.ext === 'webm' ? 'webm' : 'mp4'}` : completedFile.type === 'audio' ? (completedFile.ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4') : completedFile.type === 'image' ? `image/${completedFile.ext === 'jpg' ? 'jpeg' : completedFile.ext}` : '*/*';
      if (NativeStorage.open(completedFile.nativeFileUri, mime)) return;
    }
    if (blobUrl) {
      window.open(blobUrl, '_blank');
      showToast('Opening file stream...');
    } else {
      showToast('Media file ready.');
    }
  };

  // Handle Delete
  const handleDelete = () => {
    if (completedFile) {
      if (confirm('Remove this downloaded file from My Files?')) {
        if (completedFile.nativeFileUri) NativeStorage.delete(completedFile.nativeFileUri);
        StorageService.deleteFile(completedFile.id);
        void MediaStorage.deleteBlob(completedFile.id);
        showToast('File deleted.');
        onViewFiles();
      }
    }
  };

  const downloadedMbStr = ApiService.formatBytes(downloadedBytes);
  const totalMbStr = ApiService.formatBytes(totalBytes);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24 animate-fadeIn">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          id="back-to-details-btn"
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:border-red-300 text-gray-700 hover:text-red-600 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Format</span>
        </button>

        <button
          id="nav-to-my-files-btn"
          onClick={onViewFiles}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:border-red-300 text-gray-700 hover:text-red-600 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <FolderDown className="w-4 h-4 text-red-600" />
          <span>My Files</span>
        </button>
      </div>

      {/* Main Download Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200/90 shadow-xl shadow-gray-200/50 mb-6">
        {/* Media Summary Info */}
        <div className="flex items-start sm:items-center gap-4 pb-6 border-b border-gray-100">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-950 shrink-0 shadow-md">
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-black text-white uppercase">
              {selectedFormat.ext}
            </div>
            {selectedFormat.category === 'audio' ? (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Music className="w-7 h-7 text-white/90" />
              </div>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                {metadata.source}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-50 text-red-600 border border-red-200/60">
                {selectedFormat.label}
              </span>
              {selectedFormat.isHd && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-600 text-white uppercase">
                  HD
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-black text-gray-950 truncate leading-snug">
              {customTitle}
            </h2>

            <p className="text-xs text-gray-500 mt-1 truncate">
              Saving to: <span className="font-mono text-gray-700">{downloadLocation}</span>
            </p>
          </div>
        </div>

        {/* Dynamic State Layout */}
        <div className="pt-6">
          {/* 1. PREPARING STATE */}
          {status === 'preparing' && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 animate-spin">
                <RotateCcw className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Preparing Media Stream...</h3>
              <p className="text-xs text-gray-500 mt-1">
                Allocating buffer and negotiating quality bitrates with server.
              </p>
            </div>
          )}

          {/* 2. DOWNLOADING STATE */}
          {status === 'downloading' && (
            <div>
              {/* Header Status & Speed */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-sm sm:text-base font-black text-gray-900">
                    Downloading...
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-black text-red-600 font-mono">
                  Speed: {speed}
                </div>
              </div>

              {/* Percentage & Downloaded Bytes Amount */}
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-3xl sm:text-4xl font-black text-gray-950 font-mono tracking-tight">
                  {percent >= 0 ? `${percent}%` : 'calculating...'}
                </div>
                <div className="text-xs sm:text-sm font-bold text-gray-600 font-mono">
                  {downloadedMbStr} / {totalMbStr}
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden mb-6 relative border border-gray-200/80">
                <div
                  className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full transition-all duration-200 relative overflow-hidden"
                  style={{ width: `${Math.max(4, Math.min(100, percent >= 0 ? percent : 20))}%` }}
                >
                  {/* Subtle shimmer animation overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]" />
                </div>
              </div>

              {/* Cancel Button */}
              <div className="flex items-center justify-center">
                <button
                  id="cancel-download-btn"
                  onClick={handleCancel}
                  className="px-5 py-2 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700 hover:text-red-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  <span>Cancel Download</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. PROCESSING / CONVERTING STATE */}
          {status === 'converting' && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Processing & Converting...</h3>
              <p className="text-xs text-gray-500 mt-1">
                Finalizing {selectedFormat.codec} stream packaging and writing tags.
              </p>
              <div className="w-48 mx-auto bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                <div className="bg-amber-500 h-full w-full animate-pulse" />
              </div>
            </div>
          )}

          {/* 4. COMPLETED STATE */}
          {status === 'completed' && (
            <div>
              {/* Success Badge */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 mb-6 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-black text-emerald-950">
                    ✓ Download Complete
                  </h3>
                  <div className="mt-2 space-y-1 text-xs text-emerald-900/90 font-medium">
                    <p>
                      <span className="text-emerald-700 font-bold">File:</span>{' '}
                      <span className="font-mono font-bold text-gray-900">
                        {customTitle}.{selectedFormat.ext}
                      </span>
                    </p>
                    <p>
                      <span className="text-emerald-700 font-bold">Format:</span>{' '}
                      <span className="font-bold text-gray-900">{selectedFormat.label}</span>
                    </p>
                    <p>
                      <span className="text-emerald-700 font-bold">Size:</span>{' '}
                      <span className="font-bold text-gray-900">{selectedFormat.size}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons: PLAY, OPEN, SHARE, DELETE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {/* PLAY Button */}
                <button
                  id="play-downloaded-media-btn"
                  onClick={() => {
                    if (completedFile && onPlayDownloadedFile) {
                      onPlayDownloadedFile(completedFile);
                    } else {
                      showToast('Media is still being prepared.');
                    }
                  }}
                  className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-md shadow-red-600/30 cursor-pointer active:scale-98 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>PLAY</span>
                </button>

                {/* OPEN Button */}
                <button
                  id="open-downloaded-file-btn"
                  onClick={handleOpenFile}
                  className="py-3 px-4 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-black flex items-center justify-center gap-2 shadow-md shadow-gray-900/20 cursor-pointer active:scale-98 transition-all"
                >
                  <Folder className="w-4 h-4" />
                  <span>OPEN FILE</span>
                </button>

                {/* SHARE Button */}
                <button
                  id="share-downloaded-file-btn"
                  onClick={handleShare}
                  className="py-3 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-800 text-sm font-black flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>SHARE</span>
                </button>
              </div>

              {/* Secondary actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs font-bold text-gray-600">
                <button
                  id="delete-completed-file-btn"
                  onClick={handleDelete}
                  className="text-gray-400 hover:text-red-600 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete File</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onViewFiles}
                    className="text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View in My Files</span>
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    onClick={onBack}
                    className="text-gray-700 hover:text-black cursor-pointer"
                  >
                    Download Another Format
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. FAILED STATE */}
          {status === 'failed' && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-black text-red-600">❌ Download Failed</h3>
              <p className="text-xs text-gray-600 max-w-md mx-auto mt-2 leading-relaxed">
                {errorMessage || 'Unable to download media stream. The website or connection may be temporarily unavailable.'}
              </p>

              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  id="try-again-download-btn"
                  onClick={startDownload}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-2 shadow-sm shadow-red-600/30 cursor-pointer active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>TRY AGAIN</span>
                </button>

                <button
                  onClick={onBack}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold cursor-pointer"
                >
                  Choose Different Format
                </button>
              </div>
            </div>
          )}

          {/* 6. CANCELLED STATE */}
          {status === 'cancelled' && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-4">
                <Ban className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-gray-800">Download Cancelled</h3>
              <p className="text-xs text-gray-500 mt-1">
                The download process was stopped before completion.
              </p>

              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  id="restart-cancelled-download-btn"
                  onClick={startDownload}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-red-600/30"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restart Download</span>
                </button>

                <button
                  onClick={onBack}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold cursor-pointer"
                >
                  Back to Details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VidGrab Dedicated Players */}
      {isPlaying && selectedFormat.category === 'video' && (
        <VidGrabVideoPlayer
          file={completedFile || {
            id: 'file_' + Date.now(),
            mediaId: metadata.id,
            originalUrl: metadata.url,
            fileName: `${customTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.${selectedFormat.ext}`,
            title: customTitle,
            source: metadata.source,
            formatId: selectedFormat.id,
            formatLabel: selectedFormat.label,
            ext: selectedFormat.ext,
            type: 'video',
            size: selectedFormat.size,
            sizeBytes: selectedFormat.sizeBytes,
            downloadedAt: new Date().toISOString(),
            thumbnail: metadata.thumbnail,
            mediaBlobUrl:
              (metadata.previewUrl && !metadata.previewUrl.includes('youtube') && !metadata.previewUrl.includes('embed') && !metadata.previewUrl.includes('soundhelix'))
                ? metadata.previewUrl
                : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            location: downloadLocation,
          }}
          onClose={() => setIsPlaying(false)}
        />
      )}

      {isPlaying && selectedFormat.category === 'audio' && (
        <VidGrabAudioPlayer
          file={completedFile || {
            id: 'file_' + Date.now(),
            mediaId: metadata.id,
            originalUrl: metadata.url,
            fileName: `${customTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.${selectedFormat.ext}`,
            title: customTitle,
            source: metadata.source,
            formatId: selectedFormat.id,
            formatLabel: selectedFormat.label,
            ext: selectedFormat.ext,
            type: 'audio',
            size: selectedFormat.size,
            sizeBytes: selectedFormat.sizeBytes,
            downloadedAt: new Date().toISOString(),
            thumbnail: metadata.thumbnail,
            mediaBlobUrl:
              (metadata.previewUrl && !metadata.previewUrl.includes('youtube') && !metadata.previewUrl.includes('embed') && !metadata.previewUrl.includes('soundhelix'))
                ? metadata.previewUrl
                : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            location: downloadLocation,
          }}
          onClose={() => setIsPlaying(false)}
        />
      )}

      {isPlaying && selectedFormat.category === 'image' && (
        <VidGrabImageViewer
          file={completedFile || {
            id: 'file_' + Date.now(),
            mediaId: metadata.id,
            originalUrl: metadata.url,
            fileName: `${customTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.${selectedFormat.ext}`,
            title: customTitle,
            source: metadata.source,
            formatId: selectedFormat.id,
            formatLabel: selectedFormat.label,
            ext: selectedFormat.ext,
            type: 'image',
            size: selectedFormat.size,
            sizeBytes: selectedFormat.sizeBytes,
            downloadedAt: new Date().toISOString(),
            thumbnail: metadata.thumbnail,
            mediaBlobUrl: metadata.thumbnail || metadata.previewUrl,
            location: downloadLocation,
          }}
          onClose={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
};
