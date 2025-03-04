'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseF';
// 실제 환경에 맞춰 경로 조정하세요.

export default function PartnershipList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartnershipData();
  }, []);

  // partnershipSubmit 테이블의 모든 행을 가져옴
  async function fetchPartnershipData() {
    try {
      const { data, error } = await supabase
        .from('partnershipsubmit')
        .select('*')
        .order('id', { ascending: true }); // 필요에 따라 정렬 조건 추가

      if (error) {
        console.error('파트너십 데이터 조회 오류:', error);
      } else {
        setRows(data || []);
      }
    } catch (err) {
      console.error('API 호출 중 오류:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-blue-600">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="bg-white p-4">
      <h1 className="mb-4 text-xl font-bold text-blue-600">제휴신청 목록</h1>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 text-sm">
<thead className="bg-white text-blue-600">
  <tr>
    {[
      <Th key="번호">번호</Th>,
      <Th key="유저아이디">유저아이디</Th>,
      <Th key="상품(광고위치)">상품(광고위치)</Th>,
      <Th key="지역선택">지역선택</Th>,
      <Th key="세부 지역선택">세부 지역선택</Th>,
      <Th key="업체명">업체명</Th>,
      <Th key="전화번호">전화번호</Th>,
      <Th key="담당자 연락처">담당자 연락처</Th>,
      <Th key="주차방법">주차방법</Th>,
      <Th key="샵형태">샵형태</Th>,
      <Th key="#후원">#후원</Th>,
      <Th key="연락방법">연락방법</Th>,
      <Th key="인사말">인사말</Th>,
      <Th key="이벤트">이벤트</Th>,
      <Th key="주소">주소</Th>,
      <Th key="인근 지하철/건물">인근 지하철/건물</Th>,
      <Th key="영업시간">영업시간</Th>,
      <Th key="프로그램(코스)">프로그램(코스)</Th>,
      <Th key="글 제목">글 제목</Th>,
      <Th key="관리사">관리사</Th>,
      <Th key="등록일">등록일</Th>,
    ]}
  </tr>
</thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <Td>{row.id}</Td>
                <Td>{row.user_id}</Td>
                <Td>{row.ad_type}</Td>
                <Td>{row.region_id}</Td>
                <Td>{row.sub_region_id}</Td>
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
                <Td>{row.created_at}</Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={20}
                  className="p-4 text-center text-gray-500"
                >
                  등록된 제휴신청이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 재사용 가능한 <th> 스타일
function Th({ children }) {
  return (
    <th className="border-b border-gray-200 p-2 text-left font-semibold">
      {children}
    </th>
  );
}

// 재사용 가능한 <td> 스타일
function Td({ children }) {
  return (
    <td className="border-b border-gray-200 p-2">
      {children}
    </td>
  );
}