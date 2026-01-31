// DentalLoader.tsx
import React from 'react';

const DentalLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      {/* Simple Spinner */}
      <div className="relative mb-6">
        <div className="h-16 w-16 border-4 border-gray-200 rounded-full"></div>
        <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      
      <h3 className="text-lg font-semibold mb-2">Loading Dental Chart</h3>
      <p className="text-gray-600">Please wait...</p>
    </div>
  );
};

export default DentalLoader;