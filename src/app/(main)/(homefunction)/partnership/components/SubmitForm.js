import React from "react";
import MapSelector from "./MapSelector";

export default function SubmitForm({
  editId,

  // 지역
  isMaster = false,
  adType, setAdType,
  regions,
  selectedRegionId, setSelectedRegionId,
  childRegions,
  selectedSubRegionId, setSelectedSubRegionId,
  themes,
  selectedThemeIds, setSelectedThemeIds,

  // 업체
  companyName, setCompanyName,
  phoneNumber, setPhoneNumber,
  managerContact, setManagerContact,

  // 휴무일 (이름 변경: closedDay -> holiday)
  holidaySelectVal, setHolidaySelectVal,
  holidayDirect, setHolidayDirect,

  // 주차방법
  parkingSelectVal, setParkingSelectVal,
  parkingDirect, setParkingDirect,

  contactMethod, setContactMethod,

  // 업체 소개, 이벤트
  greeting, setGreeting,
  eventInfo, setEventInfo,

  // 영업시간
  is24Hours, setIs24Hours,
  startTime, setStartTime,
  endTime, setEndTime,
  timeOptions,

  // 주소
  addressInput, setAddressInput,
  addressStreet, setAddressStreet,
  nearBuilding, setNearBuilding,

  // 프로그램(코스), 글제목, 관리사
  programInfo, setProgramInfo,
  postTitle, setPostTitle,

  // 지도
  mapRef,
  handleAddressSearch,
  handleKeyDown,
  markerPosition,
}) {
  // 테마 선택 함수
  function handleThemeClick(themeId) {
    setSelectedThemeIds((prev) => {
      if (prev.includes(themeId)) {
        return prev.filter((id) => id !== themeId);
      }
      return [...prev, themeId];
    });
  }

  return (
    <>
      {/* ─────────────────────────────────────────
          (1) 광고위치: VIP / VIP+ / 선택 안함
          isMaster가 true이면 자동 승인 처리이므로 UI에서 광고위치 선택을 숨김
      ───────────────────────────────────────── */}
      {!isMaster ? (
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <label className="w-32 font-semibold">상품(광고위치)*</label>
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
              className={`px-6 py-2 rounded border ${
                adType === "VIP"
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-700 border-gray-300"
              } hover:opacity-80`}
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
              className={`px-6 py-2 rounded border ${
                adType === "VIP+"
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-700 border-gray-300"
              } hover:opacity-80`}
            >
              VIP+
            </button>
            <button
              type="button"
              onClick={() => setAdType("")}
              className={`px-6 py-2 rounded border ${
                adType === ""
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-700 border-gray-300"
              } hover:opacity-80`}
            >
              선택 안함
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <label className="w-32 font-semibold">상품(광고위치)</label>
          <div className="text-green-600 font-semibold">
            마스터 모드 – 자동 승인
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────
          (2) 상위 지역
      ───────────────────────────────────────── */}
      <div>
        <label className="block font-semibold mb-1">
          지역선택 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-7 gap-2">
          {regions.map((region) => {
            const isSelected = region.id === selectedRegionId;
            return (
              <button
                key={region.id}
                type="button"
                onClick={() => setSelectedRegionId(region.id)}
                className={`px-3 py-2 text-center rounded border border-gray-300 ${
                  isSelected
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-white text-gray-700"
                } hover:opacity-80`}
              >
                {region.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 하위 지역 */}
      {childRegions.length > 0 && (
        <div>
          <label className="block font-semibold mb-1">
            세부 지역선택 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-7 gap-2">
            {childRegions.map((sub) => {
              const isSelected = sub.id === selectedSubRegionId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubRegionId(sub.id)}
                  className={`px-3 py-2 text-center rounded border border-gray-300 ${
                    isSelected
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-700"
                  } hover:opacity-80`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────
          (3) 테마(M:N)
      ───────────────────────────────────────── */}
      {themes.length > 0 && (
        <div>
          <label className="block font-semibold mb-1">
            테마 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-7 gap-2">
            {themes.map((theme) => {
              const isSelected = selectedThemeIds.includes(theme.id);
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeClick(theme.id)}
                  className={`px-3 py-2 text-center rounded border border-gray-300 ${
                    isSelected
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-700"
                  } hover:opacity-80`}
                >
                  {theme.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────
          (4) 업체명
      ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="w-32 font-semibold">
          업체명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="지역+업체명"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-2 py-1"
        />
      </div>

      {/* 전화번호 */}
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="w-32 font-semibold">
          전화번호 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="영업용 010 번호"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-2 py-1"
        />
      </div>

      {/* 담당자 연락처 */}
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="w-32 font-semibold">
          담당자 연락처 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="실제 연락가능 번호"
          value={managerContact}
          onChange={(e) => setManagerContact(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-2 py-1"
        />
      </div>

      {/* ─────────────────────────────────────────
          (5) 업체 휴무일 (closedDay -> holiday)
      ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="w-32 font-semibold">업체 휴무일</label>
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <select
            value={holidaySelectVal}
            onChange={(e) => {
              setHolidaySelectVal(e.target.value);
              if (e.target.value !== "직접입력") {
                setHolidayDirect("");
              }
            }}
            className="border border-gray-300 rounded px-2 py-1 w-full sm:w-1/2 mb-2"
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
              placeholder="예: 공휴일 휴무 / 둘째주 수요일 휴무 등"
              value={holidayDirect}
              onChange={(e) => setHolidayDirect(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full sm:w-1/2"
            />
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────
          (6) 주차방법 (Select + 직접입력)
      ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
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
            className="border border-gray-300 rounded px-2 py-1 w-full sm:w-1/2 mb-2"
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
              className="border border-gray-300 rounded px-2 py-1 w-full sm:w-1/2"
            />
          )}
        </div>
      </div>

      {/* 예약방법 */}
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="w-32 font-semibold">
          예약방법 <span className="text-red-500">*</span>
        </label>
        <select
          value={contactMethod}
          onChange={(e) => setContactMethod(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-2 py-1"
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

      {/* 업체 소개 */}
      <div>
        <label className="block font-semibold mb-1">
          업체 소개 <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder="ex) 사업장 소개"
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded px-2 py-1"
        />
      </div>

      {/* 업체 이벤트 */}
      <div>
        <label className="block font-semibold mb-1">
          업체 이벤트 <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder="주간할인, 시간대 할인 등"
          value={eventInfo}
          onChange={(e) => setEventInfo(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded px-2 py-1"
        />
      </div>

      {/* 영업시간 */}
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <label className="w-32 font-semibold mb-1">
          영업시간 <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-gray-700">시작</span>
            <select
              disabled={is24Hours}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1"
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
              className="border border-gray-300 rounded px-2 py-1"
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
            className={`px-3 py-1 border rounded ${
              is24Hours
                ? "bg-gray-600 text-white border-gray-600"
                : "bg-white text-gray-700 border-gray-300"
            } hover:opacity-80`}
          >
            24시간
          </button>
          <span className="text-gray-500 ml-2">
            ※24시간 영업 시 선택해주세요.
          </span>
        </div>
      </div>

      {/* 주소 + 지도 */}
      <div>
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
            className="border border-gray-300 rounded px-2 py-1 flex-1"
          />
          <button
            type="button"
            onClick={handleAddressSearch}
            className="px-4 py-2 rounded bg-gray-600 text-white font-semibold hover:bg-gray-700"
          >
            검색하기
          </button>
        </div>
        <input
          type="text"
          placeholder="인근 지하철/건물"
          value={nearBuilding}
          onChange={(e) => setNearBuilding(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 w-full mb-2"
        />
        <MapSelector mapRef={mapRef} markerPosition={markerPosition} />
      </div>

      {/* 도로명 주소 */}
      <div>
        <label className="block font-semibold mb-1">
          도로명 주소 (자동)
        </label>
        <input
          type="text"
          placeholder="지도 클릭 or 검색 시 자동 입력됩니다."
          value={addressStreet}
          onChange={(e) => setAddressStreet(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 mb-2"
        />
      </div>

      {/* 프로그램(코스) */}
      <div>
        <label className="block font-semibold mb-1">
          프로그램(코스) <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder={`프로그램(코스)는 관리자 승인 후에 추가 하실 수 있습니다 
이 곳에는 간단한 소개글을 적어주세요.
              `}
          value={programInfo}
          onChange={(e) => setProgramInfo(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1"
          rows={3}
        />
      </div>

      {/* 글 제목 */}
      <div>
        <label className="block font-semibold mb-1">
          글 제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="예) [지역/업체명] 여기닷 애견펜션"
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1"
        />
      </div>
    </>
  );
}