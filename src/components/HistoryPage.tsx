import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Plus
} from 'lucide-react';
import { HistoryItem } from '../types';
import { StorageService } from '../services/storage';

interface HistoryPageProps {
  history: HistoryItem[];
  onRefresh: () => void;
  onRedownload: (url: string) => void;
  onGoHome: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onRefresh,
  onRedownload,
  onGoHome,
}) => {
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleDeleteItem = (id: string) => {
    StorageService.deleteHistoryItem(id);
    onRefresh();
    showToast('Entry removed from history.');
  };

  const handleClearAll = () => {
    if (confirm('Clear all download history logs?')) {
      StorageService.clearHistory();
      onRefresh();
      showToast('History cleared.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-red-600" />
            <span>Download History</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Logs of your recent conversion requests and downloads.
          </p>
        </div>

        {history.length > 0 && (
          <button
            id="clear-all-history-btn"
            onClick={handleClearAll}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-gray-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History Items List */}
      {history.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Download History</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
            You don't have any download records yet. Past activities will show up here.
          </p>
          <button
            onClick={onGoHome}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-red-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Grab a Media URL
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const dateStr = new Date(item.timestamp).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                id={`history-item-${item.id}`}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 hover:border-red-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail / Status */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-900 shrink-0">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1">
                      {item.status === 'completed' ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                          <XCircle className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-700">
                        {item.source}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-50 text-red-600 border border-red-200/60">
                        {item.formatLabel}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 ml-auto sm:ml-0">
                        <Clock className="w-3 h-3" />
                        {dateStr}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-gray-400 truncate mt-0.5 font-mono">
                      {item.url}
                    </p>
                  </div>
                </div>

                {/* Actions: Redownload & Delete */}
                <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <button
                    id={`redownload-btn-${item.id}`}
                    onClick={() => onRedownload(item.url)}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    title="Redownload this source"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Redownload</span>
                  </button>

                  <button
                    id={`delete-history-btn-${item.id}`}
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
