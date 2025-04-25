// src/app/(main)/(homefunction)/search/page.js

import React from "react";
import MapSelector from "./MapSelector";

export default function SubmitForm({
  editId,
  isMaster = false,
  adType,
  setAdType,
  titleColor,
  setTitleColor,
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
      <div className="mb-6">
        <label className="block font-medium text-gray-700 mb-2">
          상품(광고위치) <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAdType("VIP")}
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
              onClick={() => setAdType("VIP+")}
              className={`px-6 py-2.5 rounded-lg transition-all duration-200 ${
                adType === "VIP+"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-orange-500"
              }`}
            >
              VIP+
            </button>
            <input
              type="radio"
              name="adType"
              value="선택 안함"
              checked={adType === ""}
              onChange={() => setAdType("")}
              className="hidden"
            />
          </div>

          {/* VIP 미리보기 */}
          {adType === "VIP" && (
            <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="table-fixed w-full text-sm border-separate border-spacing-0">
                <colgroup>
                  <col className="w-[55%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-4 px-6 text-left text-gray-600 font-medium border-b border-gray-100">제목</th>
                    <th className="py-4 px-6 text-center text-gray-600 font-medium border-b border-gray-100">최저가</th>
                    <th className="py-4 px-6 text-center text-gray-600 font-medium border-b border-gray-100">조회수</th>
                    <th className="py-4 px-6 text-center text-gray-600 font-medium border-b border-gray-100">리뷰수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="group transition-all duration-300 relative bg-gradient-to-r from-rose-50/80 via-orange-50/60 to-amber-50/50 hover:from-rose-100/80 hover:via-orange-50/70 hover:to-amber-50/60 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.1)]">
                    <td className="py-4 px-6 relative">
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-300 via-rose-400 to-orange-300 opacity-70" />
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm">
                          VIP
                        </span>
                        <div className="flex-1">
                          <h3 className="font-medium text-rose-900 group-hover:text-rose-500 transition-colors">
                            반갑습니다.
                          </h3>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span className="font-medium text-rose-600">가격 없음</span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span className="text-rose-600/80">130</span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span className="text-rose-600/80">0</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* VIP+ 미리보기 */}
          {adType === "VIP+" && (
            <>
              <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="table-fixed w-full text-sm border-separate border-spacing-0">
                  <colgroup>
                    <col className="w-[55%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-4 px-6 text-left text-gray-600 font-medium border-b border-gray-100">제목</th>
                      <th className="py-4 px-6 text-center text-gray-600 font-medium border-b border-gray-100">최저가</th>
                      <th className="py-4 px-6 text-center text-gray-600 font-medium border-b border-gray-100">조회수</th>
                      <th className="py-4 px-6 text-center text-gray-600 font-medium border-b border-gray-100">리뷰수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="group transition-all duration-300 relative bg-gradient-to-r from-rose-50/80 via-orange-50/60 to-amber-50/50 hover:from-rose-100/80 hover:via-orange-50/70 hover:to-amber-50/60 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.1)]">
                      <td className="py-4 px-6 relative">
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-300 via-rose-400 to-orange-300 opacity-70" />
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm">
                            VIP+
                          </span>
                          <div className="flex-1">
                            <h3 style={{ 
                              color: {
                                'red': '#dc2626',
                                'orange': '#ea580c',
                                'yellow': '#ca8a04',
                                'olive': '#556b2f',
                                'lime': '#65a30d',
                                'green': '#16a34a',
                                'blue': '#2563eb',
                                'indigo': '#4f46e5',
                                'pink': '#db2777',
                                'purple': '#9333ea',
                                'black': '#000000'
                              }[titleColor]
                            }} className="font-medium group-hover:text-rose-500 transition-colors">
                              {postTitle || "글 제목을 입력해주세요"}
                            </h3>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span className="font-medium text-rose-600">가격 없음</span>
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span className="text-rose-600/80">130</span>
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span className="text-rose-600/80">0</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 제목 색상 선택 */}
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  제목 색상 선택
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'red', label: '빨강', bg: 'bg-red-500', color: '#dc2626' },
                    { key: 'orange', label: '주황', bg: 'bg-orange-500', color: '#ea580c' },
                    { key: 'yellow', label: '노랑', bg: 'bg-yellow-500', color: '#ca8a04' },
                    { key: 'olive', label: '올리브', bg: 'bg-[#808000]', color: '#556b2f' },
                    { key: 'lime', label: '라임', bg: 'bg-lime-500', color: '#65a30d' },
                    { key: 'green', label: '초록', bg: 'bg-green-500', color: '#16a34a' },
                    { key: 'blue', label: '파랑', bg: 'bg-blue-500', color: '#2563eb' },
                    { key: 'indigo', label: '남색', bg: 'bg-indigo-500', color: '#4f46e5' },
                    { key: 'pink', label: '분홍', bg: 'bg-pink-500', color: '#db2777' },
                    { key: 'purple', label: '보라', bg: 'bg-purple-500', color: '#9333ea' },
                    { key: 'black', label: '검정', bg: 'bg-black', color: '#000000' }
                  ].map(color => (
                    <button
                      key={color.key}
                      type="button"
                      onClick={() => setTitleColor(color.key)}
                      className={`relative p-2 rounded-lg transition-all duration-200 ${
                        titleColor === color.key 
                          ? 'ring-2 ring-offset-2 ring-gray-400' 
                          : 'hover:ring-2 hover:ring-offset-2 hover:ring-gray-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${color.bg} mb-1`} />
                      <span className="text-xs text-gray-600">{color.label}</span>
                      {titleColor === color.key && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-gray-800" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 글 제목 입력 (VIP+ 모드에서) */}
              <div className="mt-4">
                <label className="block font-medium text-gray-700 mb-2">
                  글 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예) [지역/업체명] 여기닷 애견펜션"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </>
          )}
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

      {/* 기존 글 제목 입력 (VIP+ 아닐 때만 표시) */}
      {adType !== "VIP+" && (
        <div className="mt-4">
          <label className="block font-medium text-gray-700 mb-2">
            글 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="예) [지역/업체명] 여기닷 애견펜션"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      )}

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