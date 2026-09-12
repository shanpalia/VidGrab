import React from 'react';
import { FolderDown, Menu, ShieldCheck } from 'lucide-react';
import { ActiveNavTab } from '../types';

interface HeaderProps {
  activeTab: ActiveNavTab;
  onNavigate: (tab: ActiveNavTab) => void;
  filesCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onNavigate, filesCount }) => {
  return (
    <header className="vidgrab-app-header sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          id="vidgrab-logo-button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left active:scale-95 transition-transform"
        >
          <img
            src="/vidgrab-icon.png"
            alt="VidGrab"
            className="w-9 h-9 rounded-xl object-cover"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-gray-950">
                VID<span className="text-red-600">GRAB</span>
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-50 text-red-600 border border-red-200 rounded-full">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-gray-500 leading-none">PaliaAPK HUB</p>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1 bg-gray-50 p-1 rounded-full border border-gray-200">
          {[
            ['home', 'Home'],
            ['music', 'Music'],
            ['video', 'Video'],
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => onNavigate(tab as ActiveNavTab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
                activeTab === tab || (tab === 'home' && activeTab === 'result')
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => onNavigate('files')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 ${
              activeTab === 'files' || activeTab === 'progress'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <FolderDown className="w-3.5 h-3.5" />
            Files
            {filesCount > 0 && <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] flex items-center justify-center">{filesCount}</span>}
          </button>
          <button
            onClick={() => onNavigate('me')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase ${activeTab === 'me' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600'}`}
          >
            Me
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Safe Media
          </div>
          <button
            id="mobile-nav-toggle-more"
            onClick={() => onNavigate('me')}
            className="md:hidden p-2 text-gray-600 rounded-lg"
            title="Options and Info"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
