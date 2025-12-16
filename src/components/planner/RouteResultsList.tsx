import React from 'react';
import { useTranslation } from 'react-i18next';
import type { RouteResult, TripResult } from '@/services/RouteFinder';
import RouteResultCard from '@/components/route-result/RouteResultCard';

interface RouteResultsListProps {
  results: RouteResult[];
  tripResults: TripResult[] | null;
  loading: boolean;
  showMap: boolean;
  onToggleMap: () => void;
  onSelectRoute: (index: number) => void;
  onViewMap: (index: number) => void;
  onRouteClick?: (route: string, stopCode: string) => void;
}

export const RouteResultsList: React.FC<RouteResultsListProps> = ({
  results,
  tripResults,
  loading,
  showMap,
  onToggleMap,
  onSelectRoute,
  onViewMap,
  onRouteClick
}) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = React.useState<'duration' | 'transfers'>('duration');

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton Loader */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg mb-4" />
          <div className="h-24 bg-gray-100 rounded-lg mb-3" />
          <div className="h-24 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) return null;

  // Sort Results
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'duration') {
       return a.totalDuration - b.totalDuration;
    } else {
       // Sort by transfers first
       if (a.transferCount !== b.transferCount) {
         return a.transferCount - b.transferCount;
       }
       // Then by duration
       return a.totalDuration - b.totalDuration;
    }
  });

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">
            {t('route_planner.results', 'Route Found')}
            <span className="ml-2 text-sm font-normal text-gray-500">
              {results.length > 1 ? `(${results.length} ${t('route_planner.options', 'options')})` : ''}
            </span>
          </h2>
          <button
            onClick={onToggleMap}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
              showMap 
                ? 'bg-teal-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🗺️ {showMap ? t('route_planner.hide_map', 'Hide Map') : t('route_planner.show_map', 'Show Map')}
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2 p-1 bg-gray-100/80 rounded-lg w-fit">
           <button
             onClick={() => setSortBy('duration')}
             className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
               sortBy === 'duration'
                 ? 'bg-white text-teal-600 shadow-sm'
                 : 'text-gray-500 hover:text-gray-700'
             }`}
           >
             ⚡ {t('route_planner.sort_fastest', 'Fastest')}
           </button>
           <button
             onClick={() => setSortBy('transfers')}
             className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
               sortBy === 'transfers'
                 ? 'bg-white text-teal-600 shadow-sm'
                 : 'text-gray-500 hover:text-gray-700'
             }`}
           >
             🔄 {t('route_planner.sort_transfers', 'Fewest Transfers')}
           </button>
        </div>
      </div>

      {sortedResults.map((result, index) => {
        // Find the original index to map correct tripResults if needed
        // Note: tripResults corresponds to original 'results' array index.
        // We need to find the correct tripResult for this specific routeResult.
        const originalIndex = results.indexOf(result);
        
        // Get walking segments if available
        const trip = tripResults?.[originalIndex];
        
        return (
          <div key={`${index}-${result.totalDuration}`} className="relative animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
            <RouteResultCard 
              result={result} 
              startWalk={trip?.startWalk}
              endWalk={trip?.endWalk}
              onHeaderClick={() => onSelectRoute(originalIndex)}
              onViewMap={() => onViewMap(originalIndex)}
              onRouteClick={onRouteClick}
            />
          </div>
        );
      })}
    </div>
  );
};
