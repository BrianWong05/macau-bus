import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useArrivalData } from '@/features/nearby-stops/hooks/useArrivalData';
import { StopCard } from '@/components/dashboard/StopCard';

interface StopListProps {
  stops: any[];
  userLocation: { lat: number; lon: number } | null;
  locationLoading: boolean;
  locationError: string | null;
  onSelectRoute: (route: string, stopCode?: string, direction?: string | null) => void;
}

export const StopList: React.FC<StopListProps> = ({
  stops,
  userLocation,
  locationLoading,
  locationError,
  onSelectRoute
}) => {
  const { t } = useTranslation();
  const [expandedStop, setExpandedStop] = useState<string | null>(null);
  const { arrivalData, loadingArrivals, fetchStopData } = useArrivalData();

  // Auto-refresh arrival data when stop is expanded
  useEffect(() => {
    if (!expandedStop) return;
    fetchStopData(expandedStop);
    const interval = setInterval(() => fetchStopData(expandedStop), 8000);
    return () => clearInterval(interval);
  }, [expandedStop, fetchStopData]);

  const handleToggleStop = (stopCode: string) => {
    setExpandedStop(prev => prev === stopCode ? null : stopCode);
  };

  if (locationLoading) {
    return <div className="text-center py-10 text-gray-400">📍 {t('loading')}</div>;
  }

  if (locationError && !userLocation) {
    return (
      <div className="text-center py-10 text-gray-500">
        <div className="text-2xl mb-2">🚫</div>
        <p>{t('location_denied')}</p>
      </div>
    );
  }

  if (stops.length === 0) {
    return <div className="text-center py-10 text-gray-500">{t('no_data')}</div>;
  }

  return (
    <div className="space-y-3">
      {stops.map((stop, idx) => (
        <StopCard
          key={`${stop.code || idx}`}
          stop={stop}
          isExpanded={expandedStop === stop.code}
          arrivalData={arrivalData}
          loadingArrivals={loadingArrivals[stop.code]}
          onToggle={() => handleToggleStop(stop.code)}
          onSelectRoute={onSelectRoute}
          userLocation={userLocation}
        />
      ))}
    </div>
  );
};
