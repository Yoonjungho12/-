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

function convertAddressToCoord(address, callback) {
  if (!window.kakao || !window.kakao.maps) return;
  const geocoder = new window.kakao.maps.services.Geocoder();
  geocoder.addressSearch(address, (result, status) => {
    if (status === window.kakao.maps.services.Status.OK) {
      const lat = parseFloat(result[0].y);
      const lng = parseFloat(result[0].x);
      callback({ lat, lng });
    } else {
      alert("주소를 찾을 수 없습니다.");
    }
  });
}
  return text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9-]/g, "")
    .toLowerCase() || "no-slug";
}

/**
 * (1) 카카오 지도 SDK 로드
 */
function loadKakaoMapScript(callback) {
  if (typeof window === "undefined") return;
  const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_KEY;
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
 * (2) 두 좌표 간 거리 계산 (km)
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
 * (3) 가격 포맷
 */
function formatPrice(num) {
  if (!num || isNaN(num)) return "가격없음";
  return Number(num).toLocaleString() + "원";
}

/**
 * NearMeListPage 컴포넌트
 */
export default function NearMeListPage() {
  const mapRef = useRef(null);    // 지도 컨테이너
  const markerRef = useRef(null); // "내 위치" 마커
  const searchInputRef = useRef(null);

  // 사용자 위치
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);

  // 지도 중심점
  const [centerLat, setCenterLat] = useState(null);
  const [centerLng, setCenterLng] = useState(null);

  // 지도 객체
  const [mapObj, setMapObj] = useState(null);

  // 전체 매장 목록 + 필터된 매장 목록
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);

  // 주소 (reverse geocoding)
  const [address, setAddress] = useState("");

  // 지도 보임/숨김
  const [mapHidden, setMapHidden] = useState(false);

  // 위치/데이터 로딩 완료 여부
  const [locationLoaded, setLocationLoaded] = useState(false);

  // 최초 한 번만 자동 닫기
  const [didAutoClose, setDidAutoClose] = useState(false);

  // ─────────────────────────────────────────────────────
  // (A) 사용자 위치 받아오기
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
        // 지도 중심점도 사용자 위치
        setCenterLat(lat);
        setCenterLng(lng);
      },
      (err) => {
        console.error("Geolocation 에러:", err);
      }
    );
  }, []);

  // ─────────────────────────────────────────────────────
  // (B) 매장 목록 로드 (테마/코스/가격 가져오기)
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
          lng,
          partnershipsubmit_themes ( themes ( id, name ) ),
          sections ( courses ( price ) )
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
  // (C) 사용자 위치 준비되면 지도 초기화
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (userLat && userLng) {
      loadKakaoMapScript(() => {
        initMap(userLat, userLng);
      });
    }
  }, [userLat, userLng]);

  /** 지도 초기화 */
  function initMap(lat, lng) {
    if (!window.kakao || !window.kakao.maps) return;
    if (!mapRef.current) return;
    const pos = new window.kakao.maps.LatLng(lat, lng);
    const options = { center: pos, level: 5 };
    const newMap = new window.kakao.maps.Map(mapRef.current, options);
    setMapObj(newMap);

    // "내 위치" 마커
    const marker = new window.kakao.maps.Marker({ position: pos });
    marker.setMap(newMap);
    markerRef.current = marker;

    // 주소 변환
    convertCoordToAddress(lng, lat, (addr) => setAddress(addr));

    // 지도 클릭
    window.kakao.maps.event.addListener(newMap, "click", (evt) => {
      const cLat = evt.latLng.getLat();
      const cLng = evt.latLng.getLng();
      moveMarker(cLat, cLng);
      setCenterLat(cLat);
      setCenterLng(cLng);
      convertCoordToAddress(cLng, cLat, (addr) => setAddress(addr));
      filterShopsByDistance(cLat, cLng);
    });

    // 지도 드래그 종료
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

  /** 마커 이동 */
  function moveMarker(lat, lng) {
    if (!markerRef.current) return;
    const pos = new window.kakao.maps.LatLng(lat, lng);
    markerRef.current.setPosition(pos);
  }

  // ─────────────────────────────────────────────────────
  // (D) 30km 필터
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (userLat && userLng && shops.length > 0) {
      filterShopsByDistance(userLat, userLng);
    }
  }, [userLat, userLng, shops]);

  function filterShopsByDistance(lat, lng) {
    const MAX_DIST = 30;
    const results = shops.filter((shop) => {
      if (!shop.lat || !shop.lng) return false;
      const dist = getDistanceFromLatLng(lat, lng, shop.lat, shop.lng);
      return dist <= MAX_DIST;
    });
    setFilteredShops(results);
    setLocationLoaded(true);

    // 초회 로딩 시 한 번만 지도 닫기
    if (!didAutoClose) {
      setDidAutoClose(true);
      setTimeout(() => {
        setMapHidden(true);
      }, 500);
    }
  }

  // 지도 열고 닫기
  function handleToggleMap() {
    if (!locationLoaded) {
      alert("아직 위치/데이터 로딩 중입니다!");
      return;
    }
    const newVal = !mapHidden;
    setMapHidden(newVal);
    if (!newVal) {
      // 지도 열기 시 재초기화
      setTimeout(() => {
        if (userLat && userLng) {
          initMap(userLat, userLng);
        }
      }, 0);
    }
  }

