"use client";
import React from "react";
import CommentsList from "./CommentsList";

/**
 * /app/master/comments/page.js
 *
 * "미승인" + "승인" 댓글 목록을 한 페이지에서.
 */
export default function CommentsPage() {
  return (
    <div className="p-4 flex flex-col md:flex-row gap-8">
      {/* 왼쪽: 미승인 (isApproved=false) */}
      <div className="flex-1 min-w-[300px]">
        <CommentsList isApproved={false} />
      </div>

      {/* 오른쪽: 승인된 (isApproved=true) */}
      <div className="flex-1 min-w-[300px]">
        <CommentsList isApproved={true} />
      </div>
    </div>
  );
}