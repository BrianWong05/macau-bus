import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fetchBusListApi } from '../services/api';
import govData from '../data/gov_data.json';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const stopsData = govData.stops;

// Helper component to auto-fit bounds
const NearbyFitBounds = ({ center, stops }) => {
    const map = useMap();
    useEffect(() => {
        if (center && stops.length > 0) {
            const bounds = L.latLngBounds();
            bounds.extend([center.lat, center.lon]);
            stops.forEach(s => bounds.extend([s.lat, s.lon]));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [center, stops, map]);
    return null;
};

const NearbyStops = ({ onClose, onSelectRoute }) => {
  const [nearbyStops, setNearbyStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [expandedStop, setExpandedStop] = useState(null);
  const [arrivalData, setArrivalData] = useState({}); 
  const [loadingArrivals, setLoadingArrivals] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        findNearby(latitude, longitude);
      },
      (err) => {
        console.error("Geo Error:", err);
        setPermissionDenied(true);
        setLoading(false);
      }
    );
  }, []);

  const findNearby = (lat, lon) => {
    try {
        const processed = stopsData.map(stop => {
            const dist = getDistanceFromLatLonInKm(lat, lon, stop.lat, stop.lon);
            let routes = [];
            if (stop.raw && stop.raw.ROUTE_NOS) {
                routes = [...new Set(stop.raw.ROUTE_NOS.split(',').map(r => r.trim()))];
            }
            let rawCode = stop.code || stop.raw?.P_ALIAS || stop.raw?.ALIAS || 'UNKNOWN';
            const code = rawCode.replace(/[_-]/g, '/');
            return { ...stop, code, distance: dist, routes };
        });

        processed.sort((a, b) => a.distance - b.distance);
        setNearbyStops(processed.slice(0, 50));
        setLoading(false);
    } catch (e) {
        setError("Failed to process stop data.");
        setLoading(false);
    }
  };

  // Haversine
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    var R = 6371; 
    var dLat = deg2rad(lat2-lat1);  
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; 
    return d;
  }

  const deg2rad = (deg) => deg * (Math.PI/180);

  const formatDistance = (km) => {
      if (km < 1) return `${Math.round(km * 1000)}m`;
      return `${km.toFixed(1)}km`;
  }

  const handleExpandStop = async (stop) => {
      if (expandedStop === stop.code) {
          setExpandedStop(null);
          return;
      }
      setExpandedStop(stop.code);
      setLoadingArrivals(prev => ({...prev, [stop.code]: true}));
      setArrivalData(prev => ({...prev, [stop.code]: {} })); 

      try {
          const newArrivals = {};
          await Promise.all(stop.routes.map(async (route) => {
               const checkDir = async (d) => {
                   try {
                     const [res2, res0] = await Promise.all([
                        fetchBusListApi(route, d, '2'),
                        fetchBusListApi(route, d, '0')
                     ]);
                     const isValid = (r) => r.data && r.data.data && r.data.data.routeInfo && r.data.data.routeInfo.length > 0;
                     const countBuses = (stops) => stops.flatMap(s => s.busInfo || []).length;
                     const findStopIndex = (stops) => {
                         return stops.findIndex(s => {
                             const sCode = (s.staCode || "").replace(/\//g, '-').replace(/_/g, '-');
                             const target = (stop.code || "").replace(/\//g, '-').replace(/_/g, '-');
                             const targetBase = target.split('-')[0];
                             if (sCode === target) return true;
                             if (sCode === targetBase || sCode.split('-')[0] === targetBase) return true;
                             return false;
                         });
                     };

                     let candidates = [];
                     if (isValid(res2)) candidates.push(res2.data.data.routeInfo);
                     if (isValid(res0)) candidates.push(res0.data.data.routeInfo);

                     let bestStops = null;
                     let bestIdx = -1;
                     for (const cStops of candidates) {
                         const idx = findStopIndex(cStops);
                         if (idx !== -1) {
                             if (!bestStops || countBuses(cStops) > countBuses(bestStops)) {
                                 bestStops = cStops;
                                 bestIdx = idx;
                             }
                         }
                     }

                     if (bestStops && bestIdx !== -1) {
                         const stops = bestStops;
                         const stopIdx = bestIdx;
                         
                         // Found stop
                          const buses = stops.flatMap(s => s.busInfo || []);
                          let minStops = 999;
                           for (let i = 0; i <= stopIdx; i++) {
                               if (stops[i].busInfo && stops[i].busInfo.length > 0) {
                                   const dist = stopIdx - i;
                                   if (dist < minStops) minStops = dist;
                               }
                           }

                            const totalActiveBuses = stops.flatMap(s => s.busInfo || []).length;
                            let info;
                            if (minStops === 999) {
                                if (totalActiveBuses > 0) info = "No approaching bus";
                                else info = "No active service";
                            } else if (minStops === 0) info = "Arriving / At Station";
                            else info = `${minStops} stops away`;
                            
                            return info;
                     }
                   } catch (e) { console.warn(e); }
                   return null;
               };

               // Probe both directions
               const info0 = await checkDir('0');
               if (info0) { newArrivals[route] = info0; return; }
               
               const info1 = await checkDir('1');
               if (info1) { newArrivals[route] = info1; } 
               else { newArrivals[route] = "No Service / Wrong Sta"; }
          }));

          setArrivalData(prev => ({...prev, [stop.code]: newArrivals }));
      } catch (err) {
          console.error("Arrival fetch failed", err);
      } finally {
          setLoadingArrivals(prev => ({...prev, [stop.code]: false}));
      }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-fade-in-up">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                📍 Nearby Stops
            </h2>
            <div className="flex gap-2">
                 <div className="flex bg-gray-200 rounded-lg p-1 text-xs font-semibold">
                    <button 
                        className={`px-3 py-1 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setViewMode('list')}
                    >
                        List
                    </button>
                    <button 
                        className={`px-3 py-1 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setViewMode('map')}
                    >
                        Map
                    </button>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">✕</button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative">
            {loading && (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {!loading && viewMode === 'list' && (
                <div className="p-4 space-y-3">
                    {permissionDenied && (
                        <div className="text-center p-6 text-gray-500">
                            <div className="text-4xl mb-2">🚫</div>
                            <p>Location access denied.</p>
                        </div>
                    )}
                    {nearbyStops.length === 0 && !permissionDenied && <div className="text-center text-gray-500">No stops found.</div>}
                    
                    {nearbyStops.map((stop, index) => (
                        <div 
                            key={stop.raw?.POLE_ID || `${stop.code}-${index}`} 
                            className={`border rounded-xl shadow-sm transition-all bg-white overflow-hidden ${expandedStop === stop.code ? 'ring-2 ring-teal-500 shadow-md' : 'hover:shadow-md border-gray-100'}`}
                        >
                            <div className="p-4 flex justify-between items-start cursor-pointer" onClick={() => handleExpandStop(stop)}>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                        {stop.name}
                                        {expandedStop === stop.code ? <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Open</span> : <span className="text-xs text-gray-400">▼</span>}
                                    </h3>
                                    <div className="text-xs text-gray-400 font-mono">{stop.code}</div>
                                </div>
                                <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                    <span>📍</span> {formatDistance(stop.distance)}
                                </div>
                            </div>
                            
                            {expandedStop !== stop.code && (
                                <div className="px-4 pb-4 flex flex-wrap gap-2">
                                    {stop.routes && stop.routes.map(route => (
                                        <span key={route} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">{route}</span>
                                    ))}
                                </div>
                            )}

                            {expandedStop === stop.code && (
                                <div className="bg-gray-50 border-t p-3 text-sm">
                                    {loadingArrivals[stop.code] ? (
                                        <div className="text-gray-500 flex items-center justify-center py-2">Loading live data...</div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {stop.routes.map(route => {
                                                const info = arrivalData[stop.code]?.[route] || "---";
                                                const active = info.includes("stops") || info.includes("Arriving");
                                                return (
                                                    <div 
                                                        key={route} 
                                                        className="bg-white p-2 rounded border flex flex-col justify-between cursor-pointer hover:border-teal-300 transition"
                                                        onClick={(e) => { e.stopPropagation(); onSelectRoute(route); onClose(); }}
                                                    >
                                                        <div className="font-bold text-lg text-gray-700">{route}</div>
                                                        <div className={`text-xs font-semibold ${active ? 'text-green-600' : 'text-gray-400'}`}>{info}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!loading && viewMode === 'map' && userLocation && (
                <div className="h-full w-full">
                    <MapContainer center={[userLocation.lat, userLocation.lon]} zoom={15} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                          attribution='&copy; CARTO'
                          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                        <NearbyFitBounds center={userLocation} stops={nearbyStops} />
                        
                        {/* User Marker */}
                        <CircleMarker center={[userLocation.lat, userLocation.lon]} radius={8} pathOptions={{ color: 'blue', fillColor: '#3b82f6', fillOpacity: 1 }}>
                            <Popup>You are here</Popup>
                        </CircleMarker>

                        {/* Stops */}
                        {nearbyStops.map(stop => (
                            <Marker key={stop.code} position={[stop.lat, stop.lon]}>
                                <Popup>
                                    <div className="text-center">
                                        <div className="font-bold">{stop.name}</div>
                                        <div className="text-xs text-gray-500 mb-2">{stop.code}</div>
                                        <button 
                                            className="bg-teal-500 text-white text-xs px-2 py-1 rounded"
                                            onClick={() => { setViewMode('list'); handleExpandStop(stop); }} // Switch to list to see details? Or just expand?
                                        >
                                            View Arrivals
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            )}
        </div>
    </div>
  );
};

export default NearbyStops;
