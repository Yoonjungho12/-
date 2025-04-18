"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseF";
import StoreInfoEditor from "../../search1/StoreInfoEditor";
import SectionManager from "./SectionManager";
import ShopPhotoUploader from "./ShopPhotoUploader";
import { toast } from "react-hot-toast";
import Link from "next/link";

// 가격 포맷팅 함수
function formatPrice(num) {
  if (!num || isNaN(num)) return "0 원";
  return Number(num).toLocaleString() + " 원";
}

// 숫자만 추출하는 함수
const onlyDigits = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[^0-9]/g, '');
};

export default function MyShopPageClient() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(null);
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
    const fetchData = async () => {
      try {
        // 가게 정보 가져오기
        const { data: storeData, error: storeError } = await supabase
          .from('partnershipsubmit')
          .select('*')
          .eq('id', id)
          .single();

        if (storeError) throw storeError;

        // 섹션 정보 가져오기
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('sections')
          .select(`
            *,
            courses (*)
          `)
          .eq('post_id', id)
          .order('created_at', { ascending: true });

        if (sectionsError) throw sectionsError;

        // 이미지 정보 가져오기
        const { data: imagesData, error: imagesError } = await supabase
          .from('partnershipsubmit_images')
          .select('*')
          .eq('submit_id', id)
          .order('sort_order', { ascending: true });

        if (imagesError) throw imagesError;

        // 썸네일이 있으면 photos 배열의 맨 앞에 추가
        const photosList = [];
        if (storeData.thumbnail_url) {
          const { data: { publicUrl } } = supabase.storage
            .from('here-it-is')
            .getPublicUrl(storeData.thumbnail_url);
          
          photosList.push({
            id: 'thumbnail',
            url: publicUrl,
            description: '썸네일 이미지'
          });
        }

        // 나머지 이미지들 추가
        if (imagesData) {
          const additionalPhotos = await Promise.all(imagesData.map(async (img) => {
            const { data: { publicUrl } } = supabase.storage
              .from('here-it-is')
              .getPublicUrl(img.image_url);
            
            return {
              id: img.id,
              url: publicUrl,
              description: `이미지 ${img.sort_order + 1}`
            };
          }));
          photosList.push(...additionalPhotos);
        }

        setStoreInfo(storeData);
        setSections(sectionsData || []);
        setPhotos(photosList);
        setIsLoading(false);
      } catch (error) {
        console.error('데이터 로드 에러:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // 이미지 업로드 처리 함수
  const handleImageUpload = async (type) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
          toast.error('파일 크기는 5MB를 초과할 수 없습니다.');
          return;
        }

        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
          toast.error('JPG, PNG, GIF 파일만 업로드 가능합니다.');
          return;
        }

        setUploadingImage(type);

        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('here-it-is')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('here-it-is')
            .getPublicUrl(fileName);

          if (type === 'thumb') {
            if (storeInfo.thumbnail_url) {
              await supabase.storage
                .from('here-it-is')
                .remove([storeInfo.thumbnail_url]);
            }

            const { error: updateError } = await supabase
              .from('partnershipsubmit')
              .update({ thumbnail_url: fileName })
              .eq('id', id);

            if (updateError) throw updateError;

            setStoreInfo(prev => ({ ...prev, thumbnail_url: fileName }));
            setPhotos(prev => {
              const withoutThumbnail = prev.filter(photo => photo.id !== 'thumbnail');
              return [
                { id: 'thumbnail', url: publicUrl, description: '썸네일 이미지' },
                ...withoutThumbnail
              ];
            });
          } else {
            const { data, error: insertError } = await supabase
              .from('partnershipsubmit_images')
              .insert({
                submit_id: id,
                image_url: fileName,
                sort_order: photos.length - 1
              })
              .select()
              .single();

            if (insertError) throw insertError;

            setPhotos(prev => [...prev, { 
              id: data.id,
              url: publicUrl,
              description: `이미지 ${prev.length}`
            }]);
          }

          toast.success('이미지가 업로드되었습니다.');
          
          // 1초 후에 스피너 제거
          await new Promise(resolve => setTimeout(resolve, 1000));
          setUploadingImage(null);

        } catch (error) {
          console.error('이미지 업로드 에러:', error);
          toast.error('이미지 업로드 중 오류가 발생했습니다.');
          setUploadingImage(null); // 에러 시에는 바로 스피너 제거
        }
      };

      input.click();
    } catch (error) {
      console.error('이미지 업로드 처리 에러:', error);
      toast.error('이미지 업로드 처리 중 오류가 발생했습니다.');
      setUploadingImage(null);
    }
  };

  // 이미지 삭제 처리 함수
  const handleDeleteImage = async (imageUrl) => {
    if (!confirm('이미지를 삭제하시겠습니까?')) return;

    const loading = toast.loading('이미지 삭제 중...');

    try {
      const isThumbnail = photos[0]?.url === imageUrl && photos[0]?.id === 'thumbnail';

      if (isThumbnail) {
        if (storeInfo.thumbnail_url) {
          await supabase.storage
            .from('here-it-is')
            .remove([storeInfo.thumbnail_url]);
        }

        await supabase
          .from('partnershipsubmit')
          .update({ thumbnail_url: null })
          .eq('id', id);

        setStoreInfo(prev => ({ ...prev, thumbnail_url: null }));
        setPhotos(prev => prev.filter(photo => photo.id !== 'thumbnail'));
      } else {
        // 일반 이미지 삭제
        const targetImage = photos.find(photo => photo.url === imageUrl);
        if (!targetImage) throw new Error('이미지를 찾을 수 없습니다.');

        const { error: deleteError } = await supabase
          .from('partnershipsubmit_images')
          .delete()
          .eq('id', targetImage.id);

        if (deleteError) throw deleteError;

        // Storage에서 파일 삭제
        const fileName = imageUrl.split('/').pop();
        await supabase.storage
          .from('here-it-is')
          .remove([`${id}/${fileName}`]);

        setPhotos(prev => prev.filter(photo => photo.id !== targetImage.id));
      }

      toast.dismiss(loading);
      toast.success('이미지가 삭제되었습니다.');
    } catch (error) {
      console.error('이미지 삭제 에러:', error);
      toast.dismiss(loading);
      toast.error('이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 관리자 네비게이션 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">내 가게 관리</h1>
              <nav className="ml-8 flex items-center space-x-4">
                <Link
                  href="#"
                  className="px-3 py-2 text-sm font-medium text-gray-900 rounded-md bg-gray-100"
                >
                  기본 정보
                </Link>
              
              </nav>
            </div>
            <Link 
              href={`/board/details/${id}`}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              <span>내 가게 바로가기</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      <div className="py-8">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">사진 관리</h2>
                
                </div>
              </div>
              <div className="space-y-6">
                {/* 썸네일 섹션 */}
                <div className="bg-white rounded-2xl border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">
                        대표 이미지
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 썸네일 이미지 또는 추가 버튼 */}
                      <div className="group relative">
                        {photos.length > 0 && photos[0].url ? (
                          <div className="relative rounded-xl overflow-hidden bg-gray-100 transition-all duration-200 group-hover:shadow-lg">
                            <img 
                              src={photos[0].url} 
                              alt="썸네일" 
                              className="w-full aspect-video object-cover"
                            />
                            {uploadingImage === 'thumb' ? (
                              <div className="absolute inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center">
                                <div className="flex flex-col items-center">
                                  <div className="animate-spin rounded-full h-12 w-12 border-3 border-white border-t-transparent"></div>
                                  <span className="text-white font-medium mt-3">업로드 중...</span>
                                </div>
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={() => handleDeleteImage(photos[0].url)}
                                  className="absolute bottom-4 right-4 bg-white/90 text-gray-700 p-2 rounded-lg hover:bg-white transition-all duration-200"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div 
                            onClick={() => !uploadingImage && handleImageUpload('thumb')}
                            className={`aspect-video rounded-xl transition-all duration-200 hover:shadow-lg ${
                              uploadingImage === 'thumb'
                                ? 'bg-gray-50'
                                : 'bg-gray-50 hover:bg-gray-100'
                            } flex flex-col items-center justify-center cursor-pointer border border-gray-200`}
                          >
                            {uploadingImage === 'thumb' ? (
                              <>
                                <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-400 border-t-transparent mb-3"></div>
                                <span className="text-gray-600 font-medium">업로드 중...</span>
                              </>
                            ) : (
                              <>
                                <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
                                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </div>
                                <span className="text-gray-700 font-medium">썸네일 이미지 추가</span>
                          
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 썸네일 교체 버튼 */}
                      {photos.length > 0 && photos[0].url && !uploadingImage && (
                        <div 
                          onClick={() => handleImageUpload('thumb')}
                          className="group relative"
                        >
                          <div className="aspect-video rounded-xl transition-all duration-200 hover:shadow-lg bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center cursor-pointer border border-gray-200">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
                              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                            </div>
                            <span className="text-gray-700 font-medium">썸네일 이미지 교체</span>
                          
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 일반 이미지 섹션 */}
                <div className="bg-white rounded-2xl border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">
                        상세 이미지
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {photos.slice(1).map((image, index) => (
                        <div key={index} className="group relative">
                          <div className="relative rounded-xl overflow-hidden bg-gray-100 transition-all duration-200 group-hover:shadow-lg">
                            <img 
                              src={image.url} 
                              alt={`상세 이미지 ${index + 1}`} 
                              className="w-full aspect-video object-cover"
                            />
                            {uploadingImage === 'detail' ? (
                              <div className="absolute inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center">
                                <div className="flex flex-col items-center">
                                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-white border-t-transparent"></div>
                                  <span className="text-white font-medium mt-3">업로드 중...</span>
                                </div>
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={() => handleDeleteImage(image.url)}
                                  className="absolute bottom-4 right-4 bg-white/90 text-gray-700 p-2 rounded-lg hover:bg-white transition-all duration-200"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* 이미지 추가 버튼 */}
                      <div 
                        onClick={() => !uploadingImage && handleImageUpload('detail')}
                        className="group relative"
                      >
                        <div className={`aspect-video rounded-xl transition-all duration-200 hover:shadow-lg ${
                          uploadingImage === 'detail'
                            ? 'bg-gray-50'
                            : 'bg-gray-50 hover:bg-gray-100'
                          } flex flex-col items-center justify-center cursor-pointer border border-gray-200`}
                        >
                          {uploadingImage === 'detail' ? (
                            <>
                              <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-400 border-t-transparent mb-3"></div>
                              <span className="text-gray-600 font-medium">업로드 중...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-6 h-6 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </div>
                              <span className="text-gray-700 font-medium">상세 이미지 추가</span>
                             
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}