"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseF";
import Image from "next/image";
import Link from "next/link";

/** 
 * (A) 슬러그 생성 함수 (회사명 → URL-friendly)
 */
function createSlug(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return "no-slug";
  }
  const slug = text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9-]/g, "")
    .toLowerCase();
  return slug || "no-slug";
}

/**
 * (1) 카카오 지도 SDK 스크립트 로드 함수
 */
function loadKakaoMapScript(callback) {
  if (typeof window === "undefined") return;

  const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  if (!KAKAO_APP_KEY) {
    console.error("Kakao Map Key is not defined. Check .env file.");
    return;
  }

  // 이미 kakao.maps가 있으면 재로딩 생략
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
 * (2) Haversine 거리 계산 함수 (km)
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
 * (3) 메인 컴포넌트
 */
export default function NearMeListPage() {
  const mapRef = useRef(null);         // 지도 컨테이너 ref
  const markerRef = useRef(null);      // "내 위치" 마커 ref
  const searchInputRef = useRef(null); // 주소 검색창 ref

  // 지도 객체
  const [mapObj, setMapObj] = useState(null);

  // 사용자 위치
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);

  // 마커 중심점
  const [centerLat, setCenterLat] = useState(null);
  const [centerLng, setCenterLng] = useState(null);

  // DB 데이터
  const [shops, setShops] = useState([]); 
  const [filteredShops, setFilteredShops] = useState([]); // 30km 내

  // 현재 주소
  const [address, setAddress] = useState("");

  // 지도 숨김 여부
  const [mapHidden, setMapHidden] = useState(false);

  // 위치 / 데이터 로딩 완료
  const [locationLoaded, setLocationLoaded] = useState(false);

  // ----------------------------------------------------------------
  // (A) 브라우저에서 내 위치 받아오기
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("위치 기반 서비스를 지원하지 않는 브라우저입니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // 초기 좌표
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        setCenterLat(lat);
        setCenterLng(lng);
      },
      (err) => {
        console.error("위치 가져오기 실패:", err);
      }
    );
  }, []);

  // ----------------------------------------------------------------
  // (B) Supabase에서 샵 목록 불러오기
  // ----------------------------------------------------------------
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
        console.error("Fetch shops err:", error);
        return;
      }
      setShops(data || []);
    }
    fetchShops();
  }, []);

  // ----------------------------------------------------------------
  // (C) 지도 SDK 로드 + initMap
  // ----------------------------------------------------------------
  useEffect(() => {
    if (userLat && userLng) {
      loadKakaoMapScript(() => {
        initMap(userLat, userLng);
      });
    }
  }, [userLat, userLng]);

  function initMap(lat, lng) {
    if (!window.kakao || !window.kakao.maps) return;

    const container = mapRef.current;
    const options = {
      center: new kakao.maps.LatLng(lat, lng),
      level: 5,
    };
    const map = new kakao.maps.Map(container, options);
    setMapObj(map);

    // "내 위치" 마커
    const markerPos = new kakao.maps.LatLng(lat, lng);
    const marker = new kakao.maps.Marker({ position: markerPos });
    marker.setMap(map);
    markerRef.current = marker;

    // 지도에서 좌표 → 주소
    convertCoordToAddress(lng, lat, (addr) => {
      setAddress(addr);
    });

    // 지도 클릭
    kakao.maps.event.addListener(map, "click", (mouseEvent) => {
      const latlng = mouseEvent.latLng;
      const cLat = latlng.getLat();
      const cLng = latlng.getLng();

      moveMarker(cLat, cLng);
      setCenterLat(cLat);
      setCenterLng(cLng);

      convertCoordToAddress(cLng, cLat, (addr) => {
        setAddress(addr);
      });
      filterShopsByDistance(cLat, cLng);
    });

    // 지도 드래그 끝
    kakao.maps.event.addListener(map, "dragend", () => {
      const center = map.getCenter();
      const cLat = center.getLat();
      const cLng = center.getLng();

      moveMarker(cLat, cLng);
      setCenterLat(cLat);
      setCenterLng(cLng);

      convertCoordToAddress(cLng, cLat, (addr) => {
        setAddress(addr);
      });
      filterShopsByDistance(cLat, cLng);
    });
  }

  // 마커 이동
  function moveMarker(lat, lng) {
    if (!markerRef.current) return;
    const newPos = new kakao.maps.LatLng(lat, lng);
    markerRef.current.setPosition(newPos);
  }

  // ----------------------------------------------------------------
  // (D) userLat, userLng, shops 불러오고 나면 거리 필터
  // ----------------------------------------------------------------
  useEffect(() => {
    if (userLat && userLng && shops.length > 0) {
      filterShopsByDistance(userLat, userLng);
    }
  }, [userLat, userLng, shops]);

  /**
   * 30km 필터 + 로딩완료 + 3초 후 자동접기
   */
  function filterShopsByDistance(lat, lng) {
    const MAX_DIST = 30;
    const results = shops.filter((shop) => {
      if (!shop.lat || !shop.lng) return false;
      const dist = getDistanceFromLatLng(lat, lng, shop.lat, shop.lng);
      return dist <= MAX_DIST;
    });
    setFilteredShops(results);

    // 위치 및 데이터 로딩 완료
    setLocationLoaded(true);

    // 3초 뒤 자동 닫기
    setTimeout(() => {
      // 만약 사용자가 이미 지도 접어놨다면 중복으로 또 닫을 필요 X
      if (!mapHidden) {
        setMapHidden(true);
      }
    }, 3000);
  }

  // ----------------------------------------------------------------
  // (E) 주소 검색
  // ----------------------------------------------------------------
  function handleSearchAddress() {
    const keyword = searchInputRef.current?.value.trim();
    if (!keyword) {
      alert("주소를 입력해주세요!");
      return;
    }
    if (!window.kakao || !window.kakao.maps || !mapObj) {
      alert("지도 로드가 아직 안되었습니다!");
      return;
    }
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(keyword, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result.length > 0) {
        const newLng = result[0].x;
        const newLat = result[0].y;
        setCenterLat(newLat);
        setCenterLng(newLng);

        moveMarker(newLat, newLng);
        const moveLatLng = new kakao.maps.LatLng(newLat, newLng);
        mapObj.setCenter(moveLatLng);

        convertCoordToAddress(newLng, newLat, (addr) => {
          setAddress(addr);
        });

        filterShopsByDistance(newLat, newLng);
      } else {
        alert("해당 주소를 찾지 못했어요!");
      }
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      handleSearchAddress();
    }
  }

  // ----------------------------------------------------------------
  // (F) 지도 열기/닫기 버튼
  // ----------------------------------------------------------------
  function handleClickMyLocation() {
    if (!locationLoaded) {
      alert("아직 로딩이 안 끝났습니다!");
      return;
    }
    // 토글
    setMapHidden((prev) => !prev);
  }

  // ----------------------------------------------------------------
  // (G) 지도가 다시 열릴 때 => relayout() + setCenter
  // ----------------------------------------------------------------
  useEffect(() => {
    // 만약 지도 열림(mapHidden === false) & mapObj 존재
    if (!mapHidden && mapObj) {
      // 약간 딜레이 후 relayout
      setTimeout(() => {
        mapObj.relayout();
        if (centerLat && centerLng) {
          const moveLatLng = new kakao.maps.LatLng(centerLat, centerLng);
          mapObj.setCenter(moveLatLng);
        }
      }, 200);
    }
  }, [mapHidden, mapObj, centerLat, centerLng]);

  // ----------------------------------------------------------------
  // (H) 지도 좌표 -> 주소
  // ----------------------------------------------------------------
  function convertCoordToAddress(lng, lat, callback) {
    if (!window.kakao || !window.kakao.maps) return;
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const detailAddr = result[0]?.address?.address_name;
        callback(detailAddr || "");
      } else {
        callback("");
      }
    });
  }

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="mt-5 max-w-4xl mx-auto p-4">
      {/* 
        상단: 위치 안내 
        locationLoaded = true 인 경우에만 “내 위치” 문구 + 지도 열기/닫기 버튼
      */}
      {locationLoaded ? (
        <div className="mb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            {/* 아이콘 (원하시면 변경 가능) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.55 11h6.4a1 1 0 00.94-.66l2.27-6.16a1 
                   1 0 011.87 0l2.27 6.16a1 
                   1 0 00.94.66h2.4c1.1 0 2 .9 2 2s-.9 2-2 
                   2h-6.4a1 1 0 00-.94.66l-2.27 
                   6.16a1 1 0 01-1.87 0l-2.27-6.16a1 
                   1 0 00-.94-.66h-2.4c-1.1 0-2-.9-2-2s.9-2 
                   2-2z"
              />
            </svg>

            <span className="text-base font-semibold">
              내 위치 : {address || "정보 없음"}
            </span>
          </div>

          <hr className="w-[60%] mx-auto border-black my-1" />

          <p className="text-sm text-gray-500 text-center">
            내 주변 가까운 순으로 샵 소개해 드릴게요 <br />
            지역을 지도에서 직접 선택하실 수도 있어요
          </p>

          <div className="flex justify-center mt-2">
            <button
              onClick={handleClickMyLocation}
              className="px-4 py-2 rounded border border-gray-400 text-sm"
            >
              {mapHidden ? "지도 보기" : "지도 접기"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center mb-4 text-gray-500">
          위치/주변 정보를 불러오는 중...
        </div>
      )}

      {/* 
        지도 영역 
        mapHidden = false인 경우에만 DOM에 나타남
      */}
      {!mapHidden && (
        <div className="mb-4">
          {/* 지도 컨테이너 */}
          <div ref={mapRef} className="w-full h-72 bg-gray-200 rounded mb-4" />

          {/* 검색창 */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              ref={searchInputRef}
              onKeyDown={handleKeyDown}
              className="flex-1 border border-gray-300 rounded px-2 py-1"
              placeholder="예) 서울 강남구 역삼동..."
            />
            <button
              onClick={handleSearchAddress}
              className="px-3 py-2 bg-blue-500 text-white rounded"
            >
              주소 검색
            </button>
          </div>
        </div>
      )}

      {/* 
        필터링된 매장 목록 
      */}
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
  );
}

