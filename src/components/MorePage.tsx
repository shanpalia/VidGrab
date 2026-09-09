import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Folder,
  Sliders,
  Info,
  CheckCircle2,
  ExternalLink,
  Code2,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { StorageService, UserSettings } from '../services/storage';
import { LocationModal } from './LocationModal';

export const MorePage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const handleToggleAutoPlay = () => {
    const updated = StorageService.updateSettings({
      autoPlayPreviews: !settings.autoPlayPreviews,
    });
    setSettings(updated);
    showSaved();
  };

  const handleQualityChange = (quality: string) => {
    const updated = StorageService.updateSettings({
      defaultQuality: quality,
    });
    setSettings(updated);
    showSaved();
  };

  const handleLocationChange = (newLoc: string) => {
    const updated = StorageService.updateSettings({
      downloadLocation: newLoc,
    });
    setSettings(updated);
    showSaved();
  };

  const showSaved = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      {/* Saved Toast */}
      {savedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Settings updated successfully!
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-red-600" />
          <span>Me & Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          VidGrab account profile, download preferences, and developer information.
        </p>
      </div>

      {/* Developer Spotlight Card - Strictly Shan Palia */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-3xl p-6 sm:p-7 shadow-lg shadow-red-600/20 mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold mb-3">
            <Code2 className="w-3.5 h-3.5" />
            <span>DEVELOPER & CREATOR</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            VidGrab Pro Edition
          </h2>
          <p className="text-red-100 text-sm mt-1.5 leading-relaxed max-w-md">
            Engineered by <strong className="text-white font-black">Shan Palia</strong> as a clean, reliable, modern mobile-first media browser and download system.
          </p>

          <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs text-red-100">
            <div>
              Developed by <span className="font-bold text-white">Shan Palia</span>
            </div>
            <div>
              copyright © <span className="font-bold text-white">Shan Palia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-gray-200/80 mb-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-red-600" />
          <span>Download Preferences</span>
        </h3>

        {/* Download Location */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-xs sm:text-sm font-bold text-gray-900">Download Location</p>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[220px] sm:max-w-md">
              {settings.downloadLocation}
            </p>
          </div>
          <button
            id="change-settings-location-btn"
            onClick={() => setIsLocationOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-bold text-red-600 cursor-pointer"
          >
            Change
          </button>
        </div>

        {/* Preferred Default Quality */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-xs sm:text-sm font-bold text-gray-900">Default Quality</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Auto-selected when media opens
            </p>
          </div>
          <select
            value={settings.defaultQuality}
            onChange={(e) => handleQualityChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-800 outline-none focus:border-red-500"
          >
            <option value="1080p">1080P HD MP4</option>
            <option value="720p">720P HD MP4</option>
            <option value="480p">480P MP4</option>
            <option value="mp3_128k">MP3 128K Audio</option>
          </select>
        </div>

        {/* Auto Play Previews */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-xs sm:text-sm font-bold text-gray-900">Auto-Play Previews</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Play sample video inside preview modal
            </p>
          </div>
          <button
            onClick={handleToggleAutoPlay}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              settings.autoPlayPreviews ? 'bg-red-600' : 'bg-gray-200'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                settings.autoPlayPreviews ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Standards & Guidelines */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-gray-200/80 mb-6 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Security & Compliance</span>
        </h3>

        <p className="text-xs text-gray-600 leading-relaxed">
          VidGrab operates strictly in compliance with public media distribution protocols. Users are authorized to grab personal backups, Creative Commons creations, or public content where permitted by copyright holders.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700">
            <span className="font-bold text-gray-900 block mb-0.5">🔒 Private Content Protected</span>
            Private and login-gated media cannot be downloaded through VidGrab.
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700">
            <span className="font-bold text-gray-900 block mb-0.5">⚡ Lossless Direct Streams</span>
            Media is processed without extraneous ad injection or tracking.
          </div>
        </div>
      </div>

      {/* Location Modal */}
      <LocationModal
        currentLocation={settings.downloadLocation}
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        onSelect={handleLocationChange}
      />
    </div>
  );
};
