"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseF";
import CommentsUI from "./comment";

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
  return `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${path}`;
}

/** (C) 라벨-값 표시 */
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

/** (E) 스크롤 스파이 훅 */
function useScrollSpy(sectionRefs, offset = 0) {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY + offset;
      let currentSectionId = null;

      for (let i = sectionRefs.length - 1; i >= 0; i--) {
        const ref = sectionRefs[i];
        if (!ref.current) continue;
        const sectionTop = ref.current.offsetTop;
        if (scrollY >= sectionTop) {
          currentSectionId = ref.current.id;
          break;
        }
      }

      if (currentSectionId !== activeId) {
        setActiveId(currentSectionId);
      }
    }

    window.addEventListener("scroll", handleScroll);
    handleScroll(); 
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sectionRefs, offset, activeId]);

  return activeId;
}

/** (F) 섹션으로 스크롤할 때 sticky 높이만큼 빼주기 */
function scrollIntoSection(ref, stickyOffset = 60) {
  if (!ref.current) return;
  const el = ref.current;
  const top = el.offsetTop - stickyOffset; 
  window.scrollTo({ top, behavior: "smooth" });
}

/** (G) 지도 */
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
            const coords = new window.kakao.maps.LatLng(
              result[0].y,
              result[0].x
            );
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