/**
 * ShopCard 컴포넌트
 */
function ShopCard({ shop, userLat, userLng }) {
  // 이미지 경로
  const url = shop.thumbnail_url
    ? `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${shop.thumbnail_url}`
    : "/placeholder.png";

  // 거리 계산
  let dist = 99999;
  if (userLat && userLng && shop.lat && shop.lng) {
    dist = getDistanceFromLatLng(userLat, userLng, shop.lat, shop.lng);
  }
  if (dist < 0.05) dist = 0;
  const distanceStr = dist.toFixed(1) + "Km";

  // 상세 링크
  const detailUrl = `/board/details/${shop.id}-${createSlug(shop.company_name)}`;

  return (
    <Link
      href={detailUrl}
      className="flex flex-col md:flex-row items-stretch border-b pb-4 gap-4"
    >
      {/* 이미지 */}
      <div className="
          relative
          w-full aspect-[373/217]
          md:w-[373px] md:h-[217px] md:aspect-auto
          bg-gray-100
          rounded
          overflow-hidden
          flex-shrink-0
        "
      >
        <Image
          src={url}
          alt={shop.company_name}
          fill
          className="object-cover"
        />
      </div>

      {/* 오른쪽 텍스트 */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-1">{shop.company_name}</h3>
        <div className="text-sm text-gray-500 mb-1 flex items-center gap-3">
          <span className="text-red-500">{distanceStr}</span>
          <span>{shop.address}</span>
          <span>| 리뷰 {shop.comment}</span>
        </div>
        <p className="text-sm text-gray-600">{shop.greeting}</p>
      </div>
    </Link>
  );
}