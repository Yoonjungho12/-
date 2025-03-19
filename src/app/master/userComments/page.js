"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

/** 전화번호 포맷: "010-1234-5678" 형태로 변환 */
function formatPhoneNumber(rawPhone) {
  if (!rawPhone) return "(전화번호 없음)";
  const digitsOnly = rawPhone.replace(/\D/g, "");
  if (digitsOnly.length === 11) {
    return digitsOnly.replace(/^(\d{3})(\d{4})(\d{4})$/, "$1-$2-$3");
  } else if (digitsOnly.length === 10) {
    return digitsOnly.replace(/^(\d{2,3})(\d{3})(\d{4})$/, "$1-$2-$3");
  } else {
    return rawPhone;
  }
}

/** 날짜/시간 문자열: "오늘/어제/x일 전" 등 */
function formatLocalTime(isoString) {
  if (!isoString) return "(작성일 없음)";
  const utcDate = new Date(isoString);
  const localDate = new Date(utcDate.getTime());

  const hh = String(localDate.getHours()).padStart(2, "0");
  const mm = String(localDate.getMinutes()).padStart(2, "0");

  const createdNoTime = new Date(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    0,
    0,
    0
  );
  const now = new Date();
  const nowNoTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0
  );
  let dayDiff = Math.floor((nowNoTime - createdNoTime) / (1000 * 60 * 60 * 24));

  if (dayDiff < 0) dayDiff = 0;
  if (dayDiff === 0) return `오늘 ${hh}:${mm}`;
  if (dayDiff === 1) return `어제 ${hh}:${mm}`;
  if (dayDiff <= 7) return `${dayDiff}일 전 ${hh}:${mm}`;

  const thisYear = now.getFullYear();
  const year = localDate.getFullYear();
  const month = localDate.getMonth() + 1;
  const date = localDate.getDate();
  if (year === thisYear) {
    return `${month}월 ${date}일 ${hh}:${mm}`;
  } else {
    return `${year}년 ${month}월 ${date}일 ${hh}:${mm}`;
  }
}

