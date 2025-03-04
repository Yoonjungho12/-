"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseF";

/** UTC → 로컬 시간 + "오늘/어제/N일 전" 으로 표시 */
function formatLocalTime(isoString) {
  if (!isoString) return "(등록일 없음)";
  const utcDate = new Date(isoString);
  const localDate = new Date(utcDate.getTime());
  const hh = String(localDate.getHours()).padStart(2, "0");
  const mm = String(localDate.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;

  const cYear = localDate.getFullYear();
  const cMonth = localDate.getMonth();
  const cDay = localDate.getDate();

  const createdNoTime = new Date(cYear, cMonth, cDay, 0, 0, 0);
  const now = new Date();
  const nowNoTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0
  );

  let dayDiff = Math.floor((nowNoTime - createdNoTime) / (1000 * 60 * 60 * 24));
  if (dayDiff < 0) dayDiff = 0;

  if (dayDiff === 0) return `오늘 ${timeStr}`;
  if (dayDiff === 1) return `어제 ${timeStr}`;
  if (dayDiff <= 7) return `${dayDiff}일 전 ${timeStr}`;
  const yyyy = localDate.getFullYear();
  const mon = localDate.getMonth() + 1;
  const dd = localDate.getDate();
  return `${yyyy}년 ${mon}월 ${dd}일`;
}

export default function PartnershipList() {
  const router = useRouter();

  // 로그인된 사용자 세션 체크
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null); // 내 user.id

  // 파트너십 데이터
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 모달 제어
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // 정렬 옵션
  const [sortOrder, setSortOrder] = useState("desc");

  // 1) 컴포넌트 마운트 시, Supabase Auth로 세션 확인
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("세션 체크 에러:", error);
        router.push("/master/login");
        return;
      }
      if (!data.session) {
        // 세션(로그인 정보) 없음
        router.push("/master/login");
      } else {
        // 세션 있음 → user.id 저장
        setSessionUserId(data.session.user.id);
        setAuthChecked(true);
      }
    });
  }, [router]);

  // 2) 세션 확인 후, 파트너십 데이터 불러오기
  useEffect(() => {
    if (authChecked) {
      fetchPartnershipData(sortOrder);
    }
  }, [authChecked, sortOrder]);

  // 정렬 옵션 변경 핸들러
  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  // 테이블 행 클릭 → 모달 오픈
  const handleRowClick = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setSelectedRow(null);
    setModalOpen(false);
  };

  // partnershipsubmit 불러오기
  async function fetchPartnershipData(order) {
    setLoading(true);
    try {
      // 1) 파트너십 데이터
      const { data: partnershipData, error } = await supabase
        .from("partnershipsubmit")
        .select("*")
        .order("created_at", { ascending: order === "asc" });

      if (error) {
        console.error("파트너십 조회 오류:", error);
        setRows([]);
        setLoading(false);
        return;
      }

      // 2) 각 행에 대해, user_id → profiles에서 닉네임/폰, region_id → regions.name
      const updatedRows = await Promise.all(
        (partnershipData || []).map(async (row) => {
          const newRow = { ...row };
          // 원본 user_id → auth_user_id
          newRow.auth_user_id = row.user_id;

          // profiles
          if (!row.user_id) {
            newRow.user_id = "(알 수 없음)";
            newRow.profile_phone = "(없음)";
            newRow.profile_name = "(없음)";
          } else {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("nickname, phone, name")
              .eq("user_id", row.user_id)
              .single();
            if (!profileData) {
              newRow.user_id = "(닉네임 없음)";
              newRow.profile_phone = "(없음)";
              newRow.profile_name = "(없음)";
            } else {
              newRow.user_id = profileData.nickname || "(닉네임 없음)";
              newRow.profile_phone = profileData.phone || "(없음)";
              newRow.profile_name = profileData.name || "(없음)";
            }
          }

          // region
          if (newRow.region_id) {
            const { data: regionData } = await supabase
              .from("regions")
              .select("name")
              .eq("id", newRow.region_id)
              .single();
            newRow.region_name = regionData ? regionData.name : "(지역 없음)";
          } else {
            newRow.region_name = "(지역 없음)";
          }

          // sub region
          if (newRow.sub_region_id) {
            const { data: subRegionData } = await supabase
              .from("regions")
              .select("name")
              .eq("id", newRow.sub_region_id)
              .single();
            newRow.sub_region_name = subRegionData
              ? subRegionData.name
              : "(세부 지역 없음)";
          } else {
            newRow.sub_region_name = "(세부 지역 없음)";
          }

          return newRow;
        })
      );

      setRows(updatedRows);
    } catch (err) {
      console.error("API 오류:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // 3) 세션 체크 안 끝나면
  if (!authChecked) {
    return <div className="p-4 text-blue-600">로그인 여부 확인 중...</div>;
  }
  // 데이터 로딩
  if (loading) {
    return <div className="p-4 text-blue-600">데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600">제휴신청 목록</h1>
        <select
          className="border border-gray-300 p-1 text-sm"
          value={sortOrder}
          onChange={handleSortChange}
        >
          <option value="desc">최신순</option>
          <option value="asc">오래된순</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 text-sm">
          <thead className="bg-white text-blue-600">
            <tr>
              <Th>번호</Th>
              <Th>닉네임</Th>
              <Th>상품(광고위치)</Th>
              <Th>지역</Th>
              <Th>세부 지역</Th>
              <Th>업체명</Th>
              <Th>전화번호</Th>
              <Th>담당자 연락처</Th>
              <Th>주차방법</Th>
              <Th>샵형태</Th>
              <Th>#후원</Th>
              <Th>연락방법</Th>
              <Th>인사말</Th>
              <Th>이벤트</Th>
              <Th>주소</Th>
              <Th>인근 지하철/건물</Th>
              <Th>영업시간</Th>
              <Th>프로그램(코스)</Th>
              <Th>글 제목</Th>
              <Th>관리사</Th>
              <Th>등록일</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setSelectedRow(row);
                  setModalOpen(true);
                }}
              >
                <Td>{idx + 1}</Td>
                <Td>{row.user_id}</Td>
                <Td>{row.ad_type}</Td>
                <Td>{row.region_name}</Td>
                <Td>{row.sub_region_name}</Td>
                <Td>{row.company_name}</Td>
                <Td>{row.phone_number}</Td>
                <Td>{row.manager_contact}</Td>
                <Td>{row.parking_type}</Td>
                <Td>{row.shop_type}</Td>
                <Td>{row.sponsor}</Td>
                <Td>{row.contact_method}</Td>
                <Td>{row.greeting}</Td>
                <Td>{row.event_info}</Td>
                <Td>{row.address}</Td>
                <Td>{row.near_building}</Td>
                <Td>{row.open_hours}</Td>
                <Td>{row.program_info}</Td>
                <Td>{row.post_title}</Td>
                <Td>{row.manager_desc}</Td>
                <Td>{formatLocalTime(row.created_at)}</Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={21} className="p-4 text-center text-gray-500">
                  등록된 제휴신청이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedRow && (
        <Modal
          row={selectedRow}
          onClose={() => setModalOpen(false)}
          senderId={sessionUserId} // 로그인한 사용자 ID
        />
      )}
    </div>
  );
}

