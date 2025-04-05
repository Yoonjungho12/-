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
      "//dapi.kakao.com/v2/maps/sdk.js?appkey=3be0573fb7f2f9b128b58dc1b0342b97&libraries=services&autoload=false";
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
            <div className="relative w-40 h-25 flex-shrink-0 rounded overflow-hidden">
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
export default function DetailClientMobile({ row, images, numericId }) {
  // 세션 관련
  const [session, setSession] = useState(null);
  const [isAdultUser, setIsAdultUser] = useState(false);
  const [isAdultContent, setIsAdultContent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showBlur, setShowBlur] = useState(true);
  // "가고싶다" 여부
  const [isSaved, setIsSaved] = useState(false);
  // 조회수
  const [views, setViews] = useState(row.views || 0);
  const [hasCountedView, setHasCountedView] = useState(false);

  // 세션 체크 및 성인 여부 확인
  useEffect(() => {
    // 초기 세션 체크
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error("[getSession error]:", error);
        } else {
          setSession(data.session || null);
          if (data.session?.user) {
            // 성인 여부 확인
            supabase
              .from('profiles')
              .select('is_adult')
              .eq('user_id', data.session.user.id)
              .single()
              .then(({ data: profile, error: profileError }) => {
                if (profileError) {
                  console.error("[profile error]:", profileError);
                } else {
                  setIsAdultUser(profile?.is_adult || false);
                }
              });
          }
        }
      })
      .catch((err) => {
        console.error("[getSession catch]:", err);
      });

    // 세션 변경 감지
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (event === "SIGNED_IN" && newSession?.user?.id) {
          // 성인 여부 확인
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_adult')
            .eq('user_id', newSession.user.id)
            .single();
          
          setIsAdultUser(profile?.is_adult || false);

          // 익명 사용자 처리
          const realId = newSession.user.id;
          const anonId = localStorage.getItem("anon_user_id");
          if (anonId && anonId !== realId) {
            await supabase
              .from("partnershipsubmit_views_log")
              .update({ user_id: realId })
              .eq("user_id", anonId);
            localStorage.setItem("anon_user_id", realId);
          }
        } else if (event === "SIGNED_OUT") {
          setIsAdultUser(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 성인 컨텐츠 체크
  useEffect(() => {
    const checkAdultContent = async () => {
      try {
        const { data: themeRows, error: themeErr } = await supabase
          .from("partnershipsubmit_themes")
          .select(`
            theme_id,
            themes!inner (
              adult_admitted
            )
          `)
          .eq("submit_id", numericId);

        if (themeErr) console.log('테마 조회 에러:', themeErr);

        if (themeRows && themeRows.length > 0) {
          const isAdult = themeRows.some((row) => {
            return row.themes?.adult_admitted === true;
          });
          setIsAdultContent(isAdult);
        } else {
          setIsAdultContent(false);
        }
      } catch (error) {
        console.error('성인 컨텐츠 체크 에러:', error);
        setIsAdultContent(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdultContent();
  }, [numericId]);

  // 블러 처리 여부 결정
  useEffect(() => {
    if (!isLoading) {
      if (!isAdultContent) {
        setShowBlur(false);
      } else if (session && isAdultUser) {
        setShowBlur(false);
      } else {
        setShowBlur(true);
      }
    }
  }, [isLoading, isAdultContent, session, isAdultUser]);

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

  // 자동 넘김
  useEffect(() => {
    if (allImages.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allImages]);

  // 직접 드래그(스와이프)
  const startXRef = useRef(0);

  function handleTouchStart(e) {
    startXRef.current = e.touches[0].clientX;
  }

  function handleTouchMove(e) {
    // e.touches[0].clientX - startXRef.current 로 이동 거리 계산 가능
    // 여기서는 애니메이션까지 하려면 추가 로직이 필요하지만,
    // 간단히 "어느 방향으로 얼마나 움직였는지"만 확인해도 됩니다.
  }

  function handleTouchEnd(e) {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startXRef.current;
    if (diff > 50) {
      // 오른쪽 스와이프 → 이전
      handlePrev();
    } else if (diff < -50) {
      // 왼쪽 스와이프 → 다음
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
  const [sectionsData, setSectionsData] = useState([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [lowestPrice, setLowestPrice] = useState(0);

  useEffect(() => {
    if (!numericId) {
      setLoadingSections(false);
      return;
    }
    (async () => {
      try {
        const { data: secRows } = await supabase
          .from("sections")
          .select("*")
          .eq("post_id", numericId)
          .order("display_order", { ascending: true });

        if (!secRows || secRows.length === 0) {
          setSectionsData([]);
          setLoadingSections(false);
          return;
        }
        const secIds = secRows.map((s) => s.id);
        const { data: couRows } = await supabase
          .from("courses")
          .select("*")
          .in("section_id", secIds)
          .order("display_order", { ascending: true });

        const merged = secRows.map((sec) => {
          const related = (couRows || []).filter((c) => c.section_id === sec.id);
          return {
            ...sec,
            isOpen: true,
            courses: related.map((c) => ({
              id: c.id,
              course_name: c.course_name,
              duration: c.duration || "",
              price: c.price || 0,
              etc_info: c.etc_info || "",
            })),
          };
        });

        setSectionsData(merged);

        let minP = Infinity;
        (couRows || []).forEach((cc) => {
          if (cc.price && cc.price < minP) {
            minP = cc.price;
          }
        });
        if (minP === Infinity) minP = 0;
        setLowestPrice(minP);
      } catch (err) {
        console.error("섹션/코스 오류:", err);
      } finally {
        setLoadingSections(false);
      }
    })();
  }, [numericId]);

  function toggleSectionOpen(secId) {
    setSectionsData((prev) =>
      prev.map((s) => (s.id === secId ? { ...s, isOpen: !s.isOpen } : s))
    );
  }

  // (6) 리뷰 개수
  const [reviewCount, setReviewCount] = useState(0);

  // (7) 출근부
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if (!numericId) {
      setLoadingMembers(false);
      return;
    }
    (async () => {
      try {
        const { data: memRows, error } = await supabase
          .from("register")
          .select("member")
          .eq("partnershipsubmit_id", numericId);
        if (error) throw error;

        setMembers(memRows || []);
      } catch (err) {
        console.error("멤버 로드 오류:", err);
      } finally {
        setLoadingMembers(false);
      }
    })();
  }, [numericId]);

  const pastelArr = [
    "bg-blue-50 text-blue-500",
    "bg-pink-50 text-pink-500",
    "bg-purple-50 text-purple-500",
    "bg-green-50 text-green-500",
    "bg-red-50 text-red-500",
    "bg-yellow-50 text-yellow-500",
  ];

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
      activeTab === tabId ? "border-b-2 border-red-500 text-red-500" : ""
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

  // 본인인증 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://scert.mobile-ok.com/resources/js/index.js';
    script.async = true;
    document.body.appendChild(script);

    const resultScript = document.createElement('script');
    resultScript.innerHTML = `
      function result(data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed) {
            window.postMessage({ type: "MOK_AUTH_SUCCESS", payload: parsed }, "*");
          }
        } catch (e) {
          console.error("인증 결과 파싱 실패:", e);
        }
      }
    `;
    document.body.appendChild(resultScript);

    return () => {
      document.body.removeChild(script);
      document.body.removeChild(resultScript);
    };
  }, []);

  useEffect(() => {
    function handleAuthSuccess(event) {
      if (event.data?.type === "MOK_AUTH_SUCCESS") {
        if (session?.user?.id) {
          supabase
            .from("profiles")
            .select("is_adult")
            .eq("user_id", session.user.id)
            .single()
            .then(({ data: profile }) => {
              if (profile?.is_adult) {
                setIsAdultUser(true);
                setShowBlur(false);
              }
            });
        }
      }
    }

    window.addEventListener("message", handleAuthSuccess);
    return () => window.removeEventListener("message", handleAuthSuccess);
  }, [session?.user?.id]);

  const handleAuthClick = () => {
    const isMobile = /Mobile|Android|iP(hone|od)|BlackBerry|IEMobile|Silk/i.test(navigator.userAgent);
    const popupType = isMobile ? "MB" : "WB";
    window.MOBILEOK.process(
      'https://www.yeogidot.com/mok/mok_std_request',
      popupType,
      'result'
    );
  };

  return (
    <div className="relative max-w-md mx-auto bg-white">
      {/* 블러 오버레이 */}
      {showBlur && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center">
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
      <div
        className="relative w-full overflow-hidden"
        style={{
          // 414:241 ≈ 58.21%
          paddingBottom: "58.21%",
        }}
      >
        <div className="absolute top-0 left-0 w-full h-full">
          {allImages.length > 0 ? (
            <div
              className="flex h-full transition-transform duration-500 ease-in-out"
              style={{
                width: `${allImages.length * 100}%`,
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {allImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative flex-shrink-0 justify-center"
                  style={{
                    width: "100%",
                    height: "250px",
                  }}
                >
                  <Image
                    src={imgUrl}
                    alt={`슬라이드 이미지 ${idx + 1}`}
                    width={450}
                    height={262}
                    className="object-contain object-center bg-black/10"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-500">
              이미지 없음
            </div>
          )}

          {/* 이전/다음 버튼 (이미지가 2장이상일 때만) */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center"
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
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center"
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
            <div className="absolute bottom-2 right-2 px-2 py-1 text-sm bg-black/60 text-white rounded">
              {currentIndex + 1} / {allImages.length}
            </div>
          )}

          {/* "가고싶다" 버튼 */}
          <button
            onClick={handleSave}
            className={`absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full
              flex items-center justify-center
              ${isSaved ? "text-red-400" : "text-white"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              className="w-4 h-4"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21l-1.45-1.342C5.4
                  15.36 2 12.28 2 8.5 2 5.42 4.42 3
                  7.5 3c1.74 0 3.41.81 4.5
                  2.09A5.987 5.987 0 0 1
                  16.5 3c3.08 0 5.5 2.42
                  5.5 5.5 0 3.78-3.4
                  6.86-8.55 11.158L12 21z"
              />
            </svg>
          </button>
        </div>
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
            샵정보
          </button>
          <button
            className={getTabClass("course")}
            onClick={() => handleTabClick("course")}
          >
            안내글
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

          {/* (C-1) 출근부 */}
          {loadingMembers ? (
            <DetailRow label="출근부" value="불러오는 중..." />
          ) : members.length === 0 ? (
            <DetailRow label="출근부" value=" " />
          ) : (
            <div className="mb-2">
              <span className="inline-block w-24 font-semibold text-gray-700 shrink-0">
                출근부
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {members.map((m, idx) => {
                  const colorClass =
                    pastelArr[Math.floor(Math.random() * pastelArr.length)];
                  return (
                    <span
                      key={idx}
                      className={`inline-block px-2 py-1 text-sm rounded ${colorClass}`}
                    >
                      {m.member}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* (D) 코스안내 섹션 */}
      <section id="course" ref={courseRef} className="px-4 pt-4 pb-6 border-t">
        <h2 className="text-xl font-bold mb-2">안내글</h2>
        <p className="text-sm text-gray-500 mb-2">
          ※ 휴대폰 전원이 OFF인 경우, 샵 휴무 또는 예약이 꽉 찼을 수 있습니다.
        </p>

        {loadingSections ? (
          <div className="py-4 text-center text-gray-500">로딩중...</div>
        ) : sectionsData.length === 0 ? (
          <div className="py-4 text-gray-500">등록된 코스가 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {sectionsData.map((sec) => (
              <div
                key={sec.id}
                className="border border-gray-200 rounded overflow-hidden"
              >
                <button
                  onClick={() => toggleSectionOpen(sec.id)}
                  className="w-full flex items-center justify-between bg-gray-100 px-4 py-2"
                >
                  <span className="font-semibold text-gray-700">
                    {sec.section_title}
                  </span>
                  <span className="text-sm text-gray-400">
                    {sec.isOpen ? "▲" : "▼"}
                  </span>
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
      <section className="px-4 pt-4 pb-20 border-t">
        <h2 className="text-xl font-bold mb-2">주변샵</h2>
        <NearbyShops currentShopId={numericId} />
      </section>

      {/* (G) 하단 fixed 바 (문자하기 / 전화하기) */}
      <div className="fixed bottom-0 left-0 w-full flex bg-white border-t border-gray-200">
        <button
          onClick={() => {
            if (!row.phone_number) return alert("전화번호 없음");
            window.location.href = `sms:${row.phone_number}`;
          }}
          className="flex-1 py-3 text-white bg-red-500 text-center font-semibold"
        >
          문자하기
        </button>
        <button
          onClick={() => {
            if (!row.phone_number) return alert("전화번호 없음");
            window.location.href = `tel:${row.phone_number}`;
          }}
          className="flex-1 py-3 text-white bg-red-500 text-center font-semibold"
        >
          전화하기
        </button>
      </div>
    </div>
  );
}