"use client";

import React, { useState } from "react";

/**
 * 매장 정보 수정 전용 컴포넌트
 * 상위에서 넘겨받은 storeInfo, setStoreInfo 등을 사용.
 */
export default function StoreInfoEditor({ storeInfo, setStoreInfo }) {
  // ─────────────────────────────────────────────
  // (A) 매장 정보 수정 상태들
  // ─────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [tempInfo, setTempInfo] = useState(storeInfo);

  // ─────────────────────────────────────────────
  // (B) 수정 모드 토글
  // ─────────────────────────────────────────────
  function toggleEditMode() {
    if (editMode) {
      // 수정 모드 종료 시 원래 정보로 복원
      setTempInfo(storeInfo);
    }
    setEditMode(!editMode);
  }

  // ─────────────────────────────────────────────
  // (C) 정보 업데이트 핸들러
  // ─────────────────────────────────────────────
  function handleUpdate() {
    // 필수 필드 검증
    if (!tempInfo.name?.trim()) {
      alert("매장 이름을 입력해주세요.");
      return;
    }
    if (!tempInfo.address?.trim()) {
      alert("주소를 입력해주세요.");
      return;
    }
    if (!tempInfo.phone?.trim()) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    // 상태 업데이트
    setStoreInfo(tempInfo);
    setEditMode(false);
  }

  // ─────────────────────────────────────────────
  // (D) 영업시간 관리
  // ─────────────────────────────────────────────
  function handleHoursChange(day, field, value) {
    setTempInfo((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [field]: value,
        },
      },
    }));
  }
  function toggleDayOff(day) {
    setTempInfo((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          isDayOff: !prev.hours[day]?.isDayOff,
        },
      },
    }));
  }

  // ─────────────────────────────────────────────
  // (E) 휴무일 관리
  // ─────────────────────────────────────────────
  function handleHolidayChange(index, value) {
    setTempInfo((prev) => {
      const holidays = [...(prev.holidays || [])];
      holidays[index] = value;
      return { ...prev, holidays };
    });
  }
  function addHoliday() {
    setTempInfo((prev) => ({
      ...prev,
      holidays: [...(prev.holidays || []), ""],
    }));
  }
  function removeHoliday(index) {
    setTempInfo((prev) => ({
      ...prev,
      holidays: prev.holidays?.filter((_, i) => i !== index),
    }));
  }

  // ─────────────────────────────────────────────
  // (F) 화면 렌더링
  // ─────────────────────────────────────────────
  const days = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="space-y-6">
      {/* 수정 모드 토글 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={toggleEditMode}
          className={`px-4 py-2 rounded ${
            editMode
              ? "bg-gray-500 hover:bg-gray-600"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white`}
        >
          {editMode ? "수정 취소" : "정보 수정"}
        </button>
      </div>

      {/* 기본 정보 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">기본 정보</h3>
        <div className="grid gap-4">
          {/* 매장 이름 */}
          <div>
            <label className="block text-sm font-medium mb-1">매장 이름</label>
            {editMode ? (
              <input
                type="text"
                value={tempInfo.name || ""}
                onChange={(e) =>
                  setTempInfo((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded"
                placeholder="매장 이름 입력"
              />
            ) : (
              <p className="text-gray-700">{storeInfo.name || "-"}</p>
            )}
          </div>

          {/* 주소 */}
          <div>
            <label className="block text-sm font-medium mb-1">주소</label>
            {editMode ? (
              <input
                type="text"
                value={tempInfo.address || ""}
                onChange={(e) =>
                  setTempInfo((prev) => ({ ...prev, address: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded"
                placeholder="주소 입력"
              />
            ) : (
              <p className="text-gray-700">{storeInfo.address || "-"}</p>
            )}
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-medium mb-1">전화번호</label>
            {editMode ? (
              <input
                type="tel"
                value={tempInfo.phone || ""}
                onChange={(e) =>
                  setTempInfo((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded"
                placeholder="전화번호 입력"
              />
            ) : (
              <p className="text-gray-700">{storeInfo.phone || "-"}</p>
            )}
          </div>

          {/* 소개글 */}
          <div>
            <label className="block text-sm font-medium mb-1">소개글</label>
            {editMode ? (
              <textarea
                value={tempInfo.description || ""}
                onChange={(e) =>
                  setTempInfo((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded h-24 resize-none"
                placeholder="매장 소개글 입력"
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-line">
                {storeInfo.description || "-"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 영업시간 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">영업시간</h3>
        <div className="space-y-2">
          {days.map((day) => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-8 font-medium">{day}</div>
              {editMode ? (
                <>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!tempInfo.hours?.[day]?.isDayOff}
                      onChange={() => toggleDayOff(day)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  {!tempInfo.hours?.[day]?.isDayOff && (
                    <>
                      <input
                        type="time"
                        value={tempInfo.hours?.[day]?.open || ""}
                        onChange={(e) =>
                          handleHoursChange(day, "open", e.target.value)
                        }
                        className="px-2 py-1 border rounded"
                      />
                      <span>~</span>
                      <input
                        type="time"
                        value={tempInfo.hours?.[day]?.close || ""}
                        onChange={(e) =>
                          handleHoursChange(day, "close", e.target.value)
                        }
                        className="px-2 py-1 border rounded"
                      />
                    </>
                  )}
                </>
              ) : (
                <span className="text-gray-700">
                  {storeInfo.hours?.[day]?.isDayOff
                    ? "휴무일"
                    : storeInfo.hours?.[day]?.open && storeInfo.hours?.[day]?.close
                    ? `${storeInfo.hours[day].open} ~ ${storeInfo.hours[day].close}`
                    : "-"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 정기 휴무일 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">정기 휴무일</h3>
        {editMode ? (
          <div className="space-y-2">
            {tempInfo.holidays?.map((holiday, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={holiday}
                  onChange={(e) => handleHolidayChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded"
                  placeholder="예: 매월 첫째 주 월요일"
                />
                <button
                  onClick={() => removeHoliday(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              onClick={addHoliday}
              className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              + 휴무일 추가
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {storeInfo.holidays?.length ? (
              storeInfo.holidays.map((holiday, index) => (
                <p key={index} className="text-gray-700">
                  • {holiday}
                </p>
              ))
            ) : (
              <p className="text-gray-500">등록된 정기 휴무일이 없습니다.</p>
            )}
          </div>
        )}
      </div>

      {/* 수정 완료/취소 버튼 */}
      {editMode && (
        <div className="flex justify-end gap-2">
          <button
            onClick={toggleEditMode}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            취소
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      )}
    </div>
  );
} 