"use client";
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseF"; // anonKey 기반 createClient

export default function NewListingPage() {
  // ----------------------------------------------------------------
  // 1) 로그인 세션 & 내가 올린 신청서 리스트
  // ----------------------------------------------------------------
  const [session, setSession] = useState(null);
  const [mySubmits, setMySubmits] = useState([]);

  // 현재 수정/업로드하려는 submit.id
  const [editId, setEditId] = useState(null);
  // "is_admitted" 여부 (true면 승인완료된 신청서)
  const [editIsAdmitted, setEditIsAdmitted] = useState(false);

  // 이미지 업로드 섹션으로 스크롤 이동해야 하는지 여부
  const [shouldFocusImage, setShouldFocusImage] = useState(false);

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

  // 내가 올린 신청서 목록 불러오기
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

  // ----------------------------------------------------------------
  // 2) "수정하기" or "이미지 업로드" 버튼 → handleEditClick
  // ----------------------------------------------------------------
  async function handleEditClick(submitId, isAdmitted) {
    setEditId(submitId);
    setEditIsAdmitted(isAdmitted);

    // 승인완료건이면 이미지 업로드 섹션으로 스크롤 이동
    setShouldFocusImage(isAdmitted);

    // 기존 내용 불러오기
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

      // 폼 값 설정
      setAdType(row.ad_type || "");
      setSelectedRegionId(row.region_id || null);
      setPendingSubRegionId(row.sub_region_id || null);
      setCompanyName(row.company_name || "");
      setPhoneNumber(row.phone_number || "");
      setManagerContact(row.manager_contact || "");
      setParkingType(row.parking_type || "");
      setShopType(row.shop_type || "");
      setHashtagSponsor(row.sponsor || "");
      setContactMethod(row.contact_method || "");
      setGreeting(row.greeting || "");
      setEventInfo(row.event_info || "");
      // ★ 지번 vs 도로명 분리
      setAddressInput(row.address || "");         
      setAddressStreet(row.address_street || ""); 
      setNearBuilding(row.near_building || "");
      setOpenHours(row.open_hours || "");
      setProgramInfo(row.program_info || "");
      setPostTitle(row.post_title || "");
      setManagerDesc(row.manager_desc || "");

      // 테마(M:N)
      const { data: themeRows, error: themeErr } = await supabase
        .from("partnershipsubmit_themes")
        .select("theme_id")
        .eq("submit_id", submitId);

      if (!themeErr && themeRows) {
        const themeIds = themeRows.map((t) => t.theme_id);
        setSelectedThemeIds(themeIds);
      }

      // 지도 좌표도 있으면
      if (row.lat && row.lng) {
        setMarkerPosition({ lat: row.lat, lng: row.lng });
      }
    } catch (err) {
      console.error("handleEditClick 오류:", err);
    }
  }

  // ----------------------------------------------------------------
  // 3) 일반 폼 상태
  // ----------------------------------------------------------------
  const [adType, setAdType] = useState("");

  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [childRegions, setChildRegions] = useState([]);
  const [selectedSubRegionId, setSelectedSubRegionId] = useState(null);
  const [pendingSubRegionId, setPendingSubRegionId] = useState(null);

  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [managerContact, setManagerContact] = useState("");
  const [parkingType, setParkingType] = useState("");
  const [shopType, setShopType] = useState("");
  const [hashtagSponsor, setHashtagSponsor] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [greeting, setGreeting] = useState("");
  const [eventInfo, setEventInfo] = useState("");

  // ★ 동시에 지번, 도로명 둘 다
  const [addressInput, setAddressInput] = useState("");   // 지번
  const [addressStreet, setAddressStreet] = useState(""); // 도로명

  const [nearBuilding, setNearBuilding] = useState("");
  const [openHours, setOpenHours] = useState("");
  const [programInfo, setProgramInfo] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [managerDesc, setManagerDesc] = useState("");

  // 테마 (M:N)
  const [themes, setThemes] = useState([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState([]);

  function handleThemeClick(themeId) {
    setSelectedThemeIds((prev) => {
      if (prev.includes(themeId)) {
        return prev.filter((id) => id !== themeId);
      }
      return [...prev, themeId];
    });
  }

  // ----------------------------------------------------------------
  // 4) 지역(상위/하위) 로드
  // ----------------------------------------------------------------
  useEffect(() => {
    // 상위 지역
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

    // 테마
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
    // 하위 지역
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

  // ----------------------------------------------------------------
  // 5) 지도
  // ----------------------------------------------------------------
  const mapRef = useRef(null);
  const mapObjectRef = useRef(null);
  const markerRef = useRef(null);

  const [markerPosition, setMarkerPosition] = useState({
    lat: 37.497951,
    lng: 127.027618,
  });

  // 지도 초기화
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

    // 지도 클릭 → coord2Address
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
            const road = result[0].road_address;   // 도로명
            const jibun = result[0].address;       // 지번
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

  // “주소 입력 후 검색” 클릭 시 → addressSearch → (좌표만 얻고) → coord2Address로 다시 변환
  // → 지번 + 도로명 모두 저장
  function handleAddressSearch() {
    const { kakao } = window;
    if (!kakao || !kakao.maps) return;

    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(addressInput, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        // 좌표 (위/경도) 추출
        const newLat = result[0].y;
        const newLng = result[0].x;
        setMarkerPosition({ lat: newLat, lng: newLng });

        // 지도/마커 이동
        if (mapObjectRef.current && markerRef.current) {
          const moveLatLng = new kakao.maps.LatLng(newLat, newLng);
          mapObjectRef.current.setCenter(moveLatLng);
          markerRef.current.setPosition(moveLatLng);
        } else {
          initMap(newLat, newLng);
        }

        // 다시 coord2Address로 “지번+도로명 둘 다” 가져옴
        geocoder.coord2Address(newLng, newLat, (res2, stat2) => {
          if (stat2 === kakao.maps.services.Status.OK) {
            const road = res2[0].road_address; // 도로명
            const jibun = res2[0].address;     // 지번

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

  // ----------------------------------------------------------------
  // 6) 폼 검증 & 전송
  // ----------------------------------------------------------------
  function validateForm() {
    if (!adType) return "상품(광고위치)을 선택해주세요.";
    if (!selectedRegionId) return "지역을 선택해주세요.";
    if (!companyName.trim()) return "업체명은 필수입니다.";
    if (!phoneNumber.trim()) return "전화번호 필수입니다.";
    if (!managerContact.trim()) return "담당자 연락처 필수입니다.";
    if (!parkingType) return "주차방법을 선택해주세요.";
    if (!shopType) return "샵형태를 선택해주세요.";
    // "둘 다"가 항상 필요하면:
    if (!addressInput.trim() || !addressStreet.trim()) {
      return "지번 주소와 도로명 주소 모두 필요합니다. 지도를 클릭하거나 검색을 다시 확인해주세요.";
    }
    if (!openHours.trim()) return "영업시간을 입력해주세요.";
    if (!programInfo.trim()) return "프로그램(코스) 정보를 입력해주세요.";
    if (!contactMethod.trim()) return "연락 방법을 입력해주세요.";
    if (!greeting.trim()) return "인사말을 입력해주세요.";
    if (!eventInfo.trim()) return "이벤트 내용을 입력해주세요.";
    if (!postTitle.trim()) return "글 제목을 입력해주세요.";
    if (!managerDesc.trim()) return "관리사 정보를 입력해주세요.";
    if (selectedThemeIds.length === 0) return "테마를 최소 1개 이상 선택해주세요.";
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
      // 지번 vs 도로명 모두 전달
      address: addressInput,         // 지번 주소
      address_street: addressStreet, // 도로명 주소
      near_building: nearBuilding,
      open_hours: openHours,
      program_info: programInfo,
      post_title: postTitle,
      manager_desc: managerDesc,
      themes: selectedThemeIds,
      lat: markerPosition.lat,
      lng: markerPosition.lng
    };

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

  // ----------------------------------------------------------------
  // 7) 이미지 업로드
  // ----------------------------------------------------------------
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const thumbnailFileInputRef = useRef(null);

  function handleThumbnailChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }

  const [multiFiles, setMultiFiles] = useState([]);
  const [multiPreviews, setMultiPreviews] = useState([]);
  const multiFileInputRef = useRef(null);

  function handleMultiFilesChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedCount = 10 - multiFiles.length;
    const addFiles = files.slice(0, allowedCount);

    const newFileList = [...multiFiles, ...addFiles];
    setMultiFiles(newFileList);

    const newPreviews = newFileList.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    setMultiPreviews(newPreviews);
  }

  async function handleImageUploadClick() {
    if (!editId) {
      alert("어느 신청서인지 알 수 없습니다. 먼저 등록/수정 후 다시 시도해주세요!");
      return;
    }

    try {
      // 썸네일
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split(".").pop();
        const fileName = `thumb_${editId}_${Date.now()}.${fileExt}`;
        const { data: thumbData, error: thumbErr } = await supabase.storage
          .from("gunma")
          .upload(fileName, thumbnailFile);

        if (thumbErr) {
          alert("썸네일 업로드 실패: " + thumbErr.message);
          return;
        }
        thumbnailUrl = thumbData.path;

        const { error: updateErr } = await supabase
          .from("partnershipsubmit")
          .update({ thumbnail_url: thumbnailUrl })
          .eq("id", editId);
        if (updateErr) {
          alert("썸네일 DB 업데이트 실패: " + updateErr.message);
          return;
        }
      }

      // 추가 이미지
      for (let i = 0; i < multiFiles.length; i++) {
        const file = multiFiles[i];
        const ext = file.name.split(".").pop();
        const fname = `multi_${editId}_${Date.now()}_${i}.${ext}`;
        const { data: fileData, error: fileErr } = await supabase.storage
          .from("gunma")
          .upload(fname, file);

        if (fileErr) {
          alert(`이미지(${file.name}) 업로드 실패: ${fileErr.message}`);
          return;
        }

        const imageUrl = fileData.path;
        const { error: insertErr } = await supabase
          .from("partnershipsubmit_images")
          .insert({ submit_id: editId, image_url: imageUrl });

        if (insertErr) {
          alert(`DB에 이미지 경로 저장 실패: ${insertErr.message}`);
          return;
        }
      }

      alert("이미지 업로드 완료!");
      window.location.reload();
    } catch (err) {
      alert("이미지 업로드 중 오류: " + err.message);
    }
  }

  // ----------------------------------------------------------------
  // 8) 승인완료건 클릭 → 이미지 업로드 섹션 스크롤
  // ----------------------------------------------------------------
  const imageUploadSectionRef = useRef(null);

  useEffect(() => {
    if (shouldFocusImage && editIsAdmitted && imageUploadSectionRef.current) {
      setTimeout(() => {
        imageUploadSectionRef.current.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [shouldFocusImage, editIsAdmitted]);

  // ----------------------------------------------------------------
  // 9) 렌더링
  // ----------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* ===================== 신청서 리스트 ===================== */}
      {mySubmits.length > 0 && (
        <div className="mb-6 bg-gray-100 border border-gray-300 p-4 rounded">
          <div className="text-gray-700 mb-2 font-semibold">
            신청서 리스트 ({mySubmits.length}건)
          </div>
          <ul className="list-disc pl-5 space-y-2">
            {mySubmits.map((submit) => {
              const isAdmitted = submit.is_admitted;
              const statusLabel = isAdmitted ? "승인완료" : "심사 중";
              const buttonText = isAdmitted ? "이미지 업로드" : "수정하기";
              const title = submit.post_title?.trim() || "무제";

              return (
                <li key={submit.id} className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-sm bg-gray-200 rounded">
                    {statusLabel}
                  </span>
                  <span className="font-medium">[{title}]</span>
                  <button
                    type="button"
                    onClick={() => handleEditClick(submit.id, isAdmitted)}
                    className="px-2 py-1 text-sm bg-green-200 rounded hover:bg-green-300 ml-2"
                  >
                    {buttonText}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ===================== 일반 폼 ===================== */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold mb-4">
          {editId
            ? editIsAdmitted
              ? "업체 정보 (승인완료) + 이미지 업로드"
              : "업체 정보 수정 (심사중)"
            : "업체 등록 (Kakao 지도)"
          }
        </h1>

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

        {/* 상위 지역 */}
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

        {/* 하위 지역 */}
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

        {/* 테마(M:N) */}
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

        {/* 연락방법 */}
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

        {/* 인사말 */}
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

        {/* 이벤트 */}
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

        {/* 주소 (지번) + 지도 */}
        <div>
          <label className="block font-semibold mb-1">
            지번 주소 <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <input
              type="text"
              placeholder="주소 입력 후 검색"
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
            placeholder="인근 지하철/건물"
            value={nearBuilding}
            onChange={(e) => setNearBuilding(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 w-full mb-2"
          />

          <div
            ref={mapRef}
            style={{ width: "100%", height: "300px" }}
            className="border border-gray-300 rounded"
          />
        </div>

        {/* 도로명 주소 */}
        <div>
          <label className="block font-semibold mb-1">
            도로명 주소 (자동)
          </label>
          <input
            type="text"
            placeholder="지도 클릭 or 검색 시 자동 입력됩니다."
            value={addressStreet}
            onChange={(e) => setAddressStreet(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 mb-2"
          />
        </div>

        {/* 영업시간 */}
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

        {/* 프로그램(코스) */}
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

        {/* 글 제목 */}
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

        {/* 관리사 */}
        <div>
          <label className="block font-semibold mb-1">
            관리사 <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="예) 보나(23) 주간, 빛나(32) 중간..."
            value={managerDesc}
            onChange={(e) => setManagerDesc(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1"
            rows={3}
          />
        </div>

        {/* 등록/수정 버튼 */}
        <div>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            {editId ? "수정하기" : "등록하기"}
          </button>
        </div>
      </form>

      {/* ===================== 이미지 업로드 섹션 ===================== */}
      {editId && editIsAdmitted && (
        <div
          ref={imageUploadSectionRef}
          className="mt-8 p-4 bg-blue-50 border border-blue-300 rounded"
        >
          <h2 className="text-xl font-bold mb-4 text-blue-700">
            이미지 업로드 섹션
          </h2>
          <p className="text-sm text-gray-700 mb-4">
            이미지로 더욱 매력적인 업체정보를 꾸며보세요!
          </p>

          {/* 썸네일 */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">썸네일 이미지</label>
            <div className="flex gap-2 flex-wrap">
              <div
                className="w-24 h-28 border border-gray-300 rounded-md flex items-center justify-center text-gray-500 relative cursor-pointer"
                onClick={() => {
                  if (thumbnailFileInputRef.current) {
                    thumbnailFileInputRef.current.click();
                  }
                }}
              >
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="썸네일 미리보기"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l3-3h12l3 3M4 8h16v11H4V8z"
                      />
                    </svg>
                    <div className="mt-1 text-sm font-semibold">Thumb</div>
                  </>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                ref={thumbnailFileInputRef}
                className="hidden"
                onChange={handleThumbnailChange}
              />
            </div>
          </div>

          {/* 여러 이미지 */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">
              추가 이미지 (여러 장)
            </label>
            <div className="flex gap-2 flex-wrap">
              <div
                className="w-24 h-28 border border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 relative cursor-pointer"
                onClick={() => {
                  if (multiFiles.length < 10 && multiFileInputRef.current) {
                    multiFileInputRef.current.click();
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l3-3h12l3 3M4 8h16v11H4V8z"
                  />
                </svg>
                <div className="mt-1 text-sm font-semibold">
                  {multiFiles.length}/10
                </div>
              </div>

              {multiPreviews.map((p, idx) => (
                <div
                  key={idx}
                  className="w-24 h-28 border border-gray-300 rounded-md overflow-hidden relative flex items-center justify-center"
                >
                  <img
                    src={p.url}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={multiFileInputRef}
              className="hidden"
              onChange={handleMultiFilesChange}
            />
          </div>

          <button
            type="button"
            onClick={handleImageUploadClick}
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            이미지 업로드하기
          </button>
        </div>
      )}
    </div>
  );
}