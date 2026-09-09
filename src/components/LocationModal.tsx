import React, { useState } from 'react';
import { X, Folder, HardDrive, Check, Smartphone } from 'lucide-react';

interface LocationModalProps {
  currentLocation: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
}

const PRESET_LOCATIONS = [
  { id: 'internal', label: 'Internal Storage / Download / VidGrab', icon: Smartphone, desc: 'Default system download folder' },
  { id: 'music', label: 'Internal Storage / Music / VidGrab', icon: Folder, desc: 'Recommended for MP3 & M4A' },
  { id: 'movies', label: 'Internal Storage / Movies / VidGrab', icon: Folder, desc: 'Recommended for 1080P & 4K videos' },
  { id: 'sdcard', label: 'SD Card / Media / VidGrab', icon: HardDrive, desc: 'Removable memory storage' },
];

export const LocationModal: React.FC<LocationModalProps> = ({ currentLocation, isOpen, onClose, onSelect }) => {
  const [selected, setSelected] = useState(currentLocation);

  if (!isOpen) return null;

  const handleSave = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Folder className="w-5 h-5 text-red-600" />
            <h3>Download Location</h3>
          </div>
          <button
            id="close-location-modal-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Choose where VidGrab stores downloaded files on your device.
        </p>

        <div className="space-y-2 mb-6">
          {PRESET_LOCATIONS.map((loc) => {
            const Icon = loc.icon;
            const isChosen = selected === loc.label;
            return (
              <div
                key={loc.id}
                onClick={() => setSelected(loc.label)}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  isChosen
                    ? 'border-red-500 bg-red-50/50 text-gray-900'
                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${isChosen ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight truncate">{loc.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{loc.desc}</p>
                </div>
                <div className="pt-0.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isChosen ? 'border-red-600 bg-red-600 text-white' : 'border-gray-300'
                    }`}
                  >
                    {isChosen && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            id="cancel-location-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            id="save-location-btn"
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-xs shadow-red-600/30 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Set Location
          </button>
        </div>
      </div>
    </div>
  );
};
