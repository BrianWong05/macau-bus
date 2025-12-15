
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ALL_ROUTES } from '@/data/routes';
import govData from '@/data/gov_data.json';
import { getDistanceFromLatLonInKm } from '@/utils/distance';
import { useArrivalData } from '@/features/nearby-stops/hooks/useArrivalData';
import { BusProgressBar } from '@/features/nearby-stops/components/BusProgressBar';

interface RouteDashboardProps {
  onSelectRoute: (route: string, stopCode?: string, direction?: string | null) => void;
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
  const [expandedStop, setExpandedStop] = useState<string | null>(null);

  // Use arrival data hook
  const { arrivalData, loadingArrivals, fetchStopData } = useArrivalData();

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

  // Auto-refresh arrival data when stop is expanded
  useEffect(() => {
    if (!expandedStop) return;
    fetchStopData(expandedStop);
    const interval = setInterval(() => fetchStopData(expandedStop), 8000);
    return () => clearInterval(interval);
  }, [expandedStop, fetchStopData]);

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
    if (searchTerm.length > 0) {
      const term = searchTerm.toLowerCase();
      results = results.filter(stop => {
        const names = [stop.name, stop.raw?.P_NAME, stop.raw?.P_NAME_EN, stop.raw?.P_NAME_POR, stop.raw?.P_ALIAS]
          .filter(Boolean).map(n => n!.toLowerCase());
        return names.some(name => name.includes(term));
      });
    }
    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, searchTerm.length > 0 ? 30 : 15);
  }, [allStopsWithDistance, searchTerm, searchMode]);

  // Get localized stop name
  const getDisplayName = (stop: StopData) => {
    const lang = i18n.language;
    if (lang === 'en') return stop.raw?.P_NAME_EN || stop.name;
    if (lang === 'pt') return stop.raw?.P_NAME_POR || stop.name;
    return stop.raw?.P_NAME || stop.name;
  };

  const formatDist = (km: number) => km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;

  const getEtaTextColor = (eta: number) => {
    if (eta <= 2) return 'text-green-600';
    if (eta <= 5) return 'text-yellow-600';
    return 'text-gray-700';
  };

  const handleStopClick = (stopCode: string) => {
    if (expandedStop === stopCode) {
      setExpandedStop(null);
    } else {
      setExpandedStop(stopCode);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4 pb-0">
      {/* Search Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setSearchMode('route'); setSearchTerm(''); setExpandedStop(null); }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            searchMode === 'route' ? 'bg-teal-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          🚌 {t('search_route')}
        </button>
        <button
          onClick={() => { setSearchMode('stop'); setSearchTerm(''); setExpandedStop(null); }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            searchMode === 'stop' ? 'bg-teal-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
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

      </div>
      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Route Mode */}
        {searchMode === 'route' && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 content-start">
            {filteredRoutes.map(route => (
              <button
                key={route}
                onClick={() => onSelectRoute(route)}
                className="aspect-square flex items-center justify-center bg-white hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg shadow-sm hover:shadow-md transition-all group"
              >
                <span className="text-lg font-bold text-gray-700 group-hover:text-teal-600">{route}</span>
              </button>
            ))}
            {filteredRoutes.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500">{t('no_data')}</div>
            )}
          </div>
        )}

        {/* Stop Mode */}
        {searchMode === 'stop' && (
          <div className="space-y-3">
            {locationLoading ? (
              <div className="text-center py-10 text-gray-400">📍 {t('loading')}</div>
            ) : locationError && !userLocation ? (
              <div className="text-center py-10 text-gray-500">
                <div className="text-2xl mb-2">🚫</div>
                <p>{t('location_denied')}</p>
              </div>
            ) : displayStops.length === 0 ? (
              <div className="text-center py-10 text-gray-500">{t('no_data')}</div>
            ) : (
              displayStops.map((stop, idx) => {
                const routes = stop.raw?.ROUTE_NOS?.split(',').map(r => r.trim()).filter(Boolean) || [];
                const isExpanded = expandedStop === stop.code;
                const stopArrivals = arrivalData[stop.code] || {};
                const isLoading = loadingArrivals[stop.code];

                return (
                  <div 
                    key={`${stop.code || idx}`} 
                    className={`border rounded-xl shadow-sm transition-all bg-white overflow-hidden ${isExpanded ? 'ring-2 ring-teal-500 shadow-md' : 'hover:shadow-md border-gray-100'}`}
                  >
                    {/* Stop Header - Clickable */}
                    <div 
                      className="p-4 flex justify-between items-start cursor-pointer"
                      onClick={() => handleStopClick(stop.code)}
                    >
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                          {getDisplayName(stop)}
                          {isExpanded 
                            ? <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{t('open')}</span>
                            : <span className="text-xs text-gray-400">▼</span>
                          }
                        </h3>
                        <div className="text-xs text-gray-400 font-mono">{stop.code}</div>
                      </div>
                      <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        <span>📍</span> {formatDist(stop.distance)}
                      </div>
                    </div>

                    {/* Collapsed: Route Tags */}
                    {!isExpanded && routes.length > 0 && (
                      <div className="px-4 pb-4 flex flex-wrap gap-2">
                        {routes.map(route => (
                          <span 
                            key={route} 
                            className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded cursor-pointer hover:bg-teal-50 hover:text-teal-600 transition"
                            onClick={(e) => { e.stopPropagation(); onSelectRoute(route, stop.code, null); }}
                          >
                            {route}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expanded Content - Arrival Data */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50">
                        {isLoading && Object.keys(stopArrivals).length === 0 ? (
                          <div className="text-center py-4 text-gray-400 text-sm">{t('loading')}</div>
                        ) : routes.length === 0 ? (
                          <div className="text-center py-4 text-gray-400 text-sm">{t('no_data')}</div>
                        ) : (
                          <div className="space-y-3">
                            {routes.map(route => {
                              const info = stopArrivals[route];
                              const isRichInfo = info && typeof info === 'object';

                              if (!isRichInfo) {
                                return (
                                  <div 
                                    key={route}
                                    className="bg-white p-3 rounded-lg border cursor-pointer hover:border-teal-300 transition"
                                    onClick={(e) => { e.stopPropagation(); onSelectRoute(route, stop.code, null); }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-lg text-teal-600">{route}</span>
                                      <span className="text-xs text-gray-400">{info || '---'}</span>
                                    </div>
                                  </div>
                                );
                              }

                              const { buses, destination, status } = info;

                              return (
                                <div 
                                  key={route}
                                  className="bg-white rounded-lg border overflow-hidden cursor-pointer hover:border-teal-300 hover:shadow-md transition"
                                  onClick={(e) => { e.stopPropagation(); onSelectRoute(route, stop.code, info.direction || null); }}
                                >
                                  {/* Route Header */}
                                  <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-xl text-teal-600">{route}</span>
                                      {destination && <span className="text-xs text-gray-500">→ {destination}</span>}
                                    </div>
                                    {status === 'arriving' && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                                        {t('arriving')}
                                      </span>
                                    )}
                                  </div>

                                  {/* Bus List */}
                                  <div className="p-3">
                                    {status === 'no-service' && <div className="text-gray-400 text-xs">{t('no_active_service')}</div>}
                                    {status === 'no-approaching' && <div className="text-gray-400 text-xs">{t('no_approaching')}</div>}
                                    {status === 'arriving' && (
                                      <div className="flex items-center gap-2 text-green-600">
                                        <span className="text-lg">🚌</span>
                                        <span className="font-semibold">{t('at_station')}</span>
                                      </div>
                                    )}
                                    {status === 'active' && buses && buses.length > 0 && (
                                      <div className="space-y-2">
                                        {buses.map((bus: any, bidx: number) => (
                                          <div key={bidx} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                            <div className="flex items-center gap-2">
                                              <span className="text-base">🚌</span>
                                              <div>
                                                <div className="text-[10px] text-gray-400 font-mono">
                                                  <span className="font-bold text-gray-600">{bus.plate}</span>
                                                  <span className="mx-1">•</span>
                                                  <span>@ {bus.currentStop}</span>
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                  {bus.stopsAway} {t('stops')} • {bus.distanceM > 0 ? `${(bus.distanceM / 1000).toFixed(1)}km` : '< 0.1km'}
                                                </div>
                                                {bus.trafficSegments && bus.trafficSegments.length > 0 && (
                                                  <BusProgressBar trafficSegments={bus.trafficSegments} />
                                                )}
                                              </div>
                                            </div>
                                            <div className={`text-lg font-bold ${getEtaTextColor(bus.eta)}`}>
                                              {bus.eta === 0 ? '<1' : bus.eta}
                                              <span className="text-xs font-normal ml-0.5">{t('min')}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
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

