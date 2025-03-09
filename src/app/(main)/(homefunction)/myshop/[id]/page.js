"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

// 숫자만 추출
function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

// 1234 → "1,234 원" 형식
function formatPrice(num) {
  if (!num || isNaN(num)) return "0 원";
  return Number(num).toLocaleString() + " 원";
}

export default function MyShopPageClient() {
  // ─────────────────────────────────────────────
  // (A) 파라미터에서 post_id 추출 (partnershipsubmit.id)
  // ─────────────────────────────────────────────
  const pathname = usePathname();
  const pathParts = pathname?.split("/") || [];
  const postId = pathParts[2] || null;

  // ─────────────────────────────────────────────
  // (B) 업체명/에러/로딩 + 섹션/코스 state
  // ─────────────────────────────────────────────
  const [companyName, setCompanyName] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // 초기 로딩이 끝나고 로컬 state로 편집하는 섹션 구조
  // sections = [
  //   {
  //     id: 123,           // DB PK or 임시(Date.now())
  //     name: "섹션이름",
  //     courses: [
  //       { id: 456, name: "A코스", duration: "60분", price:10000, ... },
  //       ...
  //     ]
  //   },
  //   ...
  // ]
  const [sections, setSections] = useState([]);

  // 섹션/코스 추가/수정 모달 상태
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  const [editSectionModalOpen, setEditSectionModalOpen] = useState(false);
  const [editSectionId, setEditSectionId] = useState(null);
  const [editSectionName, setEditSectionName] = useState("");

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState(null);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseDuration, setNewCourseDuration] = useState("");
  const [newCoursePrice, setNewCoursePrice] = useState(0);

  const [editCourseModalOpen, setEditCourseModalOpen] = useState(false);
  const [editCourseSectionId, setEditCourseSectionId] = useState(null);
  const [editCourseId, setEditCourseId] = useState(null);
  const [editCourseName, setEditCourseName] = useState("");
  const [editCourseDuration, setEditCourseDuration] = useState("");
  const [editCoursePrice, setEditCoursePrice] = useState(0);

  // ─────────────────────────────────────────────
  // (C) 마운트 시: partnershipsubmit.company_name + 기존 섹션/코스 로드
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!postId) {
      setErrorMessage("URL이 잘못되었습니다. (postId 없음)");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // 1) 업체명 가져오기
        const { data: psRow, error: psErr } = await supabase
          .from("partnershipsubmit")
          .select("company_name")
          .eq("id", postId)
          .single();

        if (psErr) throw new Error("DB 조회 에러: " + psErr.message);
        if (!psRow) throw new Error("존재하지 않는 업체");

        setCompanyName(psRow.company_name);

        // 2) sections 목록 가져오기 (해당 post_id)
        const { data: secRows, error: secErr } = await supabase
          .from("sections")
          .select("*")
          .eq("post_id", postId)
          .order("display_order", { ascending: true });
        if (secErr) throw new Error("sections 조회 에러: " + secErr.message);

        // 3) courses 목록 가져오기 (해당 sections들)
        const secIds = (secRows || []).map((s) => s.id);
        let couRows = [];
        if (secIds.length > 0) {
          const { data: cRows, error: couErr } = await supabase
            .from("courses")
            .select("*")
            .in("section_id", secIds)
            .order("display_order", { ascending: true });
          if (couErr) {
            throw new Error("courses 조회 에러: " + couErr.message);
          }
          couRows = cRows;
        }

        // 4) 로컬 state 변환
        // sections: [{ id, name, courses: [...] }, ...]
        const newSections = secRows.map((sec) => {
          // sec: {id, section_title, display_order, ...}
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
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  // 로딩/에러 시 처리
  if (loading) {
    return <div className="p-4">로딩 중...</div>;
  }
  if (errorMessage) {
    return <div className="p-4">{errorMessage}</div>;
  }

  // ─────────────────────────────────────────────
  // (D) “DB에 저장” 버튼 → Supabase로 sections/courses 재삽입
  // ─────────────────────────────────────────────
  async function handleSaveToDB() {
    if (!postId) {
      alert("postId가 없어 저장 불가능!");
      return;
    }
    const confirmMsg = "현재 화면의 섹션/코스 정보를 DB에 새로 반영합니다.\n계속할까요?";
    if (!window.confirm(confirmMsg)) return;

    try {
      // 1) 기존 sections 모두 삭제 → ON DELETE CASCADE라면 courses도 자동삭제
      let { error: delSecErr } = await supabase
        .from("sections")
        .delete()
        .eq("post_id", postId);

      if (delSecErr) throw new Error("sections 삭제 에러: " + delSecErr.message);

      // 2) 로컬 sections 순서대로 insert
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        // sections insert
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
        if (secErr) {
          throw new Error(`섹션(${sec.name}) insert 에러: ` + secErr.message);
        }
        const newSectionId = secInserted.id;

        // 코스들 insert
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
          if (cErr) {
            throw new Error(`코스(${c.name}) insert 에러: ` + cErr.message);
          }
        }
      }

      alert("DB 저장이 완료되었습니다!");
    } catch (err) {
      console.error(err);
      alert("DB 저장 에러: " + err.message);
    }
  }

  // ─────────────────────────────────────────────
  // (E) 섹션/코스 로컬 수정 로직
  // ─────────────────────────────────────────────

  // 섹션 추가
  function openSectionModal() {
    setNewSectionName("");
    setSectionModalOpen(true);
  }
  function handleAddSection() {
    if (!newSectionName.trim()) {
      alert("섹션 이름을 입력하세요!");
      return;
    }
    // 로컬 id는 임시로 Date.now()
    const newSec = {
      id: Date.now(),
      name: newSectionName.trim(),
      courses: [],
    };
    setSections((prev) => [...prev, newSec]);
    setSectionModalOpen(false);
  }

  // 섹션 편집
  function openEditSectionModal(section) {
    setEditSectionId(section.id);
    setEditSectionName(section.name);
    setEditSectionModalOpen(true);
  }
  function handleUpdateSection() {
    if (!editSectionName.trim()) {
      alert("섹션 이름을 입력해주세요.");
      return;
    }
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === editSectionId ? { ...sec, name: editSectionName.trim() } : sec
      )
    );
    setEditSectionModalOpen(false);
  }

  // 섹션 순서 이동
  function moveSectionUp(index) {
    if (index <= 0) return;
    setSections((prev) => {
      const arr = [...prev];
      [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
      return arr;
    });
  }
  function moveSectionDown(index) {
    if (index >= sections.length - 1) return;
    setSections((prev) => {
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  }

  // 코스 추가
  function openCourseModal(sectionId) {
    setTargetSectionId(sectionId);
    setNewCourseName("");
    setNewCourseDuration("");
    setNewCoursePrice(0);
    setCourseModalOpen(true);
  }
  function handleAddCourse() {
    if (!newCourseName.trim()) {
      alert("코스 이름을 입력하세요!");
      return;
    }
    const newC = {
      id: Date.now(),
      name: newCourseName.trim(),
      duration: newCourseDuration.trim(),
      price: newCoursePrice,
    };
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === targetSectionId
          ? { ...sec, courses: [...sec.courses, newC] }
          : sec
      )
    );
    setCourseModalOpen(false);
  }

  // 코스 편집
  function openEditCourseModal(sectionId, course) {
    setEditCourseSectionId(sectionId);
    setEditCourseId(course.id);
    setEditCourseName(course.name);
    setEditCourseDuration(course.duration || "");
    setEditCoursePrice(course.price || 0);
    setEditCourseModalOpen(true);
  }
  function handleUpdateCourse() {
    if (!editCourseName.trim()) {
      alert("코스 이름을 입력해주세요.");
      return;
    }
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== editCourseSectionId) return sec;
        const updatedCourses = sec.courses.map((c) =>
          c.id === editCourseId
            ? {
                ...c,
                name: editCourseName.trim(),
                duration: editCourseDuration.trim(),
                price: editCoursePrice,
              }
            : c
        );
        return { ...sec, courses: updatedCourses };
      })
    );
    setEditCourseModalOpen(false);
  }

  // 코스 순서
  function moveCourseUp(sectionIndex, courseIndex) {
    setSections((prev) => {
      const arr = [...prev];
      const sec = { ...arr[sectionIndex] };
      const cs = [...sec.courses];
      if (courseIndex <= 0) return prev;
      [cs[courseIndex], cs[courseIndex - 1]] = [cs[courseIndex - 1], cs[courseIndex]];
      sec.courses = cs;
      arr[sectionIndex] = sec;
      return arr;
    });
  }
  function moveCourseDown(sectionIndex, courseIndex) {
    setSections((prev) => {
      const arr = [...prev];
      const sec = { ...arr[sectionIndex] };
      const cs = [...sec.courses];
      if (courseIndex >= cs.length - 1) return prev;
      [cs[courseIndex], cs[courseIndex + 1]] = [cs[courseIndex + 1], cs[courseIndex]];
      sec.courses = cs;
      arr[sectionIndex] = sec;
      return arr;
    });
  }

  // 가격 핸들러
  function handleNewCoursePriceChange(e) {
    const digits = onlyDigits(e.target.value);
    setNewCoursePrice(digits ? parseInt(digits, 10) : 0);
  }
  function handleEditCoursePriceChange(e) {
    const digits = onlyDigits(e.target.value);
    setEditCoursePrice(digits ? parseInt(digits, 10) : 0);
  }

  // ─────────────────────────────────────────────
  // (F) 렌더링
  // ─────────────────────────────────────────────
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        섹션/코스 관리: post_id={postId}, {companyName || ""}
      </h1>

      {/* DB 저장 버튼 */}
      <div className="mb-4 flex gap-4">
        <button
          onClick={handleSaveToDB}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          DB에 저장하기
        </button>

        <button
          onClick={openSectionModal}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + 섹션 추가
        </button>
      </div>

      {/* 섹션 목록 */}
      {sections.length === 0 ? (
        <p className="text-gray-600">아직 섹션이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => (
            <div key={section.id} className="border border-gray-300 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                {/* 왼쪽: 순서 올리기/내리기 + 섹션 이름 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveSectionUp(sectionIndex)}
                    className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveSectionDown(sectionIndex)}
                    className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    ↓
                  </button>
                  <h2 className="font-bold text-lg">{section.name}</h2>
                </div>

                {/* 오른쪽: 섹션 수정 + 코스 추가 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditSectionModal(section)}
                    className="px-3 py-1 text-sm bg-yellow-300 hover:bg-yellow-400 rounded"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => openCourseModal(section.id)}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    + 코스 추가
                  </button>
                </div>
              </div>

              {/* 코스 목록 */}
              {section.courses.length === 0 ? (
                <p className="text-sm text-gray-500">코스가 없습니다.</p>
              ) : (
                <ul className="space-y-1">
                  {section.courses.map((course, courseIndex) => (
                    <li
                      key={course.id}
                      className="bg-gray-50 border border-gray-200 p-2 rounded flex items-center justify-between"
                    >
                      <div>
                        <strong>{course.name}</strong>
                        {course.duration && ` (${course.duration})`}
                        {course.price > 0 && ` / ${formatPrice(course.price)}`}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* 코스 순서 올리기/내리기 */}
                        <button
                          onClick={() => moveCourseUp(sectionIndex, courseIndex)}
                          className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveCourseDown(sectionIndex, courseIndex)}
                          className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          ↓
                        </button>
                        {/* 코스 수정 */}
                        <button
                          onClick={() => openEditCourseModal(section.id, course)}
                          className="px-2 py-1 text-sm bg-yellow-300 hover:bg-yellow-400 rounded"
                        >
                          수정
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ───────────── 섹션 추가 모달 ───────────── */}
      {sectionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-lg font-bold mb-3">섹션 추가</h2>
            <input
              type="text"
              placeholder="섹션 이름"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              className="border border-gray-300 rounded w-full px-2 py-1 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSectionModalOpen(false)}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={handleAddSection}
                className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────── 섹션 수정 모달 ───────────── */}
      {editSectionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-lg font-bold mb-3">섹션 수정</h2>
            <input
              type="text"
              placeholder="섹션 이름"
              value={editSectionName}
              onChange={(e) => setEditSectionName(e.target.value)}
              className="border border-gray-300 rounded w-full px-2 py-1 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditSectionModalOpen(false)}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={handleUpdateSection}
                className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────── 코스 추가 모달 ───────────── */}
      {courseModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-lg font-bold mb-3">코스 추가</h2>
            <input
              type="text"
              placeholder="코스 이름"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              className="border border-gray-300 rounded w-full px-2 py-1 mb-3"
            />
            <input
              type="text"
              placeholder="소요시간"
              value={newCourseDuration}
              onChange={(e) => setNewCourseDuration(e.target.value)}
              className="border border-gray-300 rounded w-full px-2 py-1 mb-3"
            />
            <div className="mb-3">
              <input
                type="text"
                placeholder="가격 (예: 10000)"
                value={newCoursePrice === 0 ? "" : newCoursePrice.toString()}
                onChange={(e) => {
                  const digits = onlyDigits(e.target.value);
                  setNewCoursePrice(digits ? parseInt(digits, 10) : 0);
                }}
                className="border border-gray-300 rounded w-full px-2 py-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                미리보기: {formatPrice(newCoursePrice)}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCourseModalOpen(false)}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={handleAddCourse}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────── 코스 수정 모달 ───────────── */}
      {editCourseModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-lg font-bold mb-3">코스 수정</h2>
            <input
              type="text"
              placeholder="코스 이름"
              value={editCourseName}
              onChange={(e) => setEditCourseName(e.target.value)}
              className="border border-gray-300 rounded w-full px-2 py-1 mb-3"
            />
            <input
              type="text"
              placeholder="소요시간"
              value={editCourseDuration}
              onChange={(e) => setEditCourseDuration(e.target.value)}
              className="border border-gray-300 rounded w-full px-2 py-1 mb-3"
            />
            <div className="mb-3">
              <input
                type="text"
                placeholder="가격 (예: 10000)"
                value={editCoursePrice === 0 ? "" : editCoursePrice.toString()}
                onChange={(e) => {
                  const digits = onlyDigits(e.target.value);
                  setEditCoursePrice(digits ? parseInt(digits, 10) : 0);
                }}
                className="border border-gray-300 rounded w-full px-2 py-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                미리보기: {formatPrice(editCoursePrice)}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditCourseModalOpen(false)}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={handleUpdateCourse}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}