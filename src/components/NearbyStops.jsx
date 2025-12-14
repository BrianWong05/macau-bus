import React, { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

// Feature imports
import { NearbyStopsHeader } from '../features/nearby-stops/components/NearbyStopsHeader';
import { NearbyMapView } from '../features/nearby-stops/components/NearbyMapView.jsx';
import { NearbyStopsList } from '../features/nearby-stops/components/NearbyStopsList.jsx';
import { useArrivalData } from '../features/nearby-stops/hooks/useArrivalData';
import { useNearbyDiscovery } from '../features/nearby-stops/hooks/useNearbyDiscovery';

const NearbyStops = ({ onClose, onSelectRoute }) => {
  const [expandedStop, setExpandedStop] = useState(null);
  const [viewMode, setViewMode] = useState('list'); 
  
  // Use extracted hooks
  const { nearbyStops, loading, error, permissionDenied, userLocation, refresh } = useNearbyDiscovery();
  const { arrivalData, loadingArrivals, stopBuses, lastUpdated, fetchStopData } = useArrivalData();

  // Auto-Refresh Effect
  useEffect(() => {
      let intervalId;
      if (expandedStop) {
          fetchStopData(expandedStop);
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
      }
  };

  const handleManualRefresh = () => {
      if (expandedStop) {
          fetchStopData(expandedStop);
      } else {
          refresh();
      }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-fade-in-up">
        <NearbyStopsHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onRefresh={handleManualRefresh}
          onClose={onClose}
        />

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
