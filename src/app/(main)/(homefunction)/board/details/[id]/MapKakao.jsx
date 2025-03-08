"use client";
import React, { useEffect, useRef } from "react";

/**
 * MapKakao Component:
 * - Renders a Kakao Map for the given address
 * - Ensure you replace "YOUR_KAKAO_MAP_KEY" with your actual Kakao REST key
 */
export default function MapKakao({ address }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!address || !mapRef.current) return;

    // Dynamically load Kakao Maps script
    const script = document.createElement("script");
    script.src =
      "//dapi.kakao.com/v2/maps/sdk.js?appkey=3be0573fb7f2f9b128b58dc1b0342b97&libraries=services&autoload=false";
    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = mapRef.current;
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 초기 좌표 (서울시청)
          level: 3,
        };
        const map = new window.kakao.maps.Map(container, options);

        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
            map.setCenter(coords);
            new window.kakao.maps.Marker({ map, position: coords });
          } else {
            console.warn("주소를 찾을 수 없습니다:", address);
          }
        });
      });
    };
    document.head.appendChild(script);
  }, [address]);

  return <div ref={mapRef} className="w-full h-full" />;
}