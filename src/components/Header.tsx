import React from 'react';
import { Download, Sparkles, FolderDown, History, Menu, ShieldCheck } from 'lucide-react';
import { ActiveNavTab } from '../types';

interface HeaderProps {
  activeTab: ActiveNavTab;
  onNavigate: (tab: ActiveNavTab) => void;
  filesCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onNavigate, filesCount }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo / Wordmark */}
        <button
          id="vidgrab-logo-button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left group transition-transform active:scale-95 cursor-pointer"
        >
          <img
            src="/vidgrab-icon.png"
            alt="VidGrab"
            className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:shadow-md transition-shadow"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-gray-950 font-display">
                VID<span className="text-red-600">GRAB</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-50 text-red-600 border border-red-200/60 rounded-full tracking-wider">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium leading-none">
              Developed by <span className="text-gray-700 font-semibold">Shan Palia</span>
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-gray-50/80 p-1 rounded-full border border-gray-200/60">
          <button
            id="nav-desktop-home"
            onClick={() => onNavigate('home')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'home' || activeTab === 'result'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Home
          </button>
          <button
            id="nav-desktop-music"
            onClick={() => onNavigate('music')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'music'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Music
          </button>
          <button
            id="nav-desktop-video"
            onClick={() => onNavigate('video')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Video
          </button>
          <button
            id="nav-desktop-files"
            onClick={() => onNavigate('files')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'files' || activeTab === 'progress'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FolderDown className="w-3.5 h-3.5" />
            My Files
            {filesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] flex items-center justify-center font-bold">
                {filesCount}
              </span>
            )}
          </button>
          <button
            id="nav-desktop-me"
            onClick={() => onNavigate('me')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'me'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Me
          </button>
        </nav>

        {/* Right side utility / credit */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1.5 rounded-full font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Clean & Safe Media</span>
          </div>
          <button
            id="mobile-nav-toggle-more"
            onClick={() => onNavigate('more')}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            title="Options and Info"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
