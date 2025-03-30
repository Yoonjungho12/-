"use client";

import React, { useState } from "react";

/**
 * 멤버 관리 전용 컴포넌트
 * 상위에서 넘겨받은 members, setMembers 등을 사용.
 */
export default function MemberManager({ members, setMembers }) {
  // ─────────────────────────────────────────────
  // (A) 멤버 추가/수정용 모달 상태들
  // ─────────────────────────────────────────────
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");

  const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberRole, setEditMemberRole] = useState("");

  // ─────────────────────────────────────────────
  // (B) 멤버 추가
  // ─────────────────────────────────────────────
  function openMemberModal() {
    setNewMemberName("");
    setNewMemberRole("");
    setMemberModalOpen(true);
  }
  function handleAddMember() {
    if (!newMemberName.trim()) {
      alert("멤버 이름을 입력하세요!");
      return;
    }
    const newMem = {
      id: Date.now(),
      name: newMemberName.trim(),
      role: newMemberRole.trim(),
    };
    setMembers((prev) => [...prev, newMem]);
    setMemberModalOpen(false);
  }

  // ─────────────────────────────────────────────
  // (C) 멤버 수정
  // ─────────────────────────────────────────────
  function openEditMemberModal(member) {
    setEditMemberId(member.id);
    setEditMemberName(member.name);
    setEditMemberRole(member.role || "");
    setEditMemberModalOpen(true);
  }
  function handleUpdateMember() {
    if (!editMemberName.trim()) {
      alert("멤버 이름을 입력해주세요.");
      return;
    }
    setMembers((prev) =>
      prev.map((mem) =>
        mem.id === editMemberId
          ? {
              ...mem,
              name: editMemberName.trim(),
              role: editMemberRole.trim(),
            }
          : mem
      )
    );
    setEditMemberModalOpen(false);
  }

  // ─────────────────────────────────────────────
  // (D) 멤버 삭제
  // ─────────────────────────────────────────────
  function handleDeleteMember(memberId) {
    if (!window.confirm("정말 이 멤버를 삭제하시겠습니까?")) return;
    setMembers((prev) => prev.filter((mem) => mem.id !== memberId));
  }

  // ─────────────────────────────────────────────
  // (E) 멤버 순서 이동
  // ─────────────────────────────────────────────
  function moveMemberUp(index) {
    if (index <= 0) return;
    setMembers((prev) => {
      const arr = [...prev];
      [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
      return arr;
    });
  }
  function moveMemberDown(index) {
    if (index >= members.length - 1) return;
    setMembers((prev) => {
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  }

  // ─────────────────────────────────────────────
  // (F) 화면 렌더링
  // ─────────────────────────────────────────────
  return (
    <div>
      {/* + 멤버 추가 버튼 */}
      <div className="mb-4">
        <button
          onClick={openMemberModal}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + 멤버 추가
        </button>
      </div>

      {/* 멤버 목록 */}
      {members.length === 0 ? (
        <p className="text-gray-600">아직 멤버가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {members.map((member, index) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
            >
              {/* 왼쪽: 순서 올리기/내리기 + 멤버 정보 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveMemberUp(index)}
                  className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveMemberDown(index)}
                  className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                >
                  ↓
                </button>
                <span className="font-medium">{member.name}</span>
                {member.role && (
                  <span className="text-gray-600">({member.role})</span>
                )}
              </div>

              {/* 오른쪽: 수정/삭제 버튼 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditMemberModal(member)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDeleteMember(member.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 멤버 추가 모달 */}
      {memberModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">새 멤버 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  멤버 이름
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="멤버 이름 입력"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  역할 (선택)
                </label>
                <input
                  type="text"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  placeholder="예: 매니저, 디자이너 등"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setMemberModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleAddMember}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 멤버 수정 모달 */}
      {editMemberModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">멤버 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  멤버 이름
                </label>
                <input
                  type="text"
                  value={editMemberName}
                  onChange={(e) => setEditMemberName(e.target.value)}
                  placeholder="멤버 이름 입력"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  역할 (선택)
                </label>
                <input
                  type="text"
                  value={editMemberRole}
                  onChange={(e) => setEditMemberRole(e.target.value)}
                  placeholder="예: 매니저, 디자이너 등"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditMemberModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleUpdateMember}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 