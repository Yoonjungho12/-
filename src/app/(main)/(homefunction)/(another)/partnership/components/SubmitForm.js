// src/app/(main)/(homefunction)/search/page.js

import React from "react";
import MapSelector from "./MapSelector";

export default function SubmitForm({
  editId,
  isMaster = false,
  adType,
  setAdType,
  regions,
  selectedRegionId,
  setSelectedRegionId,
  childRegions,
  selectedSubRegionId,
  setSelectedSubRegionId,
  themes,
  selectedThemeIds,
  setSelectedThemeIds,
  companyName,
  setCompanyName,
  phoneNumber,
  setPhoneNumber,
  managerContact,
  setManagerContact,
  holidaySelectVal,
  setHolidaySelectVal,
  holidayDirect,
  setHolidayDirect,
  parkingSelectVal,
  setParkingSelectVal,
  parkingDirect,
  setParkingDirect,
  contactMethod,
  setContactMethod,
  greeting,
  setGreeting,
  eventInfo,
  setEventInfo,
  is24Hours,
  setIs24Hours,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  timeOptions,
  addressInput,
  setAddressInput,
  addressStreet,
  setAddressStreet,
  nearBuilding,
  setNearBuilding,
  programInfo,
  setProgramInfo,
  postTitle,
  setPostTitle,
  mapRef,
  handleAddressSearch,
  handleKeyDown,
  markerPosition,
}) {
  /**
   * 테마 선택 (단일)
   * - selectedThemeIds는 배열이나, 항상 [단일테마ID]로 관리
   */
  function handleSingleThemeSelect(e) {
    const selectedValue = Number(e.target.value);
    setSelectedThemeIds([selectedValue]);
  }

  return (
    <>
      {/* (1) 광고위치 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
        <label className="w-32 font-medium text-gray-700">상품(광고위치)*</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              if (adType === "VIP") {
                setAdType("");
              } else {
                setAdType("VIP");
              }
            }}
            className={`px-6 py-2.5 rounded-lg transition-all duration-200 ${
              adType === "VIP"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:border-orange-500"
            }`}
          >
            VIP
          </button>
          <button
            type="button"
            onClick={() => {
              if (adType === "VIP+") {
                setAdType("");
              } else {
                setAdType("VIP+");
              }
            }}
            className={`px-6 py-2.5 rounded-lg transition-all duration-200 ${
              adType === "VIP+"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:border-orange-500"
            }`}
          >
            VIP+
          </button>
          <button
            type="button"
            onClick={() => setAdType("")}
            className={`px-6 py-2.5 rounded-lg transition-all duration-200 ${
              adType === ""
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:border-orange-500"
            }`}
          >
            선택 안함
          </button>
        </div>
      </div>

      {/* (2) 상위 지역 */}
      <div className="mb-6">
        <label className="block font-medium text-gray-700 mb-2">
          지역선택 <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedRegionId || ""}
          onChange={(e) => setSelectedRegionId(Number(e.target.value))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        >
          <option value="">지역 선택</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </div>

      {/* (3) 하위 지역 */}
      {childRegions.length > 0 && (
        <div className="mb-6">
          <label className="block font-medium text-gray-700 mb-2">
            세부 지역선택 <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedSubRegionId || ""}
            onChange={(e) => setSelectedSubRegionId(Number(e.target.value))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">하위 지역 선택</option>
            {childRegions.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* (4) 테마 (단일 선택) */}
      {themes.length > 0 && (
        <div className="mb-6">
          <label className="block font-medium text-gray-700 mb-2">
            테마 <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedThemeIds[0] || ""}
            onChange={handleSingleThemeSelect}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">테마 선택</option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* (5) 업체 정보 */}
      <div className="mb-6">
        <label className="block font-medium text-gray-700 mb-2">
          업체명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="지역+업체명"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      <div className="mb-6">
        <label className="block font-medium text-gray-700 mb-2">
          전화번호 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="영업용 010 번호"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      <div className="mb-6">
        <label className="block font-medium text-gray-700 mb-2">
          담당자 연락처 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="실제 연락가능 번호"
          value={managerContact}
          onChange={(e) => setManagerContact(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {/* (6) 업체 휴무일 */}
      <div className="mb-6">
        <label className="block font-medium text-gray-700 mb-2">업체 휴무일</label>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={holidaySelectVal}
            onChange={(e) => {
              setHolidaySelectVal(e.target.value);
              if (e.target.value !== "직접입력") {
                setHolidayDirect("");
              }
            }}
            className="w-full sm:w-1/2 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
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
          {holidaySelectVal === "직접입력" && (
            <input
              type="text"
              value={holidayDirect}
              onChange={(e) => setHolidayDirect(e.target.value)}
              placeholder="직접 입력"
              className="w-full sm:w-1/2 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
            />
          )}
        </div>
      </div>

      {/* (7) 주차방법 */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <label className="w-32 font-semibold">
          주차방법 <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <select
            value={parkingSelectVal}
            onChange={(e) => {
              setParkingSelectVal(e.target.value);
              if (e.target.value !== "직접입력") {
                setParkingDirect("");
              }
            }}
            className="border-[0.3px] border-zinc-700 rounded px-2 py-1 w-full sm:w-1/2 mb-2"
          >
            <option value="">선택</option>
            <option value="직접입력">직접입력</option>
            <option value="주차 가능(문의)">주차 가능(문의)</option>
            <option value="건물 내 주차(문의)">건물 내 주차(문의)</option>
          </select>
          {parkingSelectVal === "직접입력" && (
            <input
              type="text"
              placeholder="예: 발렛 가능 / 인근 유료주차장 / 등등"
              value={parkingDirect}
              onChange={(e) => setParkingDirect(e.target.value)}
              className="border-[0.3px] border-zinc-700 rounded px-2 py-1 w-full sm:w-1/2"
            />
          )}
        </div>
      </div>

      {/* (8) 예약방법 */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <label className="w-32 font-semibold">
          예약방법 <span className="text-red-500">*</span>
        </label>
        <select
          value={contactMethod}
          onChange={(e) => setContactMethod(e.target.value)}
          className="flex-1 border-[0.3px] border-zinc-700 rounded px-2 py-1"
        >
          <option value="">예약 방법 선택</option>
          <option value="전화/문자 모두 예약 가능">
            전화/문자 모두 예약 가능
          </option>
          <option value="문자로 예약 가능 (전화예약 불가)">
            문자로 예약 가능 (전화예약 불가)
          </option>
          <option value="전화로 예약 가능 (문자 예약 불가)">
            전화로 예약 가능 (문자 예약 불가)
          </option>
        </select>
      </div>

      {/* (9) 업체 소개 */}
      <div className="mt-4">
        <label className="block font-semibold mb-1">
          업체 소개 <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder="ex) 사업장 소개"
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          rows={4}
          className="w-full border-[0.3px] border-zinc-700 rounded px-2 py-1"
        />
      </div>

      <div className="mt-4">
        <label className="block font-semibold mb-1">
          글 제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="예) [지역/업체명] 여기닷 애견펜션"
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
          className="w-full border-[0.3px] border-zinc-700 rounded px-2 py-1"
        />
      </div>

      <div className="mt-4">
        <label className="block font-semibold mb-1">
          프로그램(코스) <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder={`프로그램(코스)는 관리자 승인 후에 추가 하실 수 있습니다. 
이 곳에는 간단한 소개글을 적어주세요.`}
          value={programInfo}
          onChange={(e) => setProgramInfo(e.target.value)}
          className="w-full border-[0.3px] border-zinc-700 rounded px-2 py-1"
          rows={3}
        />
      </div>

      {/* (10) 업체 이벤트 */}
      <div className="mt-4">
        <label className="block font-semibold mb-1">
          업체 이벤트 <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder="주간할인, 시간대 할인 등"
          value={eventInfo}
          onChange={(e) => setEventInfo(e.target.value)}
          rows={4}
          className="w-full border-[0.3px] border-zinc-700 rounded px-2 py-1"
        />
      </div>

      {/* (11) 영업시간 */}
      <div className="flex flex-col sm:flex-row gap-2 items-center mt-4">
        <label className="w-32 font-semibold">
          영업시간 <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-gray-700">시작</span>
            <select
              disabled={is24Hours}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border-[0.3px] border-zinc-700 rounded px-2 py-1"
            >
              <option value="">시간선택</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-700">종료</span>
            <select
              disabled={is24Hours}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border-[0.3px] border-zinc-700 rounded px-2 py-1"
            >
              <option value="">시간선택</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!is24Hours) {
                setIs24Hours(true);
                setStartTime("");
                setEndTime("");
              } else {
                setIs24Hours(false);
              }
            }}
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

      {/* (12) 주소 + 지도 */}
      <div className="mt-4">
        <label className="block font-semibold mb-1">
          지번 주소 <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <input
            type="text"
            placeholder="주소 입력 후 검색"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-[0.3px] border-zinc-700 rounded px-2 py-1 flex-1"
          />
          <button
            type="button"
            onClick={handleAddressSearch}
            className="px-4 py-2 rounded bg-orange-500 text-white font-semibold hover:bg-orange-400"
          >
            검색하기
          </button>
        </div>
        <input
          type="text"
          placeholder="인근 지하철/건물"
          value={nearBuilding}
          onChange={(e) => setNearBuilding(e.target.value)}
          className="border-[0.3px] border-zinc-700 rounded px-2 py-1 w-full mb-2"
        />
        {!isMaster && (
          <MapSelector mapRef={mapRef} markerPosition={markerPosition} />
        )}
      </div>

      {/* (13) 도로명 주소 */}
      <div className="mt-4">
        <label className="block font-semibold mb-1">
          도로명 주소 (자동)
        </label>
        <input
          type="text"
          placeholder="지도 클릭 or 검색 시 자동 입력됩니다."
          value={addressStreet}
          onChange={(e) => setAddressStreet(e.target.value)}
          className="w-full border-[0.3px] border-zinc-700 rounded px-2 py-1 mb-2"
        />
      </div>
    </>
  );
}