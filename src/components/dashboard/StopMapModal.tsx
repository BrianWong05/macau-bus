import React from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';

interface StopWithDistance {
  name: string;
  lat: number;
  lon: number;
  distance: number;
  code: string;
  raw?: {
    ROUTE_NOS?: string;
    P_NAME?: string;
    P_NAME_EN?: string;
    P_NAME_POR?: string;
    P_ALIAS?: string;
  };
}

interface StopMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  stops: StopWithDistance[];
  userLocation: { lat: number; lon: number } | null;
  onSelectStop?: (stopCode: string) => void;
}

export const StopMapModal: React.FC<StopMapModalProps> = ({
  isOpen,
  onClose,
  stops,
  userLocation,
  onSelectStop
}) => {
  const { t, i18n } = useTranslation();

  if (!isOpen) return null;

  const getDisplayName = (stop: StopWithDistance) => {
    const lang = i18n.language;
    if (lang === 'en') return stop.raw?.P_NAME_EN || stop.name;
    if (lang === 'pt') return stop.raw?.P_NAME_POR || stop.name;
    return stop.raw?.P_NAME || stop.name;
  };

  // Calculate center point
  const center: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lon]
    : stops.length > 0 
      ? [stops[0].lat, stops[0].lon]
      : [22.1987, 113.5439]; // Default Macau center

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-[95vw] h-[85vh] max-w-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-teal-500 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📍</span>
            <span className="font-bold">{t('nearby_stops', 'Nearby Stops')}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-2xl leading-none hover:bg-teal-600 rounded p-1 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={center}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {/* User Location Marker */}
            {userLocation && (
              <CircleMarker
                center={[userLocation.lat, userLocation.lon]}
                radius={10}
                fillColor="#3b82f6"
                color="#1d4ed8"
                weight={3}
                fillOpacity={0.8}
              >
                <Popup>{t('your_location', 'Your Location')}</Popup>
              </CircleMarker>
            )}

            {/* Stop Markers */}
            {stops.map((stop, idx) => (
              <Marker
                key={stop.code || idx}
                position={[stop.lat, stop.lon]}
                icon={L.divIcon({
                  className: '',
                  html: `<div style="
                    background-color: #14b8a6;
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 10px;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  ">${idx + 1}</div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })}
              >
                <Popup>
                  <div className="text-sm min-w-[140px]">
                    <div className="font-bold text-teal-600 text-base">{getDisplayName(stop)}</div>
                    <div className="text-gray-500 text-xs">{stop.code}</div>
                    {stop.distance && stop.distance < 999 && (
                      <div className="text-gray-500 text-xs mt-1">
                        {stop.distance < 1 
                          ? `${Math.round(stop.distance * 1000)}m` 
                          : `${stop.distance.toFixed(1)}km`
                        }
                      </div>
                    )}
                    {stop.raw?.ROUTE_NOS && (
                      <div className="text-xs text-gray-600 mt-1 max-w-[150px] flex flex-wrap gap-1">
                        {stop.raw.ROUTE_NOS.split(',').slice(0, 6).map(r => (
                          <span key={r} className="bg-gray-100 px-1 rounded">{r.trim()}</span>
                        ))}
                        {stop.raw.ROUTE_NOS.split(',').length > 6 && (
                          <span className="text-gray-400">...</span>
                        )}
                      </div>
                    )}
                    {onSelectStop && (
                      <button
                        onClick={() => {
                          onSelectStop(stop.code);
                          onClose();
                        }}
                        className="mt-2 w-full py-1.5 bg-teal-500 text-white text-xs font-medium rounded hover:bg-teal-600 transition-colors"
                      >
                        {t('view_details', 'View Details')}
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-600 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-700"></div>
            <span>{t('your_location', 'Your Location')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-teal-500 border border-white"></div>
            <span>{t('bus_stop', 'Bus Stop')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StopMapModal;