/**
 * (F) 주소 검색
 */
async function handleSearchAddress() {
  const keyword = searchInputRef.current?.value.trim();
  if (!keyword) {
    alert("검색어를 입력해주세요!");
    return;
  }

  convertAddressToCoord(keyword, ({ lat, lng }) => {
    if (mapObj) {
      const newPos = new window.kakao.maps.LatLng(lat, lng);
      setCenterLat(lat);
      setCenterLng(lng);
      mapObj.setCenter(newPos);
      moveMarker(lat, lng);
      convertCoordToAddress(lng, lat, (addr) => setAddress(addr));
      filterShopsByDistance(lat, lng);
    }
  });
}

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      handleSearchAddress();
    }
  }

  /** 좌표 → 주소 변환 */
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

  function convertAddressToCoord(address, callback) {
    if (!window.kakao || !window.kakao.maps) return;
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const lat = parseFloat(result[0].y);
        const lng = parseFloat(result[0].x);
        callback({ lat, lng });
      } else {
        alert("주소를 찾을 수 없습니다.");
      }
    });
  }

  // ─────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────
  return (
    <div className="mt-5 max-w-7xl mx-auto p-4">
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
           내 주변 가까운 순으로 제휴사 리스트를 소개해 드릴게요 지역을 지도에서 직접 선택하실 수도 있어요!</p>
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

      <div className="mb-6 mt-20">
        <h3 className="text-lg font-semibold mb-2">검색 결과</h3>

        <div className="space-y-6">
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

/** 
 * (G) 매장 카드 컴포넌트
 * 모바일일 때는 화면 꽉 차게, 데스크톱(md) 이상이면 373×217
 */
function ShopCard({ shop, userLat, userLng }) {

  const url = shop.thumbnail_url
    ? process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL +'/'+shop.thumbnail_url
    : "/placeholder.png";

  let dist = 99999;
  if (userLat && userLng && shop.lat && shop.lng) {
    dist = getDistanceFromLatLng(userLat, userLng, shop.lat, shop.lng);
  }
  if (dist < 0.05) dist = 0; // 0.05km 이내면 0Km로 표시
  const distanceStr = dist.toFixed(1) + "Km";

  const themeList = shop.partnershipsubmit_themes || [];

  let lowestPrice = null;
  if (shop.sections?.length) {
    shop.sections.forEach((sec) => {
      if (sec.courses?.length) {
        sec.courses.forEach((c) => {
          if (lowestPrice === null || (c.price && c.price < lowestPrice)) {
            lowestPrice = c.price;
          }
        });
      }
    });
  }

  const detailUrl = `/board/details/${shop.id}-${createSlug(shop.company_name)}`;

  return (
    <Link
      href={detailUrl}
      className="
        block
        flex flex-col md:flex-row
        items-stretch
        p-3
        rounded-lg
        overflow-hidden
        hover:bg-gray-200
        transition-colors
        mb-0
        md:mb-4      "
    >
      {/* 
        (1) 이미지 컨테이너: 모바일에서 w-full h-48 
        md:에서 373×217
      */}
      <div className="relative w-full h-48 mb-3 md:mb-0 md:w-[373px] md:h-[217px] flex-shrink-0">
        {/* fill 모드로 배치해서, 컨테이너 사이즈에 맞춰! */}
        <Image
          src={url}
          alt={shop.company_name}
          fill
          className="object-cover rounded-xl"
        />
      </div>

      {/* (2) 오른쪽 텍스트 영역 */}
      <div className="flex-1 px-4 py-2">
        <h2 className="text-lg font-semibold mb-1">{shop.company_name}</h2>

        {/* 주소 + 리뷰 + 거리 */}
        <div className="flex items-center text-sm text-gray-600 mb-1 gap-3">
          {/* 주소 */}
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
                d="M12 11c1.656 0
                   3-1.344
                   3-3s-1.344-3
                   -3-3-3
                   1.344-3
                   3 1.344
                   3 3
                   3z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 9.5c0
                   7.168-7.5
                   11-7.5
                   11s-7.5-3.832
                   -7.5-11a7.5
                   7.5 0
                   1115
                   0z"
              />
            </svg>
            <span>{shop.address || "주소 정보 없음"}</span>
          </div>
          {/* 리뷰수 */}
          <div className="text-gray-500">리뷰 {shop.comment ?? 0}</div>
          {/* 거리 */}
          <div className="text-red-500">{distanceStr}</div>
        </div>

        {/* 최저가 */}
        <div className="text-sm text-red-600 font-semibold mb-1">
          최저가: {lowestPrice ? formatPrice(lowestPrice) : "가격없음"}
        </div>

        {/* 인사말 */}
        <p className="text-sm text-gray-800">{shop.greeting}</p>

        {/* 테마 태그 */}
        <div className="mt-2 flex flex-wrap gap-2">
          {themeList.map((pt) => (
            <span
              key={pt.themes.id}
              className="rounded-full border border-gray-300 px-2 py-1 text-xs text-gray-600"
            >
              #{pt.themes.name}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}