import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Share2,
  Download,
  Trash2,
  FolderOpen,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';
import { DownloadedFile } from '../types';
import { StorageService } from '../services/storage';
import { MediaStorage } from '../services/mediaStorage';
import { NativeStorage } from '../services/nativeStorage';

interface VidGrabImageViewerProps {
  file: DownloadedFile;
  onClose: () => void;
  onDeleteFile?: (fileId: string) => void;
}

export const VidGrabImageViewer: React.FC<VidGrabImageViewerProps> = ({
  file,
  onClose,
  onDeleteFile,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const [imgSrc, setImgSrc] = useState<string>(file.mediaBlobUrl || file.thumbnail);

  React.useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    const resolveImage = async () => {
      if (file.mediaBlobKey) {
        const blob = await MediaStorage.getBlob(file.mediaBlobKey);
        if (blob && !cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setImgSrc(objectUrl);
          return;
        }
      }
      if (!cancelled) setImgSrc(file.mediaBlobUrl || file.thumbnail);
    };
    void resolveImage();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [file.id, file.mediaBlobKey, file.mediaBlobUrl, file.thumbnail]);

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 0.25, 3.5));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleShare = async () => {
    const shareData = {
      title: file.title,
      text: `VidGrab Image: ${file.fileName}`,
      url: file.originalUrl,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!');
      } catch {}
    } else {
      navigator.clipboard.writeText(file.originalUrl || file.title);
      showToast('Image link copied to clipboard!');
    }
  };

  const handleSave = () => {
    const anchor = document.createElement('a');
    anchor.href = imgSrc;
    anchor.download = file.fileName || 'image.jpg';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    showToast('Saved to device storage.');
  };

  const handleOpenFile = () => {
    if (file.nativeFileUri && NativeStorage.isAndroidBridgeAvailable && window.VidGrabNative) {
      window.VidGrabNative.shareFile(file.nativeFileUri, 'image/*', file.fileName);
      return;
    }
    window.open(imgSrc, '_blank');
  };

  const handleDelete = () => {
    if (confirm(`Delete "${file.fileName}" from your downloads?`)) {
      StorageService.deleteFile(file.id);
      if (onDeleteFile) onDeleteFile(file.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 text-white flex flex-col justify-between overflow-hidden select-none animate-fadeIn">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl border border-gray-700 pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* TOP BAR */}
      <div className="p-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-black/60 backdrop-blur-md z-30">
        <div className="flex items-center gap-2 min-w-0">
          <ImageIcon className="w-5 h-5 text-red-500 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm font-bold truncate max-w-xs sm:max-w-md">{file.fileName}</h2>
            <p className="text-[11px] text-gray-400">
              {file.formatLabel} • {file.size} • {Math.round(zoom * 100)}%
            </p>
          </div>
        </div>

        {/* Zoom & Rotation Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold font-mono transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-red-600 transition-colors cursor-pointer ml-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* IMAGE CANVAS */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto cursor-grab active:cursor-grabbing">
        <img
          src={imgSrc}
          alt={file.title}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease-out',
          }}
          className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-auto"
        />
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="p-4 bg-black/80 border-t border-white/10 shrink-0 flex items-center justify-between text-xs font-bold">
        <div className="text-gray-400 truncate max-w-xs">
          Path: <span className="font-mono text-gray-300">{file.location}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1.5 text-white"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5 text-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={handleOpenFile}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1.5 text-white"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open File</span>
          </button>

          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