/** 모달: 상세 보기 + 쪽지 전송 */
function Modal({ row, onClose, senderId }) {
  const [showTextarea, setShowTextarea] = useState(false);
  const [message, setMessage] = useState("");

  // 전화버튼
  const handleCall = () => {
    if (!row.phone_number || row.phone_number === "(없음)") {
      alert("전화번호가 없습니다.");
      return;
    }
    window.location.href = `tel:${row.phone_number}`;
  };

  // 쪽지 전송
  const handleSendMsg = async () => {
    if (!row.auth_user_id || row.auth_user_id === "(알 수 없음)") {
      alert("받는 사람 UUID가 없습니다!");
      return;
    }
    if (!message.trim()) {
      alert("쪽지 내용을 입력하세요!");
      return;
    }
    if (!senderId) {
      alert("로그인된 사용자 ID(senderId)가 없습니다!");
      return;
    }

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: senderId,            // 내 ID
          receiver_id: row.auth_user_id,  // 대상 ID
          content: message,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        alert(`쪽지 전송 실패: ${error || "알 수 없는 에러"}`);
        return;
      }
      alert(
        "쪽지 전송 완료!\n" +
          `보낸사람: ${senderId}\n` +
          `받는사람: ${row.auth_user_id}\n` +
          `내용: ${message}`
      );
    } catch (err) {
      console.error("쪽지 전송 중 오류:", err);
      alert("쪽지 전송 중 오류가 발생했습니다.");
    }
    setMessage("");
    setShowTextarea(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="relative w-[600px] h-[600px] p-4 rounded shadow-xl bg-white flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-2">상세 보기</h2>

        <div className="flex-1 overflow-y-auto border border-gray-200 p-2 space-y-2 text-sm">
          <DetailItem label="닉네임" value={row.user_id} />
          <DetailItem label="전화번호" value={row.phone_number} />
          <DetailItem label="담당자 연락처" value={row.manager_contact} />
          <DetailItem label="프로필 전화" value={row.profile_phone} />
          <DetailItem label="프로필 이름" value={row.profile_name} />
          <DetailItem label="상품(광고위치)" value={row.ad_type} />
          <DetailItem label="지역선택" value={row.region_name} />
          <DetailItem label="세부 지역선택" value={row.sub_region_name} />
          <DetailItem label="등록일" value={row.created_at} />
          {/* ... 필요한 필드 더 표시 가능 */}
        </div>

        {/* 쪽지 보내기 영역 */}
        {showTextarea && (
          <div className="mt-2 border border-gray-200 p-2">
            <textarea
              className="w-full h-20 border border-gray-300 p-1 text-sm"
              placeholder="쪽지를 작성하세요..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        )}

        <div className="mt-2 text-right space-x-2">
          {!showTextarea && (
            <button
              className="px-4 py-1 bg-gray-300 text-black rounded"
              onClick={() => setShowTextarea(true)}
            >
              쪽지 보내기
            </button>
          )}
          {showTextarea && (
            <button
              className="px-4 py-1 bg-gray-300 text-black rounded"
              onClick={handleSendMsg}
            >
              쪽지 전송
            </button>
          )}

          <button
            className="px-4 py-1 bg-green-500 text-white rounded"
            onClick={handleCall}
          >
            연락하기
          </button>
          <button
            className="px-4 py-1 bg-blue-500 text-white rounded"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// label:value
function DetailItem({ label, value }) {
  return (
    <div>
      <span className="font-semibold">{label}:</span> {value}
    </div>
  );
}

// 테이블 스타일
function Th({ children }) {
  return (
    <th className="border-b border-gray-200 p-2 text-left font-semibold">
      {children}
    </th>
  );
}
function Td({ children, ...props }) {
  return (
    <td className="border-b border-gray-200 p-2" {...props}>
      {children}
    </td>
  );
}