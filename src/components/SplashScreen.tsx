import React from 'react';
import { Download, Play, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinished: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  React.useEffect(() => {
    const timer = window.setTimeout(onFinished, 2300);
    return () => window.clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-white flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,1)_0%,rgba(255,245,250,0.92)_42%,rgba(238,245,255,0.96)_100%)]" />
      <div className="absolute -top-28 -left-24 w-72 h-72 rounded-full bg-pink-300/30 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 w-80 h-80 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="relative w-full max-w-md px-8 text-center flex flex-col items-center animate-fadeIn">
        <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-white shadow-[0_20px_70px_rgba(99,20,120,0.18)] ring-1 ring-gray-100 overflow-hidden flex items-center justify-center">
          <img src="/vidgrab-splash-logo.png" alt="VidGrab By PaliaAPK HUB" className="w-full h-full object-contain" />
        </div>

        <div className="mt-7 flex items-center gap-2 text-gray-900">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 via-pink-500 to-blue-600 text-white flex items-center justify-center shadow-md">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </span>
          <span className="text-2xl font-black tracking-tight">Vid<span className="text-red-600">Grab</span></span>
        </div>
        <div className="mt-1 text-sm font-bold tracking-wide text-gray-700">By PaliaAPK HUB</div>
        <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          Download • Play • Enjoy
          <Download className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="mt-10 text-xs font-bold text-gray-700">Developer by Shan Palia</div>
        <div className="mt-1 text-[10px] text-gray-400">© Shan Palia</div>

        <div className="mt-7 w-40 h-1 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-blue-600 animate-[splashProgress_2.1s_ease-in-out_forwards]" />
        </div>
      </div>
    </div>
  );
};
