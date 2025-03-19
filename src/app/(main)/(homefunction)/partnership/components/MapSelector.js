//src/app/%28main%29/%28homefunction%29/partnership/components/MapSelector.js
import React from "react";

export default function MapSelector({ mapRef, markerPosition }) {
  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "300px" }}
      className="border border-gray-300 rounded"
    />
  );
}