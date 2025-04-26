"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseF";
import CommentsUI from "./comment";

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL;

/** (A) 비로그인 시 localStorage 익명 UUID */
function generateAnonUuid() {
  return crypto.randomUUID();
}
function getOrCreateAnonUuid() {
  const key = "anon_user_id";
  let stored = localStorage.getItem(key);
  if (!stored) {
    stored = generateAnonUuid();
    localStorage.setItem(key, stored);
  }
  return stored;
}

/** (B) 스토리지 경로 빌더 */
function buildPublicImageUrl(path) {
  return `${baseUrl}/${path}`;
}

/** (C) 라벨-값 표시용 */
function DetailRow({ label, value }) {
  return (
    <div className="flex items-start mb-2">
      <span className="inline-block w-24 font-semibold text-gray-700 shrink-0">
        {label}
      </span>
      <span className="text-gray-800">{value || "-"}</span>
    </div>
  );
}

/** (D) 가격 포맷 */
function formatPrice(num) {
  if (!num || isNaN(num)) return "0";
  return Number(num).toLocaleString();
}

/** (E) 지도: 현재 샵 위치만 표시 (주변샵은 따로) */
function MapKakao({ address }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!address || !mapRef.current) return;
    const script = document.createElement("script");
    script.src =
         `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_KEY}&libraries=services&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(() => {
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780),
          level: 3,
        });
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
            map.setCenter(coords);
            new window.kakao.maps.Marker({ map, position: coords });
          } else {
            console.warn("주소를 찾을 수 없습니다:", address);
          }
        });
      });
    };
    document.head.appendChild(script);
  }, [address]);

  return <div ref={mapRef} className="w-full h-60 bg-gray-200" />;
}

/** (F) 주변샵: 30km 이내, 본인 제외, 거리순 */
function NearbyShops({ currentShopId }) {
  const [nearbyShops, setNearbyShops] = useState([]);

  // 거리 계산용
  function getDistance(lat1, lng1, lat2, lng2) {
    function deg2rad(deg) {
      return deg * (Math.PI / 180);
    }
    const R = 6371; // 지구 반지름(km)
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1); // ← 여기 버그없도록 꼭 lng2-lng1
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  useEffect(() => {
    if (!currentShopId) return;

    (async () => {
      try {
        // 1) 현재 샵 lat,lng
        const { data: currShop, error: csErr } = await supabase
          .from("partnershipsubmit")
          .select("lat, lng")
          .eq("id", currentShopId)
          .maybeSingle();

        if (csErr || !currShop) return;

        // 2) 모든 최종 승인 샵 불러오기
        const { data: allShops } = await supabase
          .from("partnershipsubmit")
          .select("id, lat, lng, company_name, address, near_building, thumbnail_url")
          .eq("final_admitted", true);

        if (!allShops) return;

        // 3) 거리 계산
        const lat1 = currShop.lat || 0;
        const lng1 = currShop.lng || 0;

        const withDist = allShops.map((shop) => {
          let dist = Infinity;
          if (shop.lat && shop.lng) {
            dist = getDistance(lat1, lng1, shop.lat, shop.lng);
          }
          return { ...shop, distance: dist };
        });

        // 4) 30km + 본인 제외 + 거리 정렬
        const filtered = withDist
          .filter((s) => s.id !== currentShopId)
          .filter((s) => s.distance <= 30)
          .sort((a, b) => a.distance - b.distance);

        setNearbyShops(filtered);
      } catch (err) {
        console.error("주변샵 불러오기 오류:", err);
      }
    })();
  }, [currentShopId]);

  if (!nearbyShops || nearbyShops.length === 0) {
    return <div className="text-gray-500">주변 30km 이내 다른 샵이 없습니다.</div>;
  }

  return (
    <div className="space-y-5">
      {nearbyShops.map((shop) => (
        <a
          key={shop.id}
          href={`/board/details/${shop.id}`}
          className="block rounded hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-40 h-[100px] flex-shrink-0 rounded overflow-hidden">
              {shop.thumbnail_url ? (
                <Image
                  src={baseUrl + "/" + shop.thumbnail_url}
                  alt={shop.company_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center text-sm text-gray-500 h-full">
                  No Image
                </div>
              )}
            </div>
            <div>
              <p className="font-bold">{shop.company_name}</p>
              <p className="text-sm text-gray-600">{shop.address || "주소 미입력"}</p>
              {shop.near_building && (
                <p className="text-sm text-gray-600 mt-0.5">
                  {shop.near_building}
                </p>
              )}
              <p className="text-sm text-blue-600 mt-1">
                거리: {shop.distance.toFixed(2)} km
              </p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

/** (G) 메인 모바일 상세페이지 컴포넌트 */
export default function DetailClientMobile({
  row,
  images,
  numericId,
  showBlurDefault,
  sectionsData,
  lowestPrice,
  nearbyShops
}) {
  const [session, setSession] = useState(null);
  const [showBlur, setShowBlur] = useState(showBlurDefault);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPopup, setLoadingPopup] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [views, setViews] = useState(row.views || 0);
  const [hasCountedView, setHasCountedView] = useState(false);

  // sections 상태 관리 (sectionsData를 초기값으로 사용)
  const [sections, setSections] = useState(sectionsData);

  // 세션 체크 및 성인 인증 상태 확인
  useEffect(() => {
    const checkAdultStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_adult")
            .eq("user_id", user.id)
            .single();
          
          if (profile?.is_adult) {
            setShowBlur(false);
          }
        }
      } catch (error) {
        console.error("[⚠️ 성인 인증 상태 확인 실패]", error);
      } finally {
        setIsLoading(false);
      }
    };

    // 초기 상태 확인
    checkAdultStatus();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        await checkAdultStatus();
      } else if (event === "SIGNED_OUT") {
        setShowBlur(showBlurDefault);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [showBlurDefault]);

  // 인증 완료 메시지 처리
  useEffect(() => {
    const listener = (event) => {
      if (event.data?.type === "MOK_AUTH_SUCCESS") {
        console.log("✅ 드림시큐리티 인증 완료 메시지 수신됨!");
        // 인증 완료 후 DB에서 다시 성인 여부 확인
        const recheckAdultStatus = async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("is_adult")
                .eq("user_id", user.id)
                .single();
              
              if (profile?.is_adult) {
                setShowBlur(false); // 🔓 블러 제거!
              }
            }
          } catch (error) {
            console.error("[⚠️ 인증 후 is_adult 재확인 실패]", error);
          }
        };
        recheckAdultStatus();
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  // 인증 요청 처리
  async function handleAuthClick() {
    setLoadingPopup(true);
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    console.log("🔍 인증 요청 직전 userId:", userId);
    console.log("📦 body payload:", JSON.stringify({ userId }));

    if (!userId) {
      alert("로그인이 필요합니다.");
      return;
    }

    const response = await fetch("/mok/mok_std_request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const payload = await response.json();
    if (payload.error) {
      alert("인증 요청 에러: " + payload.error);
      return;
    }

    setTimeout(() => setLoadingPopup(false), 2000);
    const isMobile = /Mobile|Android|iP(hone|od)|BlackBerry|IEMobile|Silk/i.test(
      navigator.userAgent
    );
    const popupType = isMobile ? "MB" : "WB";
    window.MOBILEOK.process(
      "https://www.yeogidot.com/mok/mok_std_request",
      popupType,
      "result"
    );
  }

  // (2) userId 결정 + 조회수
  let userId = null;
  if (session?.user?.id) {
    userId = session.user.id;
  } else if (typeof window !== "undefined") {
    userId = getOrCreateAnonUuid();
  }

  useEffect(() => {
    if (!userId || !numericId || hasCountedView) return;
    (async () => {
      try {
        const _24hAgo = new Date(Date.now() - 86400000).toISOString();
        const { data: logs } = await supabase
          .from("partnershipsubmit_views_log")
          .select("*")
          .eq("user_id", userId)
          .eq("partnershipsubmit_id", numericId)
          .gt("last_viewed_at", _24hAgo);

        if (!logs || logs.length === 0) {
          const { data: rowData } = await supabase
            .from("partnershipsubmit")
            .select("views")
            .eq("id", numericId)
            .single();

          const newViews = (rowData?.views || 0) + 1;
          const { data: updated } = await supabase
            .from("partnershipsubmit")
            .update({ views: newViews })
            .eq("id", numericId)
            .select("views")
            .single();

          if (updated) {
            setViews(updated.views);
          }

          await supabase.from("partnershipsubmit_views_log").upsert(
            {
              user_id: userId,
              partnershipsubmit_id: numericId,
              last_viewed_at: new Date().toISOString(),
            },
            { onConflict: "user_id, partnershipsubmit_id" }
          );
        }
      } catch (err) {
        console.error("조회수 오류:", err);
      }
      setHasCountedView(true);
    })();
  }, [userId, numericId, hasCountedView]);

  // (3) "가고싶다" 여부 체크
  useEffect(() => {
    if (!session?.user?.id || !numericId) return;
    supabase
      .from("wantToGo")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("partnershipsubmit_id", numericId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setIsSaved(true);
        }
      })
      .catch(console.error);
  }, [session, numericId]);

  // 토글
  async function handleSave() {
    if (!session?.user?.id) {
      alert("로그인 먼저 해주세요!");
      return;
    }
    if (isSaved) {
      // 해제
      try {
        const { error } = await supabase
          .from("wantToGo")
          .delete()
          .eq("user_id", session.user.id)
          .eq("partnershipsubmit_id", numericId);
        if (!error) {
          setIsSaved(false);
          alert("가고싶다 해제되었습니다!");
        } else {
          console.error("가고싶다 해제 오류:", error);
          alert("가고싶다 해제 오류!");
        }
      } catch (err) {
        console.error("handleSave delete error:", err);
        alert("가고싶다 해제 오류!");
      }
      return;
    }
    // 등록
    try {
      const { error } = await supabase.from("wantToGo").insert({
        user_id: session.user.id,
        partnershipsubmit_id: numericId,
      });
      if (!error) {
        setIsSaved(true);
        alert("가고싶다 목록에 저장되었습니다!");
      } else {
        console.error("가고싶다 저장 오류:", error);
        alert("가고싶다 저장 오류!");
      }
    } catch (err) {
      console.error("handleSave insert error:", err);
      alert("가고싶다 저장 오류!");
    }
  }

  // (4) 이미지 슬라이드
  const allImages = [];
  if (row.thumbnail_url) {
    allImages.push(buildPublicImageUrl(row.thumbnail_url));
  }
  if (images && images.length > 0) {
    images.forEach((imgObj) => {
      allImages.push(buildPublicImageUrl(imgObj.image_url));
    });
  }

  // 인덱스
  const [currentIndex, setCurrentIndex] = useState(0);

  // 직접 드래그(스와이프)
  const startXRef = useRef(0);

  function handleTouchStart(e) {
    startXRef.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startXRef.current;
    if (diff > 50) {
      handlePrev();
    } else if (diff < -50) {
      handleNext();
    }
  }

  function handlePrev() {
    setCurrentIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  }

  function handleNext() {
    setCurrentIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  }

  // (5) 코스 + 최저가
  const [loadingSections, setLoadingSections] = useState(true);

  // 섹션 토글 함수
  function toggleSectionOpen(secId) {
    setSections((prev) =>
      prev.map((s) => (s.id === secId ? { ...s, isOpen: !s.isOpen } : s))
    );
  }

  // (6) 리뷰 개수
  const [reviewCount, setReviewCount] = useState(0);

  // (8) 연락방법
  const fullContact = row.contact_method
    ? row.contact_method + (row.near_building ? ` / ${row.near_building}` : "")
    : row.near_building || "";

  // (9) 탭 + 스크롤
  const [activeTab, setActiveTab] = useState("info");
  const infoRef = useRef(null);
  const courseRef = useRef(null);
  const reviewRef = useRef(null);

  function getTabClass(tabId) {
    return `flex-1 py-3 text-center font-semibold ${
      activeTab === tabId ? "border-b-2 border-orange-500 tex-orange-500" : ""
    }`;
  }
  function scrollToRef(ref) {
    if (!ref.current) return;
    const offset = 50;
    const yPos = ref.current.offsetTop - offset;
    window.scrollTo({ top: yPos, behavior: "smooth" });
  }
  function handleTabClick(tabId) {
    setActiveTab(tabId);
    if (tabId === "info") {
      scrollToRef(infoRef);
    } else if (tabId === "course") {
      scrollToRef(courseRef);
    } else if (tabId === "review") {
      scrollToRef(reviewRef);
    }
  }

  return (
    <div className="relative max-w-md mx-auto bg-white">
      {/* 블러 오버레이 */}
      {showBlur && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-xl font-bold mb-2">
              {!session ? "로그인이 필요한 컨텐츠입니다" : "성인 인증이 필요한 컨텐츠입니다"}
            </p>
            <p className="text-gray-600 mb-4">
              {!session 
                ? "로그인 후 이용해주세요" 
                : "성인 인증 후 이용해주세요"}
            </p>
            {!session ? (
              <a 
                href="/login" 
                className="inline-block px-6 py-3 rounded-lg text-white font-medium
                  bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700
                  transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                로그인 하기
              </a>
            ) : (
              <button 
                onClick={handleAuthClick}
                className="inline-block px-6 py-3 rounded-lg text-white font-medium
                  bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700
                  transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                성인 인증 하기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 이미지 슬라이드 영역 */}
      <div className="relative w-full overflow-hidden bg-gray-100">
        <div 
          className="flex transition-transform duration-300"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {allImages.map((imgUrl, idx) => (
            <div
              key={idx}
              className="w-full flex-shrink-0 relative aspect-[4/3]"
            >
              <Image
                src={imgUrl}
                alt={`슬라이드 이미지 ${idx + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
                quality={100}
              />
            </div>
          ))}
        </div>
        
        {/* 이전/다음 버튼 (이미지가 2장이상일 때만) */}
        {allImages.length > 1 && (
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

        {/* 인덱스 표시 */}
        {allImages.length > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 text-sm bg-black/60 text-white rounded z-10">
            {currentIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* 탭 영역 */}
      <div
        className="sticky top-[50px] bg-white z-10 flex flex-col border-b border-gray-200"
        style={{ marginTop: 0 }}
      >
        <div className="flex">
          <button
            className={getTabClass("info")}
            onClick={() => handleTabClick("info")}
          >
            제휴사 소개
          </button>
          <button
            className={getTabClass("course")}
            onClick={() => handleTabClick("course")}
          >
            가격 안내
          </button>
          <button
            className={getTabClass("review")}
            onClick={() => handleTabClick("review")}
          >
            리뷰 {reviewCount}
          </button>
        </div>
      </div>

      {/* (C) 샵정보 섹션 */}
      <section id="info" ref={infoRef} className="px-4 pt-4 pb-6">
        <div className="p-2 text-center">
          <h2 className="text-xl font-bold">{row.company_name}</h2>
        </div>

        <div className="flex items-center justify-center gap-6 pb-2 text-gray-500">
          <div className="flex justify-center items-center gap-1">
            <img
              src="/icons/views.svg"
              alt="조회수"
              className="object-contain"
              style={{ width: "18px", height: "16px" }}
            />
            <span>{views.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <img
              src="/icons/man.svg"
              alt="리뷰수"
              className="object-contain"
              style={{ width: "18px", height: "14px" }}
            />
            <span>{reviewCount}</span>
          </div>
        </div>

        <MapKakao address={row.address} />

        <div className="mt-4">
          <DetailRow label="오시는길" value={row.address_street} />
          {lowestPrice > 0 && (
            <DetailRow label="최저가" value={`${formatPrice(lowestPrice)}원 ~`} />
          )}
          <DetailRow label="전화번호" value={row.phone_number} />
          <DetailRow label="연락방법" value={fullContact} />
          <DetailRow label="영업시간" value={row.open_hours} />
          <DetailRow label="주차안내" value={row.parking_type} />
        </div>
      </section>

      {/* 이벤트 정보 추가 */}
      {row.event_info?.trim() && (
        <section className="px-4 pt-4 pb-6 border-t">
          <h2 className="text-xl font-bold mb-2">이벤트</h2>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-gray-800 whitespace-pre-wrap text-sm">
              {row.event_info}
            </div>
          </div>
        </section>
      )}

      {/* (D) 코스안내 섹션 */}
      <section id="course" ref={courseRef} className="px-4 pt-4 pb-6 border-t">
        <h2 className="text-xl font-bold mb-2">가격안내</h2>
        <p className="text-sm text-gray-500 mb-2">
          {row.program_info || "※ 휴대폰 전원이 OFF인 경우, 샵 휴무 또는 예약이 꽉 찼을 수 있습니다."}
        </p>

        {sections.length === 0 ? (
          <div className="py-4 text-gray-500">등록된 가격 정보가 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {sections.map((sec) => (
              <div key={sec.id} className="border border-gray-200 rounded overflow-hidden">
                <button
                  onClick={() => toggleSectionOpen(sec.id)}
                  className="w-full flex items-center justify-between bg-gray-100 px-4 py-2"
                >
                  <span className="font-semibold text-gray-700">{sec.title}</span>
                  <span className="text-sm text-gray-400">{sec.isOpen ? "▲" : "▼"}</span>
                </button>

                {sec.isOpen && (
                  <div className="px-4 py-3">
                    {sec.courses.length === 0 ? (
                      <div className="text-sm text-gray-500">코스가 없습니다.</div>
                    ) : (
                      <ul className="space-y-2">
                        {sec.courses.map((c) => (
                          <li key={c.id}>
                            <div className="flex items-center justify-between">
                              <div className="text-gray-700">
                                {c.duration || "시간 미입력"}
                              </div>
                              {c.price > 0 && (
                                <div className="text-gray-800 font-semibold">
                                  {formatPrice(c.price) + " 원"}
                                </div>
                              )}
                            </div>
                            <div className="text-sm mt-1 text-gray-700 font-semibold">
                              {c.course_name}
                            </div>
                            {c.etc_info && (
                              <div className="text-xs text-gray-500 mt-1">
                                {c.etc_info}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* (E) 리뷰 섹션 */}
      <section id="review" ref={reviewRef} className="px-4 pt-4 pb-6 border-t">
        <h2 className="text-xl font-bold mb-2">리뷰 {reviewCount}</h2>
        <p className="text-sm text-gray-500 mb-2">
          {row.company_name} 업체에 리뷰를 남겨보세요!
        </p>
        <CommentsUI
          company_name={row.company_name}
          id={row.id}
          onNewComment={() => setReviewCount((n) => n + 1)}
        />
      </section>

      {/* (F) 주변샵 */}
      <section className="px-4 pt-4 pb-0 md:pb-20 border-t">
        <h2 className="text-xl font-bold mb-2">주변샵</h2>
        <NearbyShops currentShopId={numericId} />
      </section>

      {/* (G) 하단 fixed 바 (문자하기 / 전화하기) */}
      <div className="fixed bottom-[60px] left-0 w-full flex shadow-sm z-20">
        <button
          onClick={() => {
            if (!row.phone_number) return alert("전화번호 없음");
            window.location.href = `sms:${row.phone_number}`;
          }}
          className="flex-1 py-3.5 text-white bg-orange-500 text-center font-semibold relative after:absolute after:right-0 after:top-[20%] after:h-[60%] after:w-[1px] after:bg-white/20"
        >
          문자하기
        </button>
        <button
          onClick={() => {
            if (!row.phone_number) return alert("전화번호 없음");
            window.location.href = `tel:${row.phone_number}`;
          }}
          className="flex-1 py-3.5 text-white bg-orange-500 text-center font-semibold"
        >
          전화하기
        </button>
      </div>
    </div>
  );
}