"use client";

import React, { useState } from "react";

/**
 * 섹션/코스 전용 관리 컴포넌트
 * 상위에서 넘겨받은 sections, setSections, formatPrice, onlyDigits 등을 사용.
 */
export default function SectionManager({
  sections,
  setSections,
  formatPrice,
  onlyDigits,
}) {
  // ─────────────────────────────────────────────
  // (A) 섹션 추가/수정용 모달 상태들
  // ─────────────────────────────────────────────
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  const [editSectionModalOpen, setEditSectionModalOpen] = useState(false);
  const [editSectionId, setEditSectionId] = useState(null);
  const [editSectionName, setEditSectionName] = useState("");

  // ─────────────────────────────────────────────
  // (B) 코스 추가/수정용 모달 상태들
  // ─────────────────────────────────────────────
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
  // (C) 섹션 추가
  // ─────────────────────────────────────────────
  function openSectionModal() {
    setNewSectionName("");
    setSectionModalOpen(true);
  }
  function handleAddSection() {
    if (!newSectionName.trim()) {
      alert("섹션 이름을 입력하세요!");
      return;
    }
    const newSec = {
      id: Date.now(),
      name: newSectionName.trim(),
      courses: [],
    };
    setSections((prev) => [...prev, newSec]);
    setSectionModalOpen(false);
  }

  // ─────────────────────────────────────────────
  // (D) 섹션 수정
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // (E) 섹션 순서 이동
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // (F) 코스 추가
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // (G) 코스 수정
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // (H) 코스 순서 이동
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // (I) 가격 입력 핸들러
  // ─────────────────────────────────────────────
  function handleNewCoursePriceChange(e) {
    const digits = onlyDigits(e.target.value);
    setNewCoursePrice(digits ? parseInt(digits, 10) : 0);
  }
  function handleEditCoursePriceChange(e) {
    const digits = onlyDigits(e.target.value);
    setEditCoursePrice(digits ? parseInt(digits, 10) : 0);
  }

  // ─────────────────────────────────────────────
  // (J) 화면 렌더링
  // ─────────────────────────────────────────────
  return (
    <div>
      {/* + 섹션 추가 버튼 */}
      <div className="mb-4">
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

      {/* ===================== 섹션 추가 모달 ===================== */}
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

      {/* ===================== 섹션 수정 모달 ===================== */}
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

      {/* ===================== 코스 추가 모달 ===================== */}
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
                onChange={handleNewCoursePriceChange}
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

      {/* ===================== 코스 수정 모달 ===================== */}
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
                onChange={handleEditCoursePriceChange}
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