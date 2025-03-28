"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseF";
import MapSelector from "./MapSelector";

/**
 * 가게 정보 수정 (전체 필드 + 카카오 맵 지역 매핑)
 * @param {number} shopId  - 수정하려는 partnershipsubmit.id
 * @param {function} onClose - 닫기 콜백 (optional)
 */
export default function StoreInfoEditor({ shopId, onClose }) {
  console.log("shopId:", shopId);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // ─────────────────────────────────────────
  // (A) 폼 상태들 (SubmitForm과 동일/통합)
  // ─────────────────────────────────────────
  const [adType, setAdType] = useState("");

  // 지역
  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [childRegions, setChildRegions] = useState([]);
  const [selectedSubRegionId, setSelectedSubRegionId] = useState(null);

  // 테마(M:N)
  const [themes, setThemes] = useState([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState([]);

  // 업체 정보
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [managerContact, setManagerContact] = useState("");

  // 휴무일
  const [holidaySelectVal, setHolidaySelectVal] = useState("");
  const [holidayDirect, setHolidayDirect] = useState("");

  // 주차방법
  const [parkingSelectVal, setParkingSelectVal] = useState("");
  const [parkingDirect, setParkingDirect] = useState("");


  const [contactMethod, setContactMethod] = useState("");

  // 업체 소개, 이벤트
  const [greeting, setGreeting] = useState("");
  const [eventInfo, setEventInfo] = useState("");

  // 영업시간
  const [is24Hours, setIs24Hours] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeOptions, setTimeOptions] = useState([]);

  // 주소
  const [addressInput, setAddressInput] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [nearBuilding, setNearBuilding] = useState("");

  // 프로그램(코스), 글제목, 관리사
  const [programInfo, setProgramInfo] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [managerDesc, setManagerDesc] = useState("");

  // 지도 (카카오 맵)
  const [lat, setLat] = useState(37.497951);
  const [lng, setLng] = useState(127.027618);
  const mapRef = useRef(null); // 지도 div ref
  const mapObjectRef = useRef(null);
  const markerRef = useRef(null);

  // ─────────────────────────────────────────
  // (B) 상위 지역 & 테마 목록 & 30분 단위 시간 세팅
  // ─────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        // 상위 지역
        const { data: regionRows, error: regErr } = await supabase
          .from("regions")
          .select("*")
          .is("parent_id", null)
          .order("sort_order", { ascending: true });
        if (regErr) console.error("상위 지역 로딩 에러:", regErr);
        setRegions(regionRows || []);

        // 테마
        const { data: themeRows, error: thErr } = await supabase
          .from("themes")
          .select("id, name")
          .order("id", { ascending: true });
        if (thErr) console.error("테마 로딩 에러:", thErr);
        setThemes(themeRows || []);
      } catch (err) {
        console.error("초기 목록 로딩 오류:", err);
      }
    }
    fetchData();

    // 30분 간격 timeOptions 생성
    const temp = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        temp.push(`${hh}:${mm}`);
      }
    }
    setTimeOptions(temp);
  }, []);

  // 하위 지역 로딩
  useEffect(() => {
    async function fetchChilds() {
      if (!selectedRegionId) {
        setChildRegions([]);
        setSelectedSubRegionId(null);
        return;
      }
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .eq("parent_id", selectedRegionId)
        .order("sort_order", { ascending: true });
      if (error) {
        console.error("하위 지역 로딩 에러:", error);
        setChildRegions([]);
      } else {
        setChildRegions(data || []);
      }
    }
    fetchChilds();
  }, [selectedRegionId]);

  // ─────────────────────────────────────────
  // (C) shopId로 DB 로딩
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!shopId) {
      setLoading(false);
      setErrorMsg("shopId가 없어 수정 불가!");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        // partnershipsubmit 단건
        const { data: row, error: rowErr } = await supabase
          .from("partnershipsubmit")
          .select("*")
          .eq("id", shopId)
          .single();
        if (rowErr) throw rowErr;
        if (!row) throw new Error("해당 가게 정보를 찾을 수 없습니다!");

        // 테마 관계
        const { data: themeRel } = await supabase
          .from("partnershipsubmit_themes")
          .select("theme_id")
          .eq("submit_id", shopId);
        const themeIds = themeRel?.map((t) => t.theme_id) || [];

        // 폼 세팅
        setAdType(row.ad_type || "");
        setSelectedRegionId(row.region_id || null);
        setSelectedSubRegionId(row.sub_region_id || null);

        setCompanyName(row.company_name || "");
        setPhoneNumber(row.phone_number || "");
        setManagerContact(row.manager_contact || "");

        // 주차방법
        const knownPark = ["주차 가능(문의)", "건물 내 주차(문의)"];
        if (row.parking_type && knownPark.includes(row.parking_type)) {
          setParkingSelectVal(row.parking_type);
          setParkingDirect("");
        } else if (row.parking_type) {
          setParkingSelectVal("직접입력");
          setParkingDirect(row.parking_type);
        }

        setContactMethod(row.contact_method || "");
        setGreeting(row.greeting || "");
        setEventInfo(row.event_info || "");

        // 휴무일
        const knownHolidays = [
          "연중무휴",
          "월요일 휴무",
          "화요일 휴무",
          "수요일 휴무",
          "목요일 휴무",
          "금요일 휴무",
          "토요일 휴무",
          "일요일 휴무",
        ];
        if (row.holiday) {
          if (knownHolidays.includes(row.holiday)) {
            setHolidaySelectVal(row.holiday);
            setHolidayDirect("");
          } else {
            setHolidaySelectVal("직접입력");
            setHolidayDirect(row.holiday);
          }
        }

        // 영업시간
        if (row.open_hours === "24시간") {
          setIs24Hours(true);
          setStartTime("");
          setEndTime("");
        } else {
          setIs24Hours(false);
          if (row.open_hours?.includes("~")) {
            const [st, et] = row.open_hours.split("~").map((v) => v.trim());
            setStartTime(st || "");
            setEndTime(et || "");
          }
        }

        setAddressInput(row.address || "");
        setAddressStreet(row.address_street || "");
        setNearBuilding(row.near_building || "");
        setProgramInfo(row.program_info || "");
        setPostTitle(row.post_title || "");


        // 좌표
        if (row.lat) setLat(row.lat);
        if (row.lng) setLng(row.lng);

        setSelectedThemeIds(themeIds);

        setLoading(false);
      } catch (err) {
        console.error("DB 로딩 오류:", err);
        setErrorMsg(err.message);
        setLoading(false);
      }
    })();
  }, [shopId]);

  // ─────────────────────────────────────────
  // (D) 카카오 지도: 스크립트 로드 → 지도/마커 초기화
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!window.kakao) {
      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${
        process.env.NEXT_PUBLIC_KAKAO_KEY
      }&libraries=services&autoload=false`;
      script.onload = () => {
        window.kakao.maps.load(() => {
          initMap(lat, lng);
        });
      };
      document.head.appendChild(script);
    } else {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          initMap(lat, lng);
        });
      }
    }
  }, [lat]);

  function initMap(_lat, _lng) {
    if (!window.kakao?.maps) return;
    const kakao = window.kakao;
    const container = document.getElementById("myMapContainer"); // 고정 ID
    if (!container) return;

    const centerPos = new kakao.maps.LatLng(_lat, _lng);
    const options = { center: centerPos, level: 3 };
    const mapObj = new kakao.maps.Map(container, options);
    mapObjectRef.current = mapObj;

    // 마커
    const markerPos = new kakao.maps.LatLng(_lat, _lng);
    const marker = new kakao.maps.Marker({ position: markerPos });
    marker.setMap(mapObj);
    markerRef.current = marker;

    // 지도 클릭 → 좌표 갱신 + 주소 역지오코딩
    kakao.maps.event.addListener(mapObj, "click", (evt) => {
      const latlng = evt.latLng;
      marker.setPosition(latlng);
      setLat(latlng.getLat());
      setLng(latlng.getLng());

      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.coord2Address(
        latlng.getLng(),
        latlng.getLat(),
        (result, status) => {
          if (status === kakao.maps.services.Status.OK && result[0]) {
            const road = result[0].road_address;
            const jibun = result[0].address;
            if (road) {
              let fullRoad = road.address_name;
              if (road.building_name?.trim()) {
                fullRoad += " " + road.building_name;
              }
              setAddressStreet(fullRoad);
            } else {
              setAddressStreet("");
            }
            if (jibun) {
              setAddressInput(jibun.address_name);
            } else {
              setAddressInput("");
            }
          }
        }
      );
    });
  }

  // 주소 검색
  function handleAddressSearch() {
    if (!window.kakao?.maps) return;
    const kakao = window.kakao;
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(addressInput, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        const newLat = result[0].y;
        const newLng = result[0].x;
        setLat(newLat);
        setLng(newLng);

        // 지도/마커 갱신
        if (mapObjectRef.current && markerRef.current) {
          const moveLatLng = new kakao.maps.LatLng(newLat, newLng);
          mapObjectRef.current.setCenter(moveLatLng);
          markerRef.current.setPosition(moveLatLng);
        } else {
          initMap(newLat, newLng);
        }

        // 역지오코딩
        geocoder.coord2Address(newLng, newLat, (r2, st2) => {
          if (st2 === kakao.maps.services.Status.OK && r2[0]) {
            const road = r2[0].road_address;
            const jibun = r2[0].address;
            if (road) {
              let fullRoad = road.address_name;
              if (road.building_name?.trim()) {
                fullRoad += " " + road.building_name;
              }
              setAddressStreet(fullRoad);
            } else {
              setAddressStreet("");
            }
            if (jibun) {
              setAddressInput(jibun.address_name);
            } else {
              setAddressInput("");
            }
          }
        });
      } else {
        alert("주소를 찾을 수 없어요!");
      }
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddressSearch();
    }
  }

  // ─────────────────────────────────────────
  // (E) DB 저장
  // ─────────────────────────────────────────
  async function handleSave() {
    if (!shopId) {
      alert("shopId가 없어 저장 불가!");
      return;
    }

    const finalParking =
      parkingSelectVal === "직접입력" ? parkingDirect : parkingSelectVal;

    const finalHoliday =
      holidaySelectVal === "직접입력" ? holidayDirect : holidaySelectVal;

    let finalOpenHours = "";
    if (is24Hours) {
      finalOpenHours = "24시간";
    } else {
      finalOpenHours = `${startTime} ~ ${endTime}`;
    }

    const payload = {
      ad_type: adType || null,
      region_id: selectedRegionId || null,
      sub_region_id: selectedSubRegionId || null,

      company_name: companyName.trim(),
      phone_number: phoneNumber.trim(),
      manager_contact: managerContact.trim(),
      parking_type: finalParking.trim() || null,
      contact_method: contactMethod || null,
      greeting: greeting.trim(),
      event_info: eventInfo.trim(),
      holiday: finalHoliday || null,
      open_hours: finalOpenHours.trim(),
      address: addressInput.trim(),
      address_street: addressStreet.trim(),
      near_building: nearBuilding.trim(),
      program_info: programInfo.trim(),
      post_title: postTitle.trim(),
      lat: lat,
      lng: lng,
    };

    try {
      setLoading(true);

      // 1) partnershipsubmit 업데이트
      const { error: updErr } = await supabase
        .from("partnershipsubmit")
        .update(payload)
        .eq("id", shopId);
      if (updErr) throw new Error(updErr.message);

      // 2) 테마 M:N: 일단 삭제 → 다시 insert
      await supabase
        .from("partnershipsubmit_themes")
        .delete()
        .eq("submit_id", shopId);
      if (selectedThemeIds.length > 0) {
        const arr = selectedThemeIds.map((themeId) => ({
          submit_id: shopId,
          theme_id: themeId,
        }));
        const { error: thErr } = await supabase
          .from("partnershipsubmit_themes")
          .insert(arr);
        if (thErr) throw new Error(thErr.message);
      }

      alert("가게 정보가 성공적으로 수정되었습니다!");
      onClose && onClose();
    } catch (err) {
      console.error("가게 정보 수정 에러:", err);
      alert("저장 오류: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // 테마 클릭
  function handleThemeClick(themeId) {
    setSelectedThemeIds((prev) => {
      if (prev.includes(themeId)) {
        return prev.filter((id) => id !== themeId);
      }
      return [...prev, themeId];
    });
  }

  // 광고위치(VIP 등) 버튼 렌더링
  function renderAdButton(label) {
    return (
      <button
        type="button"
        onClick={() => {
          setAdType((prev) => (prev === label ? "" : label));
        }}
        className={`px-6 py-2 rounded border ${
          adType === label
            ? "bg-red-500 text-white border-red-500"
            : "bg-white text-gray-700 border-gray-300"
        } hover:opacity-80`}
      >
        {label}
      </button>
    );
  }

  // ─────────────────────────────────────────
  // (F) 렌더링
  // ─────────────────────────────────────────
  if (!shopId) {
    return (
      <div className="border border-gray-300 p-4 rounded mt-4">
        <p className="text-gray-600">가게 선택 정보(shopId)가 없습니다.</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="border border-gray-300 p-4 rounded mt-4">
        로딩 중...
      </div>
    );
  }
  if (errorMsg) {
    return (
      <div className="border border-red-300 p-4 rounded mt-4">
        <p className="text-red-600">오류: {errorMsg}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 rounded mt-2 hover:bg-gray-300"
          >
            닫기
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="border border-gray-300 p-4 rounded mt-4 bg-gray-50 text-sm">
      <h2 className="text-xl font-bold mb-3">가게 정보 수정 (카카오 맵)</h2>

      {/* 광고위치 */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">광고위치 (VIP, VIP+)</label>
        <div className="flex gap-3">
          {renderAdButton("VIP")}
          {renderAdButton("VIP+")}
          {/* 선택 안함 */}
          <button
            type="button"
            onClick={() => setAdType("")}
            className={`px-6 py-2 rounded border ${
              adType === ""
                ? "bg-red-500 text-white border-red-500"
                : "bg-white text-gray-700 border-gray-300"
            } hover:opacity-80`}
          >
            선택 안함
          </button>
        </div>
      </div>

      {/* 상위 지역 선택 */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">지역선택</label>
        {regions.length === 0 ? (
          <p className="text-gray-400">상위 지역이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {regions.map((r) => {
              const isSel = r.id === selectedRegionId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRegionId(r.id)}
                  className={`px-3 py-2 text-center rounded border ${
                    isSel
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-700 border-gray-300"
                  } hover:opacity-80`}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 하위 지역 선택 */}
      {childRegions.length > 0 && (
        <div className="mb-4">
          <label className="block font-semibold mb-1">세부 지역선택</label>
          <div className="grid grid-cols-7 gap-2">
            {childRegions.map((c) => {
              const isSel = c.id === selectedSubRegionId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedSubRegionId(c.id)}
                  className={`px-3 py-2 text-center rounded border ${
                    isSel
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-700 border-gray-300"
                  } hover:opacity-80`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 테마(M:N) */}
      {themes.length > 0 && (
        <div className="mb-4">
          <label className="block font-semibold mb-1">테마 선택</label>
          <div className="grid grid-cols-7 gap-2">
            {themes.map((th) => {
              const isSelected = selectedThemeIds.includes(th.id);
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => handleThemeClick(th.id)}
                  className={`px-3 py-2 text-center rounded border ${
                    isSelected
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-700 border-gray-300"
                  } hover:opacity-80`}
                >
                  {th.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 업체명, 전화번호, 담당자 연락처 */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <label className="w-32 font-semibold">업체명</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-2 py-1"
          placeholder="업체명"
        />
      </div>
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <label className="w-32 font-semibold">전화번호</label>
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-2 py-1"
          placeholder="ex) 010-xxxx-xxxx"
        />
      </div>
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <label className="w-32 font-semibold">담당자 연락처</label>
        <input
          type="text"
          value={managerContact}
          onChange={(e) => setManagerContact(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-2 py-1"
          placeholder="실제 연락가능 번호"
        />
      </div>

      {/* 휴무일 */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">업체 휴무일</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={holidaySelectVal}
            onChange={(e) => {
              setHolidaySelectVal(e.target.value);
              if (e.target.value !== "직접입력") setHolidayDirect("");
            }}
            className="border border-gray-300 rounded px-2 py-1 w-full sm:w-1/2"
          >
            <option value="">선택</option>
            <option value="직접입력">직접입력</option>
            <option value="연중무휴">연중무휴</option>
            <option value="월요일 휴무">월요일 휴무</option>
            <option value="화요일 휴무">화요일 휴무</option>
            <option value="수요일 휴무">수요일 휴무</option>
            <option value="목요일 휴무">목요일 휴무</option>
            <option value="금요일 휴무">금요일 휴무</option>
            <option value="토요일 휴무">토요일 휴무</option>
            <option value="일요일 휴무">일요일 휴무</option>
          </select>
          {holidaySelectVal === "직접입력" && (
            <input
              type="text"
              value={holidayDirect}
              onChange={(e) => setHolidayDirect(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full sm:w-1/2"
              placeholder="ex) 공휴일 휴무 / 둘째주 수요일 휴무 등"
            />
          )}
        </div>
      </div>

      {/* 주차방법 */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">주차방법</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={parkingSelectVal}
            onChange={(e) => {
              setParkingSelectVal(e.target.value);
              if (e.target.value !== "직접입력") setParkingDirect("");
            }}
            className="border border-gray-300 rounded px-2 py-1 w-full sm:w-1/2"
          >
            <option value="">선택</option>
            <option value="직접입력">직접입력</option>
            <option value="주차 가능(문의)">주차 가능(문의)</option>
            <option value="건물 내 주차(문의)">건물 내 주차(문의)</option>
          </select>
          {parkingSelectVal === "직접입력" && (
            <input
              type="text"
              value={parkingDirect}
              onChange={(ev) => setParkingDirect(ev.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full sm:w-1/2"
              placeholder="ex) 발렛 가능 / 인근 유료주차장 등"
            />
          )}
        </div>
      </div>

      {/* 샵형태, 후원, 예약방법 */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
       
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <label className="w-32 font-semibold">예약방법</label>
        <select
          value={contactMethod}
          onChange={(e) => setContactMethod(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-2 py-1"
        >
          <option value="">예약 방법 선택</option>
          <option value="전화/문자 모두 예약 가능">
            전화/문자 모두 예약 가능
          </option>
          <option value="문자로 예약 가능 (전화예약 불가)">
            문자로 예약 가능 (전화예약 불가)
          </option>
          <option value="전화로 예약 가능 (문자 예약 불가)">
            전화로 예약 가능 (문자 예약 불가)
          </option>
        </select>
      </div>
          </div>
      {/* 업체 소개, 이벤트 */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">업체 소개</label>
        <textarea
          rows={3}
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1"
          placeholder="ex) 사업장 소개"
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">업체 이벤트</label>
        <textarea
          rows={3}
          value={eventInfo}
          onChange={(e) => setEventInfo(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1"
          placeholder="ex) 주간할인, 시간대 할인 등"
        />
      </div>

      {/* 영업시간 */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">영업시간</label>
        <div className="flex items-center gap-4 flex-wrap">
          {/* 시작 */}
          <div className="flex items-center gap-1">
            <span>시작</span>
            <select
              disabled={is24Hours}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1"
            >
              <option value="">시간선택</option>
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {/* 종료 */}
          <div className="flex items-center gap-1">
            <span>종료</span>
            <select
              disabled={is24Hours}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1"
            >
              <option value="">시간선택</option>
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {/* 24시간 */}
          <button
            type="button"
            onClick={() => {
              if (!is24Hours) {
                setIs24Hours(true);
                setStartTime("");
                setEndTime("");
              } else {
                setIs24Hours(false);
              }
            }}
            className={`px-3 py-1 border rounded ${
              is24Hours
                ? "bg-gray-600 text-white border-gray-600"
                : "bg-white text-gray-700 border-gray-300"
            } hover:opacity-80`}
          >
            24시간
          </button>
        </div>
      </div>

      {/* 주소(지번, 도로명, 인근) + 지도 */}
      <div className="mb-0 mt-10">
        <div className="flex gap-5 items-center">
              <label className="block font-semibold mb-1">지번 주소</label>      <button
          type="button"
          onClick={handleAddressSearch}
          className="mb-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
        >
          주소 검색
        </button>
        </div>
        
        <div>

        <input
          type="text"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full border border-gray-300 rounded px-2 py-1 mb-2"
          placeholder="주소 입력 후 검색"
        />
        </div>
        

      </div>
      
        <label className="block font-semibold mb-1">인근 지하철/건물</label>
        <input
          type="text"
          value={nearBuilding}
          onChange={(e) => setNearBuilding(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 mb-2"
        />
         <label className="block font-semibold mt-2 mb-1">도로명 주소 (* 도로명 주소가 올바르게 매칭되는 지 확인해 주세요 * 직접 수정 불가.)</label>
        <input
          type="text"
          value={addressStreet}
          onChange={(e) => setAddressStreet(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 bg-gray-200 mb-3 diagonal-input"
          placeholder="지도 클릭 or 검색 시 자동 입력" disabled
        />
        {/* 지도 */}
        <div
          id="myMapContainer"
          style={{ width: "100%", height: "300px" }}
          className="border border-gray-300 rounded"
        />

   

      {/* lat / lng 수동 수정 */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <label className="w-32 font-semibold">위도(lat)</label>
        <input
          type="hidden"
          value={lat}
          onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
          className="flex-1 border border-gray-300 rounded px-2 py-1"
        />
      </div>
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <label className="w-32 font-semibold">경도(lng)</label>
        <input
          type="hidden"
          value={lng}
          onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
          className="flex-1 border border-gray-300 rounded px-2 py-1"
        />
      </div>

      {/* 프로그램(코스), 글제목, 관리사 */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">프로그램(코스)</label>
        <textarea
          rows={3}
          value={programInfo}
          onChange={(e) => setProgramInfo(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1"
          placeholder="ex) 코스 상세 설명\n관리자 승인 후 수정 가능"
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">글 제목</label>
        <input
          type="text"
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1"
          placeholder="ex) [지역/업체명] ..."
        />
      </div>


      {/* 저장/닫기 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          저장
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-700"
          >
            닫기
          </button>
        )}
      </div>
    </div>
  );
}