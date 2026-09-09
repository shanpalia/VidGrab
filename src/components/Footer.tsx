import React from 'react';
import { Download, Shield, Sparkles, CheckCircle2, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16 pb-24 md:pb-12 pt-10 text-gray-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-black">
                <Download className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xl font-black text-gray-950 tracking-tight">
                VID<span className="text-red-600">GRAB</span>
              </span>
            </div>
            <p className="text-sm text-gray-600 max-w-sm leading-relaxed">
              Fast, high-fidelity media utility built for mobile and desktop. Convert and download public authorized video and audio streams seamlessly.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 pt-1">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> High Definition (up to 4K)
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lossless Audio (320K/M4A)
              </span>
            </div>
          </div>

          {/* Supported Platforms */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">Supported Platforms</h4>
            <ul className="text-xs text-gray-600 space-y-2">
              <li className="hover:text-red-600 transition-colors cursor-pointer">YouTube & Shorts</li>
              <li className="hover:text-red-600 transition-colors cursor-pointer">Instagram Reels & Clips</li>
              <li className="hover:text-red-600 transition-colors cursor-pointer">TikTok HD Without Watermark</li>
              <li className="hover:text-red-600 transition-colors cursor-pointer">Facebook & X / Twitter</li>
              <li className="hover:text-red-600 transition-colors cursor-pointer">Pinterest & WhatsApp Media</li>
            </ul>
          </div>

          {/* Legal & Standards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">Security & Compliance</h4>
            <ul className="text-xs text-gray-600 space-y-2">
              <li className="flex items-center gap-1.5 text-gray-500">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Authorized Media Only</span>
              </li>
              <li>No DRM / Login Bypass</li>
              <li>Encrypted Stream Processing</li>
              <li>Privacy First • No Personal Logs</li>
            </ul>
          </div>
        </div>

        {/* Developer Credit & Copyright Section - Strictly as specified */}
        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="text-sm font-bold text-gray-900">
              VidGrab
            </p>
            <p className="text-xs font-medium text-gray-600 mt-0.5">
              Developed by <span className="font-semibold text-gray-900">Shan Palia</span>
            </p>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            copyright © <span className="font-semibold text-gray-700">Shan Palia</span>. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
