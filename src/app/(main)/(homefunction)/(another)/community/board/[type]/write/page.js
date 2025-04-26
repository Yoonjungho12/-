 "use client";
// Removed video import as it is now loaded internally by SunEditor
import imageCompression from "browser-image-compression";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseF";
import dynamic from "next/dynamic";
import "suneditor/dist/css/suneditor.min.css";
const SunEditor = dynamic(() => import("suneditor-react"), { ssr: false });
import DOMPurify from "dompurify";

// 에디터 팝업 input 스타일 오버라이드
const editorCustomStyle = `
  .sun-editor .se-dialog-inner input[type="text"],
  .sun-editor .se-dialog-inner input[type="url"],
  .sun-editor .se-dialog-inner input[type="number"] {
    font-size: 16px !important;
  }
`;

// 테마 목록 상수
const THEMES = [
  { id: 0,  name: "전체",         sort_order: 0 },
  { id: 1,  name: "신규업체",     sort_order: 1 },
  { id: 19, name: "눈썹문신",     sort_order: 19 },
  { id: 20, name: "애견펜션",     sort_order: 20 },
  { id: 21, name: "사주",        sort_order: 21 },
  { id: 22, name: "타로",        sort_order: 22 },
  { id: 23, name: "아이폰-스냅",   sort_order: 23 },
  { id: 24, name: "웨딩플래너",   sort_order: 24 },
  { id: 25, name: "룸카페",      sort_order: 25 },
  { id: 26, name: "성인용품",    sort_order: 26 },
  { id: 27, name: "클럽",       sort_order: 27 },
  { id: 28, name: "나이트클럽",   sort_order: 28 },
  { id: 29, name: "네일샵",     sort_order: 29 },
  { id: 30, name: "애견미용",   sort_order: 30 },
  { id: 31, name: "태닝샵",     sort_order: 31 },
  { id: 32, name: "왁싱샵",     sort_order: 32 },
  { id: 33, name: "라운지바",   sort_order: 33 },
  { id: 34, name: "헌팅포차",   sort_order: 34 },
  { id: 35, name: "바",        sort_order: 35 },
  { id: 36, name: "감성주점",   sort_order: 36 },
];

