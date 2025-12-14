import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fetchBusListApi, fetchMapLocationApi, fetchTrafficApi } from '../services/api';
import govData from '../data/gov_data.json';

// Import extracted utilities
import { getDistanceFromLatLonInKm, formatDistance } from '../utils/distance';
import { getStopCoords, getStopName } from '../utils/stopCodeMatcher';
import { getEtaColor, getEtaTextColor } from '../utils/etaColors';

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

// NearbyFitBounds is now imported from features/nearby-stops/components
import { NearbyFitBounds } from '../features/nearby-stops/components/NearbyFitBounds';
import { NearbyStopsHeader } from '../features/nearby-stops/components/NearbyStopsHeader';
import { NearbyMapView } from '../features/nearby-stops/components/NearbyMapView.jsx';
import { NearbyStopsList } from '../features/nearby-stops/components/NearbyStopsList.jsx';
import { useArrivalData } from '../features/nearby-stops/hooks/useArrivalData';

const NearbyStops = ({ onClose, onSelectRoute }) => {
  const [nearbyStops, setNearbyStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [expandedStop, setExpandedStop] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState('list'); 
  
  // Use extracted hook for arrival data management
  const { arrivalData, loadingArrivals, stopBuses, lastUpdated, fetchStopData } = useArrivalData();

  // ... (useEffect for geolocation) ...
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    console.log("Requesting Geolocation...");
    const timeoutId = setTimeout(() => {
        // Fallback or just log if it takes too long
        console.warn("Geolocation timed out (manual check).");
        // We could force an error here if we want to stop "finding forever"
        // But typically the OS prompt handles this.
        // Let's force an error state after 15 seconds to unblock UI
        if (loading) {
            setError("Location request timed out. Please check permissions.");
            setLoading(false);
        }
    }, 15000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        console.log("Location Found:", position.coords);
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        findNearby(latitude, longitude);
      },
      (err) => {
        clearTimeout(timeoutId);
        console.error("Geo Error:", err);
        setError(`Location access error: ${err.message}`);
        setPermissionDenied(true);
        setLoading(false);
      },
      {
          enableHighAccuracy: true,
          timeout: 10000, 
          maximumAge: 0
      }
    );
    
    return () => clearTimeout(timeoutId);
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

  // Note: getDistanceFromLatLonInKm and formatDistance are now imported from utils/distance
  // Note: fetchStopData is now provided by useArrivalData hook

  // Auto-Refresh Effect
  useEffect(() => {
      let intervalId;
      if (expandedStop) {
          // Initial Fetch
          fetchStopData(expandedStop);

          // Interval Fetch (every 5 seconds)
          intervalId = setInterval(() => {
              fetchStopData(expandedStop);
          }, 5000);
      }

      return () => {
          if (intervalId) clearInterval(intervalId);
      };
  }, [expandedStop, fetchStopData]);

  const handleExpandStop = (stop) => {
      if (expandedStop === stop.code) {
          setExpandedStop(null);
      } else {
          setExpandedStop(stop.code);
          // State is now managed by useArrivalData hook
      }
  };

  const handleManualRefresh = () => {
      if (expandedStop) {
          // Loading state managed by hook
          fetchStopData(expandedStop);
      } else if (userLocation) {
          setLoading(true);
          findNearby(userLocation.lat, userLocation.lon);
      }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-fade-in-up">
        {/* ... Header ... */}
        <NearbyStopsHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onRefresh={handleManualRefresh}
          onClose={onClose}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative">
            {loading && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    <div className="text-sm">Finding nearby stops...</div>
                </div>
            )}

            {!loading && error && (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center text-red-500">
                    <div className="text-3xl mb-2">⚠️</div>
                    <div>{error}</div>
                    {permissionDenied && <div className="text-xs text-gray-400 mt-2">Please enable location access.</div>}
                </div>
            )}
            
            {!loading && viewMode === 'list' && (
                <NearbyStopsList
                  nearbyStops={nearbyStops}
                  expandedStop={expandedStop}
                  arrivalData={arrivalData}
                  loadingArrivals={loadingArrivals}
                  lastUpdated={lastUpdated}
                  permissionDenied={permissionDenied}
                  onExpandStop={handleExpandStop}
                  onSelectRoute={onSelectRoute}
                  onClose={onClose}
                />
            )}

            {!loading && viewMode === 'map' && userLocation && (
                <NearbyMapView
                  userLocation={userLocation}
                  nearbyStops={nearbyStops}
                  stopBuses={stopBuses}
                  expandedStop={expandedStop}
                  onStopSelect={(stop) => { setViewMode('list'); handleExpandStop(stop); }}
                />
            )}
        </div>
    </div>
  );
};

export default NearbyStops;
