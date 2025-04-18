"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseF";

/**
 * 매장 사진 업로드 전용 컴포넌트
 * 상위에서 넘겨받은 photos, setPhotos 등을 사용.
 */
export default function ShopPhotoUploader({ shopId, photos, setPhotos }) {
  // ─────────────────────────────────────────────
  // (A) 파일 업로드 관련 상태들
  // ─────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ─────────────────────────────────────────────
  // (B) 파일 업로드 핸들러
  // ─────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      // 파일 크기 및 타입 체크
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          alert('파일 크기는 5MB를 초과할 수 없습니다.');
          return;
        }
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
          alert('JPG, PNG, GIF 파일만 업로드 가능합니다.');
          return;
        }
      }

      // 썸네일 이미지가 없고, 단일 파일 선택인 경우 썸네일로 처리
      if (!photos.find(photo => photo.id === 'thumbnail') && files.length === 1) {
        const file = files[0];
        const filename = `thumb_${shopId}_${Date.now()}.${file.name.split('.').pop()}`;
        
        // Supabase Storage에 업로드
        const { data, error } = await supabase.storage
          .from('partnershipsubmit')
          .upload(filename, file);

        if (error) throw error;

        // 썸네일 URL 업데이트
        const thumbnailUrl = `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/partnershipsubmit/${filename}`;
        
        // DB 업데이트
        const { error: updateError } = await supabase
          .from('partnershipsubmit')
          .update({ thumbnail_url: filename })
          .eq('id', shopId);

        if (updateError) throw updateError;

        setPhotos([
          {
            id: 'thumbnail',
            url: thumbnailUrl,
            description: '썸네일 이미지'
          },
          ...photos.filter(photo => photo.id !== 'thumbnail')
        ]);
      } else {
        // 일반 이미지 업로드
        const uploadedPhotos = await Promise.all(
          files.map(async (file) => {
            const filename = `multi_${shopId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
            
            // Supabase Storage에 업로드
            const { data, error } = await supabase.storage
              .from('partnershipsubmit')
              .upload(filename, file);

            if (error) throw error;

            // DB에 이미지 정보 저장
            const { data: imageData, error: insertError } = await supabase
              .from('partnershipsubmit_images')
              .insert({
                submit_id: shopId,
                image_url: filename,
                sort_order: photos.length
              })
              .select()
              .single();

            if (insertError) throw insertError;

            return {
              id: imageData.id,
              url: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/partnershipsubmit/${filename}`,
              description: `이미지 ${photos.length + 1}`
            };
          })
        );

        setPhotos([...photos, ...uploadedPhotos]);
      }
    } catch (error) {
      console.error('파일 업로드 에러:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ─────────────────────────────────────────────
  // (C) 드래그 앤 드롭 핸들러
  // ─────────────────────────────────────────────
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }
  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: Array.from(e.dataTransfer.files) } });
    }
  }

  // ─────────────────────────────────────────────
  // (D) 사진 순서 이동
  // ─────────────────────────────────────────────
  function movePhotoUp(index) {
    if (index <= 0) return;
    setPhotos((prev) => {
      const arr = [...prev];
      [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
      return arr;
    });
  }
  function movePhotoDown(index) {
    if (index >= photos.length - 1) return;
    setPhotos((prev) => {
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  }

  // ─────────────────────────────────────────────
  // (E) 사진 삭제
  // ─────────────────────────────────────────────
  const handleDeletePhoto = async (photoId) => {
    try {
      const photoToDelete = photos.find(p => p.id === photoId);
      if (!photoToDelete) return;

      // 파일명 추출
      const filename = photoToDelete.url.split('/').pop();

      // Supabase Storage에서 파일 삭제
      const { error: storageError } = await supabase.storage
        .from('partnershipsubmit')
        .remove([filename]);

      if (storageError) throw storageError;

      if (photoId === 'thumbnail') {
        // 썸네일 삭제
        const { error: updateError } = await supabase
          .from('partnershipsubmit')
          .update({ thumbnail_url: null })
          .eq('id', shopId);

        if (updateError) throw updateError;
      } else {
        // 일반 이미지 삭제
        const { error: deleteError } = await supabase
          .from('partnershipsubmit_images')
          .delete()
          .eq('id', photoId);

        if (deleteError) throw deleteError;
      }

      setPhotos(photos.filter(photo => photo.id !== photoId));
    } catch (error) {
      console.error('사진 삭제 에러:', error);
      alert('사진 삭제 중 오류가 발생했습니다.');
    }
  };

  // ─────────────────────────────────────────────
  // (F) 화면 렌더링
  // ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* 썸네일 이미지 섹션 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">썸네일 이미지</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {photos.find(photo => photo.id === 'thumbnail') ? (
            <div className="relative">
              <div className="aspect-video relative">
                <Image
                  src={photos.find(photo => photo.id === 'thumbnail').url}
                  alt="썸네일 이미지"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <button
                onClick={() => handleDeletePhoto('thumbnail')}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-gray-400 mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-sm text-gray-500">썸네일 이미지를 추가해주세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 일반 이미지 섹션 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">일반 이미지</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {photos.filter(photo => photo.id !== 'thumbnail').map((photo, index) => (
            <div key={photo.id} className="relative">
              <div className="aspect-video relative">
                <Image
                  src={photo.url}
                  alt={`매장 사진 ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <button
                onClick={() => handleDeletePhoto(photo.id)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
          {/* 이미지 추가 버튼 */}
          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-gray-400 mb-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <p className="text-sm text-gray-500">이미지 추가하기</p>
          </div>
        </div>
      </div>

      {/* 파일 업로드 input */}
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif"
        multiple
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
      />
    </div>
  );
} 