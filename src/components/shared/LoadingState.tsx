/**
 * LoadingState - Reusable loading spinner component
 */

import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      <div className="text-sm">{message}</div>
    </div>
  );
};
