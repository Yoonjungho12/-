import React from "react";

export default function SubmitList({ mySubmits, router, handleEditClick }) {
  if (!mySubmits || mySubmits.length === 0) return null;

  return (
    <div className="mb-6 bg-gray-100 border border-gray-300 p-4 rounded">
      <div className="text-gray-700 mb-2 font-semibold">
        신청서 리스트 ({mySubmits.length}건)
      </div>
      <ul className="list-disc pl-5 space-y-2">
        {mySubmits.map((submit) => {
          const isAdmitted = submit.is_admitted;
          const statusLabel = isAdmitted ? "승인완료" : "심사 중";
          const title = submit.post_title?.trim() || "무제";

          return (
            <li key={submit.id} className="flex items-center space-x-2">
              {/* 상태 라벨 */}
              <span className="px-2 py-1 text-sm bg-gray-200 rounded">
                {statusLabel}
              </span>

              {/* 제목 */}
              <span className="font-medium">[{title}]</span>

              {/* 버튼 영역 */}
              {isAdmitted ? (
                <>
                  {/* 내 가게 관리 버튼 */}
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/myshop/${submit.id}`);
                    }}
                    className="px-2 py-1 text-sm bg-blue-200 rounded hover:bg-blue-300 ml-2"
                  >
                    내 가게 관리
                  </button>

                  {/* 수정하기 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleEditClick(submit.id, isAdmitted)}
                    className="px-2 py-1 text-sm bg-green-200 rounded hover:bg-green-300"
                  >
                    수정하기
                  </button>
                </>
              ) : (
                <>
                  {/* 승인 전인 경우: 수정하기만 표시 */}
                  <button
                    type="button"
                    onClick={() => handleEditClick(submit.id, isAdmitted)}
                    className="px-2 py-1 text-sm bg-green-200 rounded hover:bg-green-300 ml-2"
                  >
                    수정하기
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}