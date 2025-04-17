// app/community/board/[board_id]/[post_id]/CommentForm.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseF';

export default function CommentForm({ postId }) {
  const [content, setContent] = useState('');

  // 현재 로그인 user_id
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session?.user?.id) {
        setUserId(data.session.user.id);
      }
    }
    fetchSession();
  }, []);

  const handleSubmit = async () => {
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!content.trim()) {
      alert('댓글 내용을 입력하세요!');
      return;
    }

    // post_comments 테이블에 저장
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: content,
      });

    if (error) {
      console.error('댓글 등록 오류:', error.message);
      alert('댓글 등록 실패');
      return;
    }

    // 성공 후 새로고침
    alert('댓글이 등록되었습니다.');
    location.reload(); 
    // or router.refresh() (Next.js 13 app router) if you want partial refresh
  };

  return (
    <div className="border-t border-gray-300 pt-4 bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-bold mb-2">댓글 작성</h3>
      <textarea
        className="w-full border-[0.5px] r p-2 text-sm mb-2 rounded"
        rows={4}
        placeholder="댓글을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="text-right">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-orange-500 hover:bg-blue-600 text-white text-sm rounded"
        >
          등록
        </button>
      </div>
    </div>
  );
}