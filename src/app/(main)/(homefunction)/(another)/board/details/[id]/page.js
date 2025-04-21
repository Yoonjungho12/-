"use server";
import { headers, cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import DetailClient from "./DetailClient";
import DetailClientMobile from "./DetailClientMobile";

/**
 * (1) 메타데이터 설정 함수 (generateMetadata)
 */
export async function generateMetadata({ params:param }) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  const params = await param;
  const splitted = params.id?.split("-");
  const numericId = splitted?.[0];
  if (!numericId) return {};

  const { data: row } = await supabase
    .from("partnershipsubmit")
    .select("*")
    .eq("id", numericId)
    .single();

  if (!row) return {};

  const companyName = row.company_name || "상세 페이지";
  const pageTitle = `${companyName.trim()} - 여기닷`;
  const description = `${companyName.trim()} 가장 인기있는 웨이터를 찾고 계신가요!? 여기닷을 방문하시면~~~`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
    },
  };
}

/**
 * (2) 실제 상세 페이지 컴포넌트
 */
export default async function DetailPage({ params:param }) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  const requestHeaders = await headers();
  const params = await param;
  const splitted = params.id?.split("-");
  const numericId = splitted?.[0];
  if (!numericId) notFound();

  const { data: row } = await supabase
    .from("partnershipsubmit")
    .select("*")
    .eq("id", numericId)
    .single();
  if (!row) notFound();

  const { data: images } = await supabase
    .from("partnershipsubmit_images")
    .select("image_url")
    .eq("submit_id", numericId);

  const { data: sections } = await supabase
    .from("sections")
    .select(`
      id,
      title,
      courses (
        id,
        course_name,
        duration,
        price,
        etc_info
      )
    `)
    .eq("partnershipsubmit_id", numericId)
    .order("id", { ascending: true });

  const sectionsData = sections?.map(section => ({
    id: section.id,
    title: section.title,
    isOpen: true,
    courses: section.courses.map(course => ({
      id: course.id,
      course_name: course.course_name,
      duration: course.duration,
      price: course.price,
      etc_info: course.etc_info
    }))
  })) || [];

  const lowestPrice = sectionsData.reduce((min, section) => {
    const sectionMin = section.courses.reduce((sectionMin, course) => {
      return course.price < sectionMin ? course.price : sectionMin;
    }, Infinity);
    return sectionMin < min ? sectionMin : min;
  }, Infinity);

  const { data: nearbyShopsRaw } = await supabase
    .from("partnershipsubmit")
    .select("id, lat, lng, company_name, address, near_building, thumbnail_url")
    .eq("final_admitted", true);

  const nearbyShops = nearbyShopsRaw
    ?.filter(shop => shop.lat !== null && shop.lng !== null)
    .map(shop => ({
      id: shop.id,
      lat: shop.lat,
      lng: shop.lng,
      company_name: shop.company_name,
      address: shop.address,
      near_building: shop.near_building,
      thumbnail_url: shop.thumbnail_url
    })) || [];

  const userAgent = requestHeaders.get("user-agent") || "";
  const isMobile = /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry/i.test(userAgent);

  const { data: themeRows } = await supabase
    .from("partnershipsubmit_themes")
    .select(`theme_id, themes!inner (adult_admitted)`)
    .eq("submit_id", numericId);

  const isAdultContent = themeRows?.some(t => t.themes?.adult_admitted) || false;

  let isAdultUser = false;
  let showBlurDefault = false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[🔐 user 정보]", user);

    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_adult")
        .eq("user_id", user.id)
        .single();
      isAdultUser = profile?.is_adult || false;
    } else {
      console.warn("[⚠️ 로그인되지 않은 사용자]");
    }
  } catch (error) {
    console.error("[❌ Supabase getUser 에러]", error);
  }

  showBlurDefault = isAdultContent && !isAdultUser;
  console.log("[🧩 블러 적용 여부] isAdultContent:", isAdultContent, "| isAdultUser:", isAdultUser, "| showBlurDefault:", showBlurDefault);

  const Component = isMobile ? DetailClientMobile : DetailClient;

  return (
    <Component
      row={row}
      images={images || []}
      numericId={numericId}
      showBlurDefault={showBlurDefault}
      sectionsData={sectionsData}
      lowestPrice={lowestPrice}
      nearbyShops={nearbyShops}
    />
  );
}