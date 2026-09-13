import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './components/HomePage';
import { InAppBrowser } from './components/InAppBrowser';
import { MusicPage } from './components/MusicPage';
import { VideoPage } from './components/VideoPage';
import { DownloadResultPage } from './components/DownloadResultPage';
import { DownloadProgressPage } from './components/DownloadProgressPage';
import { SupportedPlatformsPage } from './components/SupportedPlatformsPage';
import { MyFilesPage } from './components/MyFilesPage';
import { HistoryPage } from './components/HistoryPage';
import { MorePage } from './components/MorePage';
import { VidGrabVideoPlayer } from './components/VidGrabVideoPlayer';
import { VidGrabAudioPlayer } from './components/VidGrabAudioPlayer';
import { VidGrabImageViewer } from './components/VidGrabImageViewer';
import { MiniPlayer } from './components/MiniPlayer';
import { MediaMetadata, MediaFormat, DownloadedFile, HistoryItem, ActiveNavTab } from './types';
import { ApiService } from './services/api';
import { StorageService } from './services/storage';
import { NativeStorage } from './services/nativeStorage';
import { MediaStorage } from './services/mediaStorage';
import { SplashScreen } from './components/SplashScreen';

const isPublicMediaUrl = (value: string) => /^(https?:\/\/)?([^\s]+\.)?(youtube\.com|youtu\.be|facebook\.com|fb\.watch|instagram\.com|tiktok\.com|x\.com|twitter\.com|pinterest\.[^/]+)\//i.test(value);

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('home');
  const [browserUrl, setBrowserUrl] = useState('https://www.youtube.com/');
  const [nativeBrowserOpen, setNativeBrowserOpen] = useState(false);
  const [currentMetadata, setCurrentMetadata] = useState<MediaMetadata | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<MediaFormat | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [downloadLocation, setDownloadLocation] = useState('/storage/emulated/0/Download/VidGrab/');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [files, setFiles] = useState<DownloadedFile[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activePlaybackFile, setActivePlaybackFile] = useState<DownloadedFile | null>(null);
  const [isPlayerMaximized, setIsPlayerMaximized] = useState(true);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(true);
  const [activeImageViewerFile, setActiveImageViewerFile] = useState<DownloadedFile | null>(null);
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);

  const refreshStorage = () => { setFiles(StorageService.getFiles()); setHistory(StorageService.getHistory()); };
  const handlePlayFile = (file: DownloadedFile) => {
    if (file.type === 'image') { setActiveImageViewerFile(file); return; }
    setActivePlaybackFile(file); setIsPlayerMaximized(true); setIsPlaybackPlaying(true);
  };

  useEffect(() => { refreshStorage(); void NativeStorage.ensureFolders(); }, []);

  useEffect(() => {
    const onNativeBrowserClosed = () => {
      setNativeBrowserOpen(false);
      setActiveTab('home');
      setErrorMessage(undefined);
    };
    window.addEventListener('vidgrab-native-browser-closed', onNativeBrowserClosed);
    return () => window.removeEventListener('vidgrab-native-browser-closed', onNativeBrowserClosed);
  }, []);

  useEffect(() => {
    if (showSplash) return;
    let cancelled = false;
    let lastSeen = '';
    const check = async () => {
      if (cancelled) return;
      let text = '';
      try { text = String((window as any).VidGrabNative?.getClipboardText?.() || '').trim(); } catch {}
      if (!text && navigator.clipboard?.readText) { try { text = (await navigator.clipboard.readText()).trim(); } catch {} }
      if (!text || text === lastSeen || !isPublicMediaUrl(text)) return;
      lastSeen = text;
      setClipboardUrl(text);
    };
    void check();
    const timer = window.setInterval(check, 1200);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [showSplash]);

  const handleGrab = async (url: string) => {
    setErrorMessage(undefined);
    try {
      const metadata = await ApiService.getMetadata(url);
      setCurrentMetadata(metadata); setCustomTitle(metadata.title); setActiveTab('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) { setErrorMessage(err?.message || 'Unable to analyze this media URL.'); }
  };

  const handleOpenBrowser = (url: string) => {
    setBrowserUrl(url);
    setErrorMessage(undefined);
    const openedNative = NativeStorage.openBrowser(url);
    if (openedNative) {
      setNativeBrowserOpen(true);
      setActiveTab('browser');
      return;
    }
    setNativeBrowserOpen(false);
    setActiveTab('browser');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartDownload = (format: MediaFormat, title: string, location: string) => { setSelectedFormat(format); setCustomTitle(title); setDownloadLocation(location); setActiveTab('progress'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleBackToHome = () => { setNativeBrowserOpen(false); setActiveTab('home'); setErrorMessage(undefined); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleBackToResult = () => { setActiveTab('result'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const navigate = (tab: ActiveNavTab) => { setNativeBrowserOpen(false); setActiveTab(tab); setErrorMessage(undefined); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (showSplash) return <SplashScreen onFinished={() => setShowSplash(false)} />;
  const isBrowser = activeTab === 'browser';
  const showReactBrowser = isBrowser && !nativeBrowserOpen;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans overflow-x-hidden">
      {!isBrowser && <Header activeTab={activeTab} onNavigate={navigate} filesCount={files.length} />}
      <main className={isBrowser ? 'flex-1 min-h-0 overflow-hidden vidgrab-browser-main' : 'flex-1 vidgrab-app-main'}>
        {activeTab === 'home' && <HomePage onOpenBrowser={handleOpenBrowser} onOpenDownloadPage={handleGrab} onOpenMoreSites={() => navigate('platforms')} />}
        {showReactBrowser && <InAppBrowser initialUrl={browserUrl} onClose={handleBackToHome} onOpenDownloadPage={(metadata) => { setCurrentMetadata(metadata); setCustomTitle(metadata.title); setActiveTab('result'); }} />}
        {activeTab === 'music' && <MusicPage onOpenDownloadPage={handleGrab} onOpenBrowser={handleOpenBrowser} />}
        {activeTab === 'video' && <VideoPage onOpenDownloadPage={handleGrab} onOpenBrowser={handleOpenBrowser} />}
        {activeTab === 'platforms' && <SupportedPlatformsPage onBack={handleBackToHome} onSelectSample={handleOpenBrowser} />}
        {activeTab === 'result' && currentMetadata && <DownloadResultPage metadata={currentMetadata} onBack={handleBackToHome} onViewFiles={() => { refreshStorage(); setActiveTab('files'); }} onStartDownload={handleStartDownload} />}
        {activeTab === 'progress' && currentMetadata && selectedFormat && <DownloadProgressPage metadata={currentMetadata} selectedFormat={selectedFormat} customTitle={customTitle || currentMetadata.title} downloadLocation={downloadLocation} onBack={handleBackToResult} onViewFiles={() => { refreshStorage(); setActiveTab('files'); }} onRedownload={() => handleStartDownload(selectedFormat, customTitle, downloadLocation)} onPlayDownloadedFile={handlePlayFile} />}
        {activeTab === 'files' && <MyFilesPage files={files} onRefresh={refreshStorage} onGoHome={handleBackToHome} onPlayFile={handlePlayFile} />}
        {activeTab === 'history' && <HistoryPage history={history} onRefresh={refreshStorage} onRedownload={handleGrab} onGoHome={handleBackToHome} />}
        {activeTab === 'me' && <MorePage />}
      </main>
      {!isBrowser && <Footer />}
      {activePlaybackFile && !isPlayerMaximized && <MiniPlayer file={activePlaybackFile} isPlaying={isPlaybackPlaying} onTogglePlay={(e) => { e.stopPropagation(); setIsPlaybackPlaying((v) => !v); }} onMaximize={() => setIsPlayerMaximized(true)} onClose={(e) => { e.stopPropagation(); setActivePlaybackFile(null); }} />}
      {activePlaybackFile && isPlayerMaximized && activePlaybackFile.type === 'video' && <VidGrabVideoPlayer file={activePlaybackFile} onClose={() => setActivePlaybackFile(null)} onMinimize={() => setIsPlayerMaximized(false)} onFileUpdated={refreshStorage} onDeleteFile={(id) => { const target = StorageService.getFiles().find((f) => f.id === id); if (target?.nativeFileUri) NativeStorage.delete(target.nativeFileUri); StorageService.deleteFile(id); void MediaStorage.deleteBlob(id); refreshStorage(); setActivePlaybackFile(null); }} />}
      {activePlaybackFile && isPlayerMaximized && activePlaybackFile.type === 'audio' && <VidGrabAudioPlayer file={activePlaybackFile} onClose={() => setActivePlaybackFile(null)} onMinimize={() => setIsPlayerMaximized(false)} onFileUpdated={refreshStorage} onDeleteFile={(id) => { const target = StorageService.getFiles().find((f) => f.id === id); if (target?.nativeFileUri) NativeStorage.delete(target.nativeFileUri); StorageService.deleteFile(id); void MediaStorage.deleteBlob(id); refreshStorage(); setActivePlaybackFile(null); }} />}
      {activeImageViewerFile && <VidGrabImageViewer file={activeImageViewerFile} onClose={() => setActiveImageViewerFile(null)} onDeleteFile={(id) => { const target = StorageService.getFiles().find((f) => f.id === id); if (target?.nativeFileUri) NativeStorage.delete(target.nativeFileUri); StorageService.deleteFile(id); void MediaStorage.deleteBlob(id); refreshStorage(); setActiveImageViewerFile(null); }} />}
      {!isBrowser && <BottomNav activeTab={activeTab} onNavigate={navigate} filesCount={files.length} />}
      {clipboardUrl && (
        <div className="fixed inset-0 z-[200] bg-black/55 flex items-center justify-center p-5">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-3"><h2 className="text-xl font-black text-gray-900">Go to your copied URL</h2><p className="mt-3 text-sm text-gray-500 break-all line-clamp-3">{clipboardUrl}</p></div>
            <div className="px-6 py-4 flex items-center justify-end gap-7 border-t border-gray-100">
              <button onClick={() => setClipboardUrl(null)} className="font-bold text-gray-500">LATER</button>
              <button onClick={async () => { const url = clipboardUrl; setClipboardUrl(null); await handleGrab(url); }} className="font-bold text-sky-600">GO</button>
            </div>
          </div>
        </div>
      )}
      {errorMessage && <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[150] bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl">{errorMessage}</div>}
    </div>
  );
}
