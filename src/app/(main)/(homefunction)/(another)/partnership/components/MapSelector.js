//src/app/%28main%29/%28homefunction%29/partnership/components/MapSelector.js
import React from "react";

export default function MapSelector({ mapRef, markerPosition }) {
  return (
    <div className="relative w-full group">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent rounded-2xl pointer-events-none" />
      <div
        ref={mapRef}
        style={{ width: "100%", height: "400px" }}
        className="rounded-2xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 group-hover:shadow-2xl"
      />
      <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 text-sm text-gray-700 border border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium">지도를 클릭하여 위치를 선택하세요</span>
        </div>
      </div>
    </div>
  );
}