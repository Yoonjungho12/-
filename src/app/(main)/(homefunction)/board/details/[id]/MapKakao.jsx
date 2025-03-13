"use client";
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseF";
import Link from "next/link";

/**
 * MapKakao Component:
 * - Renders a Kakao Map for the given address
 * - Fetches the current shop info (by props.id) to get the company_name
 * - Fetches nearby shops (within 30km, excluding current shop)
 * - Displays near_building under the address, and clicking each card goes to detail
 */
export default function MapKakao({ address, id }) {
  const mapRef = useRef(null);

  // (1) 지도 좌표 저장
  const [mapCenter, setMapCenter] = useState(null);

  // (2) 현재 샵 정보 (회사이름 표시용)
  const [shopName, setShopName] = useState("");

  // (3) 주변 샵 목록
  const [nearbyShops, setNearbyShops] = useState([]);

  // (A) 거리 계산용 (Haversine Formula)
  function getDistanceFromLatLng(lat1, lng1, lat2, lng2) {
    function deg2rad(deg) {
      return deg * (Math.PI / 180);
    }
    const R = 6371; // 지구 반경(km)
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d; // km 리턴
  }

  // (B) 현재 샵 정보 가져오기 (company_name)
  useEffect(() => {
    if (!id) return;

    async function fetchCurrentShop() {
      const { data, error } = await supabase
        .from("partnershipsubmit")
        .select("company_name")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.error("현재 샵 정보 불러오기 오류:", error);
        return;
      }
      if (data) {
        setShopName(data.company_name || "");
      }
    }

    fetchCurrentShop();
  }, [id]);

  // (C) 카카오 지도 스크립트 로드 및 지오코딩
  useEffect(() => {
    if (!address || !mapRef.current) return;

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
            setMapCenter({ lat: result[0].y, lng: result[0].x });
          } else {
            console.warn("주소를 찾을 수 없습니다:", address);
          }
        });
      });
    };
    document.head.appendChild(script);
  }, [address]);

  // (D) 주변 샵 불러오기 (30km 이내, 현재 샵 제외)
  useEffect(() => {
    if (!mapCenter) return;

    async function fetchShops() {
      const { data, error } = await supabase
        .from("partnershipsubmit")
        .select("id, lat, lng, company_name, address, near_building, thumbnail_url")
         .eq("final_admitted", true);;

      if (error) {
        console.error("주변 샵 불러오기 오류:", error);
        return;
      }

      if (data && data.length > 0) {
        const shopsWithDistance = data.map((shop) => {
          let distance = Infinity;
          if (shop.lat && shop.lng) {
            distance = getDistanceFromLatLng(
              mapCenter.lat,
              mapCenter.lng,
              shop.lat,
              shop.lng
            );
          }
          return { ...shop, distance };
        });

        // 30km 이내 + 현재 샵(id) 제외 + 거리 오름차순
        const filtered = shopsWithDistance
          .filter((s) => s.distance <= 30)
          .filter((s) => s.id !== id)
          .sort((a, b) => a.distance - b.distance);

        setNearbyShops(filtered);
      }
    }

    fetchShops();
  }, [mapCenter]);

  return (
    <div className="flex flex-col">
      {/* 지도 영역 */}
      <div ref={mapRef} className="relative w-full h-80 bg-gray-200" />

      {/* 주변 샵 목록 */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">
          {shopName || "현재샵"}의 주변샵
        </h2>

        {nearbyShops && nearbyShops.length > 0 ? (
          <div>
            {nearbyShops.map((shop) => (
              <Link
                href={`/board/details/${shop.id}`}
                key={shop.id}
                className="block"
              >
                <div className="flex items-center gap-4 py-4 border-t border-gray-200 hover:bg-gray-50">
                  {/* 썸네일 */}
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 relative overflow-hidden rounded">
                    {shop.thumbnail_url ? (
                      <img
                        src={
                          "https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/" +
                          shop.thumbnail_url
                        }
                        alt={shop.company_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div>
                    <div className="font-semibold text-lg">{shop.company_name}</div>
                    <div className="text-gray-500 text-sm">
                      {shop.address || "주소 미입력"}
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      {shop.near_building || ""}
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      거리: {shop.distance.toFixed(2)} km
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">주변 30km 이내 샵이 없습니다.</div>
        )}
      </div>
    </div>
  );
}