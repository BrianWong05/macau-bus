/**
 * Geocoding Service - Place search via OpenStreetMap Nominatim
 * https://nominatim.org/release-docs/develop/api/Search/
 */

export interface PlaceResult {
  name: string;
  lat: number;
  lng: number;
  type?: string;
}

// Macau bounding box (viewbox format: left,top,right,bottom)
const MACAU_VIEWBOX = '113.5,22.25,113.6,22.1';

// Rate limiting: Nominatim requires max 1 request/second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // ms

/**
 * Search for places in Macau using OpenStreetMap Nominatim API
 * @param query - Search query (e.g., "Macau Tower", "澳門塔", "Grand Lisboa")
 * @returns Array of place results with coordinates
 */
export async function searchPlace(query: string): Promise<PlaceResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();

  try {
    const encodedQuery = encodeURIComponent(query.trim() + ', Macau');
    // Use bounded=0 to allow results slightly outside viewbox, but still prioritize Macau
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&viewbox=${MACAU_VIEWBOX}&bounded=0&limit=5&accept-language=zh,en,pt`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'zh,en,pt',
      },
    });

    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      return [];
    }

    const data = await response.json();

    // Transform Nominatim response to our format
    // Filter to only include results actually in Macau area (lat ~22.1-22.25, lng ~113.5-113.6)
    return data
      .filter((item: any) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        return lat >= 22.0 && lat <= 22.3 && lng >= 113.4 && lng <= 113.7;
      })
      .map((item: any) => ({
        name: item.display_name?.split(',')[0] || item.name || query,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
      }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to get a place name
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Place name or null
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.display_name?.split(',')[0] || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
