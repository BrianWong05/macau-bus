/**
 * AppHeader - Header component for the main app
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getLocalizedStopName } from '@/utils/localizedStopName';

interface AppHeaderProps {
  activeRoute: string;
  busData: any;
  routeNo: string;
  showNearby: boolean;
  hasOppositeDirection: boolean;
  onBack: () => void;
  onSearch: () => void;
  onSetRouteNo: (val: string) => void;
  onToggleDirection: () => void;
  onShowNearby: () => void;
  onResetToHome: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeRoute,
  busData,
  routeNo,
  showNearby,
  hasOppositeDirection,
  onBack,
  onSearch,
  onSetRouteNo,
  onToggleDirection,
  onShowNearby,
  onResetToHome,
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white p-4 shadow-md sticky top-0 z-10">
      <div className="flex justify-between items-center mb-4">
        <h1 
          className="text-2xl font-bold tracking-tight cursor-pointer flex items-center gap-2"
          onClick={onResetToHome}
        >
          {busData && (
            <button 
              onClick={(e) => { e.stopPropagation(); onBack(); }}
              className="mr-1 hover:bg-white/20 rounded-full p-1 transition"
              title="Back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
          )}
          {!busData && "🚍"} {t('app_title')}
        </h1>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button 
            onClick={onShowNearby}
            className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition backdrop-blur-sm"
            title="Nearby Stops"
          >
            📍
          </button>
        </div>
      </div>

      {!busData && !showNearby && (
        <div className="text-teal-100 text-sm mb-2">
          {t('subtitle', 'Real-time bus tracking & traffic')}
        </div>
      )}
      
      {/* Active Route Header (Compact) */}
      {busData && (
        <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg backdrop-blur-md">
          <div className="bg-white text-teal-600 font-bold px-3 py-1 rounded text-xl shadow">
            {activeRoute}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-teal-100 uppercase font-semibold tracking-wider">{t('to_destination')}</div>
            <div className="font-medium truncate">{getLocalizedStopName(busData.stops[busData.stops.length-1]?.staCode, busData.stops[busData.stops.length-1]?.staName)}</div>
          </div>
        </div>
      )}
    </div>
  );
};