export default function UserCommentsPopup() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("user_id");

  // 프로필
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // 댓글
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);

  // 작성 게시글
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchProfile(userId);
    fetchComments(userId);
    fetchMyPosts(userId);
  }, [userId]);

  // ================== 프로필 조회 ==================
  async function fetchProfile(uid) {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, nickname, phone, created_at, is_banned")
        .eq("user_id", uid)
        .single();

      if (error) {
        console.error("프로필 조회 에러:", error);
        setProfile(null);
      } else {
        setProfile(data || null);
      }
    } catch (err) {
      console.error("프로필 fetch 오류:", err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }

  // ================== 댓글 조회 ==================
  async function fetchComments(uid) {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          comment,
          created_at,
          is_admitted,
          partnershipsubmit_id,
          partnershipsubmit ( id, post_title )
        `)
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("댓글 조회 에러:", error);
        setComments([]);
      } else {
        setComments(data || []);
      }
    } catch (err) {
      console.error("API fetch 오류:", err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }

  // ================== 작성 글 조회 ==================
  async function fetchMyPosts(uid) {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from("partnershipsubmit")
        .select("id, post_title, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("파트너십 글 조회 에러:", error);
        setMyPosts([]);
      } else {
        setMyPosts(data || []);
      }
    } catch (err) {
      console.error("파트너십 글 fetch 오류:", err);
      setMyPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }

  // 쪽지 보내기
  function handleSendMsgPopup() {
    if (!userId) {
      alert("유저 정보가 없습니다!");
      return;
    }
    const w = 500,
      h = 800;
    const top = window.screenY + 100;
    const left = window.screenX + 100;
    window.open(
      `/master/sendMessage?otherId=${userId}`,
      `sendMessagePopup-${userId}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=no,scrollbars=yes`
    );
  }

  // 게시글 제목 클릭 (팝업)
  function handlePostTitleClick(postId) {
    const w = 1500,
      h = 1500;
    const top = window.screenY + 50;
    const left = window.screenX + 50;
    window.open(
      `/board/details/${postId}`,
      `postDetailPopup-${postId}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  }

  // ================== 유저 차단/해제 ==================
  async function handleToggleBan() {
    if (!profile) return;

    if (profile.is_banned) {
      if (!confirm("해당 유저의 차단을 해제하시겠습니까?")) return;
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ is_banned: false })
          .eq("user_id", userId);
        if (error) {
          console.error("차단 해제 오류:", error);
          alert("차단 해제 실패: " + error.message);
          return;
        }
        alert("차단이 해제되었습니다.");
        fetchProfile(userId);
      } catch (err) {
        console.error("차단 해제 오류:", err);
        alert("차단 해제 중 오류 발생!");
      }
    } else {
      const msg =
        "유저 차단을 하면 해당 유저는 댓글 및 커뮤니티 게시글을 작성할 수 없습니다.\n" +
        "진행하시겠습니까? (유저 차단 후 차단 해제 복구 가능)";
      if (!confirm(msg)) return;
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ is_banned: true })
          .eq("user_id", userId);
        if (error) {
          console.error("유저 차단 오류:", error);
          alert("유저 차단 실패: " + error.message);
          return;
        }
        alert("유저가 차단되었습니다.");
        fetchProfile(userId);
      } catch (err) {
        console.error("유저 차단 API 오류:", err);
        alert("유저 차단 중 오류 발생!");
      }
    }
  }

  // ================== 회원 탈퇴 ==================
  async function handleDeleteUser() {
    if (!confirm("정말 회원 탈퇴 처리하시겠습니까?")) return;
    try {
      const res = await fetch("/api/deleteUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        alert("회원 탈퇴 실패: " + (error || "알 수 없는 에러"));
        return;
      }
      alert("회원 탈퇴가 완료되었습니다.");
    } catch (err) {
      console.error("회원 탈퇴 요청 중 오류:", err);
      alert("회원 탈퇴 요청 중 오류가 발생했습니다.");
    }
  }

  // ================== 댓글 거부(삭제) ==================
  async function handleRejectComment(commentId) {
    if (!confirm("이 댓글을 '거부'(삭제)하시겠습니까?")) return;
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) {
        console.error("댓글 거부 오류:", error);
        alert("댓글 거부 실패: " + error.message);
        return;
      }
      alert("댓글이 거부(삭제)되었습니다.");
      fetchComments(userId);
    } catch (err) {
      console.error("댓글 거부 중 오류:", err);
      alert("댓글 거부 중 오류 발생!");
    }
  }

  // ================== 댓글 삭제(승인된 것도) ==================
  async function handleDeleteComment(commentId) {
    if (!confirm("승인된 댓글을 삭제하시겠습니까?")) return;
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) {
        console.error("댓글 삭제 오류:", error);
        alert("댓글 삭제 실패: " + error.message);
        return;
      }
      alert("댓글이 삭제되었습니다.");
      fetchComments(userId);
    } catch (err) {
      console.error("댓글 삭제 중 오류:", err);
      alert("댓글 삭제 중 오류 발생!");
    }
  }

  // ================== 댓글 '승인' (is_admitted = true) ==================
  async function handleApproveComment(commentId) {
    if (!confirm("이 댓글을 승인하시겠습니까?")) return;
    try {
      const { error } = await supabase
        .from("comments")
        .update({ is_admitted: true })
        .eq("id", commentId);

      if (error) {
        console.error("댓글 승인 오류:", error);
        alert("댓글 승인 실패: " + error.message);
        return;
      }
      alert("댓글이 승인되었습니다.");
      fetchComments(userId);
    } catch (err) {
      console.error("댓글 승인 중 오류:", err);
      alert("댓글 승인 중 오류 발생!");
    }
  }

  if (!userId) {
    return (
      <div className="p-4 text-red-600">
        잘못된 접근입니다. (user_id가 존재하지 않음)
      </div>
    );
  }

  // 전화번호 포맷
  const displayPhone = profile?.phone ? formatPhoneNumber(profile.phone) : "";
  // 유저 차단/해제 버튼
  const banBtnLabel = profile?.is_banned ? "차단 해제" : "유저 차단";
  const banBtnColorClass = profile?.is_banned
    ? "border border-green-600 text-green-600 hover:bg-green-600 hover:text-white hover:border-transparent"
    : "border border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white hover:border-transparent";
    
  return (
    <>
     <h1 className="text-xl font-semibold bg-zinc-700 p-3 text-white">유저 상세 정보</h1>
    <div className="relative min-h-screen bg-gray-50 p-4 flex flex-col gap-6">
     

      {/* 프로필 카드 */}
      <div className="bg-white border border-gray-200 rounded-lg shadow p-4">
        <h2 className="font-semibold text-base mb-3">유저 기본 정보</h2>
        {profileLoading ? (
          <div className="text-sm text-gray-500">로딩 중...</div>
        ) : profile ? (
          <table className="table-auto w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="px-3 py-2 text-left">이름</th>
                <th className="px-3 py-2 text-left">닉네임</th>
                <th className="px-3 py-2 text-left">전화번호</th>
                <th className="px-3 py-2 text-left">가입일</th>
                <th className="px-3 py-2 text-left">차단 여부</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 text-gray-700">
                <td className="px-3 py-2">{profile.name || "(이름 없음)"}</td>
                <td className="px-3 py-2">
                  {profile.nickname || "(닉네임 없음)"}
                </td>
                <td className="px-3 py-2">{displayPhone}</td>
                <td className="px-3 py-2">
                  {formatLocalTime(profile.created_at)}
                </td>
                <td className="px-3 py-2">
                  {profile.is_banned ? (
                    <span className="text-red-600 font-medium">차단됨</span>
                  ) : (
                    <span className="text-blue-600 font-medium">정상</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="text-sm text-red-500">
            프로필 정보를 찾을 수 없습니다.
          </div>
        )}
      </div>

      {/* 게시글 카드 (작성글이 있을 때만) */}
      {loadingPosts ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow p-4 text-sm text-gray-500">
          게시글 로딩 중...
        </div>
      ) : myPosts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow p-4">
          <h2 className="font-semibold text-base mb-3">제휴 게시글</h2>
          <table className="table-auto w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="px-3 py-2 text-left">제목</th>
                <th className="px-3 py-2 text-left">작성일</th>
              </tr>
            </thead>
            <tbody>
              {myPosts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-gray-200 text-gray-700"
                >
                  <td className="px-3 py-2">
                    {/* underline 제거 → hover 시만 색상 변화 */}
                    <button
                      className="text-blue-600 hover:text-blue-400 focus:outline-none"
                      onClick={() => handlePostTitleClick(post.id)}
                    >
                      {post.post_title || "(제목 없음)"}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    {formatLocalTime(post.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 댓글 카드 */}
      <div className="bg-white border border-gray-200 rounded-lg shadow p-4 flex-1">
        <h2 className="font-semibold text-base mb-3">유저 댓글 목록</h2>
        {loadingComments ? (
          <div className="text-sm text-gray-500">댓글 로딩 중...</div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-gray-500">댓글이 없습니다.</div>
        ) : (
          <table className="table-auto w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="px-3 py-2 text-left">게시글 제목</th>
                <th className="px-3 py-2 text-left w-[250px]">댓글 내용</th>
                <th className="px-3 py-2 text-left">작성일</th>
                <th className="px-3 py-2 text-left">승인</th>
                <th className="px-3 py-2 text-left">관리</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((cmt) => {
                const pSub = cmt.partnershipsubmit;
                const isApproved = cmt.is_admitted;

                // 미승인 => "거부" + "승인"  / 승인 => "삭제"
                const renderButtons = isApproved ? (
                  <button
                    onClick={() => handleDeleteComment(cmt.id)}
                    className="px-2 py-1 text-xs rounded border border-red-600 text-red-600 hover:bg-red-600 hover:text-white hover:border-transparent"
                  >
                    삭제
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectComment(cmt.id)}
                      className="px-2 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-400"
                    >
                      거부
                    </button>
                    <button
                      onClick={() => handleApproveComment(cmt.id)}
                      className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-400"
                    >
                      승인
                    </button>
                  </div>
                );

                return (
                  <tr
                    key={cmt.id}
                    className="border-b border-gray-200 text-gray-700"
                  >
                    {/* 게시글 제목 */}
                    <td className="px-3 py-2">
                      {pSub ? (
                        <a
                          href={`/board/details/${pSub.id}`}
                          className="text-blue-600 hover:text-blue-400"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {pSub.post_title || "(제목없음)"}
                        </a>
                      ) : (
                        <span className="text-gray-400">(연결된 글 없음)</span>
                      )}
                    </td>
                    {/* 댓글 내용 – 길어지면 줄바꿈 */}
                    <td className="px-3 py-2 whitespace-pre-wrap break-words w-[250px] max-w-[250px]">
                      {cmt.comment}
                    </td>
                    {/* 작성일 */}
                    <td className="px-3 py-2">{formatLocalTime(cmt.created_at)}</td>
                    {/* 승인 텍스트 */}
                    <td className="px-3 py-2">
                      {isApproved ? (
                        <span className="text-green-600 font-medium">승인</span>
                      ) : (
                        <span className="text-orange-500 font-medium">미승인</span>
                      )}
                    </td>
                    {/* 관리 칼럼 – (거부 + 승인) or (삭제) */}
                    <td className="px-3 py-2">
                      {renderButtons}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 오른쪽 하단 버튼들 – fixed */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 z-50">
        {/* 쪽지 보내기 */}
        <button
          onClick={handleSendMsgPopup}
          className="px-4 py-2 text-sm font-medium
                     rounded-md  border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-transparent
                     focus:outline-none
                     shadow-lg"
        >
          쪽지 보내기
        </button>
        {/* 유저 차단/차단 해제 */}
        <button
          onClick={handleToggleBan}
          className={`px-4 py-2 text-sm font-medium rounded-md
                     focus:outline-none shadow-lg
                     ${banBtnColorClass}`}
        >
          {banBtnLabel}
        </button>
        {/* 회원 탈퇴 */}
        <button
          onClick={handleDeleteUser}
          className="px-4 py-2 text-sm font-medium
                     rounded-md border border-red-600 text-red-600 hover:bg-red-600 hover:text-white hover:border-transparent
                     focus:outline-none
                     shadow-lg"
        >
          회원 탈퇴
        </button>
      </div>
    </div>
    </>
  );
}