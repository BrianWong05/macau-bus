import React from 'react';
import { useTranslation } from 'react-i18next';

interface RouteGridProps {
  routes: string[];
  onSelectRoute: (route: string) => void;
}

export const RouteGrid: React.FC<RouteGridProps> = ({ routes, onSelectRoute }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 content-start">
      {routes.map(route => (
        <button
          key={route}
          onClick={() => onSelectRoute(route)}
          className="aspect-square flex items-center justify-center bg-white hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg shadow-sm hover:shadow-md transition-all group"
        >
          <span className="text-lg font-bold text-gray-700 group-hover:text-teal-600">
            {route}
          </span>
        </button>
      ))}
      
      {routes.length === 0 && (
        <div className="col-span-full text-center py-10 text-gray-500">
          {t('no_data')}
        </div>
      )}
    </div>
  );
};
