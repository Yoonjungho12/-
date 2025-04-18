"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseF";
import SectionManager from "../myshop/[id]/SectionManager";

/**
 * 매장 정보 수정 전용 컴포넌트
 * 상위에서 넘겨받은 storeInfo, setStoreInfo 등을 사용.
 */
export default function StoreInfoEditor({ storeInfo, setStoreInfo, sections, setSections, formatPrice, onlyDigits, post_id }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempInfo, setTempInfo] = useState({
    greeting: storeInfo?.greeting || '',
    event_info: storeInfo?.event_info || '',
    program_info: storeInfo?.program_info || '',
    open_hours: storeInfo?.open_hours || '',
    start_time: storeInfo?.start_time || '',
    end_time: storeInfo?.end_time || '',
    ...storeInfo
  });
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'location' | 'operation' | 'details' | 'menu'
  const [is24Hours, setIs24Hours] = useState(false);
  const [timeOptions, setTimeOptions] = useState([]);

  // textarea 자동 높이 조절 함수
  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  // 초기 렌더링 시 textarea 높이 설정
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });
  }, [activeTab, tempInfo?.greeting, tempInfo?.event_info, tempInfo?.program_info]);

  // 시간 옵션 생성
  useEffect(() => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    setTimeOptions(options);
  }, []);

  // 영업시간 초기화
  useEffect(() => {
    if (storeInfo?.open_hours) {
      const [start, end] = storeInfo.open_hours.split('~').map(t => t.trim());
      setTempInfo(prev => ({
        ...prev,
        start_time: start,
        end_time: end
      }));
      setIs24Hours(
        (start === "00:00" && end === "23:59") || 
        (start === "00:00" && end === "24:00") ||
        storeInfo.open_hours.includes("24시간")
      );
    }
  }, [storeInfo?.open_hours]);

  // 영업시간 저장 시 포맷팅
  const formatOpenHours = (start, end) => {
    if (is24Hours) return "00:00 ~ 23:59";
    if (!start || !end) return "";
    return `${start} ~ ${end}`;
  };

  function toggleEdit() {
    if (isEditing) {
      setTempInfo(storeInfo);
    } else {
      setTempInfo({...storeInfo});
    }
    setIsEditing(!isEditing);
  }

  async function handleSave() {
    try {
      const { error } = await supabase
        .from('partnershipsubmit')
        .update({
          company_name: tempInfo.company_name,
          phone_number: tempInfo.phone_number,
          manager_contact: tempInfo.manager_contact,
          address: tempInfo.address,
          address_street: tempInfo.address_street,
          near_building: tempInfo.near_building,
          open_hours: formatOpenHours(tempInfo.start_time, tempInfo.end_time),
          holiday: tempInfo.holiday,
          parking_type: tempInfo.parking_type,
          contact_method: tempInfo.contact_method,
          greeting: tempInfo.greeting,
          event_info: tempInfo.event_info,
          program_info: tempInfo.program_info
        })
        .eq('id', storeInfo.id);

      if (error) throw error;

      setStoreInfo({
        ...tempInfo,
        open_hours: formatOpenHours(tempInfo.start_time, tempInfo.end_time)
      });
      setIsEditing(false);
      alert('저장되었습니다.');
    } catch (err) {
      console.error('저장 중 오류 발생:', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  }

  const tabs = [
    { id: 'basic', name: '기본 정보', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'location', name: '위치 정보', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
    { id: 'operation', name: '운영 정보', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'details', name: '상세 정보', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'menu', name: '메뉴 관리', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' }
  ];

  return (
    <div className="bg-white">
      {/* 상단 헤더 */}
      <div className="border-b border-gray-200">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
              {storeInfo.company_name}
            </span>
          </div>
          {isEditing ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-full text-white bg-gradient-to-r from-orange-600 to-indigo-600 hover:from-orange-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                변경사항 저장
              </button>
            </div>
          ) : (
            <button
              onClick={toggleEdit}
              className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-full text-white bg-gradient-to-r from-orange-500 to-orange-500 hover:from-orange-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              정보 수정
            </button>
          )}
        </div>
        {/* 탭 네비게이션 */}
        <div className="mt-2">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <svg
                  className={`mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="py-6 space-y-6">
        {/* 메뉴 관리 탭 */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <SectionManager 
              sections={sections} 
              setSections={setSections}
              formatPrice={formatPrice}
              onlyDigits={onlyDigits}
              post_id={post_id}
            />
          </div>
        )}

        {/* 기본 정보 */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                업체명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={isEditing ? tempInfo.company_name : storeInfo.company_name}
                onChange={(e) => setTempInfo(prev => ({ ...prev, company_name: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={isEditing ? tempInfo.phone_number : storeInfo.phone_number}
                onChange={(e) => setTempInfo(prev => ({ ...prev, phone_number: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                담당자 연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={isEditing ? tempInfo.manager_contact : storeInfo.manager_contact}
                onChange={(e) => setTempInfo(prev => ({ ...prev, manager_contact: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락 방법</label>
              <input
                type="text"
                value={isEditing ? tempInfo.contact_method : storeInfo.contact_method}
                onChange={(e) => setTempInfo(prev => ({ ...prev, contact_method: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>
        )}

        {/* 위치 정보 */}
        {activeTab === 'location' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">지번 주소</label>
              <input
                type="text"
                value={isEditing ? tempInfo.address : storeInfo.address}
                onChange={(e) => setTempInfo(prev => ({ ...prev, address: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">도로명 주소</label>
              <input
                type="text"
                value={isEditing ? tempInfo.address_street : storeInfo.address_street}
                onChange={(e) => setTempInfo(prev => ({ ...prev, address_street: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">근처 건물</label>
              <input
                type="text"
                value={isEditing ? (tempInfo.near_building ?? "") : (storeInfo.near_building ?? "")}
                onChange={(e) => setTempInfo(prev => ({ ...prev, near_building: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>
        )}

        {/* 운영 정보 */}
        {activeTab === 'operation' && (
          <div className="space-y-6">
            {/* 주차방법 */}
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <label className="w-32 font-semibold">
                주차방법 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <select
                  value={isEditing ? tempInfo.parking_type : storeInfo.parking_type}
                  onChange={(e) => setTempInfo(prev => ({ ...prev, parking_type: e.target.value }))}
                  disabled={!isEditing}
                  className="border-[0.3px] border-zinc-700 rounded px-2 py-1 w-full sm:w-1/2 mb-2"
                >
                  <option value="">선택</option>
                  <option value="직접입력">직접입력</option>
                  <option value="주차 가능(문의)">주차 가능(문의)</option>
                  <option value="건물 내 주차(문의)">건물 내 주차(문의)</option>
                </select>
                {tempInfo.parking_type === "직접입력" && (
                  <input
                    type="text"
                    placeholder="예: 발렛 가능 / 인근 유료주차장 / 등등"
                    value={isEditing ? tempInfo.parking_direct : storeInfo.parking_direct}
                    onChange={(e) => setTempInfo(prev => ({ ...prev, parking_direct: e.target.value }))}
                    disabled={!isEditing}
                    className="border-[0.3px] border-zinc-700 rounded px-2 py-1 w-full sm:w-1/2"
                  />
                )}
              </div>
            </div>

            {/* 예약방법 */}
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <label className="w-32 font-semibold">
                예약방법 <span className="text-red-500">*</span>
              </label>
              <select
                value={isEditing ? tempInfo.contact_method : storeInfo.contact_method}
                onChange={(e) => setTempInfo(prev => ({ ...prev, contact_method: e.target.value }))}
                disabled={!isEditing}
                className="flex-1 border-[0.3px] border-zinc-700 rounded px-2 py-1"
              >
                <option value="">예약 방법 선택</option>
                <option value="전화/문자 모두 예약 가능">전화/문자 모두 예약 가능</option>
                <option value="문자로 예약 가능 (전화예약 불가)">문자로 예약 가능 (전화예약 불가)</option>
                <option value="전화로 예약 가능 (문자 예약 불가)">전화로 예약 가능 (문자 예약 불가)</option>
              </select>
            </div>

            {/* 영업시간 */}
            <div className="flex flex-col sm:flex-row gap-2 items-center mt-4">
              <label className="w-32 font-semibold">
                영업시간 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-gray-700">시작</span>
                  <select
                    disabled={!isEditing}
                    value={isEditing ? tempInfo.start_time : storeInfo.start_time}
                    onChange={(e) => {
                      setTempInfo(prev => ({ ...prev, start_time: e.target.value }));
                      if (is24Hours) {
                        setIs24Hours(false);
                      }
                    }}
                    className="border-[0.3px] border-zinc-700 rounded px-2 py-1"
                  >
                    <option value="">시간선택</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-700">종료</span>
                  <select
                    disabled={!isEditing}
                    value={isEditing ? tempInfo.end_time : storeInfo.end_time}
                    onChange={(e) => {
                      setTempInfo(prev => ({ ...prev, end_time: e.target.value }));
                      if (is24Hours) {
                        setIs24Hours(false);
                      }
                    }}
                    className="border-[0.3px] border-zinc-700 rounded px-2 py-1"
                  >
                    <option value="">시간선택</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!is24Hours) {
                      setIs24Hours(true);
                      setTempInfo(prev => ({ ...prev, start_time: "00:00", end_time: "23:59" }));
                    } else {
                      setIs24Hours(false);
                    }
                  }}
                  disabled={!isEditing}
                  className={`px-3 py-1 border-[0.3px] rounded ${
                    is24Hours
                      ? "bg-gray-600 text-white border-zinc-700"
                      : "bg-white text-gray-700 border-zinc-700"
                  } hover:opacity-80`}
                >
                  24시간
                </button>
                <span className="text-gray-500 ml-2">
                  ※24시간 영업 시 선택해주세요.
                </span>
              </div>
            </div>

            {/* 휴무일 */}
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <label className="w-32 font-semibold">휴무일</label>
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <select
                  value={isEditing ? tempInfo.holiday : storeInfo.holiday}
                  onChange={(e) => {
                    setTempInfo(prev => ({ ...prev, holiday: e.target.value }));
                    if (e.target.value !== "직접입력") {
                      setTempInfo(prev => ({ ...prev, holiday_direct: "" }));
                    }
                  }}
                  disabled={!isEditing}
                  className="border-[0.3px] border-zinc-700 rounded px-2 py-1 w-full sm:w-1/2"
                >
                  <option value="">선택</option>
                  <option value="직접입력">직접입력</option>
                  <option value="연중무휴">연중무휴</option>
                  <option value="월요일 휴무">월요일 휴무</option>
                  <option value="화요일 휴무">화요일 휴무</option>
                  <option value="수요일 휴무">수요일 휴무</option>
                  <option value="목요일 휴무">목요일 휴무</option>
                  <option value="금요일 휴무">금요일 휴무</option>
                  <option value="토요일 휴무">토요일 휴무</option>
                  <option value="일요일 휴무">일요일 휴무</option>
                </select>
                {tempInfo.holiday === "직접입력" && (
                  <input
                    type="text"
                    value={isEditing ? tempInfo.holiday_direct : storeInfo.holiday_direct}
                    onChange={(e) => setTempInfo(prev => ({ ...prev, holiday_direct: e.target.value }))}
                    disabled={!isEditing}
                    className="border-[0.3px] border-zinc-700 rounded px-2 py-1 w-full sm:w-1/2"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* 상세 정보 */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">소개글</label>
              <textarea
                value={isEditing ? tempInfo.greeting : storeInfo.greeting}
                onChange={(e) => {
                  setTempInfo(prev => ({ ...prev, greeting: e.target.value }));
                  autoResize(e);
                }}
                onInput={autoResize}
                rows={1}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 min-h-[100px] overflow-hidden"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이벤트 정보</label>
              <textarea
                value={isEditing ? tempInfo.event_info : storeInfo.event_info}
                onChange={(e) => {
                  setTempInfo(prev => ({ ...prev, event_info: e.target.value }));
                  autoResize(e);
                }}
                onInput={autoResize}
                rows={1}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 min-h-[100px] overflow-hidden"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">프로그램 정보</label>
              <textarea
                value={isEditing ? tempInfo.program_info : storeInfo.program_info}
                onChange={(e) => {
                  setTempInfo(prev => ({ ...prev, program_info: e.target.value }));
                  autoResize(e);
                }}
                onInput={autoResize}
                rows={1}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 min-h-[100px] overflow-hidden"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 