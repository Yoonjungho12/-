import Image from "next/image";
import MapKakao from "./MapKakao";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseF"; // Supabase 클라이언트 import
import CommentsUI from "./comment";

// Supabase 스토리지 public URL 빌더
function buildPublicImageUrl(path) {
  return `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${path}`;
}

// 단순 label-value 표시용
function DetailRow({ label, value }) {
  return (
    <div className="mb-2">
      <span className="inline-block w-24 font-semibold text-gray-600">
        {label}
      </span>
      <span className="text-gray-800">{value || "-"}</span>
    </div>
  );
}

export default function DetailPage({ row, images }) {
  // 이미지 목록을 서버에서 받아서 props로 전달함
  const allImages = [];
  if (row.thumbnail_url) {
    allImages.push(buildPublicImageUrl(row.thumbnail_url));
  }
  if (images && images.length > 0) {
    images.forEach((imgObj) => {
      allImages.push(buildPublicImageUrl(imgObj.image_url));
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
      {/* ===== 왼쪽 섹션 (이미지 + 상세 정보) ===== */}
      <div className="flex-[7]">
        {/* ======= 1) 이미지 섹션 ======= */}
        <div className="flex gap-4">
          {/* 왼쪽: 첫 번째 이미지 */}
          <div className="relative flex-1 h-80 bg-gray-100 rounded overflow-hidden">
            {allImages.length > 0 ? (
              <Image
                src={allImages[0]}
                alt="메인 이미지"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 66vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                이미지가 등록되지 않았습니다.
              </div>
            )}
          </div>

          {/* 오른쪽: 썸네일 목록 */}
          {allImages.length > 1 && (
            <div
              className="flex flex-col gap-2 overflow-y-auto"
              style={{ width: "90px" }}
            >
              {allImages.map((src, idx) => (
                <div
                  key={idx}
                  className="relative w-[80px] h-[80px] border rounded overflow-hidden"
                >
                  <Image src={src} alt={`썸네일-${idx}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======= 2) 텍스트 상세 정보 ======= */}
        <div className="mt-6 bg-white p-4 rounded">
            <h1 className="text-3xl"><DetailRow label="업체명" value={row.company_name}></DetailRow></h1>
          <div className="flex items-center gap-1 text-gray-700 mb-3">
            <MegaphoneIcon className="w-5 h-5 text-red-500" />
            <span className="font-semibold">{row.shop_type || "샵형태 미입력"}</span>
          </div>

          <DetailRow label="업체 소개" value={row.greeting} />
          <DetailRow label="오시는 길" value={row.address} />
          <DetailRow label="인근 건물" value={row.near_building} />
          <DetailRow label="전화번호" value={row.phone_number} />
          <DetailRow label="연락방법" value={row.contact_method} />
          <DetailRow label="영업시간" value={row.open_hours} />
          <DetailRow label="주차안내" value={row.parking_type} />
          <DetailRow label="관리사" value={row.manager_desc} />
          {row.program_info?.trim() && (
            <DetailRow label="프로그램" value={row.program_info} />
          )}
        </div>

        {/* ======= 이벤트 블록 ======= */}
        <div className="mt-6 bg-white p-4 rounded">
          {row.event_info?.trim() && (
            <DetailRow label="이벤트" value={row.event_info} />
          )}
        </div>

        {/* ======= 부천-타임( company_title ) 블록 ======= */}
        <div className="mt-6 bg-white p-4 rounded">
            <CommentsUI company_name={row.company_name} id={row.id} />
        </div>
      </div>

      {/* ===== 오른쪽 섹션 (지도) ===== */}
      <div className="flex-[3] rounded overflow-hidden h-[330px]">
        <MapKakao address={row.address} />
      </div>
    </div>
  );
}

// SSR에서 데이터 불러오기
export async function getServerSideProps(context) {
  const { id } = context.params;

  // 1. 단일 row 정보 가져오기
  const { data: row, error: rowError } = await supabase
    .from("shops")
    .select("*")
    .eq("id", id)
    .single();

  if (rowError || !row) {
    return { notFound: true };
  }

  // 2. 관련 이미지 가져오기
  const { data: images, error: imagesError } = await supabase
    .from("shop_images")
    .select("image_url")
    .eq("shop_id", id);

  return {
    props: {
      row,
      images: images || [],
    },
  };
}