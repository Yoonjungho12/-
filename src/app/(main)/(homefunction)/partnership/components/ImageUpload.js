import React, { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseF";
const directory ='partnershipsubmit'
export default function ImageUpload({
  editId,
  editIsAdmitted,
  imageUploadSectionRef,
}) {
  // 7) 이미지 업로드 states
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const thumbnailFileInputRef = useRef(null);

  function handleThumbnailChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }

  const [multiFiles, setMultiFiles] = useState([]);
  const [multiPreviews, setMultiPreviews] = useState([]);
  const multiFileInputRef = useRef(null);

  function handleMultiFilesChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedCount = 10 - multiFiles.length;
    const addFiles = files.slice(0, allowedCount);

    const newFileList = [...multiFiles, ...addFiles];
    setMultiFiles(newFileList);

    const newPreviews = newFileList.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    setMultiPreviews(newPreviews);
  }

  async function handleImageUploadClick() {
    if (!editId) {
      alert("어느 신청서인지 알 수 없습니다. 먼저 등록/수정 후 다시 시도해주세요!");
      return;
    }

    try {
      // 썸네일 업로드
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

        const { error: updateErr } = await supabase
          .from("partnershipsubmit")
          .update({ thumbnail_url: thumbnailUrl })
          .eq("id", editId);
        if (updateErr) {
          alert("썸네일 DB 업데이트 실패: " + updateErr.message);
          return;
        }
      }

      // 추가 이미지 업로드
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
      window.location.reload();
    } catch (err) {
      alert("이미지 업로드 중 오류: " + err.message);
    }
  }

  return (
    <div
      ref={imageUploadSectionRef}
      className="mt-8 p-4 bg-blue-50 border border-blue-300 rounded"
    >
      <h2 className="text-xl font-bold mb-4 text-blue-700">
        이미지 업로드 섹션
      </h2>
      <p className="text-sm text-gray-700 mb-4">
        이미지로 더욱 매력적인 업체정보를 꾸며보세요!
      </p>

      {/* 썸네일 */}
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

      {/* 여러 이미지 */}
      <div className="mb-6">
        <label className="block font-semibold mb-2">
          추가 이미지 (여러 장)
        </label>
        <div className="flex gap-2 flex-wrap">
          <div
            className="w-24 h-28 border border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 relative cursor-pointer"
            onClick={() => {
              if (multiFiles.length < 10 && multiFileInputRef.current) {
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
              {multiFiles.length}/10
            </div>
          </div>

          {multiPreviews.map((p, idx) => (
            <div
              key={idx}
              className="w-24 h-28 border border-gray-300 rounded-md overflow-hidden relative flex items-center justify-center"
            >
              <img
                src={p.url}
                alt={p.name}
                className="w-full h-full object-cover"
              />
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