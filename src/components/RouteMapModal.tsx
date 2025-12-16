import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchTrafficApi } from '@/services/api';
import type { RouteLeg } from '@/services/RouteFinder';
import { CloseIcon } from '@/components/Icons';
import { getStopInfo } from '@/utils/stopUtils';
import type { TrafficSegment } from '@/types/mapTypes';
import { FitBoundsOnLoad } from '@/components/map/FitBoundsOnLoad';
import { RoutePathLayer } from '@/components/map/RoutePathLayer';
import { RouteMarkerLayer } from '@/components/map/RouteMarkerLayer';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const createPinIcon = (color: string) => L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" class="w-10 h-10 drop-shadow-lg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const GreenPin = createPinIcon('#22c55e'); // Green-500
const RedPin = createPinIcon('#ef4444');   // Red-500

// ============== Types ==============
interface RouteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  legs: RouteLeg[];
  startWalk?: { distanceMeters: number; durationMinutes: number };
  endWalk?: { distanceMeters: number; durationMinutes: number };
  startCoords?: { lat: number; lng: number };
  endCoords?: { lat: number; lng: number };
}

// ============== Component: RouteBottomSheet ==============
const RouteBottomSheet: React.FC<{ 
  legs: RouteLeg[];
  trafficData: Record<string, TrafficSegment[]>;
  segmentIndices: Record<string, { start: number; end: number }>;
}> = ({ legs, trafficData, segmentIndices }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`absolute bottom-0 left-0 right-0 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] rounded-t-[2rem] z-[1000] transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col ${isExpanded ? 'h-[85%]' : 'h-[180px]'}`}
    >
      {/* Drag Handle / Header */}
      <div 
        className="w-full pt-3 pb-6 flex flex-col items-center cursor-pointer shrink-0 bg-white rounded-t-[2rem]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mb-5" />
        
        {/* Route Summary (Always visible) */}
        <div className="flex items-center gap-5 w-full px-6">
           {/* Route Badge */}
           <div className="bg-teal-600 text-white font-bold text-2xl px-3 py-2 rounded-xl min-w-[4rem] text-center shadow-sm shrink-0">
             {legs[0].routeName}
           </div>
           
           {/* Info */}
           <div className="flex flex-col flex-1 min-w-0">
             <div className="flex items-center gap-3 text-lg font-bold text-gray-800 mb-1">
                <span className="truncate">{getStopInfo(legs[0].fromStop)?.name}</span>
                <span className="text-gray-300">➜</span>
                <span className="truncate">{getStopInfo(legs[legs.length-1].toStop)?.name}</span>
             </div>
             <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{legs.reduce((sum, l) => sum + l.stopCount, 0)} stops</span>
                <span className="text-gray-300">•</span>
                <span className="text-teal-600 font-bold">{Math.round(legs.reduce((sum, l) => sum + l.duration, 0))} min</span>
             </div>
           </div>
        </div>
      </div>

      {/* Expanded Content: Route Timeline */}
      <div className="flex-1 overflow-y-auto px-6 bg-white">
        <div className="space-y-4 pb-10 mt-2">
           {legs.map((leg, i) => {
             // Get Traffic Data for this leg
             const allTraffic = trafficData[leg.routeId] || [];
             
             return (
               <div key={i} className="relative">
                  {/* Leg Header */}
                  <div className="flex items-center gap-3 mb-6 sticky top-0 bg-white/95 backdrop-blur-sm z-20 py-3 border-b border-gray-50">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                      BUS {leg.routeName}
                    </span>
                  </div>

                  {/* Stops Timeline */}
                  <div className="ml-5 pl-8 pt-1 pb-4 relative">
                     {leg.stops.map((stopId, idx) => {
                        const stop = getStopInfo(stopId);
                        const isFirst = idx === 0;
                        const isLast = idx === leg.stops.length - 1;
                        
                        // Robust Matching: Find traffic segment by Station Code
                        // Traffic array usually has stationCode like "T308".
                        // stopId is "T308/1".
                        const stopCode = stopId.split('/')[0];
                        
                        const matchedSeg = allTraffic.find((seg: any) => {
                             const sCode = seg.stationCode;
                             return sCode && (sCode === stopCode || sCode === stopId);
                        });
                        
                        let trafficLevel = matchedSeg ? matchedSeg.traffic : 0;
                        
                        // Default to 1 (Smooth) if we found a segment but traffic is 0/null, 
                        // purely to make it look "active" like the live view, assuming user implies "color" = "green".
                        // Actually, better to trust the data.
                        // But if BusList shows green, data is 1.

                        // Map Traffic Level to Color
                        let lineColor = 'bg-gray-200';
                        // Note: BusList logic: 1=Emerald, 2=Yellow, 3=Red.
                        if (trafficLevel >= 3) lineColor = 'bg-red-500';
                        else if (trafficLevel === 2) lineColor = 'bg-yellow-400';
                        else if (trafficLevel === 1) lineColor = 'bg-emerald-400';
                        
                        // If we have a matched segment but level is 0 or undefined, maybe treat as Smooth?
                        // Often APIs return 0 for "Normal".
                        if (matchedSeg && (trafficLevel === 0 || trafficLevel === undefined)) {
                             lineColor = 'bg-emerald-400';
                        }


                        // Line Logic: Render line if NOT last stop
                        // Height: 100% of content + margin-bottom (32px = 2rem)
                        // Position: Centered on dots.
                        // Dots are at left: -40px (w-3 = 12px or w-3.5 = 14px). Center ~ -34px with border.
                        // Let's refine dot positioning.
                        // Dot center: -34px.
                        // Line w-1.5 (6px). Left: -37px.

                        return (
                          <div key={stopId} className="relative group mb-8 last:mb-0">
                            {/* Traffic Line Segment */}
                            {!isLast && (
                                <div className={`absolute left-[-37px] top-3 h-[calc(100%+2rem)] w-1.5 rounded-full z-0 transition-colors duration-300 ${lineColor}`} />
                            )}

                            {/* Timeline Dot */}
                            {/* isLast: w-3 h-3 (12px). Center offset: -40.5px left -> center at -34.5px */}
                            {/* isFirst: w-3 h-3. */}
                            {/* Normal: w-2.5 h-2.5 (10px). Left -38.5px -> center at -33.5px. */}
                            {/* To perfectly align centers, let's fix the left and widths */}
                            
                            <div className={`absolute box-content rounded-full z-10 transition-all duration-300 transform -translate-x-1/2 left-[-34px]
                              ${isLast 
                                ? 'bg-red-500 w-3 h-3 border-4 border-white shadow-sm' 
                                : isFirst 
                                  ? 'bg-white border-[3px] border-teal-500 w-3 h-3'
                                  : 'bg-white border-[3px] border-gray-200 w-2.5 h-2.5 group-hover:border-teal-400 group-hover:scale-110'}`} 
                            />
                            
                            <div className="flex flex-col">
                              <div className={`text-[15px] leading-tight transition-colors ${isLast ? 'font-black text-gray-900' : 'font-bold text-gray-700 group-hover:text-teal-700'}`}>
                                {stop?.name || stopId}
                              </div>
                              <div className="text-[11px] text-gray-400 font-mono mt-0.5 group-hover:text-teal-500/70">
                                {stopId} 
                                {/* Show traffic badge if needed, or rely on line color */}
                                {trafficLevel >= 3 && <span className="ml-2 text-[10px] font-bold text-red-500 bg-red-50 px-1 rounded">Congested</span>}
                              </div>
                            </div>
                          </div>
                        );
                     })}
                  </div>
                  
                  {/* Transfer Indicator */}
                  {i < legs.length - 1 && (
                    <div className="my-8 ml-5 pl-8 relative">
                       {/* Dashed line connecting legs */}
                       <div className="absolute left-[-34px] top-[-30px] bottom-[-30px] w-0 border-l-2 border-dashed border-gray-300 z-0" />
                       
                       <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 inline-flex items-center gap-3 shadow-sm relative z-10">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                          <span className="text-orange-700 text-xs font-bold uppercase tracking-wide">
                            Transfer to {legs[i+1].routeName}
                          </span>
                       </div>
                    </div>
                  )}
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

// ============== Main Component ==============
export const RouteMapModal: React.FC<RouteMapModalProps> = ({
  isOpen,
  onClose,
  legs,
  startWalk,
  startCoords,
  endCoords
}) => {
  const { t } = useTranslation();
  const [trafficData, setTrafficData] = useState<Record<string, TrafficSegment[]>>({});
  const [segmentIndices, setSegmentIndices] = useState<Record<string, { start: number; end: number }>>({});
  const [loading, setLoading] = useState(false);

  // Fetch traffic data for all route legs and find correct segment indices

  // Fetch traffic data for all route legs and find correct segment indices
  useEffect(() => {
    if (!isOpen || legs.length === 0) return;

    const fetchAllTraffic = async () => {
      setLoading(true);
      const newTrafficData: Record<string, any[]> = {};
      const newSegmentIndices: Record<string, { start: number; end: number }> = {};
      
      for (const leg of legs) {
        const routeNo = leg.routeName;
        const direction = leg.direction;
        const key = leg.routeId;

        try {
            // Fetch traffic data
            const traffic = await fetchTrafficApi(routeNo, direction);
            newTrafficData[key] = traffic || [];
            
            const totalSegments = (traffic || []).length;
            
            // SIMPLIFIED APPROACH: Use only the number of stops in the leg
            // The leg has leg.stops = array of stop IDs.
            // We need to show exactly leg.stops.length - 1 segments.
            // Improve: Match by stationCode instead of geometry
            
            let startIdx = -1;
            const firstStopId = leg.stops[0];
            // Normalize stop ID (remove suffix like /1, /2) for matching
            const firstStopCode = firstStopId.split('/')[0]; 
            
            if (traffic && traffic.length > 0) {
              // Try to find exact or prefix match
              traffic.forEach((seg: any, idx: number) => {
                 if (startIdx !== -1) return;
                 
                 const segCode = seg.stationCode;
                 if (segCode) {
                    // Check for match
                    if (firstStopId === segCode || firstStopCode === segCode) {
                        startIdx = idx;
                    }
                 }
              });

              // Fallback to geometry if code match fails
              if (startIdx === -1) {
                  const firstStopInfo = getStopInfo(firstStopId);
                  if (firstStopInfo) {
                      const stopLat = firstStopInfo.lat;
                      const stopLng = firstStopInfo.lon;
                      let minDist = Infinity;
                      
                      traffic.forEach((seg: TrafficSegment, idx: number) => {
                        if (seg.path && seg.path.length > 0) {
                          const startPt = seg.path[0];
                          const dist = Math.abs(startPt[0] - stopLat) + Math.abs(startPt[1] - stopLng);
                          if (dist < minDist && dist < 0.005) { // Threshold ~500m
                            minDist = dist;
                            startIdx = idx;
                          }
                        }
                      });
                  }
              }
            }
            
            // If we couldn't find start, default to 0
            if (startIdx === -1) startIdx = 0;
            
            // Calculate the number of segments based on the number of stops
            const numSegments = Math.max(1, leg.stops.length - 1);
            
            let start = startIdx;
            let end = startIdx + numSegments;
            
            // Clamp to bounds
            start = Math.max(0, Math.min(start, totalSegments - 1));
            end = Math.max(start + 1, Math.min(end, totalSegments));
            
            console.log(`[RouteMapModal] Route ${routeNo}: Match by Code? ${startIdx !== -1}. Start=${start}, End=${end}`);
            
            newSegmentIndices[key] = { start, end };
          } catch (e) {
            console.error(`Failed to fetch traffic for ${routeNo}:`, e);
            newTrafficData[key] = [];
            newSegmentIndices[key] = { start: 0, end: 0 };
          }
      }

      setTrafficData(newTrafficData);
      setSegmentIndices(newSegmentIndices);
      setLoading(false);
    };

    fetchAllTraffic();
  }, [isOpen, legs]);

  if (!isOpen) return null;

  // Collect all points for bounds calculation
  const allPoints: [number, number][] = [];
  
  // Add walking start point
  if (startCoords) {
    allPoints.push([startCoords.lat, startCoords.lng]);
  }
  
  // Add route points from traffic data
  Object.values(trafficData).forEach(segments => {
    segments.forEach(seg => {
      if (seg.path) {
        seg.path.forEach(point => allPoints.push(point));
      }
    });
  });
  
  // Add walking end point
  if (endCoords) {
    allPoints.push([endCoords.lat, endCoords.lng]);
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {legs.map(l => l.routeName).join(' → ')}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
          aria-label={t('close', 'Close')}
        >
          <CloseIcon />
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center">
            <div className="text-teal-600 font-medium">{t('loading', 'Loading...')}</div>
          </div>
        )}
        
        <MapContainer
          center={[22.1987, 113.5439]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* Walking path to first stop (Start Pin) */}
          {(startCoords || (legs.length > 0)) && (() => {
             // Determine Start Position: startCoords OR First Stop
             let pos: [number, number] | null = null;
             let label = t('route_planner.start_point', 'Start Point');

             if (startCoords) {
                 pos = [startCoords.lat, startCoords.lng];
                 label = t('route_planner.my_location', 'My Location');
             } else if (legs.length > 0) {
                 const firstStop = getStopInfo(legs[0].stops[0]);
                 if (firstStop) pos = [firstStop.lat, firstStop.lon];
             }

             if (!pos) return null;

             return (
               <Marker position={pos} icon={GreenPin} zIndexOffset={1000}>
                 <Popup>{label}</Popup>
               </Marker>
             );
          })()}

          {/* Traffic-colored route polylines - filtered to user's journey */}
          <RoutePathLayer 
            legs={legs}
            trafficData={trafficData}
            segmentIndices={segmentIndices}
          />

          {/* Station markers, destination dots, and transfer indicators */}
          <RouteMarkerLayer 
            legs={legs}
            trafficData={trafficData}
            segmentIndices={segmentIndices}
            endCoords={endCoords}
          />

          {allPoints.length > 0 && <FitBoundsOnLoad points={allPoints} />}
        </MapContainer>
      </div>

      {/* Footer info */}
      <RouteBottomSheet 
        legs={legs} 
        trafficData={trafficData}
        segmentIndices={segmentIndices}
      />
    </div>
  );
};
