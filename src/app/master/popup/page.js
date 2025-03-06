"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseF";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

/** 
 * Supabase 스토리지 public URL 빌더 
 * (버킷명: gunma, PROJECT_URL 은 본인 프로젝트 주소로 교체)
 */
const PROJECT_URL = "https://vejthvawsbsitttyiwzv.supabase.co";
function buildPublicImageUrl(path) {
  return `${PROJECT_URL}/storage/v1/object/public/gunma/${path}`;
}

/** 
 * 작성일(생성일) 로컬 시간 표시 
 */
function formatLocalTime(isoString) {
  if (!isoString) return "(작성일 없음)";
  const utcDate = new Date(isoString);
  const localDate = new Date(utcDate.getTime());
  return localDate.toLocaleString(); // 브라우저 로케일에 따른 로컬 시간 포맷
}

/** 
 * 팝업 상세 페이지
 * URL 파라미터 id에 해당하는 partnershipsubmit 행과 관련 조인 데이터(region, profiles)를 출력합니다.
 */
export default function PartnershipPopupPage() {
  const searchParams = useSearchParams();
  const rowId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);

  // 쪽지 전송 관련
  const [showTextarea, setShowTextarea] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionUserId, setSessionUserId] = useState(null);

  // 추가 이미지(1:N)
  const [images, setImages] = useState([]);

  // 프로필 보기 토글
  const [showProfile, setShowProfile] = useState(false);
  function toggleProfile() {
    setShowProfile((prev) => !prev);
  }

  // -------------------------------------------
  // 1) 세션 및 rowId로 DB 조회
  // -------------------------------------------
  useEffect(() => {
    if (!rowId) return;
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("세션 체크 에러:", error);
        window.close();
        return;
      }
      if (!data.session) {
        alert("로그인 정보가 없습니다. 팝업을 닫습니다.");
        window.close();
      } else {
        setSessionUserId(data.session.user.id);
        fetchOneRow(rowId);
      }
    });
  }, [rowId]);

  /** partnershipsubmit과 관련 조인(지역, 세부지역, 프로필) 데이터를 가져옴 */
  async function fetchOneRow(id) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("partnershipsubmit")
        .select(`
          id,
          ad_type,
          region_id,
          sub_region_id,
          company_name,
          phone_number,
          manager_contact,
          parking_type,
          shop_type,
          sponsor,
          contact_method,
          greeting,
          event_info,
          address,
          near_building,
          open_hours,
          program_info,
          post_title,
          manager_desc,
          created_at,
          user_id,
          thumbnail_url,
          is_admitted,
          final_admitted,
          region:region_id(name),
          subregion:sub_region_id(name),
          profiles:user_id(name, nickname, phone, created_at)
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("팝업 DB조회 오류:", error);
        window.close();
        return;
      }
      setRow(data);
    } catch (err) {
      console.error("API 오류:", err);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------
  // 1-2) is_admitted가 true이면 추가 이미지 목록 조회
  // -------------------------------------------
  useEffect(() => {
    if (row && row.is_admitted) {
      fetchImages(row.id);
    }
  }, [row]);

  async function fetchImages(submitId) {
    try {
      const { data, error } = await supabase
        .from("partnershipsubmit_images")
        .select("image_url")
        .eq("submit_id", submitId);
      if (error) {
        console.error("이미지 목록 조회 에러:", error);
        return;
      }
      setImages(data || []);
    } catch (err) {
      console.error("이미지 목록 fetch 오류:", err);
    }
  }

  // -------------------------------------------
  // 2) 쪽지 전송
  // -------------------------------------------
  async function handleSendMsg() {
    if (!row || !row.user_id) {
      alert("row.user_id가 없습니다!");
      return;
    }
    if (!message.trim()) {
      alert("쪽지 내용을 입력하세요!");
      return;
    }
    if (!sessionUserId) {
      alert("로그인 정보가 없습니다!");
      return;
    }

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: sessionUserId,
          receiver_id: row.user_id,
          content: message,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        alert(`쪽지 전송 실패: ${error || "알 수 없는 에러"}`);
        return;
      }
      alert(
        `쪽지 전송 완료!\n보낸사람: ${sessionUserId}\n받는사람: ${row.user_id}\n내용: ${message}`
      );
      setMessage("");
      setShowTextarea(false);
    } catch (err) {
      console.error("쪽지 전송 중 오류:", err);
      alert("쪽지 전송 오류");
    }
  }

  // -------------------------------------------
  // 3) 전화걸기
  // -------------------------------------------
  function handleCall() {
    if (!row || !row.phone_number) {
      alert("전화번호가 없습니다.");
      return;
    }
    window.location.href = `tel:${row.phone_number}`;
  }

  // -------------------------------------------
  // 4) 팝업 닫기
  // -------------------------------------------
  function handleCloseWindow() {
    window.close();
  }

  // -------------------------------------------
  // 5) 승인 / 최종승인 버튼 처리
  // -------------------------------------------
  async function handleApproval() {
    if (!row) return;
    if (!row.is_admitted) {
      // 승인 처리: is_admitted를 true로 업데이트
      if (!confirm("해당 항목을 승인하시겠습니까?")) return;
      const { error } = await supabase
        .from("partnershipsubmit")
        .update({ is_admitted: true })
        .eq("id", row.id);
      if (error) {
        alert("승인 실패: " + error.message);
        return;
      }
      alert("승인 완료되었습니다.");
      fetchOneRow(row.id);
    } else {
      // 최종승인 처리: final_admitted를 true로 업데이트
      if (
        !confirm(
          "최종 승인 진행하시겠습니까? 최종 승인 후에는 모든 일반 사용자들에게 노출됩니다."
        )
      )
        return;
      const { error } = await supabase
        .from("partnershipsubmit")
        .update({ final_admitted: true })
        .eq("id", row.id);
      if (error) {
        alert("최종 승인 실패: " + error.message);
        return;
      }
      alert("최종 승인 완료되었습니다.");
      fetchOneRow(row.id);
    }
  }

  // -------------------------------------------
  // 6) 이미지 클릭 시 크게 보기 (새 탭)
  // -------------------------------------------
  function handleImageClick(imgUrl) {
    const fullUrl = buildPublicImageUrl(imgUrl);
    window.open(fullUrl, "_blank");
  }

  // -------------------------------------------
  // 렌더링
  // -------------------------------------------
  if (!rowId) {
    return <div className="p-4">잘못된 접근(아이디 없음)</div>;
  }
  if (loading) {
    return <div className="p-4">로딩 중...</div>;
  }
  if (!row) {
    return <div className="p-4">데이터를 찾을 수 없습니다.</div>;
  }

  // region 및 subregion 이름, 프로필 객체
  const regionName = row.region?.name || "";
  const subRegionName = row.subregion?.name || "";
  const profileObj = row.profiles || null;

  return (
    <div className="p-4" style={{ minWidth: "800px", minHeight: "800px" }}>
      <h1 className="text-xl font-bold mb-2">팝업 상세 페이지</h1>

      {/* partnershipsubmit 모든 컬럼 표시 */}
      <div className="border border-gray-200 p-2 space-y-2 text-sm">
        <DetailItem label="광고유형 (ad_type)" value={row.ad_type} />
        <DetailItem label="지역" value={regionName} />
        <DetailItem label="세부지역" value={subRegionName} />
        <DetailItem label="업체명" value={row.company_name} />
        <DetailItem label="전화번호" value={row.phone_number} />
        <DetailItem label="담당자 연락처" value={row.manager_contact} />
        <DetailItem label="주차방법" value={row.parking_type} />
        <DetailItem label="샵형태" value={row.shop_type} />
        <DetailItem label="후원" value={row.sponsor} />
        <DetailItem label="연락방법" value={row.contact_method} />
        <DetailItem label="인사말" value={row.greeting} />
        <DetailItem label="이벤트" value={row.event_info} />
        <DetailItem label="주소" value={row.address} />
        <DetailItem label="인근 건물" value={row.near_building} />
        <DetailItem label="영업시간" value={row.open_hours} />
        <DetailItem label="프로그램" value={row.program_info} />
        <DetailItem label="글제목" value={row.post_title} />
        <DetailItem label="관리사" value={row.manager_desc} />
        <DetailItem label="작성일" value={formatLocalTime(row.created_at)} />
      </div>

      {/* 프로필 보기 */}
      <div className="mt-4 border border-gray-200 p-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm">작성자 프로필</span>
          <button
            onClick={toggleProfile}
            className="text-blue-600 text-sm underline"
          >
            {showProfile ? "프로필 닫기" : "프로필 보기"}
          </button>
        </div>
        {showProfile && profileObj && (
          <div className="mt-2 space-y-2 text-sm">
            <DetailItem label="이름" value={profileObj.name} />
            <DetailItem label="닉네임" value={profileObj.nickname} />
            <DetailItem label="전화번호" value={profileObj.phone} />
            <DetailItem
              label="가입일"
              value={formatLocalTime(profileObj.created_at)}
            />
          </div>
        )}
      </div>

      {/* is_admitted=true → 이미지 미리보기 */}
      {row.is_admitted && (
        <div className="mt-4 p-2 border border-gray-200">
          <h2 className="text-lg font-bold mb-2">이미지 미리보기</h2>
          {/* 썸네일 */}
          <div className="mb-4">
            <strong>썸네일: </strong>
            {row.thumbnail_url ? (
              <img
                src={buildPublicImageUrl(row.thumbnail_url)}
                alt="썸네일"
                className="w-32 h-auto border cursor-pointer mt-1"
                onClick={() => handleImageClick(row.thumbnail_url)}
              />
            ) : (
              <div className="text-gray-500 mt-1">
                이미지가 등록되지 않았습니다.
              </div>
            )}
          </div>
          {/* 추가 이미지들 */}
          <div>
            <strong>추가 이미지들:</strong>
            {images.length > 0 ? (
              <div className="flex gap-2 flex-wrap mt-1">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={buildPublicImageUrl(img.image_url)}
                    alt={`추가이미지-${idx}`}
                    className="w-24 h-24 object-cover border cursor-pointer"
                    onClick={() => handleImageClick(img.image_url)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-gray-500 mt-1">
                이미지 아직 업로드 되지않음
              </div>
            )}
          </div>
        </div>
      )}

      {/* 하단 버튼들 */}
      <div className="mt-4 flex items-center gap-2">
        <button
          className="px-3 py-1 bg-green-500 text-white rounded"
          onClick={handleCall}
        >
          연락하기
        </button>
        <button
          className="px-3 py-1 bg-orange-500 text-white rounded disabled:opacity-50"
          onClick={handleApproval}
          disabled={row.is_admitted && !row.thumbnail_url}
          title={
            row.is_admitted && !row.thumbnail_url
              ? "이용자가 이미지를 업로드 한 후에 가능합니다"
              : ""
          }
        >
          {row.is_admitted ? "최종승인" : "승인"}
        </button>
        <button
          className="px-3 py-1 bg-gray-300 text-black rounded"
          onClick={() => setShowTextarea((prev) => !prev)}
        >
          {showTextarea ? "쪽지 닫기" : "쪽지 열기"}
        </button>
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded"
          onClick={handleCloseWindow}
        >
          닫기
        </button>
      </div>

      {/* 쪽지 영역 */}
      {showTextarea && (
        <div className="mt-3 border border-gray-200 p-2 relative">
          <textarea
            className="w-full h-20 border border-gray-300 p-2 pr-12 text-sm resize-none"
            placeholder="쪽지를 작성하세요..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            onClick={handleSendMsg}
            style={{ backgroundColor: "#229ED9" }}
            className="absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center"
          >
            <PaperAirplaneIcon className="h-4 w-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

/** 단순 정보 표시용 컴포넌트 */
function DetailItem({ label, value }) {
  return (
    <div>
      <strong>{label}:</strong> {value}
    </div>
  );
}