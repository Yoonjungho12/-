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
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    섹션 수정
                  </button>
                  <button
                    onClick={() => openCourseModal(section.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    + 코스 추가
                  </button>
                </div>
              </div>

              {/* 코스 목록 */}
              {section.courses.length === 0 ? (
                <p className="text-gray-500 text-sm">아직 코스가 없습니다.</p>
              ) : (
                <div className="space-y-2 pl-4">
                  {section.courses.map((course, courseIndex) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between py-1"
                    >
                      {/* 왼쪽: 순서 올리기/내리기 + 코스 정보 */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveCourseUp(sectionIndex, courseIndex)}
                          className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveCourseDown(sectionIndex, courseIndex)}
                          className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          ↓
                        </button>
                        <span className="font-medium">{course.name}</span>
                        {course.duration && (
                          <span className="text-gray-600">
                            ({course.duration})
                          </span>
                        )}
                        <span className="text-blue-600">
                          {formatPrice(course.price)}
                        </span>
                      </div>

                      {/* 오른쪽: 코스 수정 */}
                      <button
                        onClick={() => openEditCourseModal(section.id, course)}
                        className="px-2 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        수정
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 섹션 추가 모달 */}
      {sectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">새 섹션 추가</h3>
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="섹션 이름 입력"
              className="w-full px-3 py-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSectionModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleAddSection}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 섹션 수정 모달 */}
      {editSectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">섹션 수정</h3>
            <input
              type="text"
              value={editSectionName}
              onChange={(e) => setEditSectionName(e.target.value)}
              placeholder="섹션 이름 입력"
              className="w-full px-3 py-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditSectionModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleUpdateSection}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 코스 추가 모달 */}
      {courseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">새 코스 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  코스 이름
                </label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="코스 이름 입력"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  소요 시간
                </label>
                <input
                  type="text"
                  value={newCourseDuration}
                  onChange={(e) => setNewCourseDuration(e.target.value)}
                  placeholder="예: 60분"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">가격</label>
                <input
                  type="text"
                  value={formatPrice(newCoursePrice)}
                  onChange={handleNewCoursePriceChange}
                  placeholder="숫자만 입력"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setCourseModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleAddCourse}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 코스 수정 모달 */}
      {editCourseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">코스 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  코스 이름
                </label>
                <input
                  type="text"
                  value={editCourseName}
                  onChange={(e) => setEditCourseName(e.target.value)}
                  placeholder="코스 이름 입력"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  소요 시간
                </label>
                <input
                  type="text"
                  value={editCourseDuration}
                  onChange={(e) => setEditCourseDuration(e.target.value)}
                  placeholder="예: 60분"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">가격</label>
                <input
                  type="text"
                  value={formatPrice(editCoursePrice)}
                  onChange={handleEditCoursePriceChange}
                  placeholder="숫자만 입력"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditCourseModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleUpdateCourse}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 