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
    // 공백 -> "-"
    .replace(/\s+/g, "-")
    // 한글, 영문, 숫자, 하이픈 제외한 문자는 제거
    .replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9-]/g, "")
    .toLowerCase();
  return slug || "no-slug";
}

/**
 * (1) 카카오 지도 SDK 스크립트 로드 함수
 */
function loadKakaoMapScript(callback) {
  // SSR 환경이면 종료
  if (typeof window === "undefined") return;

  // .env 설정 확인
  const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  if (!KAKAO_APP_KEY) {
    console.error("Kakao Map Key is not defined. Check .env file.");
    return;
  }

  // 이미 로드된 경우
  if (window.kakao && window.kakao.maps) {
    window.kakao.maps.load(callback);
    return;
  }

  // 아직 스크립트가 없다면
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
 * (3) 메인 컴포넌트: "내 주변" 지도 + 검색창 + 리스트
 */
export default function NearMeListPage() {
  const mapRef = useRef(null);         // 지도 컨테이너 ref
  const searchInputRef = useRef(null); // 주소 검색창 ref

  const [mapObj, setMapObj] = useState(null);

  // 사용자 실제 위치 (geolocation)
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);

  // 지도 중심 (드래그 / 검색 등으로 바뀔 수 있음)
  const [centerLat, setCenterLat] = useState(null);
  const [centerLng, setCenterLng] = useState(null);

  // Supabase에서 불러온 DB 데이터
  const [shops, setShops] = useState([]); 
  const [filteredShops, setFilteredShops] = useState([]); // 30km 내

  // 사용자 현재 주소 (reverse geocoding)
  const [address, setAddress] = useState("");

  // ① 브라우저에서 geolocation으로 내 위치 가져오기
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("위치 기반 서비스를 지원하지 않는 브라우저입니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        // 지도 초기 중심
        setCenterLat(pos.coords.latitude);
        setCenterLng(pos.coords.longitude);
      },
      (err) => {
        console.error("위치 가져오기 실패:", err);
      }
    );
  }, []);

  // ② Supabase에서 partnershipsubmit 테이블 조회
  useEffect(() => {
    async function fetchShops() {
      const { data, error } = await supabase
        .from("partnershipsubmit")
        .select(`
          id,
          company_name,
          thumbnail_url,
          address,
          comment,
          greeting,
          lat,
          lng
        `);
      if (error) {
        console.error("Fetch shops err:", error);
        return;
      }
      setShops(data || []);
    }
    fetchShops();
  }, []);

  // ③ 지도 초기화 (userLat/userLng 확보 후)
  useEffect(() => {
    if (userLat && userLng) {
      loadKakaoMapScript(() => {
        initMap(userLat, userLng);
      });
    }
  }, [userLat, userLng]);

  // 실제 지도 생성 + dragend 핸들러
  function initMap(lat, lng) {
    if (!window.kakao || !window.kakao.maps) return;

    const container = mapRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(lat, lng),
      level: 5,
    };

    const map = new window.kakao.maps.Map(container, options);
    setMapObj(map);

    // 초기 주소 변환
    convertCoordToAddress(lng, lat, (addr) => {
      setAddress(addr);
    });

    // 내 위치 마커
    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(lat, lng),
    });
    marker.setMap(map);

    // 드래그 끝나면 지도 중심 좌표 갱신
    kakao.maps.event.addListener(map, "dragend", () => {
      const center = map.getCenter();
      setCenterLat(center.getLat());
      setCenterLng(center.getLng());
    });
  }

  // 위/경도를 주소로 변환
  function convertCoordToAddress(lng, lat, callback) {
    if (!window.kakao || !window.kakao.maps) return;
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const detailAddr = result[0]?.address?.address_name;
        callback(detailAddr || "");
      } else {
        callback("");
      }
    });
  }

  // ④ 30km 내 필터링 (처음엔 userLat, userLng 기준)
  useEffect(() => {
    if (userLat && userLng && shops.length > 0) {
      filterShopsByDistance(userLat, userLng);
    }
  }, [userLat, userLng, shops]);

  // 필터 (30km)
  function filterShopsByDistance(lat, lng) {
    const MAX_DIST = 30; // km
    const results = shops.filter((shop) => {
      if (!shop.lat || !shop.lng) return false;
      const dist = getDistanceFromLatLng(lat, lng, shop.lat, shop.lng);
      return dist <= MAX_DIST;
    });
    setFilteredShops(results);
  }

  // “이 주변 샵 찾기” → centerLat/centerLng 기준
  function handleSearchAround() {
    if (!centerLat || !centerLng) return;
    convertCoordToAddress(centerLng, centerLat, (addr) => {
      setAddress(addr);
    });
    filterShopsByDistance(centerLat, centerLng);
  }

  // (추가) 검색창: 입력한 주소 -> 지도 중심 이동
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
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(keyword, (result, status) => {
      if (
        status === window.kakao.maps.services.Status.OK &&
        result.length > 0
      ) {
        const newLng = result[0].x;
        const newLat = result[0].y;
        // 지도 중심 갱신
        setCenterLat(newLat);
        setCenterLng(newLng);
        // 지도 이동
        const moveLatLng = new window.kakao.maps.LatLng(newLat, newLng);
        mapObj.setCenter(moveLatLng);
        // 주소 표시
        convertCoordToAddress(newLng, newLat, (addr) => {
          setAddress(addr);
        });
      } else {
        alert("해당 주소를 찾지 못했어요!");
      }
    });
  }

  return (
    <div className="mt-5 max-w-4xl mx-auto p-4">
      {/* 상단 제목/주소 */}
      <h2 className="text-2xl font-bold flex justify-center items-center gap-1 mb-2">
        <span>내 위치 :</span>
        <span className="font-medium text-gray-600">
          {address || "위치 확인중..."}
        </span>
      </h2>

      <p className="text-sm text-center text-gray-500 mb-4">
        내 주변 가까운 순으로 샵 리스트를 소개해 드릴게요. <br/>
        지도에서 직접 위치를 선택하시거나 주소 검색을 통해도 이동 가능합니다!
      </p>

      {/* 지도 */}
      <div className="mb-4">
        <div ref={mapRef} className="w-full h-72 bg-gray-200 rounded" />
      </div>

      {/* (추가) 검색창 */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          ref={searchInputRef}
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

      {/* "이 주변 샵 찾기" 버튼 */}
      <button
        onClick={handleSearchAround}
        className="w-full px-4 py-2 mb-6 bg-black text-white rounded"
      >
        이 주변 샵 찾기
      </button>

      {/* 업종 필터 (예시) */}
      <div className="mb-2">
        <span className="text-sm text-gray-500 mr-2">업종</span>
        <label className="mr-2">
          <input type="checkbox" className="mr-1" />
          1인샵
        </label>
        <label className="mr-2">
          <input type="checkbox" className="mr-1" />
          스웨디시
        </label>
        <label className="mr-2">
          <input type="checkbox" className="mr-1" />
          타이
        </label>
        <label className="mr-2">
          <input type="checkbox" className="mr-1" />
          스파
        </label>
        <label className="mr-2">
          <input type="checkbox" className="mr-1" />
          왁싱
        </label>
        <label className="mr-2">
          <input type="checkbox" className="mr-1" />
          24시간
        </label>
        <label className="mr-2">
          <input type="checkbox" className="mr-1" />
          수면가능
        </label>
        <button className="px-3 py-1 bg-gray-100 text-sm border ml-2">
          검색
        </button>
      </div>

      {/* 필터링된 샵 리스트 */}
      <div className="mt-4 space-y-6">
        {filteredShops.map((shop) => (
          <ShopCard
            key={shop.id}
            shop={shop}
            userLat={userLat}
            userLng={userLng}
          />
        ))}
      </div>
    </div>
  );
}

/** 
 * (4) ShopCard: 카드 클릭 시 `/board/details/${id}-${createSlug(company_name)}` 로 이동
 */
function ShopCard({ shop, userLat, userLng }) {
  // 썸네일 경로
  const url = `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${shop.thumbnail_url}`;

  // 거리 계산
  let dist = getDistanceFromLatLng(userLat, userLng, shop.lat, shop.lng);
  if (dist < 0.05) dist = 0;
  const distanceStr = dist.toFixed(1) + "Km";

  // 디테일 링크
  const detailUrl = `/board/details/${shop.id}-${createSlug(shop.company_name)}`;

  return (
    <Link href={detailUrl} className="flex items-start gap-4 border-b pb-4">
      {/* 썸네일 */}
      <div className="w-[373px] h-[217px] bg-gray-100 rounded overflow-hidden flex-shrink-0">
        <Image
          src={shop.thumbnail_url ? url : "/placeholder.png"}
          alt={shop.company_name}
          width={373}
          height={217}
          className="object-cover"
        />
      </div>

      {/* 우측 텍스트 */}
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