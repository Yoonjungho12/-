"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
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
 * 메인 컴포넌트
 * row: partnershipsubmit 단일 레코드
 * images: partnershipsubmit_images[]
 * numericId: partnershipsubmit.id
 */
export default function DetailClient({ row, images, numericId }) {
  // ─────────────────────────────────────────────────────────
  // 1) session 관련
  // ─────────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [isSaved, setIsSaved] = useState(false); // “가고싶다”
  const [views, setViews] = useState(row.views || 0); // 조회수
  const [hasCountedView, setHasCountedView] = useState(false); // 중복방지

  useEffect(() => {
    // (1) 현재 세션
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

    // (2) onAuthStateChange
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        // 로그인 직후 anon→real merge
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
  // 2) 24h 중복체크 → views +1
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !numericId) return;
    if (hasCountedView) return;

    (async () => {
      try {
        const _24hAgo = new Date(
          Date.now() - 24 * 60 * 60 * 1000
        ).toISOString();
        const { data: logRows } = await supabase
          .from("partnershipsubmit_views_log")
          .select("id, last_viewed_at")
          .eq("user_id", userId)
          .eq("partnershipsubmit_id", numericId)
          .gt("last_viewed_at", _24hAgo);

        if (!logRows || logRows.length === 0) {
          // +1
          const { data: oldData } = await supabase
            .from("partnershipsubmit")
            .select("views")
            .eq("id", numericId)
            .single();

          const currViews = oldData?.views || 0;
          const newViews = currViews + 1;

          const { data: updated } = await supabase
            .from("partnershipsubmit")
            .update({ views: newViews })
            .eq("id", numericId)
            .select("views")
            .single();

          if (updated) {
            setViews(updated.views);
          }

          // log upsert
          await supabase.from("partnershipsubmit_views_log").upsert(
            {
              user_id: userId,
              partnershipsubmit_id: numericId,
              last_viewed_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id, partnershipsubmit_id",
            }
          );
        }
      } catch (err) {
        console.error("조회수 증가 로직 오류:", err);
      }
      setHasCountedView(true);
    })();
  }, [userId, numericId, hasCountedView]);

  // ─────────────────────────────────────────────────────────
  // 3) “가고싶다” 여부 (로그인 시)
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
        if (data && !error) {
          setIsSaved(true);
        }
      })
      .catch((err) => console.error("wantToGo check error:", err));
  }, [session, numericId]);

  // “가고싶다” 저장
  async function handleSave() {
    if (!session?.user?.id) {
      alert("로그인이 필요합니다!");
      return;
    }
    if (isSaved) {
      alert("이미 '가고싶다' 목록에 있습니다.");
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
        alert("가고싶다 목록에 저장됨!");
      } else {
        console.error("wantToGo insert error:", error);
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
  // 5) 섹션/코스 로드 + 최저가 구하기
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
        // 1) 섹션 로드
        const { data: secRows, error: secErr } = await supabase
          .from("sections")
          .select("*")
          .eq("post_id", numericId)
          .order("display_order", { ascending: true });

        if (secErr) throw new Error("섹션 조회 오류: " + secErr.message);

        // 섹션이 없다면
        if (!secRows || secRows.length === 0) {
          setSectionsData([]);
          setLoadingSections(false);
          return;
        }

        // 2) 코스 로드
        const secIds = secRows.map((s) => s.id);
        const { data: couRows, error: couErr } = await supabase
          .from("courses")
          .select("*")
          .in("section_id", secIds)
          .order("display_order", { ascending: true });

        if (couErr) throw new Error("코스 조회 오류: " + couErr.message);

        // 3) 섹션-코스 merge
        const newSecs = secRows.map((sec) => {
          const relatedCourses = (couRows || []).filter(
            (c) => c.section_id === sec.id
          );
          return {
            id: sec.id,
            title: sec.section_title,
            isOpen: true, // 기본 펼침
            courses: relatedCourses.map((c) => ({
              id: c.id,
              course_name: c.course_name,
              duration: c.duration || "",
              price: c.price || 0,
              etc_info: c.etc_info || "",
            })),
          };
        });

        setSectionsData(newSecs);

        // 4) 최저가 계산
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

  // 섹션 열기/닫기
  function toggleSectionOpen(secId) {
    setSectionsData((prev) =>
      prev.map((s) =>
        s.id === secId ? { ...s, isOpen: !s.isOpen } : s
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // 6) 렌더링
  // ─────────────────────────────────────────────────────────
  // 전화번호, 연락방법(contact_method + near_building), 영업시간, 주차안내, 관리사님, 최저가
  const fullContact = row.contact_method
    ? row.contact_method + (row.near_building ? ` / ${row.near_building}` : "")
    : row.near_building || ""; // 둘 중 하나만 있으면 이어붙이거나 etc.

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
                {session?.user?.id && (
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
                        d="M12 21l-1.45-1.342C5.4 15.36 2
                           12.28 2 8.5 2 5.42 4.42 3 7.5
                           3c1.74 0 3.41.81 4.5
                           2.09A5.987 5.987 0 0 1
                           16.5 3C19.58 3 22 5.42
                           22 8.5c0 3.78-3.4
                           6.86-8.55 11.158L12 21z"
                      />
                    </svg>
                  </button>
                )}
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
          <h1 className="text-3xl font-bold mb-2">
            {row.company_name}
            <span className="text-base text-gray-600 ml-2">
              (조회수: {views})
            </span>
          </h1>
          <div className="flex items-center gap-1 text-gray-700 mb-3">
            <MegaphoneIcon className="w-5 h-5 text-red-500" />
            <span className="font-semibold">
              {row.shop_type || "샵형태 미입력"}
            </span>
          </div>

          {/* ★ 요청한 필드들: greeting / address_street / phone_number / contact_method + near_building / open_hours / 최저가 / parking_type / manager_desc */}
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
        </div>

        {/* (A-3) 이벤트 */}
        {row.event_info?.trim() && (
          <div className="mt-6 bg-white p-4 rounded">
            <DetailRow label="이벤트" value={row.event_info} />
          </div>
        )}

        {/* (A-4) 코스 안내 (sections/courses) */}
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">코스안내</h2>
          <p className="text-sm text-gray-500 mb-2">
            ※ 휴대폰 전원이 OFF인 경우, 샵 휴무 또는 예약이 꽉찼을 수 있으니 참고 바랍니다.
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
                  {/* 섹션 헤더 (열기/닫기 버튼) */}
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

                  {/* 코스 목록 */}
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
                                {/* 코스명 + 소요시간 */}
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
                                {/* 가격 */}
                                {c.price > 0 && (
                                  <div className="text-red-600 font-medium">
                                    {formatPrice(c.price)}
                                  </div>
                                )}
                              </div>
                              {/* 기타설명 */}
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
        <MapKakao address={row.address} id={row.id}/>
      </div>
    </div>
  );
}