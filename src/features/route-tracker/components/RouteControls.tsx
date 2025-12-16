/**
 * RouteControls - Toolbar for active route view (View toggle, Direction toggle, Refresh)
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

interface RouteControlsProps {
  viewMode: 'list' | 'map';
  onViewModeChange: (mode: 'list' | 'map') => void;
  direction: string;
  hasOppositeDirection: boolean;
  onToggleDirection: () => void;
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading?: boolean;
}

export const RouteControls: React.FC<RouteControlsProps> = ({
  viewMode,
  onViewModeChange,
  direction,
  hasOppositeDirection,
  onToggleDirection,
  lastUpdated,
  onRefresh,
  loading = false,
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white border-b px-4 py-2 flex items-center justify-between sticky top-0 z-40 shadow-sm flex-wrap gap-2">
      
      {/* View Toggle */}
      <div className="bg-gray-100 p-1 rounded-lg flex shrink-0">
        <button
          onClick={() => onViewModeChange('list')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${viewMode === 'list' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('list_view')}
        </button>
        <button
          onClick={() => onViewModeChange('map')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${viewMode === 'map' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('map_view')}
        </button>
      </div>

      {/* Right Actions: Direction & Refresh */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        {/* Direction Toggle */}
        {hasOppositeDirection && (
          <button 
            onClick={onToggleDirection}
            className="bg-teal-50 text-teal-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-teal-100 transition flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
            <span className="hidden sm:inline">{t('switch_dir')}</span>
          </button>
        )}

        {/* Refresh Status (Compact) */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
           <span className="text-[10px] text-gray-400 hidden sm:inline-block">
             {lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : t('loading')}
           </span>
           <button 
             onClick={onRefresh}
             disabled={loading}
             className={`text-gray-400 hover:text-teal-600 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
             title={t('refresh')}
           >
             <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
           </button>
        </div>
      </div>
    </div>
  );
};