/** (H) 주변샵 */
function NearbyShops({ currentShopId }) {
  const [nearbyShops, setNearbyShops] = useState([]);

  function getDistance(lat1, lng1, lat2, lng2) {
    function deg2rad(deg) {
      return deg * (Math.PI / 180);
    }
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  useEffect(() => {
    if (!currentShopId) return;

    (async () => {
      // 1) 현재 샵 lat/lng
      const { data: currShop } = await supabase
        .from("partnershipsubmit")
        .select("lat, lng")
        .eq("id", currentShopId)
        .maybeSingle();

      if (!currShop?.lat || !currShop.lng) return;

      // 2) 전체 샵
      const { data: allShops } = await supabase
        .from("partnershipsubmit")
        .select("id, lat, lng, company_name, address, near_building, thumbnail_url");

      if (!allShops) return;

      const lat1 = currShop.lat;
      const lng1 = currShop.lng;

      const shopsWithDist = allShops.map((s) => {
        let dist = Infinity;
        if (s.lat && s.lng) {
          dist = getDistance(lat1, lng1, s.lat, s.lng);
        }
        return { ...s, distance: dist };
      });

      const filtered = shopsWithDist
        .filter((s) => s.id !== currentShopId)
        .filter((s) => s.distance <= 30)
        .sort((a, b) => a.distance - b.distance);

      setNearbyShops(filtered);
    })();
  }, [currentShopId]);

  if (nearbyShops.length === 0) {
    return <div className="text-gray-500">주변 30km 이내 다른 샵이 없습니다.</div>;
  }

  return (
    <div className="space-y-3">
      {nearbyShops.map((shop) => (
        <a
          href={`/board/details/${shop.id}`}
          key={shop.id}
          className="block p-2 border border-gray-200 rounded hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 bg-gray-100 flex-shrink-0 rounded overflow-hidden">
              {shop.thumbnail_url ? (
                <img
                  src={
                    "https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/" +
                    shop.thumbnail_url
                  }
                  alt={shop.company_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center text-sm text-gray-500 h-full">
                  No Image
                </div>
              )}
            </div>
            <div>
              <p className="font-bold">{shop.company_name}</p>
              <p className="text-sm text-gray-600">
                {shop.address || "주소 미입력"}
              </p>
              {shop.near_building && (
                <p className="text-sm text-gray-600 mt-0.5">
                  {shop.near_building}
                </p>
              )}
              <p className="text-sm text-blue-600 mt-1">
                거리: {shop.distance?.toFixed(2)} km
              </p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

/** (I) 메인 컴포넌트 */
export default function DetailClient({ row, images, numericId }) {
  // ─────────────────────────────
  // 1) session, 조회수, 가고싶다
  // ─────────────────────────────
  const [session, setSession] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [views, setViews] = useState(row.views || 0);
  const [hasCountedView, setHasCountedView] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!error && data) {
          setSession(data.session || null);
        }
      })
      .catch(console.error);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (event === "SIGNED_IN" && newSession?.user?.id) {
          const realId = newSession.user.id;
          const anonId = localStorage.getItem("anon_user_id");
          if (anonId && anonId !== realId) {
            await supabase
              .from("partnershipsubmit_views_log")
              .update({ user_id: realId })
              .eq("user_id", anonId);
            localStorage.setItem("anon_user_id", realId);
          }
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  let userId = null;
  if (session?.user?.id) {
    userId = session.user.id;
  } else if (typeof window !== "undefined") {
    userId = getOrCreateAnonUuid();
  }

  // 조회수 +1 (24h 중복)
  useEffect(() => {
    if (!userId || !numericId) return;
    if (hasCountedView) return;

    (async () => {
      try {
        const _24hAgo = new Date(Date.now() - 86400000).toISOString();
        const { data: recentLogs } = await supabase
          .from("partnershipsubmit_views_log")
          .select("*")
          .eq("user_id", userId)
          .eq("partnershipsubmit_id", numericId)
          .gt("last_viewed_at", _24hAgo);

        if (!recentLogs || recentLogs.length === 0) {
          // +1
          const { data: old } = await supabase
            .from("partnershipsubmit")
            .select("views")
            .eq("id", numericId)
            .single();
          const newViews = (old?.views || 0) + 1;
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
        console.error("조회수 로직 오류:", err);
      }
      setHasCountedView(true);
    })();
  }, [userId, numericId, hasCountedView]);

  // “가고싶다”
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

  async function handleSave() {
    if (!session?.user?.id) {
      alert("로그인이 필요합니다!");
      return;
    }
    if (isSaved) {
      alert("이미 가고싶다에 등록됨!");
      return;
    }
    try {
      const realId = session.user.id;
      const { error } = await supabase.from("wantToGo").insert({
        user_id: realId,
        partnershipsubmit_id: numericId,
      });
      if (!error) {
        setIsSaved(true);
        alert("가고싶다 등록 성공!");
      } else {
        alert("가고싶다 오류: " + error.message);
      }
    } catch (e) {
      console.error("가고싶다 오류:", e);
      alert("가고싶다 오류: " + e);
    }
  }

  // ─────────────────────────────
  // 2) 이미지
  // ─────────────────────────────
  const allImages = [];
  if (row.thumbnail_url) {
    allImages.push(buildPublicImageUrl(row.thumbnail_url));
  }
  if (images && images.length > 0) {
    images.forEach((imgObj) => {
      allImages.push(buildPublicImageUrl(imgObj.image_url));
    });
  }

  // ─────────────────────────────
  // 3) 섹션/코스
  // ─────────────────────────────
  const [sectionsData, setSectionsData] = useState([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [lowestPrice, setLowestPrice] = useState(0);

  useEffect(() => {
    if (!numericId) return setLoadingSections(false);

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
          const relevant = (couRows || []).filter((c) => c.section_id === sec.id);
          return {
            ...sec,
            isOpen: true,
            courses: relevant.map((c) => ({
              id: c.id,
              course_name: c.course_name,
              duration: c.duration || "",
              price: c.price || 0,
              etc_info: c.etc_info || "",
            })),
          };
        });
        setSectionsData(merged);

        // 최저가
        let minP = Infinity;
        (couRows || []).forEach((cc) => {
          if (cc.price && cc.price < minP) {
            minP = cc.price;
          }
        });
        if (minP === Infinity) minP = 0;
        setLowestPrice(minP);
      } catch (err) {
        console.error("코스 로드 오류:", err);
      } finally {
        setLoadingSections(false);
      }
    })();
  }, [numericId]);

  function toggleSectionOpen(secId) {
    setSectionsData((prev) =>
      prev.map((s) =>
        s.id === secId ? { ...s, isOpen: !s.isOpen } : s
      )
    );
  }

  // ─────────────────────────────
  // 4) 문자/전화하기
  // ─────────────────────────────
  function handleSms() {
    if (!row.phone_number) {
      alert("전화번호 없음");
      return;
    }
    window.location.href = `sms:${row.phone_number}`;
  }
  function handleCall() {
    if (!row.phone_number) {
      alert("전화번호 없음");
      return;
    }
    window.location.href = `tel:${row.phone_number}`;
  }

  // ─────────────────────────────
  // 5) 스크롤 + 탭
  // ─────────────────────────────
  const infoRef = useRef(null);
  const courseRef = useRef(null);
  const reviewRef = useRef(null);

  const [reviewCount, setReviewCount] = useState(0);

  const stickyOffset = 60; 
  const activeId = useScrollSpy([infoRef, courseRef, reviewRef], stickyOffset);

  function getTabClass(id) {
    return `flex-1 py-3 text-center font-semibold ${
      activeId === id ? "border-b-2 border-red-500 text-red-500" : ""
    }`;
  }

  // 탭 클릭 시, sticky만큼 빼고 스크롤하기
  function scrollToSection(ref) {
    scrollIntoSection(ref, stickyOffset);
  }

  const fullContact = row.contact_method
    ? row.contact_method + (row.near_building ? ` / ${row.near_building}` : "")
    : row.near_building || "";

  // ─────────────────────────────
  // 최종 렌더링
  // ─────────────────────────────
  return (
    <div className="relative max-w-md mx-auto bg-white">
      {/* (A) 상단 이미지 */}
      <div className="relative w-full h-60 bg-gray-200">
        {allImages.length > 0 ? (
          <Image
            src={allImages[0]}
            alt="메인이미지"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            이미지 없음
          </div>
        )}
        {/* 가고싶다 버튼 */}
        {session?.user?.id && (
          <button
            onClick={handleSave}
            className={`absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full 
              flex items-center justify-center
              ${isSaved ? "text-red-400" : "text-white"}`}
          >
            {/* ♥ 아이콘 */}
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
                  15.36 2 12.28 2 8.5 2 5.42
                  4.42 3 7.5 3c1.74 0
                  3.41.81 4.5 2.09A5.987
                  5.987 0 0 1 16.5 3c3.08 0
                  5.5 2.42 5.5 5.5 0 3.78-3.4
                  6.86-8.55 11.158L12 21z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* (B) 스티키 탭 */}
      <div
        className="sticky top-[60px] bg-white z-10 flex border-b border-gray-200"
        style={{ marginTop: 0 }}
      >
        <button
          className={getTabClass("info")}
          onClick={() => scrollToSection(infoRef)}
        >
          샵정보
        </button>
        <button
          className={getTabClass("course")}
          onClick={() => scrollToSection(courseRef)}
        >
          코스안내
        </button>
        <button
          className={getTabClass("review")}
          onClick={() => scrollToSection(reviewRef)}
        >
          리뷰 {reviewCount}
        </button>
      </div>

      {/* (C) 샵정보 섹션 */}
      <section id="info" ref={infoRef} className="px-4 pt-4 pb-6">
        {/* 상호 + 조회수 */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">{row.company_name}</h2>
          {/* 조회수 */}
          <div className="flex items-center text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-5 h-5 mr-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223c1.7-2.877
                  4.335-5.223 8.02-5.223s6.32
                  2.346 8.02 5.223a13.06
                  13.06 0 0 1 0
                  7.554c-1.7 2.877-4.335
                  5.223-8.02 5.223s-6.32-2.346-8.02-5.223a13.06
                  13.06 0 0 1 0-7.554Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15
                  12a3 3 0 1 1-6
                  0 3 3 0 0
                  1 6 0Z"
              />
            </svg>
            {views}
          </div>
        </div>

        {/* 지도 */}
        <MapKakao address={row.address} />

        {/* 정보 목록 */}
        <div className="mt-4">
          <DetailRow label="오시는길" value={row.address_street} />
          {lowestPrice > 0 && (
            <DetailRow
              label="최저가"
              value={`${formatPrice(lowestPrice)}원 ~`}
            />
          )}
          <DetailRow label="전화번호" value={row.phone_number} />
          <DetailRow label="연락방법" value={row.contact_method} />
          <DetailRow label="영업시간" value={row.open_hours} />
          <DetailRow label="주차안내" value={row.parking_type} />
          <DetailRow label="관리사님" value={row.manager_desc} />
        </div>

        {/* 이벤트 / 업체소개 */}
        {row.event_info?.trim() && (
          <div className="mt-4 bg-gray-50 p-3 rounded">
            <DetailRow label="이벤트" value={row.event_info} />
          </div>
        )}
        {row.greeting && (
          <div className="mt-4 bg-gray-50 p-3 rounded">
            <DetailRow label="업체소개" value={row.greeting} />
          </div>
        )}
      </section>

      {/* (D) 코스안내 섹션 */}
      <section
        id="course"
        ref={courseRef}
        className="px-4 pt-4 pb-6 border-t border-gray-100"
      >
        <h2 className="text-xl font-bold mb-2">코스안내</h2>
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
                      <div className="text-sm text-gray-500">
                        코스가 없습니다.
                      </div>
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
                                  {formatPrice(c.price)}
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
      <section
        id="review"
        ref={reviewRef}
        className="px-4 pt-4 pb-6 border-t border-gray-100"
      >
        <h2 className="text-xl font-bold mb-2">리뷰 {reviewCount}</h2>
        <p className="text-sm text-gray-500 mb-2">
          {row.company_name} 업체에 리뷰를 남겨보세요!
        </p>
        <CommentsUI
          company_name={row.company_name}
          id={row.id}
          onNewComment={() => setReviewCount((prev) => prev + 1)}
        />
      </section>

      {/* (F) 주변샵 */}
      <section className="px-4 pt-4 pb-20 border-t border-gray-100">
        <h2 className="text-xl font-bold mb-2">주변샵</h2>
        <NearbyShops currentShopId={numericId} />
      </section>

      {/* (G) 하단 fixed 바 */}
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