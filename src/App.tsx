import React, { useState, useEffect } from 'react';
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

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('home');
  const [browserUrl, setBrowserUrl] = useState<string>('https://www.youtube.com/');
  const [currentMetadata, setCurrentMetadata] = useState<MediaMetadata | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<MediaFormat | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [downloadLocation, setDownloadLocation] = useState<string>('/storage/emulated/0/Download/VidGrab/');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [files, setFiles] = useState<DownloadedFile[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activePlaybackFile, setActivePlaybackFile] = useState<DownloadedFile | null>(null);
  const [isPlayerMaximized, setIsPlayerMaximized] = useState(true);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(true);
  const [activeImageViewerFile, setActiveImageViewerFile] = useState<DownloadedFile | null>(null);

  const refreshStorage = () => {
    setFiles(StorageService.getFiles());
    setHistory(StorageService.getHistory());
  };

  const handlePlayFile = (file: DownloadedFile) => {
    if (file.type === 'image') {
      setActiveImageViewerFile(file);
      return;
    }
    setActivePlaybackFile(file);
    setIsPlayerMaximized(true);
    setIsPlaybackPlaying(true);
  };

  useEffect(() => {
    refreshStorage();
    void NativeStorage.ensureFolders();
  }, []);

  const handleGrab = async (url: string) => {
    setErrorMessage(undefined);
    try {
      const metadata = await ApiService.getMetadata(url);
      setCurrentMetadata(metadata);
      setCustomTitle(metadata.title);
      setActiveTab('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to analyze media at this URL. Please check the link and try again.');
    }
  };

  const handleOpenBrowser = (url: string) => {
    setBrowserUrl(url);
    setActiveTab('browser');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartDownload = (format: MediaFormat, title: string, location: string) => {
    setSelectedFormat(format);
    setCustomTitle(title);
    setDownloadLocation(location);
    setActiveTab('progress');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setActiveTab('home');
    setErrorMessage(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToResult = () => {
    setActiveTab('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (showSplash) return <SplashScreen onFinished={() => setShowSplash(false)} />;

  const isBrowser = activeTab === 'browser';

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {!isBrowser && (
        <Header
          activeTab={activeTab}
          onNavigate={(tab) => { setActiveTab(tab); setErrorMessage(undefined); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          filesCount={files.length}
        />
      )}

      <main className={isBrowser ? 'flex-1 min-h-0 overflow-hidden vidgrab-browser-main' : 'flex-1 vidgrab-app-main'}>
        {activeTab === 'home' && (
          <HomePage onOpenBrowser={handleOpenBrowser} onOpenDownloadPage={handleGrab} onOpenMoreSites={() => setActiveTab('platforms')} />
        )}

        {activeTab === 'browser' && (
          <InAppBrowser
            initialUrl={browserUrl}
            onClose={handleBackToHome}
            onOpenDownloadPage={(metadata) => {
              setCurrentMetadata(metadata);
              setCustomTitle(metadata.title);
              setActiveTab('result');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'music' && <MusicPage onOpenDownloadPage={handleGrab} onOpenBrowser={handleOpenBrowser} />}
        {activeTab === 'video' && <VideoPage onOpenDownloadPage={handleGrab} onOpenBrowser={handleOpenBrowser} />}

        {activeTab === 'platforms' && (
          <SupportedPlatformsPage onBack={handleBackToHome} onSelectSample={handleOpenBrowser} />
        )}

        {activeTab === 'result' && currentMetadata && (
          <DownloadResultPage
            metadata={currentMetadata}
            onBack={handleBackToHome}
            onViewFiles={() => { refreshStorage(); setActiveTab('files'); }}
            onStartDownload={handleStartDownload}
          />
        )}

        {activeTab === 'progress' && currentMetadata && selectedFormat && (
          <DownloadProgressPage
            metadata={currentMetadata}
            selectedFormat={selectedFormat}
            customTitle={customTitle || currentMetadata.title}
            downloadLocation={downloadLocation}
            onBack={handleBackToResult}
            onViewFiles={() => { refreshStorage(); setActiveTab('files'); }}
            onRedownload={() => handleStartDownload(selectedFormat, customTitle, downloadLocation)}
            onPlayDownloadedFile={handlePlayFile}
          />
        )}

        {activeTab === 'files' && <MyFilesPage files={files} onRefresh={refreshStorage} onGoHome={handleBackToHome} onPlayFile={handlePlayFile} />}
        {activeTab === 'history' && <HistoryPage history={history} onRefresh={refreshStorage} onRedownload={handleGrab} onGoHome={handleBackToHome} />}
        {activeTab === 'me' && <MorePage />}
      </main>

      {!isBrowser && <Footer />}

      {activePlaybackFile && !isPlayerMaximized && (
        <MiniPlayer file={activePlaybackFile} isPlaying={isPlaybackPlaying} onTogglePlay={(e) => { e.stopPropagation(); setIsPlaybackPlaying(!isPlaybackPlaying); }} onMaximize={() => setIsPlayerMaximized(true)} onClose={(e) => { e.stopPropagation(); setActivePlaybackFile(null); }} />
      )}

      {activePlaybackFile && isPlayerMaximized && activePlaybackFile.type === 'video' && (
        <VidGrabVideoPlayer
          file={activePlaybackFile}
          onClose={() => setActivePlaybackFile(null)}
          onMinimize={() => setIsPlayerMaximized(false)}
          onFileUpdated={refreshStorage}
          onDeleteFile={(id) => {
            const target = StorageService.getFiles().find((f) => f.id === id);
            if (target?.nativeFileUri) NativeStorage.delete(target.nativeFileUri);
            StorageService.deleteFile(id); void MediaStorage.deleteBlob(id); refreshStorage(); setActivePlaybackFile(null);
          }}
        />
      )}

      {activePlaybackFile && isPlayerMaximized && activePlaybackFile.type === 'audio' && (
        <VidGrabAudioPlayer
          file={activePlaybackFile}
          onClose={() => setActivePlaybackFile(null)}
          onMinimize={() => setIsPlayerMaximized(false)}
          onFileUpdated={refreshStorage}
          onDeleteFile={(id) => {
            const target = StorageService.getFiles().find((f) => f.id === id);
            if (target?.nativeFileUri) NativeStorage.delete(target.nativeFileUri);
            StorageService.deleteFile(id); void MediaStorage.deleteBlob(id); refreshStorage(); setActivePlaybackFile(null);
          }}
        />
      )}

      {activeImageViewerFile && (
        <VidGrabImageViewer
          file={activeImageViewerFile}
          onClose={() => setActiveImageViewerFile(null)}
          onDeleteFile={(id) => {
            const target = StorageService.getFiles().find((f) => f.id === id);
            if (target?.nativeFileUri) NativeStorage.delete(target.nativeFileUri);
            StorageService.deleteFile(id); void MediaStorage.deleteBlob(id); refreshStorage(); setActiveImageViewerFile(null);
          }}
        />
      )}

      {!isBrowser && (
        <BottomNav
          activeTab={activeTab}
          onNavigate={(tab) => { setActiveTab(tab); setErrorMessage(undefined); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          filesCount={files.length}
        />
      )}
    </div>
  );
}
