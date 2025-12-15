/**
 * Types for the nearby-stops feature
 */

export interface NearbyStop {
  code: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  routes: string[];
  raw?: {
    POLE_ID?: string;
    P_ALIAS?: string;
    ALIAS?: string;
    ROUTE_NOS?: string;
  };
}

export interface BusInfo {
  plate: string;
  stopsAway: number;
  eta: number;
  distanceM: number;
  currentStop: string;
  trafficSegments?: number[]; // Array of traffic levels for each segment
  busStopIdx?: number;        // Bus position index
  targetStopIdx?: number;     // Selected stop index
}

export interface MapBus {
  busPlate: string;
  latitude: number;
  longitude: number;
  route?: string;
  dir?: string;
}

export interface RouteEtaInfo {
  buses: BusInfo[];
  destination: string;
  status: 'active' | 'arriving' | 'no-service' | 'no-approaching';
  minStops: number;
  minEta: number;
  totalStops: number;
  currentStopIdx: number;
  direction?: string;
}

export type ArrivalData = Record<string, Record<string, RouteEtaInfo | string>>;

export type ViewMode = 'list' | 'map';
