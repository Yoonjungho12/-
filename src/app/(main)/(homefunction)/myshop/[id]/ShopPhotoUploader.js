"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";

/**
 * 매장 사진 업로드 전용 컴포넌트
 * 상위에서 넘겨받은 photos, setPhotos 등을 사용.
 */
export default function ShopPhotoUploader({ photos, setPhotos }) {
  // ─────────────────────────────────────────────
  // (A) 파일 업로드 관련 상태들
  // ─────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // ─────────────────────────────────────────────
  // (B) 파일 업로드 핸들러
  // ─────────────────────────────────────────────
  function handleFiles(files) {
    // 파일 유효성 검사
    const validFiles = Array.from(files).filter((file) => {
      // 이미지 파일인지 확인
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드 가능합니다.");
        return false;
      }
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB 이하여야 합니다.");
        return false;
      }
      return true;
    });

    // 유효한 파일이 없으면 종료
    if (validFiles.length === 0) return;

    // 파일을 URL로 변환하여 상태에 추가
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [
          ...prev,
          {
            id: Date.now(),
            url: reader.result,
            file,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

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
      handleFiles(e.dataTransfer.files);
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
  function handleDeletePhoto(photoId) {
    if (!window.confirm("정말 이 사진을 삭제하시겠습니까?")) return;
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
  }

  // ─────────────────────────────────────────────
  // (F) 화면 렌더링
  // ─────────────────────────────────────────────
  return (
    <div>
      {/* 드래그 앤 드롭 영역 */}
      <div
        className={`relative p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="space-y-2 py-4">
          <div className="text-4xl">📸</div>
          <p className="text-gray-600">
            클릭하거나 이미지를 이곳에 끌어다 놓으세요
          </p>
          <p className="text-sm text-gray-500">
            (최대 5MB, JPG/PNG/GIF 파일만 가능)
          </p>
        </div>
      </div>

      {/* 사진 목록 */}
      {photos.length === 0 ? (
        <p className="text-gray-600 text-center mt-4">
          아직 업로드된 사진이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative border rounded-lg overflow-hidden group"
            >
              {/* 사진 */}
              <div className="aspect-video relative">
                <Image
                  src={photo.url}
                  alt={`매장 사진 ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>

              {/* 오버레이 (호버 시 표시) */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* 순서 이동 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    movePhotoUp(index);
                  }}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                >
                  ↑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    movePhotoDown(index);
                  }}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                >
                  ↓
                </button>

                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(photo.id);
                  }}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  ×
                </button>
              </div>

              {/* 순서 표시 */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white rounded text-sm">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 