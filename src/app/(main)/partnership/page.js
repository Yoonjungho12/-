"use client"; // Next.js 13 App Router에서 클라이언트 컴포넌트
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseF"; // 클라이언트 anon 키

export default function NewListingPage() {
  // ------------------------------------------------------------------
  // 1) 로그인 세션 & 내가 올린 신청서 리스트
  // ------------------------------------------------------------------
  const [session, setSession] = useState(null);
  const [mySubmits, setMySubmits] = useState([]);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        loadMySubmits(data.session.user.id);
      }
    }
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, sessionResult) => {
        setSession(sessionResult);
        if (sessionResult?.user?.id) {
          loadMySubmits(sessionResult.user.id);
        } else {
          setMySubmits([]);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 내가 올린 신청서 목록 로드
  async function loadMySubmits(userId) {
    try {
      const { data, error } = await supabase
        .from("partnershipsubmit")
        .select("id, post_title")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("내 신청서 조회 에러:", error);
        return;
      }
      setMySubmits(data || []);
    } catch (err) {
      console.error("loadMySubmits 오류:", err);
    }
  }

  // ------------------------------------------------------------------
  // 2) 폼 입력값 상태
  // ------------------------------------------------------------------
  const [adType, setAdType] = useState("");
  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [childRegions, setChildRegions] = useState([]);
  const [selectedSubRegionId, setSelectedSubRegionId] = useState(null);

  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [managerContact, setManagerContact] = useState("");
  const [parkingType, setParkingType] = useState("");
  const [shopType, setShopType] = useState("");
  const [hashtagSponsor, setHashtagSponsor] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [greeting, setGreeting] = useState("");
  const [eventInfo, setEventInfo] = useState("");

  // 주소 관련
  const [addressInput, setAddressInput] = useState("");
  const [nearBuilding, setNearBuilding] = useState("");
  const [openHours, setOpenHours] = useState("");
  const [programInfo, setProgramInfo] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [managerDesc, setManagerDesc] = useState("");

  // ------------------------------------------------------------------
  // 3) 테마(themes) (M:N)
  // ------------------------------------------------------------------
  const [themes, setThemes] = useState([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState([]);

  useEffect(() => {
    async function fetchThemes() {
      try {
        const { data, error } = await supabase
          .from("themes")
          .select("id, name")
          .order("id", { ascending: true });
        if (error) {
          console.error("테마 가져오기 에러:", error);
        } else {
          setThemes(data || []);
        }
      } catch (err) {
        console.error("fetchThemes 오류:", err);
      }
    }
    fetchThemes();
  }, []);

  function handleThemeClick(themeId) {
    setSelectedThemeIds((prev) => {
      if (prev.includes(themeId)) {
        return prev.filter((id) => id !== themeId);
      } else {
        return [...prev, themeId];
      }
    });
  }

  // ------------------------------------------------------------------
  // 4) 지역(상위/하위) 불러오기
  // ------------------------------------------------------------------
  useEffect(() => {
    async function fetchRegions() {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .is("parent_id", null)
        .order("sort_order", { ascending: true });
      if (error) {
        console.error("지역 가져오기 에러:", error);
      } else {
        setRegions(data || []);
      }
    }
    fetchRegions();
  }, []);

  useEffect(() => {
    async function fetchChildRegions() {
      if (selectedRegionId) {
        const { data, error } = await supabase
          .from("regions")
          .select("*")
          .eq("parent_id", selectedRegionId)
          .order("sort_order", { ascending: true });
        if (error) {
          console.error("하위 지역 에러:", error);
          setChildRegions([]);
        } else {
          setChildRegions(data || []);
        }
        setSelectedSubRegionId(null);
      } else {
        setChildRegions([]);
      }
    }
    fetchChildRegions();
  }, [selectedRegionId]);

  // ------------------------------------------------------------------
  // 5) Kakao 지도 동적 로드 (로컬에서만 사용, 전송 X)
  // ------------------------------------------------------------------
  const mapRef = useRef(null);
  const mapObjectRef = useRef(null);
  const markerRef = useRef(null);

  // 지도 위치 상태 (폼 전송에는 포함 X)
  const [markerPosition, setMarkerPosition] = useState({
    lat: 37.497951,
    lng: 127.027618,
  });

  useEffect(() => {
    if (!window.kakao) {
      const script = document.createElement("script");
      script.src =
        "//dapi.kakao.com/v2/maps/sdk.js?appkey=3be0573fb7f2f9b128b58dc1b0342b97&libraries=services&autoload=false";
      script.onload = () => {
        window.kakao.maps.load(() => {
          initMap(markerPosition.lat, markerPosition.lng);
        });
      };
      document.head.appendChild(script);
    } else {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          initMap(markerPosition.lat, markerPosition.lng);
        });
      }
    }
  }, []);

  function initMap(lat, lng) {
    const kakao = window.kakao;
    if (!kakao || !kakao.maps) return;
    const container = mapRef.current;
    const options = { center: new kakao.maps.LatLng(lat, lng), level: 3 };
    const map = new kakao.maps.Map(container, options);
    mapObjectRef.current = map;

    const markerPos = new kakao.maps.LatLng(lat, lng);
    const marker = new kakao.maps.Marker({ position: markerPos });
    marker.setMap(map);
    markerRef.current = marker;

    kakao.maps.event.addListener(map, "click", (mouseEvent) => {
      const latlng = mouseEvent.latLng;
      marker.setPosition(latlng);
      setMarkerPosition({ lat: latlng.getLat(), lng: latlng.getLng() });

      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          if (result[0].road_address) {
            setAddressInput(result[0].road_address.address_name);
          } else if (result[0].address) {
            setAddressInput(result[0].address.address_name);
          }
        }
      });
    });
  }

  function handleAddressSearch() {
    const { kakao } = window;
    if (!kakao || !kakao.maps) return;
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(addressInput, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const newLat = result[0].y;
        const newLng = result[0].x;
        setMarkerPosition({ lat: newLat, lng: newLng });
        if (mapObjectRef.current && markerRef.current) {
          const moveLatLng = new kakao.maps.LatLng(newLat, newLng);
          mapObjectRef.current.setCenter(moveLatLng);
          markerRef.current.setPosition(moveLatLng);
        } else {
          initMap(newLat, newLng);
        }
      } else {
        alert("주소를 찾을 수 없어요.");
      }
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddressSearch();
    }
  }

  // ------------------------------------------------------------------
  // 6) 프론트엔드 검증
  // ------------------------------------------------------------------
  function validateForm() {
    if (!adType) return "상품(광고위치)를 선택해 주세요.";
    if (!selectedRegionId) return "지역을 선택해 주세요.";
    if (!companyName.trim()) return "업체명을 입력해 주세요.";
    if (!phoneNumber.trim()) return "전화번호를 입력해 주세요.";
    if (!managerContact.trim()) return "담당자 연락처를 입력해 주세요.";
    if (!parkingType) return "주차방법을 선택해 주세요.";
    if (!shopType) return "샵형태를 선택해 주세요.";
    if (!addressInput.trim()) return "주소를 입력해 주세요.";
    if (!openHours.trim()) return "영업시간을 입력해 주세요.";
    if (!programInfo.trim()) return "프로그램(코스)을 입력해 주세요.";
    if (!contactMethod.trim()) return "연락 방법을 입력해 주세요.";
    if (!greeting.trim()) return "인사말을 입력해 주세요.";
    if (!eventInfo.trim()) return "이벤트를 입력해 주세요.";
    if (!postTitle.trim()) return "글 제목을 입력해 주세요.";
    if (!managerDesc.trim()) return "관리사를 입력해 주세요.";
    if (selectedThemeIds.length === 0) return "테마를 최소 한 개 이상 선택해 주세요.";
    return null;
  }

  // ------------------------------------------------------------------
  // 7) 폼 전송 => 백엔드
  // ------------------------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      alert(`필수 필드를 전부 입력해주세요.\n\n${error}`);
      return;
    }

    // **중요**: markerPosition은 전송하지 않음
    // DB에 저장하지 않을 거라면 payload에서 제외
    const payload = {
      ad_type: adType,
      region_id: selectedRegionId,
      sub_region_id: selectedSubRegionId,
      company_name: companyName,
      phone_number: phoneNumber,
      manager_contact: managerContact,
      parking_type: parkingType,
      shop_type: shopType,
      sponsor: hashtagSponsor,
      contact_method: contactMethod,
      greeting,
      event_info: eventInfo,
      address: addressInput,
      near_building: nearBuilding,
      open_hours: openHours,
      program_info: programInfo,
      post_title: postTitle,
      manager_desc: managerDesc,
      // markerPosition 제거
      themes: selectedThemeIds,
    };

    // 세션 토큰
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      alert("로그인 상태가 아닙니다.");
      return;
    }

    try {
      const res = await fetch("/api/partnership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }
      alert("등록 완료!");
      window.location.reload();
    } catch (err) {
      alert("등록 중 오류 발생: " + err.message);
    }
  }

  // ------------------------------------------------------------------
  // 8) 렌더링
  // ------------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 내가 올린 신청서 리스트 */}
      {mySubmits.length > 0 && (
        <div className="mb-6 bg-gray-100 border border-gray-300 p-4 rounded">
          <div className="text-gray-700 mb-2 font-semibold">
            신청서 리스트 ({mySubmits.length}건)
          </div>
          <ul className="list-disc pl-5 space-y-2">
            {mySubmits.map((submit) => {
              const title = submit.post_title?.trim() ? submit.post_title : "무제";
              return (
                <li key={submit.id} className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                  >
                    확인완료
                  </button>
                  <span className="font-medium">[{title}]</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">업체 등록 (Kakao 지도)</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 광고위치 */}
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <label className="w-32 font-semibold">상품(광고위치)</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAdType("VIP")}
              className={`px-6 py-2 rounded border ${
                adType === "VIP"
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-700 border-gray-300"
              } hover:opacity-80`}
            >
              VIP
            </button>
            <button
              type="button"
              onClick={() => setAdType("VIP+")}
              className={`px-6 py-2 rounded border ${
                adType === "VIP+"
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-700 border-gray-300"
              } hover:opacity-80`}
            >
              VIP+
            </button>
          </div>
        </div>

        {/* 지역선택(상위) */}
        <div>
          <label className="block font-semibold mb-1">
            지역선택 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-7 gap-2">
            {regions.map((region) => {
              const isSelected = selectedRegionId === region.id;
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => setSelectedRegionId(region.id)}
                  className={`px-3 py-2 text-center rounded border border-gray-300 ${
                    isSelected
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-700"
                  } hover:opacity-80`}
                >
                  {region.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 세부 지역선택(하위) */}
        {childRegions.length > 0 && (
          <div>
            <label className="block font-semibold mb-1">
              세부 지역선택 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-7 gap-2">
              {childRegions.map((sub) => {
                const isSelected = selectedSubRegionId === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubRegionId(sub.id)}
                    className={`px-3 py-2 text-center rounded border border-gray-300 ${
                      isSelected
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white text-gray-700"
                    } hover:opacity-80`}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 테마 선택(M:N) */}
        {themes.length > 0 && (
          <div>
            <label className="block font-semibold mb-1">
              테마 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-7 gap-2">
              {themes.map((theme) => {
                const isSelected = selectedThemeIds.includes(theme.id);
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleThemeClick(theme.id)}
                    className={`px-3 py-2 text-center rounded border border-gray-300 ${
                      isSelected
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white text-gray-700"
                    } hover:opacity-80`}
                  >
                    {theme.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 업체명 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="w-32 font-semibold">
            업체명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="지역+업체명"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-2 py-1"
          />
        </div>

        {/* 전화번호 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="w-32 font-semibold">
            전화번호 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="영업용 010 번호"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-2 py-1"
          />
        </div>

        {/* 담당자 연락처 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="w-32 font-semibold">
            담당자 연락처 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="실제 연락가능 번호"
            value={managerContact}
            onChange={(e) => setManagerContact(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-2 py-1"
          />
        </div>

        {/* 주차방법 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="w-32 font-semibold">
            주차방법 <span className="text-red-500">*</span>
          </label>
          <select
            value={parkingType}
            onChange={(e) => setParkingType(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-2 py-1"
          >
            <option value="">선택</option>
            <option value="유료주차">유료주차</option>
            <option value="무료주차">무료주차</option>
            <option value="주차 불가">주차 불가</option>
          </select>
        </div>

        {/* 샵형태 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="w-32 font-semibold">
            샵형태 <span className="text-red-500">*</span>
          </label>
          <select
            value={shopType}
            onChange={(e) => setShopType(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-2 py-1"
          >
            <option value="">선택</option>
            <option value="오피스텔">오피스텔</option>
            <option value="주택/빌라">주택/빌라</option>
            <option value="기타">기타</option>
          </select>
        </div>

        {/* #후원 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="w-32 font-semibold">#후원</label>
          <select
            value={hashtagSponsor}
            onChange={(e) => setHashtagSponsor(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-2 py-1"
          >
            <option value="">선택</option>
            <option value="possible">후원 가능</option>
            <option value="impossible">후원 불가</option>
          </select>
        </div>

        {/* 연락방법(필수) */}
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="w-32 font-semibold">
            연락방법 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="전화/문자/예약 등"
            value={contactMethod}
            onChange={(e) => setContactMethod(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-2 py-1"
          />
        </div>

        {/* 인사말(필수) */}
        <div>
          <label className="block font-semibold mb-1">
            인사말 <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="가게 소개, 인사말, 이벤트 안내 등"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded px-2 py-1"
          />
        </div>

        {/* 이벤트(필수) */}
        <div>
          <label className="block font-semibold mb-1">
            이벤트 <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="주간할인, 시간대 할인 등"
            value={eventInfo}
            onChange={(e) => setEventInfo(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded px-2 py-1"
          />
        </div>

        {/* 주소 + 지도 */}
        <div>
          <label className="block font-semibold mb-1">
            주소 <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <input
              type="text"
              placeholder="주소를 입력 후 검색"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border border-gray-300 rounded px-2 py-1 flex-1"
            />
            <button
              type="button"
              onClick={handleAddressSearch}
              className="px-4 py-2 rounded bg-gray-600 text-white font-semibold hover:bg-gray-700"
            >
              검색하기
            </button>
          </div>
          <input
            type="text"
            placeholder="인근 지하철 및 주요 건물"
            value={nearBuilding}
            onChange={(e) => setNearBuilding(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 w-full mb-2"
          />
          {/* 지도 표시(단순히 시각적) */}
          <div
            ref={mapRef}
            style={{ width: "100%", height: "300px" }}
            className="border border-gray-300 rounded"
          />
        </div>

        {/* 영업시간(필수) */}
        <div>
          <label className="block font-semibold mb-1">
            영업시간 <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="예) 11:00 ~ 04:00 / 24시간"
            value={openHours}
            onChange={(e) => setOpenHours(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1"
            rows={2}
          />
        </div>

        {/* 프로그램(코스)(필수) */}
        <div>
          <label className="block font-semibold mb-1">
            프로그램(코스) <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="예) A코스 60분 11만→9만 등"
            value={programInfo}
            onChange={(e) => setProgramInfo(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1"
            rows={3}
          />
        </div>

        {/* 글 제목(필수) */}
        <div>
          <label className="block font-semibold mb-1">
            글 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="예) [지역/업소명] 프리미엄 스웨디시"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1"
          />
        </div>

        {/* 관리자(관리사)(필수) */}
        <div>
          <label className="block font-semibold mb-1">
            관리사 <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="예) 보나(23) 주간, 빛나(32) 중간, ..."
            value={managerDesc}
            onChange={(e) => setManagerDesc(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1"
            rows={3}
          />
        </div>

        {/* 제출 버튼 */}
        <div>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            등록하기
          </button>
        </div>
      </form>
    </div>
  );
}