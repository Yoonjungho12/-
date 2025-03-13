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
          const buttonText = isAdmitted ? "내 가게 관리" : "수정하기";
          const title = submit.post_title?.trim() || "무제";

          return (
            <li key={submit.id} className="flex items-center space-x-2">
              <span className="px-2 py-1 text-sm bg-gray-200 rounded">
                {statusLabel}
              </span>
              <span className="font-medium">[{title}]</span>
              <button
                type="button"
                onClick={() => {
                  if (isAdmitted) {
                    router.push(`/myshop/${submit.id}`);
                  } else {
                    handleEditClick(submit.id, isAdmitted);
                  }
                }}
                className="px-2 py-1 text-sm bg-green-200 rounded hover:bg-green-300 ml-2"
              >
                {buttonText}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}