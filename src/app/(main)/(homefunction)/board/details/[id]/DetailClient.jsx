"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MegaphoneIcon, EyeIcon, UserIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseF";
import CommentsUI from "./comment";
import MapKakao from "./MapKakao";

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
    <div className="mb-2">
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
 * row: partnershipsubmit 단일 레코드
 * images: partnershipsubmit_images[]
 * numericId: partnershipsubmit.id
 */
export default function DetailClient({ row, images, numericId }) {
  // ─────────────────────────────────────────────────────────
  // 1) session, 조회수, 가고싶다
  // ─────────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [isSaved, setIsSaved] = useState(false); // 이미 가고싶다
  const [views, setViews] = useState(row.views || 0);
  const [hasCountedView, setHasCountedView] = useState(false);

  useEffect(() => {
    // (1) 현재 세션 가져오기
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error("[getSession error]:", error);
        } else {
          setSession(data.session || null);
        }
      })
      .catch((err) => {
        console.error("[getSession catch]:", err);
      });

    // (2) 세션 상태 감지
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        // anon → real merge
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

  // userId 결정
  let userId = null;
  if (session?.user?.id) {
    userId = session.user.id;
  } else if (typeof window !== "undefined") {
    userId = getOrCreateAnonUuid();
  }

  // ─────────────────────────────────────────────────────────
  // 2) 조회수 (24h 중복 방지)
  // ─────────────────────────────────────────────────────────
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
          // 기존 views
          const { data: oldData } = await supabase
            .from("partnershipsubmit")
            .select("views")
            .eq("id", numericId)
            .single();

          const currViews = oldData?.views || 0;
          const newViews = currViews + 1;

          // views 업데이트
          const { data: updated } = await supabase
            .from("partnershipsubmit")
            .update({ views: newViews })
            .eq("id", numericId)
            .select("views")
            .single();
          if (updated) {
            setViews(updated.views);
          }

          // 로그 upsert
          await supabase.from("partnershipsubmit_views_log").upsert({
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

  // ─────────────────────────────────────────────────────────
  // 3) “가고싶다” 초기 여부 체크
  // ─────────────────────────────────────────────────────────
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
      .catch((err) => console.error("wantToGo check error:", err));
  }, [session, numericId]);

  // “가고싶다” 토글 로직
  async function handleSave() {
    // 로그인 안 된 경우
    if (!session?.user?.id) {
      alert("로그인 먼저 해주세요!");
      return;
    }

    // 이미 저장된 상태 → 해제(삭제)
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
          console.error("가고싶다 해제 오류:", error);
          alert("가고싶다 해제 오류!");
        }
      } catch (err) {
        console.error("handleSave delete error:", err);
        alert("가고싶다 해제 오류!");
      }
      return;
    }

    // 저장되지 않았다면 추가
    try {
      const { error } = await supabase.from("wantToGo").insert({
        user_id: session.user.id,
        partnershipsubmit_id: numericId,
      });
      if (!error) {
        setIsSaved(true);
        alert("가고싶다 목록에 저장됨!");
      } else {
        console.error("가고싶다 저장 오류:", error);
        alert("가고싶다 저장 오류");
      }
    } catch (err) {
      console.error("handleSave error:", err);
      alert("가고싶다 저장 오류");
    }
  }

  // ─────────────────────────────────────────────────────────
  // 4) 이미지 배열
  // ─────────────────────────────────────────────────────────
  const allImages = [];
  if (row.thumbnail_url) {
    allImages.push(buildPublicImageUrl(row.thumbnail_url));
  }
  if (images && images.length > 0) {
    images.forEach((imgObj) => {
      allImages.push(buildPublicImageUrl(imgObj.image_url));
    });
  }

  // ─────────────────────────────────────────────────────────
  // 5) 섹션/코스 로드 + 최저가
  // ─────────────────────────────────────────────────────────
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
        // 섹션 로드
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

        // 코스 로드
        const secIds = secRows.map((s) => s.id);
        const { data: couRows } = await supabase
          .from("courses")
          .select("*")
          .in("section_id", secIds)
          .order("display_order", { ascending: true });

        // 섹션-코스 merge
        const merged = secRows.map((sec) => {
          const related = (couRows || []).filter(
            (c) => c.section_id === sec.id
          );
          return {
            id: sec.id,
            title: sec.section_title,
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

        // 최저가 계산
        let minP = Infinity;
        (couRows || []).forEach((co) => {
          if (co.price && co.price < minP) {
            minP = co.price;
          }
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

  // ─────────────────────────────────────────────────────────
  // 6) 멤버 로드 (출근부)
  // ─────────────────────────────────────────────────────────
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

  // 파스텔톤 색상 목록 (필요에 따라 갯수/색 수정 가능)
  const pastelColors = [
    "bg-blue-50 text-blue-500",
    "bg-pink-50 text-pink-500",
    "bg-purple-50 text-purple-500",
    "bg-green-50 text-green-500",
    "bg-red-50 text-red-500",
    "bg-yellow-50 text-yellow-500",
  ];

  // ─────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────
  // 연락방법
  const fullContact = row.contact_method
    ? row.contact_method + (row.near_building ? ` / ${row.near_building}` : "")
    : row.near_building || "";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
      {/* (A) 왼쪽 영역 */}
      <div className="flex-[7]">
        {/* (A-1) 이미지 */}
        <div className="flex gap-4">
          <div className="relative flex-1 h-80 bg-gray-100 rounded overflow-hidden">
            {allImages.length > 0 ? (
              <>
                <Image
                  src={allImages[0]}
                  alt="메인 이미지"
                  fill
                  className="object-cover"
                />
                {/* 하트 버튼 */}
                <button
                  onClick={handleSave}
                  className={`absolute top-2 right-2 w-8 h-8 
                    rounded-full flex items-center justify-center 
                    bg-black/60
                    ${isSaved ? "text-red-500" : "text-white"}
                  `}
                  style={{ transition: "color 0.3s" }}
                >
                  {/* 하트 아이콘 */}
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
                         15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5
                         3c1.74 0 3.41.81 4.5
                         2.09A5.987 5.987 0 0 1
                         16.5 3C19.58 3 22 5.42
                         22 8.5c0 3.78-3.4
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
        </div>

        {/* (A-2) 기본 정보 */}
        <div className="mt-6 bg-white p-4 rounded">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold mb-2">{row.company_name}</h1>

            {/* 추가: 아이콘+숫자 표시 영역 */}
            <div className="flex items-center gap-6 ml-1 text-gray-500">
              {/* 눈 아이콘 + 조회수 */}
              {/* 눈 아이콘 + 조회수 */}
<div className="flex items-center gap-1">
  <img
    src="/icons/views.svg"
    alt="조회수"
    className="object-contain mr-1" style={{width: "18px", height: "16.18px"}}
  />
  <span className="">
    {views.toLocaleString()}
  </span>
</div>

{/* 사람 아이콘 + row.comment */}
<div className="flex items-center gap-1">
  <img
    src="/icons/man.svg"
    alt="댓글수"
    className="object-contain mr-1" style={{width: "18px", height: "14.18px"}}
  />
  <span className="">
    {row.comment || 0}
  </span>
</div>
</div>
          </div>

          <div className="flex items-center gap-1 text-gray-700 mb-3 mt-4">
            <MegaphoneIcon className="w-5 h-5 text-red-500" />
            <span className="font-semibold">
              {row.shop_type || "샵형태 미입력"}
            </span>
          </div>

          {/* 필드들 */}
          <DetailRow label="업체소개" value={row.greeting} />
          <DetailRow label="오시는 길" value={row.address_street} />
          <DetailRow label="전화번호" value={row.phone_number} />
          <DetailRow label="연락방법" value={fullContact} />
          <DetailRow label="영업시간" value={row.open_hours} />
          {/* 최저가 (if lowestPrice>0, 표시) */}
          {lowestPrice > 0 && (
            <DetailRow
              label="최저가"
              value={`${formatPrice(lowestPrice)}원 ~`}
            />
          )}
          <DetailRow label="주차안내" value={row.parking_type} />
          <DetailRow label="관리사님" value={row.manager_desc} />

          {/* 출근부 */}
          <div className="mb-2 flex items-center">
            {/* 출근부 라벨 */}
            <span className="w-24 font-semibold text-gray-600">출근부</span>

            {/* 로딩 상태 / 멤버 목록 */}
            {loadingMembers ? (
              <span className="text-gray-800">불러오는 중...</span>
            ) : members.length === 0 ? (
              <span className="text-gray-800">등록된 멤버가 없습니다.</span>
            ) : (
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
            )}
          </div>
        </div>

        {/* (A-3) 이벤트 */}
        {row.event_info?.trim() && (
          <div className="mt-6 bg-white p-4 rounded">
            <DetailRow label="이벤트" value={row.event_info} />
          </div>
        )}

        {/* (A-4) 코스 안내 */}
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">코스안내</h2>
          <p className="text-sm text-gray-500 mb-2">
            ※ 휴대폰 전원이 OFF인 경우, 샵 휴무 또는 예약이 꽉 찼을 수 있으니 참고 바랍니다.
          </p>
          {loadingSections ? (
            <div className="py-4">로딩중...</div>
          ) : sectionsData.length === 0 ? (
            <div className="py-4 text-gray-500">등록된 코스가 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {sectionsData.map((sec) => (
                <div
                  key={sec.id}
                  className="border border-gray-200 rounded overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setSectionsData((prev) =>
                        prev.map((s) =>
                          s.id === sec.id ? { ...s, isOpen: !s.isOpen } : s
                        )
                      )
                    }
                    className="w-full flex items-center justify-between bg-gray-100 px-4 py-3 focus:outline-none text-left"
                  >
                    <span className="font-semibold text-gray-700">
                      {sec.title}
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
                                <div>
                                  <span className="font-semibold text-gray-800">
                                    {c.course_name}
                                  </span>
                                  {c.duration && (
                                    <span className="text-sm text-gray-600 ml-1">
                                      : {c.duration}
                                    </span>
                                  )}
                                </div>
                                {c.price > 0 && (
                                  <div className="text-red-600 font-medium">
                                    {formatPrice(c.price) + " 원"}
                                  </div>
                                )}
                              </div>
                              {c.etc_info?.trim() && (
                                <div className="mt-1 text-sm text-gray-500">
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
        </div>

        {/* (A-5) 댓글 */}
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