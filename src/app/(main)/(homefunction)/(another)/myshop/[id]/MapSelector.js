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