"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseF";

/**
 * 멤버(출근부) 전용 관리 컴포넌트
 * postId, members, setMembers, loadingMembers 등을 상위로부터 props로 받음
 */
export default function MemberManager({
  postId,
  members,
  setMembers,
  loadingMembers,
}) {
  // 멤버 추가 모달
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");

  // 멤버 수정 모달
  const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState(null);
  const [editMemberName, setEditMemberName] = useState("");

  // ─────────────────────────────────────────────
  // (A) 멤버 추가
  // ─────────────────────────────────────────────
  function openAddMemberModal() {
    setNewMemberName("");
    setMemberModalOpen(true);
  }
  async function handleAddMember() {
    if (!newMemberName.trim()) {
      alert("멤버 이름을 입력해주세요.");
      return;
    }
    if (!postId) {
      alert("postId가 없어 멤버를 추가할 수 없습니다.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("register")
        .insert([{ partnershipsubmit_id: postId, member: newMemberName.trim() }])
        .select()
        .single();
      if (error) throw new Error(error.message);

      const newData = {
        id: data.id,
        name: data.member,
      };
      setMembers((prev) => [...prev, newData]);
      setMemberModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("멤버 추가 에러: " + err.message);
    }
  }

  // ─────────────────────────────────────────────
  // (B) 멤버 수정
  // ─────────────────────────────────────────────
  function openEditMemberModal(m) {
    setEditMemberId(m.id);
    setEditMemberName(m.name);
    setEditMemberModalOpen(true);
  }
  async function handleEditMember() {
    if (!editMemberName.trim()) {
      alert("멤버 이름을 입력해주세요.");
      return;
    }
    try {
      const { error } = await supabase
        .from("register")
        .update({ member: editMemberName.trim() })
        .eq("id", editMemberId);
      if (error) throw new Error(error.message);

      setMembers((prev) =>
        prev.map((x) =>
          x.id === editMemberId ? { ...x, name: editMemberName.trim() } : x
        )
      );
      setEditMemberModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("멤버 수정 에러: " + err.message);
    }
  }

  // ─────────────────────────────────────────────
  // (C) 멤버 삭제
  // ─────────────────────────────────────────────
  async function handleDeleteMember(m) {
    if (!window.confirm(`${m.name}님을 삭제하시겠습니까?`)) return;
    try {
      const { error } = await supabase
        .from("register")
        .delete()
        .eq("id", m.id);
      if (error) throw new Error(error.message);

      setMembers((prev) => prev.filter((x) => x.id !== m.id));
    } catch (err) {
      console.error(err);
      alert("멤버 삭제 에러: " + err.message);
    }
  }

  // ─────────────────────────────────────────────
  // (D) 화면 렌더링
  // ─────────────────────────────────────────────
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">출근부 (멤버 관리)</h2>

      <div className="mb-4">
        <button
          onClick={openAddMemberModal}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          + 멤버 추가
        </button>
      </div>

      {/* 멤버 목록 */}
      {loadingMembers ? (
        <p>멤버 목록 로딩 중...</p>
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded p-2"
            >
              <span>{m.name}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditMemberModal(m)}
                  className="px-2 py-1 text-sm bg-yellow-300 hover:bg-yellow-400 rounded"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDeleteMember(m)}
                  className="px-2 py-1 text-sm bg-red-300 hover:bg-red-400 rounded"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
          {members.length === 0 && (
            <p className="text-gray-600">등록된 멤버가 없습니다.</p>
          )}
        </ul>
      )}

      {/* ===================== 멤버 추가 모달 ===================== */}
      {memberModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-lg font-bold mb-3">멤버 추가</h2>
            <input
              type="text"
              placeholder="멤버 이름"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="border border-gray-300 rounded w-full px-2 py-1 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMemberModalOpen(false)}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={handleAddMember}
                className="px-3 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 멤버 수정 모달 ===================== */}
      {editMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-lg font-bold mb-3">멤버 수정</h2>
            <input
              type="text"
              placeholder="이름"
              value={editMemberName}
              onChange={(e) => setEditMemberName(e.target.value)}
              className="border border-gray-300 rounded w-full px-2 py-1 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditMemberModalOpen(false)}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={handleEditMember}
                className="px-3 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}