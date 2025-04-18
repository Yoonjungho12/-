"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseF";

/**
 * 섹션/코스 전용 관리 컴포넌트
 * 상위에서 넘겨받은 sections, setSections, formatPrice, onlyDigits 등을 사용.
 */
export default function SectionManager({
  sections,
  setSections,
  formatPrice,
  onlyDigits,
  post_id
}) {
  // ─────────────────────────────────────────────
  // (A) 섹션 추가/수정용 모달 상태들
  // ─────────────────────────────────────────────
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionDescription, setNewSectionDescription] = useState("");

  const [editSectionModalOpen, setEditSectionModalOpen] = useState(false);
  const [editSectionId, setEditSectionId] = useState(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [editSectionDescription, setEditSectionDescription] = useState("");

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
    setNewSectionDescription("");
    setSectionModalOpen(true);
  }

  async function handleAddSection() {
    if (!newSectionName.trim()) {
      alert("섹션 이름을 입력하세요!");
      return;
    }

    // 현재 섹션들의 최대 display_order 가져오기
    const maxOrder = Math.max(...sections.map(s => s.display_order || 0), 0);

    // 새로운 임시 섹션 객체 생성
    const newSection = {
      id: `temp_${Date.now()}`,
      section_title: newSectionName.trim(),
      section_description: newSectionDescription.trim(),
      display_order: maxOrder + 1,
      courses: []
    };

    // 로컬 상태 업데이트
    setSections(prev => [...prev, newSection]);
    setSectionModalOpen(false);
  }

  // ─────────────────────────────────────────────
  // (D) 섹션 수정
  // ─────────────────────────────────────────────
  function openEditSectionModal(section) {
    setEditSectionId(section.id);
    setEditSectionName(section.section_title);
    setEditSectionDescription(section.section_description || "");
    setEditSectionModalOpen(true);
  }

  async function handleUpdateSection() {
    if (!editSectionName.trim()) {
      alert("섹션 이름을 입력해주세요.");
      return;
    }

    try {
      // 1. Supabase 업데이트
      const { error } = await supabase
        .from('sections')
        .update({
          section_title: editSectionName.trim(),
          section_description: editSectionDescription.trim()
        })
        .eq('id', editSectionId);

      if (error) throw error;

      // 2. 로컬 상태 업데이트
      setSections(prev =>
        prev.map(sec =>
          sec.id === editSectionId
            ? {
                ...sec,
                section_title: editSectionName.trim(),
                section_description: editSectionDescription.trim()
              }
            : sec
        )
      );

      setEditSectionModalOpen(false);
    } catch (err) {
      console.error('섹션 수정 중 오류 발생:', err);
      alert('섹션 수정 중 오류가 발생했습니다.');
    }
  }

  // ─────────────────────────────────────────────
  // (E) 섹션 삭제
  // ─────────────────────────────────────────────
  async function handleDeleteSection(sectionId) {
    if (!confirm('정말 이 섹션을 삭제하시겠습니까?\n섹션에 포함된 모든 코스도 함께 삭제됩니다.')) {
      return;
    }

    try {
      // 1. Supabase에서 섹션 삭제 (cascade로 코스도 자동 삭제)
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      // 2. 로컬 상태 업데이트
      setSections(prev => prev.filter(sec => sec.id !== sectionId));
    } catch (err) {
      console.error('섹션 삭제 중 오류 발생:', err);
      alert('섹션 삭제 중 오류가 발생했습니다.');
    }
  }

  // ─────────────────────────────────────────────
  // (F) 섹션 순서 이동
  // ─────────────────────────────────────────────
  async function moveSectionUp(index) {
    if (index <= 0) return;
    
    try {
      const currentSection = sections[index];
      const prevSection = sections[index - 1];
      
      // 1. Supabase 업데이트
      const { error } = await supabase
        .from('sections')
        .upsert([
          {
            id: currentSection.id,
            display_order: prevSection.display_order
          },
          {
            id: prevSection.id,
            display_order: currentSection.display_order
          }
        ]);

      if (error) throw error;

      // 2. 로컬 상태 업데이트
      setSections(prev => {
        const arr = [...prev];
        [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
        return arr;
      });
    } catch (err) {
      console.error('섹션 순서 변경 중 오류 발생:', err);
      alert('섹션 순서 변경 중 오류가 발생했습니다.');
    }
  }

  async function moveSectionDown(index) {
    if (index >= sections.length - 1) return;
    
    try {
      const currentSection = sections[index];
      const nextSection = sections[index + 1];
      
      // 1. Supabase 업데이트
      const { error } = await supabase
        .from('sections')
        .upsert([
          {
            id: currentSection.id,
            display_order: nextSection.display_order
          },
          {
            id: nextSection.id,
            display_order: currentSection.display_order
          }
        ]);

      if (error) throw error;

      // 2. 로컬 상태 업데이트
      setSections(prev => {
        const arr = [...prev];
        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        return arr;
      });
    } catch (err) {
      console.error('섹션 순서 변경 중 오류 발생:', err);
      alert('섹션 순서 변경 중 오류가 발생했습니다.');
    }
  }

  // ─────────────────────────────────────────────
  // (G) 코스 추가
  // ─────────────────────────────────────────────
  function openCourseModal(sectionId) {
    setTargetSectionId(sectionId);
    setNewCourseName("");
    setNewCourseDuration("");
    setNewCoursePrice(0);
    setCourseModalOpen(true);
  }

  async function handleAddCourse() {
    if (!newCourseName.trim()) {
      alert("코스 이름을 입력하세요!");
      return;
    }

    const targetSection = sections.find(s => s.id === targetSectionId);
    if (!targetSection) return;

    // 현재 코스들의 최대 display_order 가져오기
    const maxOrder = Math.max(...(targetSection.courses || []).map(c => c.display_order || 0), 0);

    // 새로운 임시 코스 객체 생성
    const newCourse = {
      id: `temp_${Date.now()}`,
      course_name: newCourseName.trim(),
      duration: newCourseDuration.trim(),
      price: newCoursePrice,
      etc_info: '',
      display_order: maxOrder + 1
    };

    // 로컬 상태 업데이트
    setSections(prev => prev.map(section =>
      section.id === targetSectionId
        ? { ...section, courses: [...(section.courses || []), newCourse] }
        : section
    ));

    setCourseModalOpen(false);
    setNewCourseName('');
    setNewCourseDuration('');
    setNewCoursePrice(0);
  }

  // ─────────────────────────────────────────────
  // (H) 코스 수정
  // ─────────────────────────────────────────────
  function openEditCourseModal(sectionId, course) {
    setEditCourseSectionId(sectionId);
    setEditCourseId(course.id);
    setEditCourseName(course.course_name);
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
                course_name: editCourseName.trim(),
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
  // (I) 코스 순서 이동
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
  // (J) 가격 입력 핸들러
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
  // (G) 메뉴 최종 등록
  // ─────────────────────────────────────────────
  async function handleFinalSubmit() {
    try {
      // 1. 섹션이 하나도 없는 경우
      if (sections.length === 0) {
        alert('등록된 섹션이 없습니다. 섹션을 먼저 추가해주세요.');
        return;
      }

      // 2. 빈 섹션이 있는지 확인
      const emptySections = sections.filter(section => !section.courses || section.courses.length === 0);
      if (emptySections.length > 0) {
        const confirmEmpty = window.confirm(
          `${emptySections.map(s => s.section_title).join(', ')} 섹션에 등록된 코스가 없습니다.\n계속 진행하시겠습니까?`
        );
        if (!confirmEmpty) return;
      }

      // 3. 최종 등록 확인
      if (!confirm('메뉴를 최종 등록하시겠습니까?')) {
        return;
      }

      // 4. 섹션 데이터 저장
      for (const section of sections) {
        if (section.id.startsWith('temp_')) {
          // 새로운 섹션 추가
          const { data: newSection, error: sectionError } = await supabase
            .from('sections')
            .insert({
              post_id: post_id,
              section_title: section.section_title,
              section_description: section.section_description,
              display_order: section.display_order
            })
            .select()
            .single();

          if (sectionError) throw sectionError;

          // 해당 섹션의 코스들 추가
          if (section.courses && section.courses.length > 0) {
            const coursesData = section.courses.map(course => ({
              section_id: newSection.id,
              course_name: course.course_name,
              duration: course.duration,
              price: parseInt(onlyDigits(course.price), 10),
              etc_info: course.etc_info || '',
              display_order: course.display_order
            }));

            const { error: coursesError } = await supabase
              .from('courses')
              .insert(coursesData);

            if (coursesError) throw coursesError;
          }
        } else {
          // 기존 섹션 업데이트
          const { error: sectionError } = await supabase
            .from('sections')
            .update({
              section_title: section.section_title,
              section_description: section.section_description,
              display_order: section.display_order
            })
            .eq('id', section.id);

          if (sectionError) throw sectionError;

          // 기존 코스 삭제 후 새로 추가
          if (section.courses && section.courses.length > 0) {
            // 기존 코스 삭제
            const { error: deleteError } = await supabase
              .from('courses')
              .delete()
              .eq('section_id', section.id);

            if (deleteError) throw deleteError;

            // 새로운 코스 추가
            const coursesData = section.courses.map(course => ({
              section_id: section.id,
              course_name: course.course_name,
              duration: course.duration,
              price: parseInt(onlyDigits(course.price), 10),
              etc_info: course.etc_info || '',
              display_order: course.display_order
            }));

            const { error: coursesError } = await supabase
              .from('courses')
              .insert(coursesData);

            if (coursesError) throw coursesError;
          }
        }
      }

      alert('메뉴가 성공적으로 등록되었습니다!');
      
      // 5. 페이지 새로고침하여 최신 데이터 로드
      window.location.reload();
    } catch (err) {
      console.error('메뉴 최종 등록 중 오류 발생:', err);
      alert('메뉴 등록 중 오류가 발생했습니다.');
    }
  }

  // ─────────────────────────────────────────────
  // (K) 화면 렌더링
  // ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* 최상단에 메뉴 최종 등록 버튼 추가 */}
      <div className="flex justify-between items-center">
        <button
          onClick={openSectionModal}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          섹션 추가
        </button>
        <button
          onClick={handleFinalSubmit}
          className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          메뉴 최종 등록
        </button>
      </div>

      {/* 섹션 목록 */}
      {sections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          등록된 섹션이 없습니다. 섹션을 추가해주세요.
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <div key={section.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">{section.section_title}</h3>
                  {section.section_description && (
                    <p className="text-gray-600 text-sm mt-1">{section.section_description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditSectionModal(section)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    삭제
                  </button>
                  {sectionIndex > 0 && (
                    <button
                      onClick={() => moveSectionUp(sectionIndex)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      ↑
                    </button>
                  )}
                  {sectionIndex < sections.length - 1 && (
                    <button
                      onClick={() => moveSectionDown(sectionIndex)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      ↓
                    </button>
                  )}
                </div>
              </div>

              {/* 코스 목록 */}
              <div className="space-y-3 mt-4">
                {section.courses && section.courses.map((course, courseIndex) => (
                  <div key={course.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{course.course_name}</span>
                      {course.duration && (
                        <span className="text-gray-600 text-sm ml-2">({course.duration})</span>
                      )}
                      <span className="text-orange-600 ml-3">{formatPrice(course.price)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditCourseModal(section.id, course)}
                        className="text-gray-600 hover:text-gray-900 text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(section.id, course.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        삭제
                      </button>
                      {courseIndex > 0 && (
                        <button
                          onClick={() => moveCourseUp(sectionIndex, courseIndex)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          ↑
                        </button>
                      )}
                      {courseIndex < section.courses.length - 1 && (
                        <button
                          onClick={() => moveCourseDown(sectionIndex, courseIndex)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          ↓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => openCourseModal(section.id)}
                  className="w-full py-2 text-gray-600 hover:text-gray-900 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  + 코스 추가
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 섹션 추가 모달 */}
      {sectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 섹션 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  섹션 이름
                </label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="섹션 이름"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  섹션 설명
                </label>
                <textarea
                  value={newSectionDescription}
                  onChange={(e) => setNewSectionDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="섹션에 대한 설명을 입력하세요"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSectionModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddSection}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 섹션 수정 모달 */}
      {editSectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">섹션 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  섹션 이름
                </label>
                <input
                  type="text"
                  value={editSectionName}
                  onChange={(e) => setEditSectionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="섹션 이름"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  섹션 설명
                </label>
                <textarea
                  value={editSectionDescription}
                  onChange={(e) => setEditSectionDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="섹션에 대한 설명을 입력하세요"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditSectionModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateSection}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 코스 추가 모달 */}
      {courseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 코스 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  코스 이름
                </label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="코스 이름"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  소요 시간
                </label>
                <input
                  type="text"
                  value={newCourseDuration}
                  onChange={(e) => setNewCourseDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="예: 60분"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가격
                </label>
                <input
                  type="text"
                  value={formatPrice(newCoursePrice)}
                  onChange={handleNewCoursePriceChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="숫자만 입력"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCourseModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddCourse}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 코스 수정 모달 */}
      {editCourseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">코스 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  코스 이름
                </label>
                <input
                  type="text"
                  value={editCourseName}
                  onChange={(e) => setEditCourseName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="코스 이름"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  소요 시간
                </label>
                <input
                  type="text"
                  value={editCourseDuration}
                  onChange={(e) => setEditCourseDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="예: 60분"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가격
                </label>
                <input
                  type="text"
                  value={formatPrice(editCoursePrice)}
                  onChange={handleEditCoursePriceChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="숫자만 입력"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditCourseModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateCourse}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 