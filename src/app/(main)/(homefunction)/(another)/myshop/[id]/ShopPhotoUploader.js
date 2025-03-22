"use client";

import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseF";

// 환경 변수: supabase storage 접근용 URL (예: "https://xxxxxx.supabase.co/storage/v1/object/public/here-it-is")
const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL || "";

// 가게 사진 업로드용 디렉토리
const directory = "partnershipsubmit";

/**
 * 가게 사진 등록 컴포넌트
 * @param {string} editId - 신청서(업체) 식별 ID (ex: partnershipsubmit.id)
 * @param {boolean} editIsAdmitted - 승인 여부 (혹은 다른 용도)
 * @param {object} imageUploadSectionRef - 스크롤 이동용 ref (optional)
 */
export default function ShopPhotoUploader({
  editId,
  editIsAdmitted,
  imageUploadSectionRef,
}) {
  // 1) 이미 등록된 썸네일/이미지 리스트
  const [existingThumbnail, setExistingThumbnail] = useState(null); // DB에 있는 thumbnail_url
  const [existingImages, setExistingImages] = useState([]);         // DB에 있는 partnershipsubmit_images

  // 2) 새롭게 업로드할 썸네일
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const thumbnailFileInputRef = useRef(null);

  // 3) 새롭게 업로드할 다중 이미지
  const [multiFiles, setMultiFiles] = useState([]);
  const [multiPreviews, setMultiPreviews] = useState([]);
  const multiFileInputRef = useRef(null);

  // ─────────────────────────────────────────────
  // (A) 이미 등록된 썸네일과 상세이미지 가져오기
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!editId) return; // editId가 없으면 조회 불가

    (async () => {
      try {
        // 1) partnershipsubmit에서 썸네일 URL 가져오기
        const { data: row, error: rowErr } = await supabase
          .from("partnershipsubmit")
          .select("thumbnail_url")
          .eq("id", editId)
          .single();

        if (rowErr) throw new Error("썸네일 조회 에러: " + rowErr.message);
        if (row?.thumbnail_url) {
          setExistingThumbnail(row.thumbnail_url);
        } else {
          setExistingThumbnail(null);
        }

        // 2) partnershipsubmit_images 테이블에서 이미지 목록 가져오기
        const { data: imgs, error: imgsErr } = await supabase
          .from("partnershipsubmit_images")
          .select("id, image_url")
          .eq("submit_id", editId);

        if (imgsErr) throw new Error("상세 이미지 조회 에러: " + imgsErr.message);
        // imgs = [ {id: 123, image_url: 'partnershipsubmit/multi_1_2.png'}, ...]
        setExistingImages(imgs || []);
      } catch (err) {
        console.error("기존 이미지 로딩 오류:", err);
        alert("기존 이미지 로딩 오류: " + err.message);
      }
    })();
  }, [editId]);

  // ─────────────────────────────────────────────
  // (B) 존재하는 썸네일 삭제
  // ─────────────────────────────────────────────
  async function handleDeleteThumbnail() {
    if (!window.confirm("정말 썸네일을 삭제하시겠습니까?")) return;
    if (!existingThumbnail) {
      alert("이미 썸네일이 없습니다.");
      return;
    }
    try {
      // 1) Supabase Storage에서 실제 파일 삭제
      // existingThumbnail = "partnershipsubmit/thumb_XXXX_YYYY.png" 같은 경로
      const { error: removeErr } = await supabase.storage
        .from("here-it-is")
        .remove([existingThumbnail]);
      if (removeErr) {
        throw new Error("스토리지 파일 삭제 에러: " + removeErr.message);
      }

      // 2) DB에서 thumbnail_url을 null로 변경
      const { error: dbErr } = await supabase
        .from("partnershipsubmit")
        .update({ thumbnail_url: null })
        .eq("id", editId);
      if (dbErr) {
        throw new Error("DB 업데이트 에러: " + dbErr.message);
      }

      // 3) 로컬 state에서 삭제
      setExistingThumbnail(null);
      alert("썸네일이 삭제되었습니다!");
    } catch (err) {
      console.error("썸네일 삭제 중 오류:", err);
      alert("썸네일 삭제 중 오류: " + err.message);
    }
  }

  // ─────────────────────────────────────────────
  // (C) 존재하는 상세 이미지 삭제
  // ─────────────────────────────────────────────
  async function handleDeleteMultiImage(imageId, imageUrl) {
    if (!window.confirm("이 이미지를 삭제하시겠습니까?")) return;
    try {
      // 1) 스토리지에서 삭제
      // imageUrl = "partnershipsubmit/multi_XXXX_YYYY_?.png"
      const { error: removeErr } = await supabase.storage
        .from("here-it-is")
        .remove([imageUrl]);
      if (removeErr) {
        throw new Error("스토리지 파일 삭제 에러: " + removeErr.message);
      }

      // 2) DB에서 삭제
      const { error: dbErr } = await supabase
        .from("partnershipsubmit_images")
        .delete()
        .eq("id", imageId);
      if (dbErr) {
        throw new Error("DB 삭제 에러: " + dbErr.message);
      }

      // 3) 로컬 state에서 제거
      setExistingImages((prev) => prev.filter((item) => item.id !== imageId));
      alert("해당 이미지를 삭제했습니다!");
    } catch (err) {
      console.error("상세 이미지 삭제 중 오류:", err);
      alert("상세 이미지 삭제 중 오류: " + err.message);
    }
  }

  // ─────────────────────────────────────────────
  // (D) 새 썸네일 선택
  // ─────────────────────────────────────────────
  function handleThumbnailChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }

  // ─────────────────────────────────────────────
  // (E) 새 다중 이미지 선택
  // ─────────────────────────────────────────────
  function handleMultiFilesChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 이미 가진 파일이 5장, 새로 5장 더 고르면 -> 총 10장까지 허용
    const allowedCount = 10 - existingImages.length - multiFiles.length;
    if (allowedCount <= 0) {
      alert("더 이상 이미지를 업로드할 수 없습니다. (최대 10장)");
      return;
    }
    const addFiles = files.slice(0, allowedCount);

    const newFileList = [...multiFiles, ...addFiles];
    setMultiFiles(newFileList);

    const newPreviews = newFileList.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    setMultiPreviews(newPreviews);
  }

  // ─────────────────────────────────────────────
  // (F) 실제 업로드 버튼 클릭
  // ─────────────────────────────────────────────
  async function handleImageUploadClick() {
    if (!editId) {
      alert("어느 신청서인지 알 수 없습니다. 먼저 등록/수정 후 다시 시도해주세요!");
      return;
    }

    try {
      // 1) 썸네일 업로드
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split(".").pop();
        const fileName = `${directory}/thumb_${editId}_${Date.now()}.${fileExt}`;
        const { data: thumbData, error: thumbErr } = await supabase.storage
          .from("here-it-is")
          .upload(fileName, thumbnailFile);

        if (thumbErr) {
          alert("썸네일 업로드 실패: " + thumbErr.message);
          return;
        }
        thumbnailUrl = thumbData.path;

        // DB 업데이트
        const { error: updateErr } = await supabase
          .from("partnershipsubmit")
          .update({ thumbnail_url: thumbnailUrl })
          .eq("id", editId);
        if (updateErr) {
          alert("썸네일 DB 업데이트 실패: " + updateErr.message);
          return;
        }
      }

      // 2) 추가 이미지 업로드
      for (let i = 0; i < multiFiles.length; i++) {
        const file = multiFiles[i];
        const ext = file.name.split(".").pop();
        const fname = `${directory}/multi_${editId}_${Date.now()}_${i}.${ext}`;
        const { data: fileData, error: fileErr } = await supabase.storage
          .from("here-it-is")
          .upload(fname, file);

        if (fileErr) {
          alert(`이미지(${file.name}) 업로드 실패: ${fileErr.message}`);
          return;
        }

        const imageUrl = fileData.path;
        const { error: insertErr } = await supabase
          .from("partnershipsubmit_images")
          .insert({ submit_id: editId, image_url: imageUrl });

        if (insertErr) {
          alert(`DB에 이미지 경로 저장 실패: ${insertErr.message}`);
          return;
        }
      }

      alert("이미지 업로드 완료!");

      // 업로드가 끝났으니, 입력창과 프리뷰 초기화
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setMultiFiles([]);
      setMultiPreviews([]);

      // 새로고침 없이도 재조회해서 반영할 수 있게, DB에서 다시 불러옵니다.
      // (optional) window.location.reload();
      // (A) 항목 재조회 로직 그대로 실행해버리기
      await reloadExistingImages();
    } catch (err) {
      alert("이미지 업로드 중 오류: " + err.message);
    }
  }

  // ─────────────────────────────────────────────
  // (G) DB에서 기존 이미지/썸네일 재조회하는 헬퍼
  // ─────────────────────────────────────────────
  async function reloadExistingImages() {
    try {
      const { data: row } = await supabase
        .from("partnershipsubmit")
        .select("thumbnail_url")
        .eq("id", editId)
        .single();
      setExistingThumbnail(row?.thumbnail_url || null);

      const { data: imgs } = await supabase
        .from("partnershipsubmit_images")
        .select("id, image_url")
        .eq("submit_id", editId);
      setExistingImages(imgs || []);
    } catch (err) {
      console.error("기존 이미지 재로딩 오류:", err);
    }
  }

  // ─────────────────────────────────────────────
  // (H) 화면 렌더링
  // ─────────────────────────────────────────────
  return (
    <div
      ref={imageUploadSectionRef}
      className="mt-8 p-4 bg-blue-50 border border-blue-300 rounded"
    >
      <h2 className="text-xl font-bold mb-4 text-blue-700">이미지 업로드 섹션</h2>
      <p className="text-sm text-gray-700 mb-4">
        이미지로 더욱 매력적인 업체정보를 꾸며보세요!
      </p>

      {/* ===================== 이미 등록된 썸네일이 있다면 보여주기 ===================== */}
      {existingThumbnail ? (
        <div className="mb-6">
          <label className="block font-semibold mb-2">기존 썸네일 이미지</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 border border-gray-300 rounded overflow-hidden">
              <img
                src={`${STORAGE_URL}/${existingThumbnail}`}
                alt="기존 썸네일"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={handleDeleteThumbnail}
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              삭제
            </button>
          </div>
        </div>
      ) : (
        // ===================== 썸네일이 없는 경우 → 새 썸네일 업로드 UI =====================
        <div className="mb-6">
          <label className="block font-semibold mb-2">썸네일 이미지</label>
          <div className="flex gap-2 flex-wrap">
            <div
              className="w-24 h-28 border border-gray-300 rounded-md flex items-center justify-center text-gray-500 relative cursor-pointer"
              onClick={() => {
                if (thumbnailFileInputRef.current) {
                  thumbnailFileInputRef.current.click();
                }
              }}
            >
              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  alt="썸네일 미리보기"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l3-3h12l3 3M4 8h16v11H4V8z"
                    />
                  </svg>
                  <div className="mt-1 text-sm font-semibold">Thumb</div>
                </>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              ref={thumbnailFileInputRef}
              className="hidden"
              onChange={handleThumbnailChange}
            />
          </div>
        </div>
      )}

      {/* ===================== 이미 등록된 상세 이미지들 ===================== */}
      <div className="mb-6">
        <label className="block font-semibold mb-2">기존 상세 이미지 목록</label>
        {existingImages.length === 0 ? (
          <p className="text-gray-500 text-sm mb-2">등록된 상세 이미지가 없습니다.</p>
        ) : (
          <div className="flex gap-3 flex-wrap mb-2">
            {existingImages.map((img) => (
              <div key={img.id} className="relative w-24 h-24 border border-gray-300 rounded">
                <img
                  src={`${STORAGE_URL}/${img.image_url}`}
                  alt={`기존 이미지 ${img.id}`}
                  className="w-full h-full object-cover"
                />
                <button
                  className="absolute top-1 right-1 bg-white/80 text-red-500 text-sm rounded px-1 py-0.5 hover:bg-red-300"
                  onClick={() => handleDeleteMultiImage(img.id, img.image_url)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===================== 새로 추가할 상세 이미지 업로드 UI (최대 10장) ===================== */}
      <div className="mb-6">
        <label className="block font-semibold mb-2">
          추가 이미지 (여러 장, 최대 10장)
        </label>
        <p className="text-gray-500 text-sm mb-2">
          현재 등록된 상세이미지: {existingImages.length}장, 추가 업로드:{" "}
          {multiFiles.length}장
        </p>
        <div className="flex gap-2 flex-wrap">
          {/* 파일첨부 클릭 영역 */}
          <div
            className="w-24 h-28 border border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 relative cursor-pointer"
            onClick={() => {
              // 이미 10장 이상이면 추가 불가
              if (existingImages.length + multiFiles.length >= 10) {
                alert("이미 최대 10장의 이미지를 추가했습니다.");
                return;
              }
              if (multiFileInputRef.current) {
                multiFileInputRef.current.click();
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l3-3h12l3 3M4 8h16v11H4V8z"
              />
            </svg>
            <div className="mt-1 text-sm font-semibold">
              {multiFiles.length + existingImages.length}/10
            </div>
          </div>

          {/* 새로 첨부한 파일 미리보기 */}
          {multiPreviews.map((p, idx) => (
            <div
              key={idx}
              className="w-24 h-28 border border-gray-300 rounded-md overflow-hidden relative flex items-center justify-center"
            >
              <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          ref={multiFileInputRef}
          className="hidden"
          onChange={handleMultiFilesChange}
        />
      </div>

      {/* ===================== 업로드 버튼 ===================== */}
      <button
        type="button"
        onClick={handleImageUploadClick}
        className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
      >
        이미지 업로드하기
      </button>
    </div>
  );
}