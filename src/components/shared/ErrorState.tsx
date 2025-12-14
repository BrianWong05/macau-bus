/**
 * ErrorState - Reusable error display component
 */

import React from 'react';

interface ErrorStateProps {
  error: string;
  showPermissionHint?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  error,
  showPermissionHint = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center text-red-500">
      <div className="text-3xl mb-2">⚠️</div>
      <div>{error}</div>
      {showPermissionHint && (
        <div className="text-xs text-gray-400 mt-2">Please enable location access.</div>
      )}
    </div>
  );
};
