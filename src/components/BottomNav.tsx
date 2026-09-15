import React from 'react';
import { Home, Music, Film, FolderDown, User } from 'lucide-react';
import { ActiveNavTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveNavTab;
  onNavigate: (tab: ActiveNavTab) => void;
  filesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onNavigate, filesCount }) => {
  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+8px)] left-2 right-2 z-50 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl px-1 py-1.5 safe-area-bottom shadow-xl shadow-gray-900/10">
      <nav className="flex items-center justify-around max-w-lg mx-auto">
        <button id="nav-tab-home" type="button" onClick={() => onNavigate('home')} className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'home' || activeTab === 'result' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}>
          <div className={`p-1 rounded-lg ${activeTab === 'home' || activeTab === 'result' ? 'bg-red-50 text-red-600' : ''}`}><Home className="w-5 h-5 stroke-[2.2]" /></div>
          <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight uppercase">Home</span>
        </button>
        <button id="nav-tab-music" type="button" onClick={() => onNavigate('music')} className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'music' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}>
          <div className={`p-1 rounded-lg ${activeTab === 'music' ? 'bg-red-50 text-red-600' : ''}`}><Music className="w-5 h-5 stroke-[2.2]" /></div>
          <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight uppercase">Music</span>
        </button>
        <button id="nav-tab-video" type="button" onClick={() => onNavigate('video')} className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'video' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}>
          <div className={`p-1 rounded-lg ${activeTab === 'video' ? 'bg-red-50 text-red-600' : ''}`}><Film className="w-5 h-5 stroke-[2.2]" /></div>
          <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight uppercase">Video</span>
        </button>
        <button id="nav-tab-files" type="button" onClick={() => onNavigate('files')} className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'files' || activeTab === 'progress' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}>
          <div className={`p-1 rounded-lg relative ${activeTab === 'files' || activeTab === 'progress' ? 'bg-red-50 text-red-600' : ''}`}>
            <FolderDown className="w-5 h-5 stroke-[2.2]" />
            {filesCount > 0 && <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">{filesCount}</span>}
          </div>
          <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight uppercase">My Files</span>
        </button>
        <button id="nav-tab-me" type="button" onClick={() => onNavigate('me')} className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'me' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}>
          <div className={`p-1 rounded-lg ${activeTab === 'me' ? 'bg-red-50 text-red-600' : ''}`}><User className="w-5 h-5 stroke-[2.2]" /></div>
          <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight uppercase">Me</span>
        </button>
      </nav>
    </div>
  );
};
