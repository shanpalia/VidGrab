import React, { useState } from 'react';
import {
  Search,
  Clipboard,
  ArrowRight,
  Youtube,
  Instagram,
  Facebook,
  Music2,
  Share2,
  Twitter,
  Pin,
  Globe,
  Download,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Link2,
  Play,
} from 'lucide-react';
import { PlatformSource } from '../types';

interface HomePageProps {
  onOpenBrowser: (url: string) => void;
  onOpenDownloadPage: (url: string) => void;
  onOpenMoreSites: () => void;
}

type Platform = {
  id: string;
  name: string;
  source: PlatformSource;
  browserUrl: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  cardClass: string;
  badge: string;
};

const PLATFORMS: Platform[] = [
  { id: 'youtube', name: 'YouTube', source: 'YouTube', browserUrl: 'https://www.youtube.com/', icon: Youtube, iconClass: 'text-red-600', cardClass: 'border-red-100 bg-red-50/80', badge: 'VIDEO' },
  { id: 'whatsapp', name: 'WhatsApp', source: 'WhatsApp', browserUrl: 'https://web.whatsapp.com/', icon: Share2, iconClass: 'text-emerald-600', cardClass: 'border-emerald-100 bg-emerald-50/80', badge: 'STATUS' },
  { id: 'instagram', name: 'Instagram', source: 'Instagram', browserUrl: 'https://www.instagram.com/', icon: Instagram, iconClass: 'text-pink-600', cardClass: 'border-pink-100 bg-pink-50/80', badge: 'REELS' },
  { id: 'facebook', name: 'Facebook', source: 'Facebook', browserUrl: 'https://m.facebook.com/', icon: Facebook, iconClass: 'text-blue-600', cardClass: 'border-blue-100 bg-blue-50/80', badge: 'WATCH' },
  { id: 'tiktok', name: 'TikTok', source: 'TikTok', browserUrl: 'https://www.tiktok.com/', icon: Music2, iconClass: 'text-gray-950', cardClass: 'border-gray-200 bg-gray-50', badge: 'VIDEO' },
  { id: 'twitter', name: 'X', source: 'X / Twitter', browserUrl: 'https://x.com/', icon: Twitter, iconClass: 'text-gray-950', cardClass: 'border-gray-200 bg-gray-50', badge: 'VIDEO' },
  { id: 'pinterest', name: 'Pinterest', source: 'Pinterest', browserUrl: 'https://www.pinterest.com/', icon: Pin, iconClass: 'text-red-600', cardClass: 'border-rose-100 bg-rose-50/80', badge: 'PINS' },
];

const isMediaUrl = (value: string) => /^(https?:\/\/)?([^\s]+\.)?(youtube\.com|youtu\.be|facebook\.com|fb\.watch|instagram\.com|tiktok\.com|x\.com|twitter\.com|pinterest\.[^/]+)(\/|$)/i.test(value);

