import React, { useState, useEffect } from 'react';
import { X, Check, Edit3 } from 'lucide-react';

interface RenameModalProps {
  currentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({ currentName, isOpen, onClose, onSave }) => {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Edit3 className="w-5 h-5 text-red-600" />
            <h3>Rename File</h3>
          </div>
          <button
            id="close-rename-modal-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              File Title
            </label>
            <input
              id="rename-file-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-gray-900 font-medium text-sm outline-none transition-all"
              placeholder="Enter custom file name"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1.5">
              The file will be saved to your device with this custom name.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              id="cancel-rename-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-rename-btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-xs shadow-red-600/30 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
