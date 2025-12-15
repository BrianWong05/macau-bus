/**
 * NearbyStopsHeader - Header component for the nearby stops view
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

interface NearbyStopsHeaderProps {
  viewMode: 'list' | 'map';
  onViewModeChange: (mode: 'list' | 'map') => void;
  onRefresh: () => void;
  onClose: () => void;
}

export const NearbyStopsHeader: React.FC<NearbyStopsHeaderProps> = ({
  viewMode,
  onViewModeChange,
  onRefresh,
  onClose,
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
      <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
        📍 {t('nearby_stops')}
      </h2>
      <div className="flex gap-2 items-center">
        <button 
          onClick={onRefresh}
          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors active:scale-95"
          title={t('refresh')}
        >
          🔄
        </button>
        <div className="flex bg-gray-200 rounded-lg p-1 text-xs font-semibold">
          <button 
            className={`px-3 py-1 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => onViewModeChange('list')}
          >
            {t('list_view')}
          </button>
          <button 
            className={`px-3 py-1 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => onViewModeChange('map')}
          >
            {t('map_view')}
          </button>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

