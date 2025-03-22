"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

// 분리한 컴포넌트 import
import SectionManager from "./SectionManager";
import MemberManager from "./MemberManager";
import ShopPhotoUploader from "./ShopPhotoUploader";
import StoreInfoEditor from "./StoreInfoEditor";

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function formatPrice(num) {
  if (!num || isNaN(num)) return "0 원";
  return Number(num).toLocaleString() + " 원";
}

export default function MyShopPageClient() {
  // URL 파라미터에서 post_id 추출
  const pathname = usePathname();
  const pathParts = pathname?.split("/") || [];
  const postId = pathParts[2] || null;

  // 기본 state들
  const [companyName, setCompanyName] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // 섹션/코스 로딩 상태
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);

  // 사진 업로드 섹션 ref
  const imageUploadSectionRef = useRef(null);

  // (추가) 토글 상태
  const [showSectionManager, setShowSectionManager] = useState(false);
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);
  const [showStoreEditor, setShowStoreEditor] = useState(false);

  useEffect(() => {
    if (!postId) {
      setErrorMessage("URL이 잘못되었습니다. (postId 없음)");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // 1) partnershipsubmit → 회사명
        const { data: psRow, error: psErr } = await supabase
          .from("partnershipsubmit")
          .select("company_name")
          .eq("id", postId)
          .single();
        if (psErr) throw new Error("DB 조회 에러: " + psErr.message);
        if (!psRow) throw new Error("존재하지 않는 업체");
        setCompanyName(psRow.company_name);

        // 2) 섹션 + 코스
        const { data: secRows, error: secErr } = await supabase
          .from("sections")
          .select("*")
          .eq("post_id", postId)
          .order("display_order", { ascending: true });
        if (secErr) throw new Error("sections 조회 에러: " + secErr.message);

        const secIds = (secRows || []).map((s) => s.id);
        let couRows = [];
        if (secIds.length > 0) {
          const { data: cRows, error: couErr } = await supabase
            .from("courses")
            .select("*")
            .in("section_id", secIds)
            .order("display_order", { ascending: true });
          if (couErr) throw new Error("courses 조회 에러: " + couErr.message);
          couRows = cRows;
        }

        // 섹션/코스 구조화
        const newSections = secRows.map((sec) => {
          const relatedCourses = couRows
            .filter((c) => c.section_id === sec.id)
            .map((c) => ({
              id: c.id,
              name: c.course_name,
              duration: c.duration || "",
              price: c.price || 0,
            }));
          return {
            id: sec.id,
            name: sec.section_title,
            courses: relatedCourses,
          };
        });
        setSections(newSections);
      } catch (err) {
        console.error(err);
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  if (loading) {
    return <div className="p-4">로딩 중...</div>;
  }
  if (errorMessage) {
    return <div className="p-4">{errorMessage}</div>;
  }

  // DB 저장 버튼 (섹션/코스)
  async function handleSaveToDB() {
    if (!postId) {
      alert("postId가 없어 저장 불가능!");
      return;
    }
    const confirmMsg = "현재 화면의 섹션/코스 정보를 DB에 새로 반영합니다.\n계속할까요?";
    if (!window.confirm(confirmMsg)) return;

    try {
      const { error: delSecErr } = await supabase
        .from("sections")
        .delete()
        .eq("post_id", postId);
      if (delSecErr) throw new Error("sections 삭제 에러: " + delSecErr.message);

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const { data: secInserted, error: secErr } = await supabase
          .from("sections")
          .insert({
            post_id: postId,
            section_title: sec.name,
            section_description: "",
            display_order: i,
          })
          .select("*")
          .single();
        if (secErr) throw new Error(`섹션(${sec.name}) insert 에러: ` + secErr.message);

        const newSectionId = secInserted.id;
        for (let j = 0; j < sec.courses.length; j++) {
          const c = sec.courses[j];
          const { error: cErr } = await supabase.from("courses").insert({
            section_id: newSectionId,
            course_name: c.name,
            duration: c.duration || "",
            etc_info: "",
            display_order: j,
            price: c.price || 0,
          });
          if (cErr) throw new Error(`코스(${c.name}) insert 에러: ` + cErr.message);
        }
      }
      alert("DB 저장이 완료되었습니다!");
    } catch (err) {
      console.error(err);
      alert("DB 저장 에러: " + err.message);
    }
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4">업체명: {companyName || "알수없음"}</h1>

      {/* 상단 버튼들 (색상/스타일 변경) */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShowPhotoUploader(!showPhotoUploader)}
          className="
            px-4 py-2 rounded-md 
            bg-gray-800 text-white 
            hover:bg-gray-700 
            transition-colors
          "
        >
          이미지 수정 및 업로드 {showPhotoUploader ? "닫기" : "열기"}
        </button>

        <button
          onClick={() => setShowStoreEditor(!showStoreEditor)}
          className="
            px-4 py-2 rounded-md 
            bg-gray-800 text-white 
            hover:bg-gray-700 
            transition-colors
          "
        >
          가게 정보 수정 {showStoreEditor ? "닫기" : "열기"}
        </button>

        <button
          onClick={handleSaveToDB}
          className="
            px-4 py-2 rounded-md 
            bg-gray-800 text-white 
            hover:bg-gray-700 
            transition-colors
          "
        >
          DB에 저장하기
        </button>

        <button
          onClick={() => setShowSectionManager(!showSectionManager)}
          className="
            px-4 py-2 rounded-md
            bg-gray-800 text-white 
            hover:bg-gray-700 
            transition-colors
          "
        >
          가격/코스 관리 {showSectionManager ? "닫기" : "열기"}
        </button>
      </div>

      {/* 섹션/코스 관리 (토글) */}
      {showSectionManager && (
        <>
          <SectionManager
            sections={sections}
            setSections={setSections}
            formatPrice={formatPrice}
            onlyDigits={onlyDigits}
          />
          <hr className="my-6" />
        </>
      )}

      {/* 사진 업로드 (토글) */}
      {showPhotoUploader && (
        <>
          <ShopPhotoUploader
            editId={postId}
            editIsAdmitted={false}
            imageUploadSectionRef={imageUploadSectionRef}
          />
          <hr className="my-6" />
        </>
      )}

      {/* 가게 정보 수정 (토글) */}
      {showStoreEditor && (
        <>
          <StoreInfoEditor shopId={postId} />
        </>
      )}
    </div>
  );
}