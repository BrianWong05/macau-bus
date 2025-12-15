/**
 * Utility to get localized stop name based on current language
 */
import i18n from '@/i18n';
import govData from '@/data/gov_data.json';

interface StopData {
  name: string;
  lat: number;
  lon: number;
  raw?: {
    NAME?: string;
    NAME_EN?: string;
    NAME_POR?: string;
    P_NAME?: string;
    P_NAME_EN?: string;
    P_NAME_POR?: string;
    P_ALIAS?: string;
    ALIAS?: string;
  };
}

const stopsData = govData.stops as StopData[];

/**
 * Get stop name in the current language
 */
export const getLocalizedStopName = (staCode: string, defaultName?: string): string => {
  const lang = i18n.language;
  
  // Normalize code for matching
  const code = (staCode || '').replace(/[-_]/g, '/').toUpperCase();
  const base = code.split('/')[0];
  
  // Find matching stop in gov data
  const match = stopsData.find((local: StopData) => {
    const pAlias = (local.raw?.P_ALIAS || '').replace(/[-_]/g, '/').toUpperCase();
    const alias = (local.raw?.ALIAS || '').toUpperCase();

    if (pAlias === code) return true;
    if (alias === code) return true;
    if (alias === base) return true;
    if (pAlias.split('/')[0] === base) return true;

    return false;
  });

  if (!match) {
    return defaultName || staCode;
  }

  // Return name based on language
  if (lang === 'en') {
    return match.raw?.P_NAME_EN || match.raw?.NAME_EN || match.name;
  } else if (lang === 'pt') {
    return match.raw?.P_NAME_POR || match.raw?.NAME_POR || match.name;
  }
  
  // Default to Chinese
  return match.raw?.P_NAME || match.raw?.NAME || match.name;
};

/**
 * Get localized stop name from raw stop data object
 */
export const getStopNameFromRaw = (raw: any): string => {
  const lang = i18n.language;
  
  if (lang === 'en') {
    return raw?.P_NAME_EN || raw?.NAME_EN || raw?.staName || raw?.P_NAME || raw?.NAME || '';
  } else if (lang === 'pt') {
    return raw?.P_NAME_POR || raw?.NAME_POR || raw?.staName || raw?.P_NAME || raw?.NAME || '';
  }
  
  // Default to Chinese
  return raw?.staName || raw?.P_NAME || raw?.NAME || '';
};
