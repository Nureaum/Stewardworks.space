import React from 'react';

export default function AdminLoading() {
  return (
    <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-steward-blue border-t-transparent rounded-full animate-spin shadow-lg"></div>
    </div>
  );
}
