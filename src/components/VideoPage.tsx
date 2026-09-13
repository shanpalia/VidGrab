import React, { useState } from 'react';
import { Film, Play, Download, ExternalLink } from 'lucide-react';
import { ApiService } from '../services/api';

interface VideoPageProps { onOpenDownloadPage: (url: string) => void; }

export const VideoPage: React.FC<VideoPageProps> = ({ onOpenDownloadPage }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const value = url.trim();
    if (!value) return;
    setLoading(true); setError('');
    try {
      await ApiService.getMetadata(value);
      onOpenDownloadPage(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to read this URL');
    } finally { setLoading(false); }
  };

  return (
    <main className="vidgrab-screen min-h-full">
      <div className="mx-auto max-w-3xl py-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-3 text-white"><Film size={22} /></div>
            <div><h1 className="text-xl font-bold text-slate-900">Video Downloader</h1><p className="text-sm text-slate-500">Paste a public video link to continue.</p></div>
          </div>
          <div className="mt-5 flex gap-2">
            <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Paste video URL" className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" />
            <button onClick={submit} disabled={loading || !url.trim()} className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50">{loading ? 'Checking…' : 'GRAB'}</button>
          </div>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4"><Play size={18} /><p className="mt-2 font-semibold">Preview</p><p className="text-xs text-slate-500">Review available media.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><Download size={18} /><p className="mt-2 font-semibold">Download</p><p className="text-xs text-slate-500">Choose format and quality.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><ExternalLink size={18} /><p className="mt-2 font-semibold">Vibe Player</p><p className="text-xs text-slate-500">Play saved videos in Vibe Player.</p></div>
          </div>
        </div>
      </div>
    </main>
  );
};
