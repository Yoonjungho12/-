"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseF";
import Image from "next/image";
import Link from "next/link";

/** (A) 문자열을 URL-friendly 슬러그로 변환하는 함수 */
function createSlug(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return "no-slug";
  }
  return text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9-]/g, "")
    .toLowerCase() || "no-slug";
}

/**
 * (1) 카카오 지도 SDK를 로드하는 함수
 */
function loadKakaoMapScript(callback) {
  if (typeof window === "undefined") return;
  const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  if (!KAKAO_APP_KEY) {
    console.error("카카오 지도 Key가 설정되지 않았습니다. .env 파일을 확인해주세요.");
    return;
  }
  if (window.kakao && window.kakao.maps) {
    window.kakao.maps.load(callback);
    return;
  }
  const script = document.createElement("script");
  script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services&autoload=false`;
  script.onload = () => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(callback);
    }
  };
  document.head.appendChild(script);
}

/**
 * (2) 두 좌표 간 거리를 km 단위로 계산하는 함수
 */
function getDistanceFromLatLng(lat1, lng1, lat2, lng2) {
  const R = 6371; // 지구 반경 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * NearMeListPage 컴포넌트
 * - 사용자의 현재 위치와 partnership 테이블 데이터를 이용하여,
 *   30km 이내의 매장을 필터링해 화면에 보여줍니다.
 * - 검색 시에는 Supabase에 주소 키워드로 재조회하며, 
 *   첫 번째 결과의 좌표로 지도 중심과 마커를 이동시킵니다.
 */
export default function NearMeListPage() {
  const mapRef = useRef(null);          // 지도 컨테이너
  const markerRef = useRef(null);       // "내 위치" 마커
  const searchInputRef = useRef(null);  // 검색창 useRef (필수)

  // 사용자 위치
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);

  // 지도 중심점 (centerLat, centerLng)
  const [centerLat, setCenterLat] = useState(null);
  const [centerLng, setCenterLng] = useState(null);

  // 지도 객체
  const [mapObj, setMapObj] = useState(null);

  // Supabase에서 불러온 매장 목록 (partnershipsubmit 테이블)
  const [shops, setShops] = useState([]);
  // 30km 이내 필터된 매장 목록
  const [filteredShops, setFilteredShops] = useState([]);

  // 내 위치 주소 (reverse geocoding 결과)
  const [address, setAddress] = useState("");

  // 지도 보임/숨김 여부
  const [mapHidden, setMapHidden] = useState(false);

  // 위치/데이터 로딩 완료 여부
  const [locationLoaded, setLocationLoaded] = useState(false);

  // "처음 자동 닫기" 플래그 (초기 로딩 시 한 번만 적용)
  const [didAutoClose, setDidAutoClose] = useState(false);

  // ─────────────────────────────────────────────────────
  // (A) 브라우저 Geolocation을 통해 사용자 위치 받아오기
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 기반 서비스를 지원하지 않습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        // 최초 지도 중심점도 사용자 위치로 설정
        setCenterLat(lat);
        setCenterLng(lng);
      },
      (err) => {
        console.error("Geolocation 에러:", err);
      }
    );
  }, []);

  // ─────────────────────────────────────────────────────
  // (B) Supabase에서 partnership 테이블 데이터 조회 (초기)
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchShops() {
      const { data, error } = await supabase
        .from("partnershipsubmit")
        .select(`
          id,
          final_admitted,
          company_name,
          thumbnail_url,
          address,
          comment,
          greeting,
          lat,
          lng
        `)
        .eq("final_admitted", true);
      if (error) {
        console.error("매장 목록 로딩 오류:", error);
        return;
      }
      setShops(data || []);
    }
    fetchShops();
  }, []);

  // ─────────────────────────────────────────────────────
  // (C) 사용자 위치가 준비되면 Kakao 지도 SDK 로드 후 지도 초기화
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (userLat && userLng) {
      loadKakaoMapScript(() => {
        initMap(userLat, userLng);
      });
    }
  }, [userLat, userLng]);

  /** 지도 초기화 함수 */
  function initMap(lat, lng) {
    if (!window.kakao || !window.kakao.maps) return;
    if (!mapRef.current) return;
    const pos = new window.kakao.maps.LatLng(lat, lng);
    const options = {
      center: pos,
      level: 5,
    };
    const newMap = new window.kakao.maps.Map(mapRef.current, options);
    setMapObj(newMap);
    // 지도 중심점도 갱신
    setCenterLat(lat);
    setCenterLng(lng);

    // "내 위치" 마커 생성
    const marker = new window.kakao.maps.Marker({ position: pos });
    marker.setMap(newMap);
    markerRef.current = marker;

    // 좌표 → 주소 변환 (reverse geocoding)
    convertCoordToAddress(lng, lat, (addr) => setAddress(addr));

    // 지도 클릭 이벤트 등록
    window.kakao.maps.event.addListener(newMap, "click", (evt) => {
      const cLat = evt.latLng.getLat();
      const cLng = evt.latLng.getLng();
      moveMarker(cLat, cLng);
      setCenterLat(cLat);
      setCenterLng(cLng);
      convertCoordToAddress(cLng, cLat, (addr) => setAddress(addr));
      // 일반 위치 변경 시 Supabase 매장 목록 필터링
      filterShopsByDistance(cLat, cLng);
    });

    // 지도 드래그 종료 이벤트 등록
    window.kakao.maps.event.addListener(newMap, "dragend", () => {
      const center = newMap.getCenter();
      const cLat = center.getLat();
      const cLng = center.getLng();
      moveMarker(cLat, cLng);
      setCenterLat(cLat);
      setCenterLng(cLng);
      convertCoordToAddress(cLng, cLat, (addr) => setAddress(addr));
      filterShopsByDistance(cLat, cLng);
    });

    setMapHidden(false);
  }

  /** 마커 이동 함수 */
  function moveMarker(lat, lng) {
    if (!markerRef.current) return;
    const pos = new window.kakao.maps.LatLng(lat, lng);
    markerRef.current.setPosition(pos);
  }

  // ─────────────────────────────────────────────────────
  // (D) 사용자 위치와 매장 목록이 준비되면 30km 필터 적용
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (userLat && userLng && shops.length > 0) {
      filterShopsByDistance(userLat, userLng);
    }
  }, [userLat, userLng, shops]);

  /** 30km 필터 함수 (Supabase 데이터 기준) */
  function filterShopsByDistance(lat, lng) {
    const MAX_DIST = 30;
    const results = shops.filter((shop) => {
      if (!shop.lat || !shop.lng) return false;
      const dist = getDistanceFromLatLng(lat, lng, shop.lat, shop.lng);
      return dist <= MAX_DIST;
    });
    setFilteredShops(results);
    setLocationLoaded(true);

    // 초기 로딩 시 한 번만 자동으로 지도 닫기
    if (!didAutoClose) {
      setDidAutoClose(true);
      setTimeout(() => {
        setMapHidden(true);
      }, 500);
    }
  }

  /** 지도 열기/접기 버튼 핸들러 */
  function handleToggleMap() {
    if (!locationLoaded) {
      alert("아직 위치/데이터 로딩 중입니다!");
      return;
    }
    const newVal = !mapHidden;
    setMapHidden(newVal);
    if (!newVal) {
      // 지도 열기 시 다시 초기화
      setTimeout(() => {
        if (userLat && userLng) {
          initMap(userLat, userLng);
        }
      }, 0);
    }
  }

  /**
   * (F) 주소 검색 함수 (Supabase 조회)
   * 검색 시에는 partnershipsubmit 테이블에서 주소 키워드가 포함된 매장을 조회하고,
   * 결과가 있다면 첫 번째 결과의 좌표로 지도를 이동시키며, 마커도 업데이트합니다.
   * 이 경우 지도 자동 닫기 로직은 적용하지 않습니다.
   */
  async function handleSearchAddress() {
    if (!userLat || !userLng) {
      alert("사용자 위치가 확인되지 않았습니다!");
      return;
    }
    const keyword = searchInputRef.current?.value.trim();
    if (!keyword) {
      alert("검색어를 입력해주세요!");
      return;
    }
    const { data, error } = await supabase
      .from("partnershipsubmit")
      .select(`
          id,
          final_admitted,
          company_name,
          thumbnail_url,
          address,
          comment,
          greeting,
          lat,
          lng
        `)
      .eq("final_admitted", true)
      .ilike("address", `%${keyword}%`);
    if (error) {
      console.error("검색 API 오류:", error);
      return;
    }
    // 결과가 있을 경우, 첫 번째 결과의 좌표로 지도를 이동시키고 마커를 업데이트합니다.
    if (data && data.length > 0) {
      const firstResult = data[0];
      if (firstResult.lat && firstResult.lng && mapObj) {
        const newPos = new window.kakao.maps.LatLng(firstResult.lat, firstResult.lng);
        setCenterLat(firstResult.lat);
        setCenterLng(firstResult.lng);
        mapObj.setCenter(newPos);
        moveMarker(firstResult.lat, firstResult.lng);
      }
    }
    // 검색 결과를 필터된 매장 목록에 저장 (지도 자동 닫기 로직은 적용하지 않음)
    setFilteredShops(data || []);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      handleSearchAddress();
    }
  }

  /** 좌표 → 주소 변환 (reverse geocoding) */
  function convertCoordToAddress(lng, lat, callback) {
    if (!window.kakao || !window.kakao.maps) return;
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const addr = result[0]?.address?.address_name || "";
        callback(addr);
      } else {
        callback("");
      }
    });
  }

  return (
    <div className="mt-5 max-w-4xl mx-auto p-4">
      {locationLoaded ? (
        <div className="mb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.55 11h6.4a1 1 0 00.94-.66l2.27-6.16a1 1 0 011.87 0l2.27 6.16a1 1 0 00.94.66h2.4c1.1 0 2 .9 2 2s-.9 2-2 2h-6.4a1 1 0 00-.94.66l-2.27 6.16a1 1 0 01-1.87 0l-2.27-6.16a1 1 0 00-.94-.66h-2.4c-1.1 0-2-.9-2-2s.9-2 2-2z"
              />
            </svg>
            <span className="font-medium text-base">
              내 위치: {address || "정보 없음"}
            </span>
          </div>
          <hr className="border-black w-[60%] mx-auto mb-2" />
          <p className="text-sm text-gray-500 text-center">
            처음 한 번만 지도 자동 닫기 (30km 필터)
            <br />
            검색 시에는 Supabase 조회를 통해 결과를 가져옵니다.
          </p>
          <div className="flex justify-center mt-2">
            <button
              onClick={handleToggleMap}
              className="px-4 py-2 border text-sm rounded"
            >
              {mapHidden ? "지도 보기" : "지도 접기"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center mb-3">
          위치/데이터 로딩중...
        </div>
      )}

      {!mapHidden && (
        <div className="mb-4">
          <div ref={mapRef} className="w-full h-72 bg-gray-200 rounded mb-3" />
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="예) 서울 강남구 역삼동..."
              onKeyDown={handleKeyDown}
              className="flex-1 border border-gray-300 rounded px-2 py-1"
              ref={searchInputRef}
            />
            <button
              onClick={handleSearchAddress}
              className="px-3 py-2 bg-black text-white rounded text-sm"
            >
              검색
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">내 주변 (30km) 매장 목록</h3>
        <div className="space-y-4">
          {filteredShops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              userLat={centerLat}
              userLng={centerLng}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** 매장 카드 컴포넌트 (Supabase 30km 필터 결과) */
// SearchPage의 디자인을 참고하여 이미지 카드 UI를 동일하게 구성하였습니다.
function ShopCard({ shop, userLat, userLng }) {
  const url = shop.thumbnail_url
    ? `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${shop.thumbnail_url}`
    : "/placeholder.png";
  let dist = 99999;
  if (userLat && userLng && shop.lat && shop.lng) {
    dist = getDistanceFromLatLng(userLat, userLng, shop.lat, shop.lng);
  }
  if (dist < 0.05) dist = 0;
  const distanceStr = dist.toFixed(1) + "Km";
  const detailUrl = `/board/details/${shop.id}-${createSlug(shop.company_name)}`;
  return (
   <Link
  href={detailUrl}
  className=" md:flex-row items-stretch bg-gray-100 p-4 rounded-lg overflow-hidden"
>
  {/* 왼쪽 썸네일 영역 - 중앙 정렬 */}
  <div className="w-[373px] h-[217px] relative flex-shrink-0 flex justify-center items-center">
    <Image
      src={url}
      alt={shop.company_name}
      layout="fill"
      className="object-cover rounded-xl"
    />
  </div>
  {/* 오른쪽 텍스트 영역 */}
  <div className="flex-1 px-4 py-2">
    <h2 className="text-lg font-semibold mb-1">{shop.company_name}</h2>
    {/* 주소 및 리뷰 */}
    <div className="flex items-center text-sm text-gray-600 mb-1 gap-3">
      <div className="flex items-center gap-1">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 11c1.656 0 3-1.343 3-3S13.656 5 12 5 9 6.343 9 8s1.344 3 3 3z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 9.5c0 7.168-7.5 11-7.5 11s-7.5-3.832-7.5-11a7.5 7.5 0 1115 0z"
          />
        </svg>
        <span>{shop.address || "주소 정보 없음"}</span>
      </div>
      <div className="text-gray-500">리뷰 {shop.comment ?? 0}</div>
      <div className="text-red-500">{distanceStr}</div>
    </div>
    <p className="text-sm text-gray-800">{shop.greeting}</p>
  </div>
</Link>
  );
}