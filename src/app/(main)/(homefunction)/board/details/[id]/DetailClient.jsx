"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseF"; 
import CommentsUI from "./comment";
import MapKakao from "./MapKakao";

/** (1) 비로그인 시 localStorage로 익명 UUID 발급 */
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

/** (2) 스토리지 경로 빌더 */
function buildPublicImageUrl(path) {
  // 주의: next.config.js → images.domains 에 "vejthvawsbsitttyiwzv.supabase.co" 추가 필요!
  return `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${path}`;
}

/** (3) 간단 label-value */
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

/**
 * (4) 메인 컴포넌트
 */
export default function DetailClient({ row, images, numericId }) {
  // ① supabase 세션
  const [session, setSession] = useState(null);

  // ② “가고싶다” 여부
  const [isSaved, setIsSaved] = useState(false);

  // ③ DB의 views
  const [views, setViews] = useState(row.views || 0);

  // ④ 24시간 중복 방지 (이 컴포넌트 내에서 한 번만)
  const [hasCountedView, setHasCountedView] = useState(false);

  // ─────────────────────────────────────────
  // (A) 컴포넌트 마운트 시: 세션 + onAuthStateChange
  // ─────────────────────────────────────────
  useEffect(() => {
    // (A-1) 현재 세션 가져오기
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

    // (A-2) onAuthStateChange
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        // “로그인 직후” → anon_user_id를 session.user.id로 병합
        if (event === "SIGNED_IN" && newSession?.user?.id) {
          const realId = newSession.user.id;
          const anonId = localStorage.getItem("anon_user_id");
          if (anonId && anonId !== realId) {
            console.log("MERGE from anon=", anonId, "→ real=", realId);
            try {
              // 예시: partnershipsubmit_views_log
              await supabase
                .from("partnershipsubmit_views_log")
                .update({ user_id: realId })
                .eq("user_id", anonId);

              // "wantToGo" 등 다른 테이블도 비슷하게 update 가능

              // localStorage 상 anon_user_id를 realId로 덮어씀
              localStorage.setItem("anon_user_id", realId);
            } catch (err) {
              console.error("merge error:", err);
            }
          }
        }
        // 로그아웃 시 anon_user_id를 새 발급할지, 그대로 둘지는 취향
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // ─────────────────────────────────────────
  // (B) user_id 결정 (로그인 유저 vs anon)
  // ─────────────────────────────────────────
  // 로그인 유저면 session.user.id, 아니면 anon_user_id
  let userId = null;
  if (session?.user?.id) {
    userId = session.user.id; // 실제 유저
  } else if (typeof window !== "undefined") {
    userId = getOrCreateAnonUuid(); 
  }

  // ─────────────────────────────────────────
  // (C) 24시간 중복 체크 → views +1
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;      // userId 없으면 return (이론상 발생X)
    if (!numericId) return;   // 파라미터 없으면 return
    if (hasCountedView) return; // 이미 카운트 했다면 return

    (async () => {
      try {
        // 24시간 전 시점
        const _24hAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // 1) partnershipsubmit_views_log에서 최근 기록이 24h 내 있는지 확인
        const { data: logRows, error: logErr } = await supabase
          .from("partnershipsubmit_views_log")
          .select("id, last_viewed_at")
          .eq("user_id", userId)
          .eq("partnershipsubmit_id", numericId)
          .gt("last_viewed_at", _24hAgo);

        if (logErr) {
          console.error("logRows error:", logErr);
          setHasCountedView(true);
          return;
        }

        // 2) 24h 내 기록이 없으면 → views +1
        if (!logRows || logRows.length === 0) {
          // 현재 partnershipsubmit 조회
          const { data: oldData, error: oldErr } = await supabase
            .from("partnershipsubmit")
            .select("views")
            .eq("id", numericId)
            .single();

          if (!oldErr && oldData) {
            const currViews = oldData.views || 0;
            const newViews = currViews + 1;

            // views update
            const { data: updated, error: updErr } = await supabase
              .from("partnershipsubmit")
              .update({ views: newViews })
              .eq("id", numericId)
              .select("views")
              .single();

            if (!updErr && updated) {
              setViews(updated.views); // state 갱신
            }

            // partnershipsubmit_views_log upsert
            await supabase
              .from("partnershipsubmit_views_log")
              .upsert(
                {
                  user_id: userId,
                  partnershipsubmit_id: numericId,
                  last_viewed_at: new Date().toISOString(),
                },
                { onConflict: "user_id, partnershipsubmit_id" }
              );
          }
        }
      } catch (error) {
        console.error("조회수 증가 로직 오류:", error);
      }

      setHasCountedView(true);
    })();
  }, [userId, numericId, hasCountedView]);

  // ─────────────────────────────────────────
  // (D) “가고싶다” 여부 (로그인만 체크)
  // ─────────────────────────────────────────
  useEffect(() => {
    // 만약 로그인 안 되었으면 skip
    if (!session?.user?.id) return;
    if (!numericId) return;

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
      .catch((err) => {
        console.error("wantToGo check error:", err);
      });
  }, [session, numericId]);

  // (E) 이미지 배열
  const allImages = [];
  if (row.thumbnail_url) {
    allImages.push(buildPublicImageUrl(row.thumbnail_url));
  }
  if (images && images.length > 0) {
    images.forEach((imgObj) => {
      allImages.push(buildPublicImageUrl(imgObj.image_url));
    });
  }

  // (F) “가고싶다” 저장 (로그인만 가능)
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
      const { data, error } = await supabase
        .from("wantToGo")
        .insert({
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

  // ─────────────────────────────────────────
  // (G) 렌더링
  // ─────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
      {/* 왼쪽 영역 */}
      <div className="flex-[7]">
        {/* 이미지 섹션 */}
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

        {/* 상세 정보 */}
        <div className="mt-6 bg-white p-4 rounded">
          <h1 className="text-3xl font-bold mb-2">
            {row.company_name}{" "}
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

          <DetailRow label="업체 소개" value={row.greeting} />
          <DetailRow label="오시는 길" value={row.address} />
          {/* ... 필요하면 추가 */}
        </div>

        {/* 이벤트 */}
        {row.event_info?.trim() && (
          <div className="mt-6 bg-white p-4 rounded">
            <DetailRow label="이벤트" value={row.event_info} />
          </div>
        )}

        {/* 댓글 */}
        <div className="mt-6 bg-white p-4 rounded">
          <CommentsUI company_name={row.company_name} id={row.id} />
        </div>
      </div>

      {/* 오른쪽 지도 */}
      <div className="flex-[3] rounded overflow-hidden h-[330px]">
        <MapKakao address={row.address} />
      </div>
    </div>
  );
}