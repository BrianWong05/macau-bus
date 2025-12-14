/**
 * useNearbyDiscovery - Hook for geolocation and finding nearby stops
 */

import { useState, useEffect, useCallback } from 'react';
import govData from '../../../data/gov_data.json';
import { getDistanceFromLatLonInKm } from '../../../utils/distance';

const stopsData = govData.stops;

interface UserLocation {
  lat: number;
  lon: number;
}

interface NearbyStop {
  code: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  routes: string[];
  raw?: any;
}

interface UseNearbyDiscoveryReturn {
  nearbyStops: NearbyStop[];
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  userLocation: UserLocation | null;
  refresh: () => void;
}

export const useNearbyDiscovery = (): UseNearbyDiscoveryReturn => {
  const [nearbyStops, setNearbyStops] = useState<NearbyStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  const findNearby = useCallback((lat: number, lon: number) => {
    try {
      const processed = stopsData.map((stop: any) => {
        const dist = getDistanceFromLatLonInKm(lat, lon, stop.lat, stop.lon);
        let routes: string[] = [];
        if (stop.raw && stop.raw.ROUTE_NOS) {
          routes = [...new Set(stop.raw.ROUTE_NOS.split(',').map((r: string) => r.trim()))] as string[];
        }
        let rawCode = stop.code || stop.raw?.P_ALIAS || stop.raw?.ALIAS || 'UNKNOWN';
        const code = rawCode.replace(/[_-]/g, '/');
        return { ...stop, code, distance: dist, routes };
      });

      processed.sort((a: any, b: any) => a.distance - b.distance);
      setNearbyStops(processed.slice(0, 50));
      setLoading(false);
    } catch (e) {
      setError("Failed to process stop data.");
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (userLocation) {
      setLoading(true);
      findNearby(userLocation.lat, userLocation.lon);
    }
  }, [userLocation, findNearby]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (loading) {
        setError("Location request timed out. Please check permissions.");
        setLoading(false);
      }
    }, 15000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        findNearby(latitude, longitude);
      },
      (err) => {
        clearTimeout(timeoutId);
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
  }, [findNearby]);

  return {
    nearbyStops,
    loading,
    error,
    permissionDenied,
    userLocation,
    refresh,
  };
};
