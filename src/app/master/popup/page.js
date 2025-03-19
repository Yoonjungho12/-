"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseF";
import Image from "next/image";

/** Supabase 스토리지 경로 → 풀 URL */
const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL;
function buildPublicImageUrl(path) {
  return `${PROJECT_URL}/${path}`;
}

/** 날짜/시간 포맷 */
function formatLocalTime(isoString) {
  if (!isoString) return "(작성일 없음)";
  const date = new Date(isoString);
  return date.toLocaleString();
}

export default function PartnershipPopupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="w-screen h-screen">
        <PartnershipPopupPageContent />
      </div>
    </Suspense>
  );
}

function PartnershipPopupPageContent() {
  const searchParams = useSearchParams();
  const rowId = searchParams.get("id");

  // 로딩상태
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);

  // 섹션/코스
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(true);

  // 이미지
  const [images, setImages] = useState([]);

  // 펼침 여부 (true면 추가필드+접기, false면 기본필드+더보기)
  const [expanded, setExpanded] = useState(false);

  // ------------------------------------------------
  // 1) 세션 체크 + partnershipsubmit 조회
  // ------------------------------------------------
  useEffect(() => {
    if (!rowId) return;
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("세션 체크 오류:", error);
        window.close();
        return;
      }
      if (!data.session) {
        alert("로그인 정보가 없습니다. 팝업 닫습니다.");
        window.close();
      } else {
        fetchOneRow(rowId);
      }
    });
  }, [rowId]);

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
          subregion:sub_region_id(name)
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("DB 조회 오류:", error);
        window.close();
        return;
      }
      setRow(data);
    } catch (err) {
      console.error("조회 오류:", err);
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------
  // 2) 섹션/코스 조회
  // ------------------------------------------------
  useEffect(() => {
    if (!row) return;
    fetchSections(row.id);
  }, [row]);

  async function fetchSections(postId) {
    setLoadingSections(true);
    try {
      const { data, error } = await supabase
        .from("sections")
        .select(`
          id,
          section_title,
          section_description,
          display_order,
          courses:courses (
            id,
            course_name,
            duration,
            display_order
          )
        `)
        .eq("post_id", postId)
        .order("display_order", { ascending: true })
        .order("display_order", { foreignTable: "courses", ascending: true });
      if (error) {
        console.error("섹션 조회 오류:", error);
        setSections([]);
        setLoadingSections(false);
        return;
      }
      setSections(data || []);
    } catch (err) {
      console.error("섹션 fetch 오류:", err);
      setSections([]);
    } finally {
      setLoadingSections(false);
    }
  }

  // ------------------------------------------------
  // 3) 이미지 (승인상태면)
  // ------------------------------------------------
  useEffect(() => {
    if (row?.is_admitted) {
      fetchImages(row.id);
    }
  }, [row]);

  async function fetchImages(id) {
    try {
      const { data, error } = await supabase
        .from("partnershipsubmit_images")
        .select("image_url")
        .eq("submit_id", id);
      if (error) {
        console.error("이미지 조회 오류:", error);
        return;
      }
      setImages(data || []);
    } catch (err) {
      console.error("이미지 fetch 오류:", err);
    }
  }

  // ------------------------------------------------
  // 버튼 핸들러
  // ------------------------------------------------
  function handleCloseWindow() {
    window.close();
  }

  async function handleDeleteSubmit() {
    if (!row) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const { error } = await supabase
        .from("partnershipsubmit")
        .delete()
        .eq("id", row.id);
      if (error) {
        alert("삭제 실패: " + error.message);
        return;
      }
      alert("삭제 완료");
      window.close();
    } catch (err) {
      console.error("삭제 오류:", err);
      alert("삭제 중 오류");
    }
  }

  async function handleApproval() {
    if (!row) return;
    if (!row.is_admitted) {
      if (!confirm("승인?")) return;
      const { error } = await supabase
        .from("partnershipsubmit")
        .update({ is_admitted: true })
        .eq("id", row.id);
      if (error) {
        alert("승인 실패:" + error.message);
        return;
      }
      alert("승인 완료");
      fetchOneRow(row.id);
    } else {
      if (!confirm("최종 승인?")) return;
      const { error } = await supabase
        .from("partnershipsubmit")
        .update({ final_admitted: true })
        .eq("id", row.id);
      if (error) {
        alert("최종 승인 실패:" + error.message);
        return;
      }
      alert("최종 승인 완료");
      fetchOneRow(row.id);
    }
  }

  function handleImageClick(url) {
    const fullUrl = buildPublicImageUrl(url);
    window.open(fullUrl, "_blank");
  }

  function handleCall() {
    if (!row?.phone_number) {
      alert("전화번호 없음");
      return;
    }
    window.location.href = `tel:${row.phone_number}`;
  }

  function handleSendMsgPopup() {
    if (!row?.user_id) {
      alert("수신자 정보 없음!");
      return;
    }
    const w = 800,
      h = 1000;
    const top = window.screenY + 100;
    const left = window.screenX + 100;
    window.open(
      `/master/sendMessage?otherId=${row.user_id}`,
      `sendMessagePopup-${row.user_id}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  }

  function handleUserCommentsPopup() {
    if (!row?.user_id) {
      alert("유저 ID 없음!");
      return;
    }
    const w = 800,
      h = 1000;
    const top = window.screenY + 50;
    const left = window.screenX + 50;
    window.open(
      `/master/userComments?user_id=${row.user_id}`,
      `userComments-${row.user_id}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  }

  // ------------------------------------------------
  // 즉시 열고 즉시 닫기 (조건부 렌더링) + NO transition
  // ------------------------------------------------

  // 로딩/에러
  if (!rowId) {
    return <div className="p-4">잘못된 접근 (id 없음)</div>;
  }
  if (loading) {
    return <div className="p-4">로딩 중...</div>;
  }
  if (!row) {
    return <div className="p-4">데이터를 찾을 수 없습니다.</div>;
  }

  // 기본필드
  const basicFields = [
    { label: "광고유형", value: row.ad_type },
    { label: "지역", value: row.region?.name },
    { label: "세부지역", value: row.subregion?.name },
    { label: "업체명", value: row.company_name },
    { label: "전화번호", value: row.phone_number },
    { label: "담당자 연락처", value: row.manager_contact },
  ];

  // 추가필드
  const extraFields = [
    { label: "주차방법", value: row.parking_type },
    { label: "샵형태", value: row.shop_type },
    { label: "후원", value: row.sponsor },
    { label: "연락방법", value: row.contact_method },
    { label: "인사말", value: row.greeting },
    { label: "이벤트", value: row.event_info },
    { label: "주소", value: row.address },
    { label: "인근 건물", value: row.near_building },
    { label: "영업시간", value: row.open_hours },
    { label: "프로그램", value: row.program_info },
    { label: "글제목", value: row.post_title },
    { label: "관리사", value: row.manager_desc },
    { label: "작성일", value: formatLocalTime(row.created_at) },
  ];

  return (
    <div className="flex flex-col w-full h-full bg-white overflow-hidden">
    

      {/* 메인 영역 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* 작성자 프로필 */}
        <div className="border border-slate-200 rounded-md p-3 flex items-center justify-between">
          <h2 className="font-semibold text-base">작성자 프로필</h2>
          <button
            onClick={handleUserCommentsPopup}
            className="bg-zinc-700 px-3 py-1 rounded border text-white hover:bg-zinc-400 text-sm"
          >
            프로필 보기
          </button>
        </div>

        {/* 파트너십 정보 */}
        <div className="border border-slate-200 rounded-md p-3">
          <h2 className="font-semibold text-base mb-2">파트너십 정보</h2>
          <table className="w-full border border-slate-100 rounded-md overflow-hidden text-sm">
            <tbody>
              {/* (1) 기본필드 */}
              {basicFields.map((bf) => (
                <DetailRow key={bf.label} label={bf.label} value={bf.value} />
              ))}

              {/* (2) 만약 expanded=false면 "더보기" 버튼만 표시 */}
              {!expanded && (
                <tr>
                  <td colSpan={2} className="text-center py-2">
                    <button
                      onClick={() => setExpanded(true)}
                      className="bg-zinc-700 px-3 py-1 rounded border text-white hover:bg-zinc-400 text-sm flex items-center justify-center mx-auto"
                    >
                      더보기
                      <span className="text-[10px] leading-none ml-1">▼</span>
                    </button>
                  </td>
                </tr>
              )}

              {/* (3) expanded=true면 추가필드 + "접기" 버튼 즉시 표시 */}
              {expanded && (
                <>
                  {extraFields.map((ef) => (
                    <DetailRow key={ef.label} label={ef.label} value={ef.value} />
                  ))}
                  {/* 접기 버튼 */}
                  <tr>
                    <td colSpan={2} className="text-center py-2">
                      <button
                        onClick={() => setExpanded(false)}
                        className="bg-zinc-700 px-3 py-1 rounded border text-white hover:bg-zinc-400 text-sm flex items-center justify-center mx-auto"
                      >
                        접기
                        <span className="text-[10px] leading-none ml-1">▲</span>
                      </button>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* 이미지 미리보기 */}
        {row.is_admitted && (
          <div className="border border-slate-200 rounded-md p-3">
            <h2 className="text-base font-semibold mb-2">이미지 미리보기</h2>
            <div className="mb-3">
              <strong>썸네일:</strong>{" "}
              {row.thumbnail_url ? (
                <Image
                  src={buildPublicImageUrl(row.thumbnail_url)}
                  alt="썸네일"
                  width={128}
                  height={128}
                  className="w-32 h-auto border cursor-pointer"
                  onClick={() => handleImageClick(row.thumbnail_url)}
                />
              ) : (
                <span className="text-slate-500 ml-2">없음</span>
              )}
            </div>
            <div>
              <strong>추가 이미지들:</strong>
              {images.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {images.map((img, idx) => (
                    <Image
                      key={idx}
                      src={buildPublicImageUrl(img.image_url)}
                      alt={`img-${idx}`}
                      width={96}
                      height={96}
                      className="w-24 h-24 object-cover border cursor-pointer"
                      onClick={() => handleImageClick(img.image_url)}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-slate-500 ml-2">없음</span>
              )}
            </div>
          </div>
        )}

        {/* 섹션/코스 */}
        <SectionCourseBlock sections={sections} loadingSections={loadingSections} />
      </div>

      {/* 하단 버튼바 */}
      <div className="border-t border-slate-200 p-3 bg-white flex items-center justify-between">
        {/* 왼쪽: final_admitted=true → "삭제" 버튼 */}
        <div>
          {row.final_admitted && (
            <button
              onClick={handleDeleteSubmit}
              className="px-4 py-2 rounded-md border border-red-600 text-red-600 hover:bg-red-400 hover:text-white hover:border-transparent text-sm"
            >
              삭제
            </button>
          )}
        </div>

        {/* 오른쪽: 연락하기 / 승인 / 쪽지 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCall}
            className="px-4 py-2 rounded-md border border-green-500 
                       text-green-600 hover:bg-green-500 hover:text-white hover:border-transparent text-sm"
          >
            연락하기
          </button>
          {!row.final_admitted && (
            <button
              onClick={handleApproval}
              disabled={row.is_admitted && !row.thumbnail_url}
              title={
                row.is_admitted && !row.thumbnail_url
                  ? "이미지 업로드 후 가능"
                  : ""
              }
              className="px-4 py-2 rounded-md border border-slate-300 
                         text-slate-600 hover:bg-slate-100 text-sm"
            >
              {row.is_admitted ? "최종승인" : "승인"}
            </button>
          )}
          <button
            onClick={handleSendMsgPopup}
            className="px-4 py-2 rounded-md border border-blue-400 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-transparent text-sm"
          >
            쪽지 보내기
          </button>
        </div>
      </div>
    </div>
  );
}

/** (수평) 테이블 행 */
function DetailRow({ label, value }) {
  return (
    <tr>
      <th className="p-2 border border-slate-100 bg-slate-50 text-gray-600 w-28 text-left align-middle">
        {label}
      </th>
      <td className="p-2 border border-slate-100 text-sm text-slate-700 align-middle text-left">
        {value || "(값 없음)"}
      </td>
    </tr>
  );
}

/** 섹션/코스 */
function SectionCourseBlock({ sections, loadingSections }) {
  if (loadingSections) {
    return (
      <div className="border border-slate-200 rounded-md p-3">
        <h2 className="text-base font-semibold mb-2">섹션/코스 목록</h2>
        <div className="text-sm text-gray-500">불러오는 중...</div>
      </div>
    );
  }
  if (!sections || sections.length === 0) {
    return (
      <div className="border border-slate-200 rounded-md p-3">
        <h2 className="text-base font-semibold mb-2">섹션/코스 목록</h2>
        <div className="text-sm text-gray-500">섹션이 없습니다.</div>
      </div>
    );
  }
  return (
    <div className="border border-slate-200 rounded-md p-3">
      <h2 className="text-base font-semibold mb-2">섹션/코스 목록</h2>
      {sections.map((sec) => (
        <div key={sec.id} className="border-b last:border-none pb-2 mb-2">
          <div className="mb-1">
            <div className="font-semibold">
              {sec.section_title || "(섹션명 없음)"}
            </div>
            {sec.section_description && (
              <div className="text-sm text-gray-600">
                {sec.section_description}
              </div>
            )}
          </div>
          {sec.courses && sec.courses.length > 0 ? (
            <div className="pl-4">
              {sec.courses.map((course) => (
                <div key={course.id} className="text-sm text-slate-700">
                  {course.course_name || "(코스이름없음)"} (
                  {course.duration || "?"}시간)
                </div>
              ))}
            </div>
          ) : (
            <div className="pl-4 text-sm text-gray-400">코스가 없습니다.</div>
          )}
        </div>
      ))}
    </div>
  );
}