export default function WritePage() {
  const router = useRouter();
  const { type } = useParams();
  const decodedType = decodeURIComponent(type || "");

  // 로그인된 사용자 ID
  const [userId, setUserId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // 추가

  // 테마 선택 (기본값: THEMES[0].id)
  const [theme, setTheme] = useState(THEMES[0].id);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 게시판 타입별 ID와 이름 매핑
  let boardTitle = { name: "", id: 0 };
  switch (decodedType) {
    case "공지사항":
      boardTitle = { name: "공지사항", id: 1 };
      break;
    case "가입인사":
      boardTitle = { name: "가입인사", id: 2 };
      break;
    case "방문후기":
      boardTitle = { name: "방문후기", id: 3 };
      break;
    case "자유게시판":
      boardTitle = { name: "자유게시판", id: 4 };
      break;
    case "유머게시판":
      boardTitle = { name: "유머게시판", id: 5 };
      break;
    case "질문답변":
      boardTitle = { name: "질문답변", id: 6 };
      break;
    case "제휴업체":
      boardTitle = { name: "제휴업체 SNS", id: 7 };
      break;
    case "코스공유":
      boardTitle = { name: "맛집/핫플/데이트 코스 공유", id: 8 };
      break;
    default:
      boardTitle = { name: "알 수 없는 게시판", id: -1 };
      break;
  }

  // 컴포넌트 마운트 시점에 세션(로그인 유저 ID) 로드
  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("세션 불러오기 오류:", error);
        return;
      }
      const currentUserId = data.session?.user?.id;
      if (!currentUserId) {
        console.log("로그인이 필요합니다!");
      } else {
        console.log("로그인 사용자 ID:", currentUserId);
        setUserId(currentUserId);
      }
    }
    fetchSession();
  }, []);

  // "글 저장" 버튼
  const handleSave = async () => {
    setIsSubmitting(true); // 추가
    try {
      if (!userId) {
        alert("로그인이 필요합니다!");
        return;
      }

      // Process blob images in content and upload to Supabase Storage
      const tempDoc = document.createElement("div");
      tempDoc.innerHTML = content;

      const imgElements = tempDoc.querySelectorAll("img[src^='blob:']");
      for (const img of imgElements) {
        const blobUrl = img.src;
        const originalFile = await fetch(blobUrl).then((r) => r.blob());
        
        const file = await imageCompression(originalFile, {
          maxSizeMB: 1.2,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        });
        const fileExt = file.type.split("/").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `community_images/${fileName}`;
        
        const { error } = await supabase.storage
          .from("here-it-is")
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });
        
        if (error) {
          console.error("이미지 업로드 실패:", error.message);
          continue;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from("here-it-is")
          .getPublicUrl(filePath);
        
        img.src = publicUrlData.publicUrl;
      }

      const finalContent = DOMPurify.sanitize(tempDoc.innerHTML);

      // (1) Insert 객체 구성
      // "방문후기" 게시판일 때만 theme_id 넣고, 아니면 넣지 않는다.
      const insertData = {
        board_id: boardTitle.id,
        user_id: userId,
        title,
        content: finalContent,
      };
      if (boardTitle.name === "방문후기") {
        insertData.theme_id = theme;
      }

      // 디버깅: Insert Query 파라미터
      console.log("==> [handleSave] Insert Query Data:", insertData);

      // posts 테이블에 삽입
      const { data, error } = await supabase.from("posts").insert(insertData);

      // 디버깅: Supabase 결과
      console.log("==> [handleSave] Supabase Insert Result data:", data);
      console.log("==> [handleSave] Supabase Insert Result error:", error);

      if (error) {
        console.error("게시글 저장 오류:", JSON.stringify(error, null, 2));
        alert("게시글 저장 중 오류가 발생했습니다!");
        return;
      }

      alert("게시 완료! 관리자 승인 후에 노출됩니다");
      router.push("/community");
    } catch (err) {
      console.error("에러 발생:", err);
      alert("알 수 없는 오류가 발생했습니다!");
    } finally {
      setIsSubmitting(false); // 추가
    }
  };

  // "목록" 버튼
  const handleList = () => {
    router.push("/community");
  };

  return (
    <div className="max-w-6xl mx-auto mb-10">
      <style>{editorCustomStyle}</style>
      {/* 게시판 이름과 등록 버튼을 포함하는 헤더 */}
      <div className="flex justify-between items-center mt-1 md:mt-3 pl-3 md:pl-0 mb-2 md:mb-4">
        <h2>
          커뮤니티 {'>'} {boardTitle.name}
        </h2>
      </div>

      {/* 글쓰기 제목과 모바일 등록 버튼을 같은 줄에 배치 */}
      <div className="px-3 flex justify-between items-center pl-3 md:pl-0 mb-2 md:mb-4">
        <h1 className="text-xl font-bold">글쓰기</h1>
        {/* 모바일에서만 보이는 등록 버튼 */}
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className={`md:hidden px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 flex items-center gap-1 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {isSubmitting ? "등록 중..." : "등록"}
        </button>
      </div>

      <table className="w-full border-t border-b border-gray-300 mb-4 text-sm">
        <tbody>
          <tr className="border-b border-gray-300">
            <td className="w-24 p-2 bg-gray-100 align-middle hidden md:table-cell">제목</td>
            <td className="p-2">
              <input
                type="text"
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border p-2 text-[16px]"
                style={{ fontSize: '16px' }}
                placeholder="제목을 입력하세요"
              />
            </td>
          </tr>
          {/* 테마 선택 (방문후기 게시판일 때만 표시) */}
          {boardTitle.name === "방문후기" && (
            <tr className="border-b border-gray-300">
              <td className="w-24 p-2 bg-gray-100 align-middle hidden md:table-cell">테마</td>
              <td className="p-2">
                <select
                  className="w-full border p-2 text-[16px]"
                  style={{ fontSize: '16px' }}
                  value={theme}
                  onChange={(e) => setTheme(Number(e.target.value))}
                >
                  {THEMES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          )}
          <tr>
            <td className="w-24 p-2 bg-gray-100 align-top hidden md:table-cell">내용</td>
            <td className="p-2">
              <div className="sun-editor-custom-wrapper">
                <SunEditor
                  height="600px"
                  lang="ko"
                  setContents={content}
                  onChange={(val) => setContent(val)}
                  onImageUploadBefore={(files, info, uploadHandler) => {
                    const file = files[0];
                    const localUrl = URL.createObjectURL(file);
                    uploadHandler({
                      result: [{ url: localUrl }],
                    });
                    return false; // 서버 업로드 방지
                  }}
                  setOptions={{
                    height: "300px",
                    defaultStyle: "font-size: 16px !important;",
                    fontSize: ["16px", "18px", "20px", "24px", "28px", "32px"],
                    buttonList: [
                      ["fontSize"],
                      ["bold", "underline", "italic", "strike", "hiliteColor"],
                      ["align", "list"],
                      ["link", "image", "video"],
                      ["removeFormat"]
                    ],
                    katex: "window.katex",
                    formats: ["p", "blockquote", "h1", "h2", "h3"],
                    toolbarWidth: "100%",
                    popupDisplay: "full",
                    videoFileInput: false
                    // Removed custom plugins to revert to built-in behavior
                  }}
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* PC에서만 보이는 등록 버튼 */}
      <div className="hidden md:flex gap-2 justify-end items-center">
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className={`px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 flex items-center gap-1 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {isSubmitting ? "등록 중..." : "등록"}
        </button>
      </div>
    </div>
  );
}