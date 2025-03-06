import { supabase } from "@/lib/supabaseE";
import { notFound } from "next/navigation";
import Image from "next/image"; // next/image 사용 예시 (일반 img도 가능)
import MapKakao from "./MapKakao";
import { MegaphoneIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

// Supabase 스토리지 public URL 빌더 (bucket: gunma)
function buildPublicImageUrl(path) {
  // 예: https://YOUR-PROJECT.supabase.co/storage/v1/object/public/gunma/<파일명>
  return `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${path}`;
}

/** 
 * 메인 상세 페이지 (SSR)
 * URL 예: /board/details/13-강남1인샵
 */
export default async function DetailPage({ params }) {
  // 1) URL 파라미터 parsing
  const slug = params.id;       // "13-강남1인샵"
  const splitted = slug.split("-");
  const numericId = splitted[0]; // "13"

  // 2) DB에서 partnershipsubmit 행 조회
  const { data: row, error } = await supabase
    .from("partnershipsubmit")
    .select("*")
    .eq("id", numericId)
    .single();

  if (error || !row) {
    notFound();
  }

  // 썸네일 URL
  const thumbnailSrc = row.thumbnail_url
    ? buildPublicImageUrl(row.thumbnail_url)
    : null;

  // 추가이미지는 partnershipsubmit_images 테이블에 있으므로,
  // 여기서 추가적으로 불러오고 싶다면 server component에서 fetch 가능
  const { data: images } = await supabase
    .from("partnershipsubmit_images")
    .select("image_url")
    .eq("submit_id", numericId);

  // 만약 추가이미지가 있다면 buildPublicImageUrl로 변환해서 아래에서 표시

  return (
    <div className="mx-auto px-4 py-6 max-w-6xl min-h-screen">
      {/* 제목 */}
      <h1 className="text-2xl font-bold mb-4">파트너십 상세 페이지</h1>

      {/* 상단 레이아웃: 왼쪽(이미지+상세), 오른쪽(카카오지도) */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* --- 왼쪽 섹션 --- */}
        <div className="md:w-2/3 flex flex-col gap-4">

          {/* 썸네일 이미지 */}
          <div className="relative w-full h-60 md:h-72 border bg-gray-100 rounded overflow-hidden">
            {thumbnailSrc ? (
              <Image
                src={thumbnailSrc}
                alt="썸네일"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                이미지가 등록되지 않았습니다.
              </div>
            )}
          </div>

          {/* 추가 이미지가 있다면 썸네일 아래에 썸네일 형식으로 나열 */}
          {images && images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((imgObj, idx) => {
                const src = buildPublicImageUrl(imgObj.image_url);
                return (
                  <div key={idx} className="relative w-24 h-24 border rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={src}
                      alt={`추가이미지-${idx}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* 상세 정보 */}
          <div className="bg-white">
            {/* shop_type (1인샵 여부) → 확성기 아이콘 + 텍스트 */}
            <div className="flex items-center gap-1 text-gray-700 mb-3">
              <MegaphoneIcon className="w-5 h-5 text-red-500" />
              <span className="font-semibold">
                {row.shop_type || "샵형태 미입력"}
              </span>
            </div>

            {/* 업체 소개 */}
            <DetailRow label="업체 소개" value={row.greeting} />
            {/* 오시는 길 */}
            <DetailRow label="오시는 길" value={row.address} />
            {/* 인근 건물 */}
            <DetailRow label="인근 건물" value={row.near_building} />
            {/* 전화번호 */}
            <DetailRow label="전화번호" value={row.phone_number} />
            {/* 연락방법 */}
            <DetailRow label="연락방법" value={row.contact_method} />
            {/* 영업시간 */}
            <DetailRow label="영업시간" value={row.open_hours} />
            {/* 주차안내 */}
            <DetailRow label="주차안내" value={row.parking_type} />
            {/* 관리사 */}
            <DetailRow label="관리사" value={row.manager_desc} />

            {/* 이벤트 (있다면) */}
            {row.event_info?.trim() && (
              <DetailRow label="이벤트" value={row.event_info} />
            )}
            {/* 프로그램(코스) */}
            {row.program_info?.trim() && (
              <DetailRow label="프로그램" value={row.program_info} />
            )}
          </div>
        </div>

        {/* --- 오른쪽 섹션: 카카오 지도 --- */}
        <div className="md:w-1/3 border rounded h-72 md:h-auto overflow-hidden">
          <MapKakao address={row.address} />
        </div>
      </div>
    </div>
  );
}

/** 
 * 간단한 label-value 표시 
 */
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