export const HomePage: React.FC<HomePageProps> = ({ onOpenBrowser, onOpenDownloadPage, onOpenMoreSites }) => {
  const [urlInput, setUrlInput] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text.trim());
        showToast('Link pasted');
        return;
      }
    } catch {}
    const fallback = window.prompt('Paste your video or media link');
    if (fallback) setUrlInput(fallback.trim());
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = urlInput.trim();
    if (!clean) {
      showToast('Paste a link or type a search');
      return;
    }
    if (/^https?:\/\//i.test(clean) || isMediaUrl(clean)) {
      const target = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
      onOpenDownloadPage(target);
      return;
    }
    onOpenBrowser(`https://www.youtube.com/results?search_query=${encodeURIComponent(clean)}`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 pt-3 sm:pt-5 pb-28">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] rounded-full bg-gray-950 text-white px-4 py-2 text-xs font-bold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}

      {/* Main download hero */}
      <section className="relative overflow-hidden rounded-[28px] bg-gray-950 text-white p-4 sm:p-6 shadow-xl shadow-gray-900/10">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-red-600/25 blur-3xl" />
        <div className="absolute -left-16 -bottom-24 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-[11px] font-black tracking-wider">
                <Zap className="w-3.5 h-3.5 text-red-400" /> FAST MEDIA DOWNLOADER
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight">Paste. Grab. Watch.</h1>
              <p className="mt-1 text-sm text-white/60">Download videos, music, reels and more with VidGrab.</p>
            </div>
            <div className="hidden sm:flex h-14 w-14 rounded-2xl bg-white/10 border border-white/10 items-center justify-center">
              <Download className="w-7 h-7" />
            </div>
          </div>

          <form onSubmit={submit} className="rounded-2xl bg-white p-1.5 shadow-2xl flex items-center gap-1.5">
            <div className="flex-1 min-w-0 flex items-center gap-2 px-2.5 sm:px-3">
              <Search className="w-5 h-5 shrink-0 text-gray-400" />
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste link or search YouTube"
                className="w-full min-w-0 bg-transparent outline-none text-gray-900 text-sm sm:text-base placeholder:text-gray-400 py-3"
                autoComplete="off"
              />
              <button type="button" onClick={handlePaste} aria-label="Paste" className="shrink-0 h-10 w-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition">
                <Clipboard className="w-5 h-5" />
              </button>
            </div>
            <button type="submit" className="shrink-0 h-12 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[.98] px-4 sm:px-6 font-black text-sm flex items-center gap-2 transition">
              NEXT <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/55">
            <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Public media links</span>
            <span className="inline-flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> HD / 4K options</span>
            <span className="inline-flex items-center gap-1"><Play className="w-3.5 h-3.5" /> Vibe Player ready</span>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mt-5 grid grid-cols-3 gap-2.5">
        <button onClick={() => onOpenBrowser('https://www.youtube.com/')} className="rounded-2xl border border-gray-200 bg-white p-3 text-left shadow-sm active:scale-[.98] transition">
          <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center"><Youtube className="w-5 h-5 text-red-600" /></div>
          <p className="mt-2 text-xs font-black text-gray-900">Browse</p>
          <p className="text-[10px] text-gray-500">YouTube</p>
        </button>
        <button onClick={handlePaste} className="rounded-2xl border border-gray-200 bg-white p-3 text-left shadow-sm active:scale-[.98] transition">
          <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center"><Clipboard className="w-5 h-5 text-gray-700" /></div>
          <p className="mt-2 text-xs font-black text-gray-900">Paste link</p>
          <p className="text-[10px] text-gray-500">From clipboard</p>
        </button>
        <button onClick={() => onOpenMoreSites()} className="rounded-2xl border border-gray-200 bg-white p-3 text-left shadow-sm active:scale-[.98] transition">
          <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center"><Globe className="w-5 h-5 text-purple-600" /></div>
          <p className="mt-2 text-xs font-black text-gray-900">More sites</p>
          <p className="text-[10px] text-gray-500">Supported sources</p>
        </button>
      </section>

      {/* Platform grid */}
      <section className="mt-7">
        <div className="flex items-end justify-between mb-3 px-1">
          <div>
            <p className="text-[11px] font-black tracking-[.16em] text-red-600">QUICK ACCESS</p>
            <h2 className="text-xl sm:text-2xl font-black text-gray-950">Choose a platform</h2>
          </div>
          <button onClick={onOpenMoreSites} className="text-xs font-bold text-gray-500 hover:text-gray-900">View all</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            return (
              <button key={platform.id} onClick={() => onOpenBrowser(platform.browserUrl)} className={`group relative min-w-0 rounded-2xl border p-3 sm:p-4 text-left shadow-sm hover:shadow-md active:scale-[.98] transition ${platform.cardClass}`}>
                <span className="absolute right-2.5 top-2.5 text-[8px] font-black tracking-wider text-gray-500/70">{platform.badge}</span>
                <div className="h-11 w-11 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Icon className={`w-6 h-6 ${platform.iconClass}`} />
                </div>
                <p className="mt-3 font-black text-sm text-gray-950 truncate">{platform.name}</p>
                <p className="mt-0.5 text-[10px] text-gray-500">Open in VidGrab</p>
              </button>
            );
          })}
          <button onClick={onOpenMoreSites} className="group min-w-0 rounded-2xl border border-purple-100 bg-purple-50/80 p-3 sm:p-4 text-left shadow-sm hover:shadow-md active:scale-[.98] transition">
            <div className="h-11 w-11 rounded-xl bg-white shadow-sm flex items-center justify-center"><Globe className="w-6 h-6 text-purple-600" /></div>
            <p className="mt-3 font-black text-sm text-gray-950">1000+ Sites</p>
            <p className="mt-0.5 text-[10px] text-gray-500">More sources</p>
          </button>
        </div>
      </section>

      {/* Clean feature strip — no fake/demo media */}
      <section className="mt-7 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-red-600" />
          <h2 className="font-black text-gray-950">VidGrab workflow</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><div className="text-xs font-black text-red-600">01</div><p className="mt-1 text-xs font-bold text-gray-900">Paste a link</p><p className="mt-0.5 text-[10px] text-gray-500">Clipboard or search</p></div>
          <div><div className="text-xs font-black text-red-600">02</div><p className="mt-1 text-xs font-bold text-gray-900">Pick quality</p><p className="mt-0.5 text-[10px] text-gray-500">Video or audio</p></div>
          <div><div className="text-xs font-black text-red-600">03</div><p className="mt-1 text-xs font-bold text-gray-900">Download & play</p><p className="mt-0.5 text-[10px] text-gray-500">Vibe Player</p></div>
        </div>
        <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 flex items-center gap-2 text-[10px] text-gray-500">
          <Link2 className="w-4 h-4 shrink-0" /> VidGrab processes publicly accessible media links only.
        </div>
      </section>
    </div>
  );
};
