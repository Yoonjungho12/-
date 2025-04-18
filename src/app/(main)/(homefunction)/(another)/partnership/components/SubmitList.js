import React from "react";

export default function SubmitList({ mySubmits, router, handleEditClick }) {
  if (!mySubmits || mySubmits.length === 0) return null;

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          신청서 리스트
          <span className="ml-2 text-orange-500">({mySubmits.length}건)</span>
        </h2>
      </div>
      
      <div className="grid gap-4">
        {mySubmits.map((submit) => {
          const isAdmitted = submit.is_admitted;
          const statusLabel = isAdmitted ? "승인완료" : "심사 중";
          const title = submit.post_title?.trim() || "무제";

          return (
            <div 
              key={submit.id} 
              className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* 상태 라벨 */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isAdmitted 
                    ? "bg-green-100 text-green-700" 
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {statusLabel}
                </div>

                {/* 제목 */}
                <h3 className="flex-1 text-base font-medium text-gray-800">
                  {title}
                </h3>

                {/* 버튼 영역 */}
                <div className="flex gap-2">
                  {isAdmitted ? (
                    <>
                      <button
                        type="button"
                        onClick={() => router.push(`/myshop/${submit.id}`)}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        내 가게 관리
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditClick(submit.id, isAdmitted)}
                        className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        수정하기
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEditClick(submit.id, isAdmitted)}
                      className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      수정하기
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}