"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";
import SubmitForm from "@/(main)/(homefunction)/partnership/components/SubmitForm";
import ImageUpload from "@/(main)/(homefunction)/partnership/components/ImageUpload";

export default function NewListingPage() {
  const router = useRouter();

  // isMaster 값 (true이면 자동 승인/최종승인 처리)
  const isMaster = true; // 필요에 따라 true로 변경하세요.

  // ──────────────────────────────────────────────────────────
  // 1) 로그인 세션 & 내가 올린 신청서 리스트
  // ──────────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [mySubmits, setMySubmits] = useState([]);

  // 현재 수정/업로드하려는 submit.id
  const [editId, setEditId] = useState(null);
  // "is_admitted" 여부 (true면 승인완료된 신청서)
  const [editIsAdmitted, setEditIsAdmitted] = useState(false);

  // 이미지 업로드 섹션으로 스크롤 이동해야 하는지 여부
  const [shouldFocusImage, setShouldFocusImage] = useState(false);
  const imageUploadSectionRef = useRef(null);

  // ──────────────────────────────────────────────────────────
  // 2) 로그인 여부 체크
  // ──────────────────────────────────────────────────────────
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

  async function loadMySubmits(userId) {
    try {
      const { data, error } = await supabase
        .from("partnershipsubmit")
        .select("id, post_title, is_admitted")
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

  // ──────────────────────────────────────────────────────────
  // 2-1) "수정하기" or "내 가게 관리" 버튼 → handleEditClick
  // ──────────────────────────────────────────────────────────
  async function handleEditClick(submitId, isAdmitted) {
    setEditId(submitId);
    setEditIsAdmitted(isAdmitted);
    // 승인완료된 신청서면 이미지 업로드 섹션으로 스크롤
    setShouldFocusImage(isAdmitted);

    try {
      const { data: row, error } = await supabase
        .from("partnershipsubmit")
        .select("*")
        .eq("id", submitId)
        .single();

      if (error || !row) {
        alert("신청서 불러오기 오류");
        return;
      }

      // 가져온 row로 state들 세팅
      setAdType(row.ad_type || "");
      setSelectedRegionId(row.region_id || null);
      setPendingSubRegionId(row.sub_region_id || null);
      setCompanyName(row.company_name || "");
      setPhoneNumber(row.phone_number || "");

      // 주차방법
      const knownParkingValues = ["주차 가능(문의)", "건물 내 주차(문의)"];
      if (knownParkingValues.includes(row.parking_type)) {
        setParkingSelectVal(row.parking_type);
        setParkingDirect("");
      } else {
        setParkingSelectVal("직접입력");
        setParkingDirect(row.parking_type || "");
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
      if (knownHolidays.includes(row.holiday)) {
        setHolidaySelectVal(row.holiday);
        setHolidayDirect("");
      } else {
        if (row.holiday) {
          setHolidaySelectVal("직접입력");
          setHolidayDirect(row.holiday);
        } else {
          setHolidaySelectVal("");
          setHolidayDirect("");
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
        } else {
          setStartTime("");
          setEndTime("");
        }
      }

      setAddressInput(row.address || "");
      setAddressStreet(row.address_street || "");
      setNearBuilding(row.near_building || "");
      setProgramInfo(row.program_info || "");
      setPostTitle(row.post_title || "");

      // 테마 M:N
      const { data: themeRows } = await supabase
        .from("partnershipsubmit_themes")
        .select("theme_id")
        .eq("submit_id", submitId);
      if (themeRows) {
        const themeIds = themeRows.map((t) => t.theme_id);
        setSelectedThemeIds(themeIds);
      }

      // 지도
      if (row.lat && row.lng) {
        setMarkerPosition({ lat: row.lat, lng: row.lng });
      }
    } catch (err) {
      console.error("handleEditClick 오류:", err);
    }
  }

  // ──────────────────────────────────────────────────────────
  // 3) 일반 폼 상태
  // ──────────────────────────────────────────────────────────
  const [adType, setAdType] = useState("");
  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [childRegions, setChildRegions] = useState([]);
  const [selectedSubRegionId, setSelectedSubRegionId] = useState(null);
  const [pendingSubRegionId, setPendingSubRegionId] = useState(null);

  // 휴무일 관련
  const [holidaySelectVal, setHolidaySelectVal] = useState("");
  const [holidayDirect, setHolidayDirect] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [managerContact, setManagerContact] = useState("");

  const [parkingSelectVal, setParkingSelectVal] = useState("");
  const [parkingDirect, setParkingDirect] = useState("");

  const [contactMethod, setContactMethod] = useState("");
  const [greeting, setGreeting] = useState("");
  const [eventInfo, setEventInfo] = useState("");

  const [is24Hours, setIs24Hours] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeOptions, setTimeOptions] = useState([]);

  const [addressInput, setAddressInput] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [nearBuilding, setNearBuilding] = useState("");

  const [programInfo, setProgramInfo] = useState("");
  const [postTitle, setPostTitle] = useState("");

  const [themes, setThemes] = useState([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState([]);

  const mapRef = useRef(null);
  const mapObjectRef = useRef(null);
  const markerRef = useRef(null);
  const [markerPosition, setMarkerPosition] = useState({
    lat: 37.497951,
    lng: 127.027618,
  });

  // ──────────────────────────────────────────────────────────
  // 4) 지역(상위/하위) & 테마 로드
  // ──────────────────────────────────────────────────────────
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

    async function fetchThemes() {
      try {
        const { data, error } = await supabase
          .from("themes")
          .select("id, name")
          .order("id", { ascending: true });
        if (!error && data) {
          setThemes(data);
        }
      } catch (err) {
        console.error("fetchThemes 오류:", err);
      }
    }
    fetchThemes();
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
        if (pendingSubRegionId) {
          setSelectedSubRegionId(pendingSubRegionId);
          setPendingSubRegionId(null);
        } else {
          setSelectedSubRegionId(null);
        }
      } else {
        setChildRegions([]);
        setSelectedSubRegionId(null);
      }
    }
    fetchChildRegions();
  }, [selectedRegionId]);

  // 30분 간격
  useEffect(() => {
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

  // 지도 로직
  useEffect(() => {
    if (!window.kakao) {
      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&libraries=services&autoload=false`;
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
  }, [markerPosition.lat]);

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
      geocoder.coord2Address(
        latlng.getLng(),
        latlng.getLat(),
        (result, status) => {
          if (status === kakao.maps.services.Status.OK) {
            const road = result[0].road_address;
            const jibun = result[0].address;
            if (road) {
              let fullRoad = road.address_name;
              if (road.building_name && road.building_name.trim()) {
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
        geocoder.coord2Address(newLng, newLat, (res2, stat2) => {
          if (stat2 === kakao.maps.services.Status.OK) {
            const road = res2[0].road_address;
            const jibun = res2[0].address;
            if (road) {
              let fullRoad = road.address_name;
              if (road.building_name && road.building_name.trim()) {
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

  // ──────────────────────────────────────────────────────────
  // 6) 폼 검증 & 전송
  // ──────────────────────────────────────────────────────────
  function validateForm() {
    if (!selectedRegionId) return "지역을 선택해주세요.";
    if (!companyName.trim()) return "업체명은 필수입니다.";
    if (!phoneNumber.trim()) return "전화번호 필수입니다.";
    if (!managerContact.trim()) return "담당자 연락처 필수입니다.";
    const finalParkingType =
      parkingSelectVal === "직접입력" ? parkingDirect : parkingSelectVal;
    if (!finalParkingType.trim()) return "주차방법을 입력(혹은 선택)해주세요.";
    if (!is24Hours && (!startTime || !endTime)) {
      return "영업시간(시작/종료)을 입력해주세요.";
    }
    if (!addressInput.trim() || !addressStreet.trim()) {
      return "지번 주소와 도로명 주소 모두 필요합니다. 지도를 클릭하거나 검색을 다시 확인해주세요.";
    }
    if (!programInfo.trim()) return "프로그램(코스) 정보를 입력해주세요.";
    if (!contactMethod.trim()) return "연락 방법을 선택해주세요.";
    if (!greeting.trim()) return "업체 소개를 입력해주세요.";
    if (!eventInfo.trim()) return "업체 이벤트 내용을 입력해주세요.";
    if (!postTitle.trim()) return "글 제목을 입력해주세요.";
    if (selectedThemeIds.length === 0)
      return "테마를 최소 1개 이상 선택해주세요.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const msg = validateForm();
    if (msg) {
      alert(msg);
      return;
    }
    if (!editId) {
      doSubmitOrUpdate(false);
    } else {
      doSubmitOrUpdate(true);
    }
  }

  async function doSubmitOrUpdate(isEdit) {
    const finalParkingType =
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
      ad_type: adType,
      region_id: selectedRegionId,
      sub_region_id: selectedSubRegionId,
      company_name: companyName,
      phone_number: phoneNumber,
      manager_contact: managerContact,
      parking_type: finalParkingType,
      contact_method: contactMethod,
      greeting,
      event_info: eventInfo,
      holiday: finalHoliday || null,
      open_hours: finalOpenHours,
      address: addressInput,
      address_street: addressStreet,
      near_building: nearBuilding,
      program_info: programInfo,
      post_title: postTitle,
      themes: selectedThemeIds,
      lat: markerPosition.lat,
      lng: markerPosition.lng,
    };

    // 만약 isMaster가 true이면 자동 승인 및 최종승인 처리
    if (isMaster) {
      payload.isMaster = true;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      alert("로그인 상태가 아닙니다.");
      return;
    }

    try {
      let url = "/api/partnership";
      let method = "POST";
      if (isEdit) {
        url = `/api/partnership?id=${editId}`;
        method = "PUT";
      }
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      alert(isEdit ? "수정 완료!" : "등록 완료!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("오류 발생: " + err.message);
    }
  }

  useEffect(() => {
    if (shouldFocusImage && editIsAdmitted && imageUploadSectionRef.current) {
      setTimeout(() => {
        imageUploadSectionRef.current.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [shouldFocusImage, editIsAdmitted]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SubmitForm
          editId={editId}
          isMaster={isMaster}
          adType={adType}
          setAdType={setAdType}
          regions={regions}
          selectedRegionId={selectedRegionId}
          setSelectedRegionId={setSelectedRegionId}
          childRegions={childRegions}
          selectedSubRegionId={selectedSubRegionId}
          setSelectedSubRegionId={setSelectedSubRegionId}
          themes={themes}
          selectedThemeIds={selectedThemeIds}
          setSelectedThemeIds={setSelectedThemeIds}
          companyName={companyName}
          setCompanyName={setCompanyName}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          managerContact={managerContact}
          setManagerContact={setManagerContact}
          holidaySelectVal={holidaySelectVal}
          setHolidaySelectVal={setHolidaySelectVal}
          holidayDirect={holidayDirect}
          setHolidayDirect={setHolidayDirect}
          parkingSelectVal={parkingSelectVal}
          setParkingSelectVal={setParkingSelectVal}
          parkingDirect={parkingDirect}
          setParkingDirect={setParkingDirect}
          contactMethod={contactMethod}
          setContactMethod={setContactMethod}
          greeting={greeting}
          setGreeting={setGreeting}
          eventInfo={eventInfo}
          setEventInfo={setEventInfo}
          is24Hours={is24Hours}
          setIs24Hours={setIs24Hours}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          timeOptions={timeOptions}
          addressInput={addressInput}
          setAddressInput={setAddressInput}
          addressStreet={addressStreet}
          setAddressStreet={setAddressStreet}
          nearBuilding={nearBuilding}
          setNearBuilding={setNearBuilding}
          openHours={""}
          setOpenHours={() => {}}
          programInfo={programInfo}
          setProgramInfo={setProgramInfo}
          postTitle={postTitle}
          setPostTitle={setPostTitle}
          mapRef={mapRef}
          handleAddressSearch={handleAddressSearch}
          handleKeyDown={handleKeyDown}
          markerPosition={markerPosition}
        />
        <ImageUpload
          editId={editId}
          editIsAdmitted={editIsAdmitted}
          imageUploadSectionRef={imageUploadSectionRef}
        />
        <div className="flex justify-center">
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            {editId ? "수정하기" : "등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}