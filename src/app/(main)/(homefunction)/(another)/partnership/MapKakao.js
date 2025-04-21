"use client";
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseF";
import Link from "next/link";
import Image from "next/image";

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
      Math.sin(dLat / 2) ** 2 +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km 리턴
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
      `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_KEY}&libraries=services&autoload=false`;
    script.onload = () => {
      console.log("[카카오맵] 스크립트 로드됨:", address);
      window.kakao.maps.load(() => {
        requestAnimationFrame(() => {
          const container = mapRef.current;
          if (!container) {
            console.warn("[카카오맵] container(mapRef.current)가 null입니다. 지도 렌더링 스킵");
            return;
          }
          const options = {
            center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 초기 좌표 (서울시청)
            level: 3,
          };
          const map = new window.kakao.maps.Map(container, options);

          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.addressSearch(address, (result, status) => {
            console.log("[카카오맵] 지오코딩 시도:", address);
            console.log("[카카오맵] 지오코딩 결과:", result, status);
            if (status === window.kakao.maps.services.Status.OK) {
              const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
              map.setCenter(coords);
              
              new window.kakao.maps.Marker({
                map,
                position: coords,
                image: new window.kakao.maps.MarkerImage(
                  '//t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
                  new window.kakao.maps.Size(32, 32),
                  { offset: new window.kakao.maps.Point(16, 32) }
                )
              });

              setMapCenter({
                lat: parseFloat(result[0].y),
                lng: parseFloat(result[0].x),
              });
              console.log("[카카오맵] setMapCenter로 설정:", {
                lat: parseFloat(result[0].y),
                lng: parseFloat(result[0].x),
              });
            } else {
              console.warn("주소를 찾을 수 없습니다:", address);
            }
          });
        });
      });
    };
    document.head.appendChild(script);
  }, [address]);

  // (D) 주변 샵 불러오기 (30km 이내, 현재 샵 제외)
  useEffect(() => {
    if (!mapCenter) {
      console.log("[지도 useEffect] mapCenter 변경됨: null");
      return;
    }
    console.log("[지도 useEffect] mapCenter 변경됨:", mapCenter, typeof mapCenter.lat, mapCenter.lat);

    async function fetchShops() {
    console.log("[🔥 fetchShops] 함수 진입!");
    try {
        // 1) DB에서 final_admitted=true인 레코드 불러오기
        const { data, error } = await supabase
          .from("partnershipsubmit")
          .select("id, lat, lng, company_name, address, near_building, thumbnail_url")
          .eq("final_admitted", true);

        console.log("Supabase 쿼리 결과:", { data, error });

        if (error) {
          console.error("주변 샵 불러오기 오류:", error);
          return;
        }

        // 2) 데이터가 없거나 빈 배열일 때 로그 추가
        if (!data || data.length === 0) {
          console.log("[fetchShops] final_admitted=true 인 레코드가 없습니다.");
          return;
        }

        // 3) 콘솔 출력
        console.log("[fetchShops] Supabase에서 받은 데이터:", data);

        // 4) 각 레코드에 거리 계산
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
          console.log("[fetchShops] 거리 계산된 샵:", { ...shop, distance });
          return { ...shop, distance };
        });

        // 5) 30km 이내 + 현재 샵 제외 + 거리순
        const filtered = shopsWithDistance
          .filter((s) => s.distance <= 30)
          .filter((s) => s.id !== id)
          .sort((a, b) => a.distance - b.distance);

        console.log("[fetchShops] 최종 필터링 (30km 이내 & 현재 샵 제외):", filtered);
        setNearbyShops(filtered);
      } catch (e) {
        console.error("[❌ fetchShops] 내부 오류:", e);
      }
    }

    fetchShops();
  }, [mapCenter]);

  return (
    <div className="flex flex-col p-3">
      {/* 지도 영역 */}
      <div ref={mapRef} className="relative w-full h-[390px] bg-gray-200" />

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
                  {/* 썸네일을 Next.js Image로 변경 */}
                  <div className="w-40 h-24 flex-shrink-0 bg-gray-100 relative overflow-hidden rounded">
                    {shop.thumbnail_url ? (
                      <Image
                        src={
                          process.env.
NEXT_PUBLIC_SUPABASE_STORAGE_URL +'/'+
                          shop.thumbnail_url
                        }
                        alt={shop.company_name}
                        fill
                        className="object-cover"
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
                    <div className="text-sm text-orange-500 mt-1">
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