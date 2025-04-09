"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseF";
import CommentsUI from "./comment";
import MapKakao from "./MapKakao";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
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

/** (C) 라벨-값 표시용 작은 컴포넌트 */
function DetailRow({ label, value }) {
  return (
    <div className="mb-4">
      <span className="inline-block w-24 font-semibold text-gray-600">
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

/**
 * 메인 컴포넌트 (PC 전용)
 *  row: partnershipsubmit 단일 레코드
 *  images: partnershipsubmit_images[]
 *  numericId: partnershipsubmit.id
 */
export default function DetailClient({ row, images, numericId, showBlurDefault }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [views, setViews] = useState(row.views || 0);
  const [hasCountedView, setHasCountedView] = useState(false);
  const [showBlur, setShowBlur] = useState(showBlurDefault);
  const [isLoading, setIsLoading] = useState(true);

  // (A) 세션 체크
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error("[getSession error]:", error);
        } else {
          setSession(data.session || null);
        }
      })
      .catch((err) => console.error("[getSession catch]:", err));

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // (B) userId 결정
  let userId = null;
  if (session?.user?.id) {
    userId = session.user.id;
  } else if (typeof window !== "undefined") {
    userId = getOrCreateAnonUuid();
  }

  // (C) 조회수
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
          const { data: oldRow } = await supabase
            .from("partnershipsubmit")
            .select("views")
            .eq("id", numericId)
            .single();

          const currViews = oldRow?.views || 0;
          const newViews = currViews + 1;

          const { data: updated } = await supabase
            .from("partnershipsubmit")
            .update({ views: newViews })
            .eq("id", numericId)
            .select("views")
            .single();
          if (updated) setViews(updated.views);

          await supabase
            .from("partnershipsubmit_views_log")
            .upsert({
              user_id: userId,
              partnershipsubmit_id: numericId,
              last_viewed_at: new Date().toISOString(),
            });
        }
      } catch (err) {
        console.error("조회수 증가 로직 오류:", err);
      }
      setHasCountedView(true);
    })();
  }, [userId, numericId, hasCountedView]);

  // (D) "가고싶다"
  useEffect(() => {
    if (!session?.user?.id || !numericId) return;
    supabase
      .from("wantToGo")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("partnershipsubmit_id", numericId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setIsSaved(true);
      })
      .catch(console.error);
  }, [session, numericId]);

  async function handleSave() {
    if (!session?.user?.id) {
      alert("로그인 먼저 해주세요!");
      return;
    }

    if (isSaved) {
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
          alert("가고싶다 해제 오류!");
        }
      } catch (err) {
        alert("가고싶다 해제 오류!");
      }
      return;
    }

    try {
      const { error } = await supabase
        .from("wantToGo")
        .insert({
          user_id: session.user.id,
          partnershipsubmit_id: numericId,
        });
      if (!error) {
        setIsSaved(true);
        alert("가고싶다 목록에 저장됨!");
      } else {
        alert("가고싶다 저장 오류");
      }
    } catch (err) {
      alert("가고싶다 저장 오류");
    }
  }

  // (E) 이미지
  const allImages = [];
  if (row.thumbnail_url) {
    allImages.push(buildPublicImageUrl(row.thumbnail_url));
  }
  if (images && images.length > 0) {
    images.forEach((imgObj) => {
      allImages.push(buildPublicImageUrl(imgObj.image_url));
    });
  }
  const hasDetailImages = images && images.length > 0;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (allImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [allImages]);

  function handleThumbnailClick(idx) {
    setCurrentIndex(idx);
  }

  // (F) 섹션/코스
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
          const rel = (couRows || []).filter((c) => c.section_id === sec.id);
          return {
            id: sec.id,
            title: sec.section_title,
            isOpen: true,
            courses: rel.map((c) => ({
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
        (couRows || []).forEach((co) => {
          if (co.price && co.price < minP) minP = co.price;
        });
        if (minP === Infinity) minP = 0;
        setLowestPrice(minP);
      } catch (err) {
        console.error("sections/courses load error:", err);
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

  // (G) 출근부(멤버)
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if (!numericId) {
      setLoadingMembers(false);
      return;
    }
    (async () => {
      try {
        const { data: memRows } = await supabase
          .from("register")
          .select("member")
          .eq("partnershipsubmit_id", numericId);
        setMembers(memRows || []);
      } catch (err) {
        console.error("멤버 로드 오류:", err);
      } finally {
        setLoadingMembers(false);
      }
    })();
  }, [numericId]);

  const pastelColors = [
    "bg-blue-50 text-blue-500",
    "bg-pink-50 text-pink-500",
    "bg-purple-50 text-purple-500",
    "bg-green-50 text-green-500",
    "bg-red-50 text-red-500",
    "bg-yellow-50 text-yellow-500",
  ];

  // (H) 본인인증 스크립트
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

  // (I) handleAuthClick - 수정된 로직
  async function handleAuthClick() {
    // 1) userId 구하기
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    console.log("🔍 인증 요청 직전 userId:", userId);
    console.log("📦 body payload:", JSON.stringify({ userId }));

    if (!userId) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 2) 서버로 userId 전달
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

    // 3) 표준창 호출
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

  useEffect(() => {
    // 클라이언트 사이드에서 성인 인증 상태 확인
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

  // ─────────────────────────────────────────────────────────
  // 최종 렌더링
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
      {/* (A) 왼쪽 영역 */}
      <div className="flex-[7] relative">
        {showBlur && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold mb-2">
                {!session ? "로그인이 필요한 컨텐츠입니다" : "성인 인증이 필요한 컨텐츠입니다"}
              </p>
              <p className="text-gray-600 mb-4">
                {!session ? "로그인 후 이용해주세요" : "성인 인증 후 이용해주세요"}
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

        {/* 사진 영역 */}
        <div className="flex gap-4">
          {/* 메인 이미지 */}
          <div
            className="relative flex-1 bg-gray-100 rounded overflow-hidden"
            style={{ height: 390 }}
          >
            {allImages.length > 0 ? (
              <>
                <Image
                  key={currentIndex}
                  src={allImages[currentIndex]}
                  alt={`메인 이미지 ${currentIndex + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-2 right-2 px-2 py-1 text-sm bg-black/60 text-white rounded">
                  {currentIndex + 1} / {allImages.length}
                </div>

                {/* 가고싶다 */}
                <button
                  onClick={handleSave}
                  className={`absolute top-2 right-2 w-8 h-8
                    rounded-full flex items-center justify-center
                    bg-black/60
                    ${isSaved ? "text-red-500" : "text-white"}
                  `}
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
                      d="M12 21l-1.45-1.342C5.4 15.36
                         2 12.28 2 8.5 2 5.42 4.42 3 7.5
                         3c1.74 0 3.41.81 4.5 2.09A5.987
                         5.987 0 0 1 16.5 3C19.58 3
                         22 5.42 22 8.5c0 3.78-3.4
                         6.86-8.55 11.158L12 21z"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                이미지가 등록되지 않았습니다
              </div>
            )}
          </div>

          {/* 오른쪽 썸네일 */}
          <div
            className="flex flex-col gap-2 overflow-y-auto"
            style={{ height: 390, width: "190px" }}
          >
            {hasDetailImages
              ? allImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className={`relative cursor-pointer border ${
                      idx === currentIndex ? "border-red-500" : "border-transparent"
                    }`}
                    style={{ width: "190px", height: "113px", display: 'flex' }}
                    onClick={() => handleThumbnailClick(idx)}
                  >
                    <Image src={imgUrl} alt={`썸네일 ${idx}`} fill className="object-cover" />
                  </div>
                ))
              : row.thumbnail_url && (
                  <div
                    className="relative cursor-pointer border border-red-500"
                    style={{ width: "190px", height: "113px" }}
                  >
                    <Image
                      src={buildPublicImageUrl(row.thumbnail_url)}
                      alt="썸네일"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="mt-6 bg-white p-4 rounded">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold mb-2">{row.company_name}</h1>
            <div className="flex items-center gap-6 ml-1 text-gray-500">
              <div className="flex items-center gap-1">
                <img src="/icons/views.svg" alt="조회수" style={{ width: "18px", height: "16px" }} />
                <span>{views.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <img src="/icons/man.svg" alt="댓글수" style={{ width: "18px", height: "14px" }} />
                <span>{row.comment || 0}</span>
              </div>
            </div>
          </div>

          <DetailRow label="업체소개" value={row.greeting} />
          <DetailRow label="오시는 길" value={row.address_street} />
          <DetailRow label="전화번호" value={row.phone_number} />
          <DetailRow
            label="연락방법"
            value={
              row.contact_method
                ? `${row.contact_method}${row.near_building ? ` / ${row.near_building}` : ""}`
                : row.near_building || ""
            }
          />
          <DetailRow label="영업시간" value={row.open_hours} />
          {lowestPrice > 0 && (
            <DetailRow label="최저가" value={`${formatPrice(lowestPrice)}원 ~`} />
          )}
          <DetailRow label="휴무일" value={row.holiday} />
          <DetailRow label="주차안내" value={row.parking_type} />

          {/* 출근부 */}
          {loadingMembers ? (
            <div className="mb-2 flex items-center">
              <span className="w-24 font-semibold text-gray-600">출근부</span>
              <span className="text-gray-800">불러오는 중...</span>
            </div>
          ) : members.length > 0 ? (
            <div className="mb-2 flex items-center">
              <span className="w-24 font-semibold text-gray-600">출근부</span>
              <div className="flex flex-wrap gap-2">
                {members.map((m, index) => {
                  const colorClass = pastelColors[index % pastelColors.length];
                  return (
                    <span
                      key={index}
                      className={`inline-block px-2 py-1 text-sm rounded ${colorClass}`}
                    >
                      {m.member}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-[0.5px] border-gray-300"></div>

        {/* 이벤트 */}
        {row.event_info?.trim() && (
          <div className="flex flex-col mt-5 mb-5 bg-white p-4 rounded">
            <span className="font-semibold text-xl mb-2">이벤트</span>
            <span>{"■ " + row.event_info}</span>
          </div>
        )}

        <div className="border-[0.5px] border-gray-300"></div>

        {/* 코스안내 */}
        {loadingSections ? (
          <div className="py-4">로딩중...</div>
        ) : sectionsData.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">코스안내</h2>
            <p className="text-sm text-gray-500 mb-2">{row.program_info || "코스 정보 없음"}</p>
            <div className="space-y-4">
              {sectionsData.map((sec) => (
                <div key={sec.id} className="border border-gray-200 rounded overflow-hidden">
                  <button
                    onClick={() => toggleSectionOpen(sec.id)}
                    className="w-full flex items-center justify-between bg-gray-100 px-4 py-3 focus:outline-none text-left"
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
                                <div>
                                  <span className="font-semibold text-gray-800">{c.course_name}</span>
                                  {c.duration && (
                                    <span className="text-sm text-gray-600 ml-1">: {c.duration}</span>
                                  )}
                                </div>
                                {c.price > 0 && (
                                  <div className="text-red-600 font-medium">
                                    {formatPrice(c.price) + " 원"}
                                  </div>
                                )}
                              </div>
                              {c.etc_info?.trim() && (
                                <div className="mt-1 text-sm text-gray-500">{c.etc_info}</div>
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
          </div>
        )}

        {/* 댓글 */}
        <div className="mt-6 bg-white rounded">
          <CommentsUI company_name={row.company_name} id={row.id} />
        </div>
      </div>

      {/* (B) 오른쪽 지도 */}
      <div className="flex-[3] rounded overflow-hidden">
        <MapKakao address={row.address} id={row.id} />
      </div>
    </div>
  );
}