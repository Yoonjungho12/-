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

  // 지도 보임/숨김 - 모바일일 때 기본값 true로 설정
  const [mapHidden, setMapHidden] = useState(false);

  // 위치/데이터 로딩 완료 여부
  const [locationLoaded, setLocationLoaded] = useState(false);

  // 최초 한 번만 자동 닫기
  const [didAutoClose, setDidAutoClose] = useState(false);

  // 모바일 체크
  const [isMobile, setIsMobile] = useState(false);

  // ─────────────────────────────────────────────────────
  // (A) 사용자 위치 받아오기 (IP 기반)
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    async function getLocationByIP() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        setUserLat(lat);
        setUserLng(lng);
        setCenterLat(lat);
        setCenterLng(lng);
      } catch (err) {
        console.error("IP 위치 정보 가져오기 실패:", err);
      }
    }
    getLocationByIP();
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
  // (C) 사용자 위치 준비되면 지도 초기화 및 주소 변환
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (userLat && userLng) {
      loadKakaoMapScript(() => {
        if (!mapHidden) {
          initMap(userLat, userLng);
        }
        // 지도 표시 여부와 상관없이 주소 변환 실행
        convertCoordToAddress(userLng, userLat, (addr) => setAddress(addr));
      });
    }
  }, [userLat, userLng]);

  // 모바일 체크 useEffect 추가
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setMapHidden(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  useEffect(() => {
    if (userLat && userLng && shops.length >= 0) {
      setLocationLoaded(true);
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
  }

  // 지도 열고 닫기 함수 수정
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {locationLoaded ? (
          <div className="mb-8">
            <div className="text-center space-y-2 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">내 주변 제휴사 찾기</h1>
              <p className="text-gray-500">현재 위치를 기준으로 가까운 제휴사를 찾아드립니다</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm p-6 max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">현재 위치</div>
                  <div className="font-medium text-gray-900">{address || "정보 없음"}</div>
                </div>
                <button
                  onClick={handleToggleMap}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    mapHidden 
                      ? "bg-orange-500 text-white hover:bg-orange-600" 
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {mapHidden ? "지도 보기" : "지도 접기"}
                </button>
              </div>

              <p className="text-sm text-gray-500 text-center">
                내 주변 가까운 순으로 제휴사 리스트를 소개해 드릴게요!<br />
                지도에서 직접 위치를 선택하실 수도 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
              <div className="text-gray-500">위치/데이터 로딩중...</div>
            </div>
          </div>
        )}

        {!mapHidden && (
          <div className="mb-8">
            <div ref={mapRef} className="w-full h-[300px] rounded-2xl overflow-hidden shadow-sm mb-4" />
            <div className="flex items-center gap-2 max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="예) 서울 강남구 역삼동..."
                onKeyDown={handleKeyDown}
                className="flex-1 px-4 py-2.5 rounded-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                ref={searchInputRef}
              />
              <button
                onClick={handleSearchAddress}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                검색
              </button>
            </div>
          </div>
        )}

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">검색 결과</h2>
            <div className="text-sm text-gray-500">{filteredShops.length}개의 제휴사</div>
          </div>

          {filteredShops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg 
                className="w-16 h-16 text-gray-300 mb-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <p className="text-gray-500 text-lg">검색 결과가 없습니다!</p>
              <p className="text-gray-400 text-sm mt-2">다른 위치를 선택해보세요.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredShops.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  userLat={centerLat}
                  userLng={centerLng}
                />
              ))}
            </div>
          )}
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
    ? process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL + '/' + shop.thumbnail_url
    : "/placeholder.png";

  let dist = 99999;
  if (userLat && userLng && shop.lat && shop.lng) {
    dist = getDistanceFromLatLng(userLat, userLng, shop.lat, shop.lng);
  }
  if (dist < 0.05) dist = 0;
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
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex flex-col md:flex-row">
        {/* 이미지 영역 */}
        <div className="relative w-full md:w-[373px] h-[300px] md:h-[250px] flex-shrink-0">
          <div className="relative w-full aspect-[16/9] bg-gray-100">
            <div className="absolute inset-0">
              {Array.isArray(url) ? (
                <div
                  className="relative w-full h-full"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {url.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="absolute inset-0 transition-opacity duration-300"
                      style={{ opacity: currentIndex === idx ? 1 : 0 }}
                    >
                      <Image
                        src={imgUrl}
                        alt={`슬라이드 이미지 ${idx + 1}`}
                        fill
                        sizes="100vw"
                        priority={idx === 0}
                        className="object-contain"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.05)'
                        }}
                      />
                    </div>
                  ))}

                  {url.length > 1 && (
                    <>
                      <button
                        onClick={handlePrev}
                        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center z-10"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 19.5L8.25 12l7.5-7.5"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center z-10"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </button>
                    </>
                  )}

                  {url.length > 0 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 text-sm bg-black/60 text-white rounded z-10">
                      {currentIndex + 1} / {url.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative flex-shrink-0 w-full aspect-[4/3]">
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="animate-pulse">로딩중...</div>
                  </div>
                  <Image
                    src={url}
                    alt={shop.company_name}
                    fill
                    sizes="100vw"
                    priority={true}
                    className="object-cover"
                    style={{
                      objectFit: 'contain',
                      backgroundColor: 'rgba(0, 0, 0, 0.05)'
                    }}
                    onLoadingComplete={(img) => {
                      img.style.opacity = '1';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
              {shop.company_name}
            </h3>
            <div className="flex items-center px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-sm font-medium">
              {distanceStr}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{shop.address || "주소 정보 없음"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span>리뷰 {shop.comment ?? 0}</span>
            </div>
          </div>

          <div className="text-sm font-medium text-orange-600 mb-4">
            최저가: {lowestPrice ? formatPrice(lowestPrice) : "가격없음"}
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {shop.greeting}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {themeList.map((pt) => (
              <span
                key={pt.themes.id}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
              >
                #{pt.themes.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

function handleNext() {
  setCurrentIndex((prev) => 
    prev === allImages.length - 1 ? 0 : prev + 1
  );
}

function handlePrev() {
  setCurrentIndex((prev) => 
    prev === 0 ? allImages.length - 1 : prev - 1
  );
}