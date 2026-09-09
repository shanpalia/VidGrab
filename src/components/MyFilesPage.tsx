import React, { useState } from 'react';
import {
  FolderDown,
  Film,
  Music,
  Image as ImageIcon,
  Play,
  Trash2,
  Share2,
  Search,
  ExternalLink,
  Plus,
  CheckCircle2,
  MoreVertical,
  Edit2,
  ChevronDown,
  Shield,
  Clock,
  HardDrive,
  FolderOpen
} from 'lucide-react';
import { DownloadedFile } from '../types';
import { StorageService } from '../services/storage';
import { MediaStorage } from '../services/mediaStorage';
import { NativeStorage } from '../services/nativeStorage';
import { RenameModal } from './RenameModal';

interface MyFilesPageProps {
  files: DownloadedFile[];
  onRefresh: () => void;
  onGoHome: () => void;
  onPlayFile: (file: DownloadedFile) => void;
}

type TabType = 'downloads' | 'videos' | 'music' | 'private';

export const MyFilesPage: React.FC<MyFilesPageProps> = ({
  files,
  onRefresh,
  onGoHome,
  onPlayFile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('downloads');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMenuFileId, setActiveMenuFileId] = useState<string | null>(null);
  const [renameFile, setRenameFile] = useState<DownloadedFile | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleDelete = (fileId: string, fileName: string) => {
    if (confirm(`Delete "${fileName}" from your downloads?`)) {
      const target = files.find((f) => f.id === fileId);
      if (target?.nativeFileUri) NativeStorage.delete(target.nativeFileUri);
      StorageService.deleteFile(fileId);
      void MediaStorage.deleteBlob(fileId);
      onRefresh();
      showToast('File deleted.');
    }
    setActiveMenuFileId(null);
  };

  const handleShare = async (file: DownloadedFile) => {
    setActiveMenuFileId(null);
    const mime = file.type === 'video' ? `video/${file.ext === 'webm' ? 'webm' : 'mp4'}` : file.type === 'audio' ? (file.ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4') : file.type === 'image' ? `image/${file.ext === 'jpg' ? 'jpeg' : file.ext}` : '*/*';
    if (file.nativeFileUri && NativeStorage.share(file.nativeFileUri, mime, file.fileName)) {
      showToast('Share sheet opened.');
      return;
    }

    const shareData = {
      title: file.title,
      text: `Downloaded with VidGrab: ${file.title} (${file.formatLabel})`,
      url: file.originalUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!');
      } catch {}
    } else {
      navigator.clipboard.writeText(`${file.title} - ${file.originalUrl}`);
      showToast('File details copied to clipboard!');
    }
  };

  const handleOpenFile = (file: DownloadedFile) => {
    setActiveMenuFileId(null);
    const mime = file.type === 'video' ? `video/${file.ext === 'webm' ? 'webm' : 'mp4'}` : file.type === 'audio' ? (file.ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4') : file.type === 'image' ? `image/${file.ext === 'jpg' ? 'jpeg' : file.ext}` : '*/*';
    if (file.nativeFileUri && NativeStorage.open(file.nativeFileUri, mime)) return;
    if (file.mediaBlobUrl) {
      window.open(file.mediaBlobUrl, '_blank');
    } else {
      window.open(file.originalUrl, '_blank');
    }
  };

  const handleRenameConfirm = (newTitle: string) => {
    if (!renameFile) return;
    StorageService.renameFile(renameFile.id, newTitle);
    onRefresh();
    showToast('File renamed.');
    setRenameFile(null);
  };

  // Filter based on tab
  const filteredByTab = files.filter((file) => {
    if (activeTab === 'downloads') return true; // All downloaded files
    if (activeTab === 'videos') return file.type === 'video';
    if (activeTab === 'music') return file.type === 'audio';
    if (activeTab === 'private') return false; // Private folder (empty by default)
    return true;
  });

  // Filter based on search query
  const searchedFiles = filteredByTab.filter((file) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      file.fileName.toLowerCase().includes(q) ||
      file.title.toLowerCase().includes(q) ||
      file.source.toLowerCase().includes(q)
    );
  });

  // Sort files
  const sortedFiles = [...searchedFiles].sort((a, b) => {
    if (sortBy === 'name') return a.fileName.localeCompare(b.fileName);
    if (sortBy === 'size') return (b.sizeBytes || 0) - (a.sizeBytes || 0);
    return new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime();
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight flex items-center gap-2 font-display">
            <FolderDown className="w-6 h-6 text-red-600" />
            <span>MY FILES</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            /storage/emulated/0/Download/VidGrab/
          </p>
        </div>

        <button
          onClick={onGoHome}
          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-red-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Grab Media</span>
        </button>
      </div>

      {/* SECTION TABS: Downloads | Videos | Music | Private */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('downloads')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'downloads'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Downloads
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'videos'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Videos
        </button>

        <button
          onClick={() => setActiveTab('music')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'music'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Music
        </button>

        <button
          onClick={() => setActiveTab('private')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'private'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Private</span>
        </button>
      </div>

      {/* SUB-HEADER: Downloaded [count] & All Files ▼ dropdown */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-bold text-gray-700">
          <span>Downloaded </span>
          <span className="text-red-600 font-mono">({sortedFiles.length})</span>
        </div>

        {/* Dropdown for Sort / Filter */}
        <div className="relative">
          <button
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-red-600 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <span>All Files</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {filterDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-30 text-xs font-medium text-gray-700 divide-y divide-gray-100 animate-fadeIn">
              <button
                onClick={() => {
                  setSortBy('date');
                  setFilterDropdownOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                  sortBy === 'date' ? 'font-bold text-red-600' : ''
                }`}
              >
                Sort by Date
              </button>
              <button
                onClick={() => {
                  setSortBy('name');
                  setFilterDropdownOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                  sortBy === 'name' ? 'font-bold text-red-600' : ''
                }`}
              >
                Sort by Name
              </button>
              <button
                onClick={() => {
                  setSortBy('size');
                  setFilterDropdownOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                  sortBy === 'size' ? 'font-bold text-red-600' : ''
                }`}
              >
                Sort by Size
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      {files.length > 0 && (
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name or source..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-gray-900 outline-none focus:border-red-500 shadow-2xs font-medium"
          />
        </div>
      )}

      {/* FILE LIST OR EMPTY STATE */}
      {activeTab === 'private' ? (
        /* Private Tab Empty View */
        <div className="bg-white rounded-3xl border border-gray-200/80 p-8 text-center my-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-gray-950 mb-1">Private Vault</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Protect sensitive downloads with PIN or fingerprint authentication. No files currently protected.
          </p>
        </div>
      ) : sortedFiles.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-gray-200/80 p-10 text-center my-6 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <FolderDown className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-gray-950 mb-1">
            No Downloaded Files Found
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
            Search or enter video and audio links from YouTube, TikTok, Facebook, and Instagram to download files into VidGrab.
          </p>
          <button
            onClick={onGoHome}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-red-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Discover & Grab Media</span>
          </button>
        </div>
      ) : (
        /* Downloaded Files List */
        <div className="space-y-3">
          {sortedFiles.map((file) => {
            const isAudio = file.type === 'audio';
            const isImage = file.type === 'image';
            const menuOpen = activeMenuFileId === file.id;

            return (
              <div
                key={file.id}
                className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 hover:border-gray-300 transition-all shadow-2xs flex items-center gap-3.5 relative group"
              >
                {/* File Thumbnail or Cover */}
                <div
                  onClick={() => onPlayFile(file)}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-950 shrink-0 cursor-pointer shadow-xs group-hover:scale-102 transition-transform"
                >
                  <img
                    src={file.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80'}
                    alt={file.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Play overlay button */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Format Badge overlay */}
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-white">
                    {file.formatLabel || file.ext.toUpperCase()}
                  </span>
                </div>

                {/* File Information */}
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onPlayFile(file)}>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-950 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                    {file.fileName || file.title}
                  </h3>

                  {/* Badges row: Quality, Duration, Platform */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-bold text-[10px] border border-red-200/60">
                      {file.formatLabel || file.ext.toUpperCase()}
                    </span>
                    {file.duration && (
                      <span className="text-[11px] font-mono text-gray-500 flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {file.duration}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-gray-500">
                      {file.source}
                    </span>
                  </div>

                  {/* File Size & Date info */}
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">
                    {file.size} | {file.ext.toUpperCase()} | {file.downloadedAt}
                  </p>
                </div>

                {/* Right Action: Play Button (for audio) + Three-dot Menu */}
                <div className="flex items-center gap-1.5 shrink-0 relative">
                  {isAudio && (
                    <button
                      onClick={() => onPlayFile(file)}
                      className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>PLAY</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveMenuFileId(menuOpen ? null : file.id)}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="File Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-2xl py-1 z-40 text-xs font-semibold text-gray-700 divide-y divide-gray-100 animate-fadeIn">
                      <button
                        onClick={() => {
                          setActiveMenuFileId(null);
                          onPlayFile(file);
                        }}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-left transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-red-600" />
                        <span>Play Media</span>
                      </button>

                      <button
                        onClick={() => handleShare(file)}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-left transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveMenuFileId(null);
                          setRenameFile(file);
                        }}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-left transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Rename</span>
                      </button>

                      <button
                        onClick={() => handleOpenFile(file)}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-left transition-colors cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Open File</span>
                      </button>

                      <button
                        onClick={() => handleDelete(file.id, file.fileName)}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-red-50 text-red-600 text-left transition-colors cursor-pointer font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rename Modal */}
      {renameFile && (
        <RenameModal
          isOpen={!!renameFile}
          initialTitle={renameFile.title}
          onClose={() => setRenameFile(null)}
          onConfirm={handleRenameConfirm}
        />
      )}
    </div>
  );
};
