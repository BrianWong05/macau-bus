
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ALL_ROUTES } from '@/data/routes';
import govData from '@/data/gov_data.json';
import { getDistanceFromLatLonInKm } from '@/utils/distance';

interface RouteDashboardProps {
  onSelectRoute: (route: string) => void;
}

type SearchMode = 'route' | 'stop';

interface StopData {
  name: string;
  lat: number;
  lon: number;
  raw?: {
    ROUTE_NOS?: string;
    P_NAME?: string;
    P_NAME_EN?: string;
    P_NAME_POR?: string;
    P_ALIAS?: string;
  };
}

interface StopWithDistance extends StopData {
  distance: number;
  code: string;
}

const stopsData = govData.stops as StopData[];

const RouteDashboard: React.FC<RouteDashboardProps> = ({ onSelectRoute }) => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('route');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user location when stop mode is selected
  useEffect(() => {
    if (searchMode === 'stop' && !userLocation && !locationLoading) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setLocationLoading(false);
        },
        (err) => {
          setLocationError(err.message);
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [searchMode, userLocation, locationLoading]);

  // Filter routes by search term
  const filteredRoutes = useMemo(() => {
    if (searchMode !== 'route') return [];
    return ALL_ROUTES.filter(route => 
      route.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, searchMode]);

  // Process all stops with distance calculation
  const allStopsWithDistance = useMemo((): StopWithDistance[] => {
    if (searchMode !== 'stop') return [];
    
    return stopsData.map(stop => {
      const distance = userLocation 
        ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lon, stop.lat, stop.lon)
        : 999;
      const code = (stop.raw?.P_ALIAS || 'UNKNOWN').replace(/[_-]/g, '/');
      return { ...stop, distance, code };
    });
  }, [searchMode, userLocation]);

  // Get stops to display: 15 nearest by default, or filtered results
  const displayStops = useMemo((): StopWithDistance[] => {
    if (searchMode !== 'stop') return [];

    let results = [...allStopsWithDistance];

    // If searching, filter by name
    if (searchTerm.length > 0) {
      const term = searchTerm.toLowerCase();
      results = results.filter(stop => {
        const names = [
          stop.name,
          stop.raw?.P_NAME,
          stop.raw?.P_NAME_EN,
          stop.raw?.P_NAME_POR,
          stop.raw?.P_ALIAS,
        ].filter(Boolean).map(n => n!.toLowerCase());
        return names.some(name => name.includes(term));
      });
    }

    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);

    // Limit: 15 for default nearby view, 30 for search results
    return results.slice(0, searchTerm.length > 0 ? 30 : 15);
  }, [allStopsWithDistance, searchTerm, searchMode]);

  // Get localized stop name based on current language
  const getDisplayName = (stop: StopData) => {
    const lang = i18n.language;
    if (lang === 'en') return stop.raw?.P_NAME_EN || stop.name;
    if (lang === 'pt') return stop.raw?.P_NAME_POR || stop.name;
    return stop.raw?.P_NAME || stop.name;
  };

  // Format distance
  const formatDist = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      {/* Search Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setSearchMode('route'); setSearchTerm(''); }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            searchMode === 'route' 
              ? 'bg-teal-500 text-white shadow-md' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          🚌 {t('search_route')}
        </button>
        <button
          onClick={() => { setSearchMode('stop'); setSearchTerm(''); }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            searchMode === 'stop' 
              ? 'bg-teal-500 text-white shadow-md' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          📍 {t('search_stop')}
        </button>
      </div>

      {/* Search Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          {searchMode === 'route' ? t('all_routes') : (searchTerm ? t('search_stop') : t('nearby_stops'))}
        </h2>
        <input
          type="text"
          placeholder={searchMode === 'route' ? t('search_route_placeholder') : t('search_stop_placeholder')}
          className="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {/* Route Mode: Grid of routes */}
        {searchMode === 'route' && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 content-start">
            {filteredRoutes.map(route => (
              <button
                key={route}
                onClick={() => onSelectRoute(route)}
                className="aspect-square flex items-center justify-center bg-white hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg shadow-sm hover:shadow-md transition-all group"
              >
                <span className="text-lg font-bold text-gray-700 group-hover:text-teal-600">
                  {route}
                </span>
              </button>
            ))}
            
            {filteredRoutes.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500">
                {t('no_data')}
              </div>
            )}
          </div>
        )}

        {/* Stop Mode: List of stops with routes */}
        {searchMode === 'stop' && (
          <div className="space-y-3">
            {locationLoading ? (
              <div className="text-center py-10 text-gray-400">
                📍 {t('loading')}
              </div>
            ) : locationError && !userLocation ? (
              <div className="text-center py-10 text-gray-500">
                <div className="text-2xl mb-2">🚫</div>
                <p>{t('location_denied')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('search_stop_placeholder')}</p>
              </div>
            ) : displayStops.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                {t('no_data')}
              </div>
            ) : (
              displayStops.map((stop, idx) => {
                const routes = stop.raw?.ROUTE_NOS?.split(',').map(r => r.trim()).filter(Boolean) || [];
                return (
                  <div key={`${stop.code || idx}`} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">📍</span>
                        <div>
                          <h3 className="font-bold text-gray-800">{getDisplayName(stop)}</h3>
                          <p className="text-xs text-gray-400 font-mono">{stop.raw?.P_ALIAS}</p>
                        </div>
                      </div>
                      {userLocation && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
                          {formatDist(stop.distance)}
                        </span>
                      )}
                    </div>
                    {routes.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">{t('routes_at_stop')}:</p>
                        <div className="flex flex-wrap gap-2">
                          {routes.map(route => (
                            <button
                              key={route}
                              onClick={() => onSelectRoute(route)}
                              className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-sm rounded-lg border border-teal-200 transition-all hover:shadow-sm"
                            >
                              {route}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteDashboard;

