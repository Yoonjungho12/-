"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseF";
import StoreInfoEditor from "./StoreInfoEditor";
import SectionManager from "./SectionManager";
import ShopPhotoUploader from "./ShopPhotoUploader";

// 가격 포맷팅 함수
function formatPrice(num) {
  if (!num || isNaN(num)) return "0 원";
  return Number(num).toLocaleString() + " 원";
}

// 숫자만 추출하는 함수
function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

export default function MyShopPageClient() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeInfo, setStoreInfo] = useState({
    id: "",
    name: "",
    ad_type: "",
    region_id: null,
    sub_region_id: null,
    company_name: "",
    phone_number: "",
    manager_contact: "",
    parking_type: "",
    contact_method: "",
    greeting: "",
    event_info: "",
    holiday: null,
    open_hours: "",
    address: "",
    address_street: "",
    near_building: "",
    program_info: "",
    post_title: "",
    lat: null,
    lng: null,
    thumbnail_url: null
  });
  
  const [sections, setSections] = useState([]);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // 기본 정보 가져오기
        const { data: submitData, error: submitError } = await supabase
          .from('partnershipsubmit')
          .select('*')
          .eq('id', id)
          .single();

        if (submitError) throw submitError;

        // 섹션 및 코스 정보 가져오기
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('sections')
          .select(`
            *,
            courses (*)
          `)
          .eq('post_id', id)
          .order('display_order', { ascending: true });

        if (sectionsError) throw sectionsError;

        // 이미지 정보 가져오기
        const { data: imagesData, error: imagesError } = await supabase
          .from('partnershipsubmit_images')
          .select('*')
          .eq('submit_id', id)
          .order('created_at', { ascending: true });

        if (imagesError) throw imagesError;

        // 데이터 설정
        setStoreInfo(submitData);
        setSections(sectionsData || []);
        
        // 이미지 데이터 포맷팅
        const formattedPhotos = [
          // 썸네일 이미지
          {
            id: 'thumbnail',
            url: submitData.thumbnail_url 
              ? `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/${submitData.thumbnail_url}`
              : null,
            description: '썸네일 이미지'
          },
          // 일반 이미지들
          ...(imagesData || []).map((img, index) => ({
            id: img.id,
            url: img.image_url 
              ? `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/${img.image_url}`
              : null,
            description: `이미지 ${index + 1}`
          }))
        ].filter(photo => photo.url);

        setPhotos(formattedPhotos);
        setIsLoading(false);
      } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
        setError(error.message);
        setIsLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
          {/* 가게 정보 */}
          <div className="bg-white rounded-xl shadow-sm p-6 h-[calc(100vh-8rem)] overflow-auto">
            <div className="sticky top-0 bg-white pb-4 z-10">
              <h2 className="text-lg font-semibold text-gray-900">가게 정보</h2>
            </div>
            <StoreInfoEditor 
              storeInfo={storeInfo} 
              setStoreInfo={setStoreInfo}
              sections={sections}
              setSections={setSections}
              formatPrice={formatPrice}
              onlyDigits={onlyDigits}
              post_id={id}
            />
          </div>

          {/* 사진 관리 */}
          <div className="bg-white rounded-xl shadow-sm p-6 h-[calc(100vh-8rem)] overflow-auto">
            <div className="sticky top-0 bg-white pb-4 z-10">
              <h2 className="text-lg font-semibold text-gray-900">사진 관리</h2>
            </div>
            <ShopPhotoUploader 
              shopId={id} 
              photos={photos}
              setPhotos={setPhotos}
            />
          </div>
        </div>
      </div>
    </div>
  );
}