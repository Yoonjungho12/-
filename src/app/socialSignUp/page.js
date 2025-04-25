"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

export default function SocialSignUpPage() {
  const router = useRouter();

  // ─────────────────────────────────────
  // (A) 상태값들
  // ─────────────────────────────────────

  // 1) 소셜 회원: nickname, email(보이지 않음), userId
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState(""); // 안 보이지만 DB에 저장
  const [userId, setUserId] = useState(null);

  // 에러 메시지 + 로딩
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─────────────────────────────────────
  // (B) 닉네임 중복확인
  // ─────────────────────────────────────
  const [nicknameAvailable, setNicknameAvailable] = useState(null);
  const [nicknameCheckError, setNicknameCheckError] = useState("");

  async function handleCheckNickname() {
    if (!nickname.trim()) {
      setNicknameAvailable(false);
      setNicknameCheckError("닉네임을 입력해주세요.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("nickname", nickname.trim())
        .maybeSingle();

      if (error) {
        throw new Error(error.message || "서버 오류");
      }
      if (data) {
        setNicknameAvailable(false);
        setNicknameCheckError("이미 사용 중인 닉네임입니다.");
      } else {
        setNicknameAvailable(true);
        setNicknameCheckError("사용 가능한 닉네임입니다.");
      }
    } catch (err) {
      console.error("닉네임 중복확인 에러:", err);
      setNicknameAvailable(false);
      setNicknameCheckError(err.message || "중복확인 중 오류");
    }
  }

  // ─────────────────────────────────────
  // (C) 약관동의 체크 (3개 + 전체동의)
  // ─────────────────────────────────────
  const [checkedTerm1, setCheckedTerm1] = useState(false);
  const [checkedTerm2, setCheckedTerm2] = useState(false);
  const [checkedTerm3, setCheckedTerm3] = useState(false);
  const [checkedAll, setCheckedAll] = useState(false);

  // 전체동의
  function handleCheckAll() {
    const newVal = !checkedAll;
    setCheckedAll(newVal);
    setCheckedTerm1(newVal);
    setCheckedTerm2(newVal);
    setCheckedTerm3(newVal);
  }

  // 개별 약관 체크 → 전체동의 해제/설정
  function handleCheckTerm1() {
    const newVal = !checkedTerm1;
    setCheckedTerm1(newVal);
    if (newVal && checkedTerm2 && checkedTerm3) {
      setCheckedAll(true);
    } else {
      setCheckedAll(false);
    }
  }
  function handleCheckTerm2() {
    const newVal = !checkedTerm2;
    setCheckedTerm2(newVal);
    if (checkedTerm1 && newVal && checkedTerm3) {
      setCheckedAll(true);
    } else {
      setCheckedAll(false);
    }
  }
  function handleCheckTerm3() {
    const newVal = !checkedTerm3;
    setCheckedTerm3(newVal);
    if (checkedTerm1 && checkedTerm2 && newVal) {
      setCheckedAll(true);
    } else {
      setCheckedAll(false);
    }
  }

  // ─────────────────────────────────────
  // (D) 모달 (약관 보기)
  // ─────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");

  function openModal(content) {
    setModalContent(content);
    setIsModalOpen(true);
  }
  function closeModal() {
    setIsModalOpen(false);
  }
  function handleBackdropClick(e) {
    if (e.currentTarget === e.target) {
      closeModal();
    }
  }

 // (H) 약관 전문 (이미 사용자가 제공한 긴 텍스트) - 여기서 필요한 부분만 삽입
  const term1 = `제1조 (목적) 본 약관은 "여기닷(yeogidot.com)"(이하 "회사")가 제공하는 서비스의 이용 조건 및 절차, 이용자와 회사 간의 권리, 의무 및 책임사항을 규정하는 것을 목적으로 합니다.
제2조 (용어의 정의)
1. "서비스"란 회사가 제공하는 웹사이트 및 관련 제반 서비스를 의미합니다.
2. "회원"이란 회사의 서비스에 접속하여 본 약관에 동의하고 회원가입을 완료한 자를 의미합니다.
3. "비회원"이란 회원가입 없이 서비스를 이용하는 자를 의미합니다.
4. "성인 회원"이란 본인인증을 통해 성인임을 확인받은 회원을 의미합니다.
제3조 (약관의 게시 및 개정)
1. 본 약관은 서비스 초기 화면 또는 연결화면을 통해 게시됩니다.
2. 회사는 필요할 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있습니다.
3. 개정 약관은 적용일자 이전에 공지하며, 회원이 명시적으로 거부 의사를 밝히지 않는 경우 동의한 것으로 간주합니다.
제4조 (서비스 이용 및 접근 제한)
1. 회원은 회사가 정한 절차에 따라 서비스를 이용할 수 있습니다.
2. 성인 키워드 관련 서비스는 성인 인증을 완료한 성인 회원만 이용할 수 있습니다.
3. 일반 키워드 관련 서비스는 회원 및 비회원 모두 접근할 수 있습니다.
4. 회사는 서비스 운영상 필요한 경우 이용 시간 및 이용 범위를 제한할 수 있습니다.
제5조 (회원의 의무)
1. 회원은 서비스 이용 시 관련 법령 및 본 약관을 준수해야 합니다.
2. 회원은 타인의 정보를 도용하거나 부정 사용해서는 안 됩니다.
3. 회원은 성인 인증이 필요한 서비스 이용 시, 본인 인증을 거쳐야 하며 허위 정보 제공 시 이용이 제한될 수 있습니다.
제6조 (서비스 제공의 중단)
회사는 정기점검, 설비 장애 등의 사유로 서비스 제공을 일시적으로 중단할 수 있습니다.
제7조 (면책 조항)
1. 회사는 회원이 제공한 정보의 정확성에 대해 보증하지 않습니다.
2. 회사는 천재지변 등 불가항력적 사유로 인한 서비스 제공 불가에 대해 책임을 지지 않습니다.
`;
  const term2 = `제1조 (목적)본 개인정보 처리 방침은 "여기닷(yeogidot.com)"이 회원의 개인정보를 어떻게 수집, 이용, 보호하는지를 설명하기 위함입니다.
제2조 (수집하는 개인정보 항목)
1. 필수 수집 정보: 이메일, 비밀번호, 닉네임
2. 선택 수집 정보: 프로필 사진, 연락처
3 .서비스 이용 과정에서 자동 수집되는 정보: 접속 로그, 쿠키, IP 주소
4. 성인 인증을 위한 정보: 본인확인 인증 데이터 (예: 휴대폰 인증 정보)
제3조 (개인정보의 이용 목적)
1. 회원가입 및 서비스 이용을 위한 본인 확인
2. 서비스 운영 및 개선
3. 성인 인증이 필요한 서비스 이용 자격 확인
4. 법적 의무 이행 및 분쟁 해결
제4조 (개인정보의 보관 및 파기)
1. 회원 탈퇴 시 관련 법령에 따른 보존 기간을 제외하고 즉시 파기합니다.
2. 법령에 따라 일정 기간 보존이 필요한 경우 해당 법률을 따릅니다.
제5조 (개인정보 제공 및 공유)
1. 회사는 회원의 동의 없이 개인정보를 외부에 제공하지 않습니다.
2. 단, 법적 요청이 있을 경우 예외로 합니다.
제6조 (이용자의 권리)
1. 회원은 자신의 개인정보를 열람, 수정 및 삭제할 수 있습니다.
2. 성인 인증 정보는 회원 요청 시 삭제할 수 있으며, 삭제 후 성인 서비스 이용이 제한될 수 있습니다.
3. 개인정보와 관련된 문의는 고객센터를 통해 가능합니다.
제7조 (개인정보 보호 조치) 회사는 개인정보 보호를 위해 기술적, 관리적 조치를 취하고 있습니다.
부칙 본 약관 및 개인정보 처리 방침은 2025년 4월 20일부터 시행됩니다.
`;
const term3Text = `제1조 (목적)본 개인정보 처리 방침은 "여기닷(yeogidot.com)"이 회원의 개인정보를 어떻게 수집, 이용, 보호하는지를 설명하기 위함입니다.
제2조 (수집하는 개인정보 항목)
1. 필수 수집 정보: 이메일, 비밀번호, 닉네임
2. 선택 수집 정보: 프로필 사진, 연락처
3 .서비스 이용 과정에서 자동 수집되는 정보: 접속 로그, 쿠키, IP 주소
4. 성인 인증을 위한 정보: 본인확인 인증 데이터 (예: 휴대폰 인증 정보)
제3조 (개인정보의 이용 목적)
1. 회원가입 및 서비스 이용을 위한 본인 확인
2. 서비스 운영 및 개선
3. 성인 인증이 필요한 서비스 이용 자격 확인
4. 법적 의무 이행 및 분쟁 해결
제4조 (개인정보의 보관 및 파기)
1. 회원 탈퇴 시 관련 법령에 따른 보존 기간을 제외하고 즉시 파기합니다.
2. 법령에 따라 일정 기간 보존이 필요한 경우 해당 법률을 따릅니다.
제5조 (개인정보 제공 및 공유)
1. 회사는 회원의 동의 없이 개인정보를 외부에 제공하지 않습니다.
2. 단, 법적 요청이 있을 경우 예외로 합니다.
제6조 (이용자의 권리)
1. 회원은 자신의 개인정보를 열람, 수정 및 삭제할 수 있습니다.
2. 성인 인증 정보는 회원 요청 시 삭제할 수 있으며, 삭제 후 성인 서비스 이용이 제한될 수 있습니다.
3. 개인정보와 관련된 문의는 고객센터를 통해 가능합니다.
제7조 (개인정보 보호 조치) 회사는 개인정보 보호를 위해 기술적, 관리적 조치를 취하고 있습니다.
부칙 본 약관 및 개인정보 처리 방침은 2025년 4월 20일부터 시행됩니다.
`;
  // ─────────────────────────────────────
  // (E) 소셜 세션 & profiles 조회
  // ─────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("세션 로딩 오류:", error);
        setErrorMsg("로그인이 필요합니다!");
        return;
      }
      const user = data?.session?.user;
      if (!user) {
        setErrorMsg("로그인이 필요합니다!");
        router.push("/login");
        return;
      }
      // userId
      setUserId(user.id);

      // meta에서 닉네임 추출 (카카오 => nickname, 구글 => name 등)
      const metaNickname = user.user_metadata?.nickname || user.user_metadata?.name || "";
      setNickname(metaNickname);

      // user.email
      const userEmail = user.email || user.user_metadata?.email || "";
      setEmail(userEmail);

      // DB에서 프로필 로딩
      fetchProfile(user.id, userEmail, metaNickname);
    });
  }, [router]);

  async function fetchProfile(uid, userEmail, userNickname) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname, email")
        .eq("user_id", uid)
        .single();

      if (error) {
        // row가 없으면 신규
        if (error.details?.includes("0 rows")) {
          console.log("profiles 테이블 기록 없음:", error);
          return;
        }
        console.error("profiles 조회 에러:", error);
        return;
      }
      if (data) {
        setNickname(data.nickname || userNickname || "");
        setEmail(data.email || userEmail || "");
      }
    } catch (err) {
      console.error("profiles 조회 중 오류:", err);
      setErrorMsg("프로필 로딩 실패");
    }
  }

  // ─────────────────────────────────────
  // (F) [회원가입 완료] → upsert profiles
  // ─────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) {
      setErrorMsg("유효한 세션이 없습니다. 다시 로그인해 주세요.");
      return;
    }

    // 닉네임 중복확인
    if (nicknameAvailable === false) {
      setErrorMsg("이미 사용 중인 닉네임입니다!");
      return;
    }
    // 약관 체크
    if (!checkedTerm1 || !checkedTerm2 || !checkedTerm3) {
      setErrorMsg("약관에 모두 동의해주셔야 가입 가능합니다!");
      return;
    }

    setIsSubmitting(true);
    try {
      // DB upsert
      const { error } = await supabase.from("profiles").upsert({
        user_id: userId,
        email: email.trim(),
        nickname: nickname.trim(),
      });
      if (error) {
        console.error("프로필 업데이트 오류:", error);
        setErrorMsg("저장 중 오류가 발생했습니다.");
        return;
      }
      alert("회원정보 가입이 성공적으로 완료되었습니다!");
      router.push("/");
    } catch (err) {
      console.error("handleSubmit 오류:", err);
      setErrorMsg("저장 중 예기치 않은 오류 발생");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─────────────────────────────────────
  // (G) UI 렌더링 (하얀 박스 + 3약관 + 전역)
  // ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <div className="mb-6 text-center">
         <Link href="/">
              <img 
                src="/logo/logo.png" 
                alt="로고" 
                className="h-40 mx-auto object-cover object-center -mt-8 -mb-16 cursor-pointer hover:scale-105 transition-transform duration-200" 
              />
            </Link>
      </div>

      <div className="w-full max-w-md rounded-md bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">소셜 회원가입 정보</h2>

        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="mb-4 text-sm text-red-500">{errorMsg}</div>
        )}

        {/* 약관동의 */}
        <div className="mb-5 border border-gray-200">
          {/* 전체동의 */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={checkedAll}
                onChange={handleCheckAll}
                className="h-4 w-4 rounded border-gray-300 text-red-500"
              />
              <span className="text-sm font-medium text-gray-700">전체동의</span>
            </div>
          </div>

          <div className="px-4 py-3 space-y-2">
            {/* 약관1 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={checkedTerm1}
                  onChange={handleCheckTerm1}
                  className="h-4 w-4 rounded border-gray-300 text-red-500"
                />
                <span className="text-sm text-gray-700">회원가입약관 (필수)</span>
              </div>
              <button
                type="button"
                onClick={() => openModal(term1)}
                className="text-sm text-gray-500 hover:underline"
              >
                보기
              </button>
            </div>

            {/* 약관2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={checkedTerm2}
                  onChange={handleCheckTerm2}
                  className="h-4 w-4 rounded border-gray-300 text-red-500"
                />
                <span className="text-sm text-gray-700">개인정보 처리방침 (필수)</span>
              </div>
              <button
                type="button"
                onClick={() => openModal(term2)}
                className="text-sm text-gray-500 hover:underline"
              >
                보기
              </button>
            </div>

            {/* 약관3 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={checkedTerm3}
                  onChange={handleCheckTerm3}
                  className="h-4 w-4 rounded border-gray-300 text-red-500"
                />
                <span className="text-sm text-gray-700">책임의 한계와 고지 (필수)</span>
              </div>
              <button
                type="button"
                onClick={() => openModal(term3Text)}
                className="text-sm text-gray-500 hover:underline"
              >
                보기
              </button>
            </div>
          </div>
        </div>

        {/* 가입 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 닉네임 + 중복확인 */}
          <div>
            <label className="block mb-1 font-semibold text-gray-600">
              닉네임 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border rounded px-2 py-2"
                placeholder="사용할 닉네임"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setNicknameAvailable(null);
                  setNicknameCheckError("");
                }}
                required
              />
              <button
                type="button"
                onClick={handleCheckNickname}
                className="px-3 py-2 rounded bg-gray-300 text-sm text-gray-700 hover:bg-gray-400"
              >
                중복확인
              </button>
            </div>
            {/* 닉네임 체크 결과 */}
            {nicknameAvailable === false && (
              <p className="mt-1 text-sm text-red-500">
                {nicknameCheckError || "이미 사용 중입니다."}
              </p>
            )}
            {nicknameAvailable === true && (
              <p className="mt-1 text-sm text-green-600">
                {nicknameCheckError || "사용 가능합니다."}
              </p>
            )}
          </div>

          {/* 회원가입 완료 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full rounded py-2 font-semibold text-white hover:bg-orange-500 
              ${isSubmitting ? "bg-orange-300" : "bg-orange-400"}
            `}
          >
            {isSubmitting ? "저장 중..." : "회원 가입 완료"}
          </button>
        </form>
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={handleBackdropClick}
        >
          <div
            className="bg-white w-full max-w-md p-6 rounded shadow-lg relative max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold mb-2">이용 약관</h3>
            <p className="text-sm whitespace-pre-wrap">{modalContent}</p>
          </div>
        </div>
      )}
    </div>
  );
}