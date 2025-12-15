import React from 'react';
import { useTranslation } from 'react-i18next';

interface SearchModeToggleProps {
  searchMode: 'route' | 'stop';
  onModeChange: (mode: 'route' | 'stop') => void;
}

export const SearchModeToggle: React.FC<SearchModeToggleProps> = ({ searchMode, onModeChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => onModeChange('route')}
        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
          searchMode === 'route' 
            ? 'bg-teal-500 text-white shadow-md' 
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
        }`}
      >
        🚌 {t('search_route')}
      </button>
      <button
        onClick={() => onModeChange('stop')}
        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
          searchMode === 'stop' 
            ? 'bg-teal-500 text-white shadow-md' 
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
        }`}
      >
        📍 {t('search_stop')}
      </button>
    </div>
  );
};
