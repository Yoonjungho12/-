"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import { supabase } from "../lib/supabaseF";
import Link from "next/link";

export default function SignupPage() {
  // ─────────────────────────────────────────
  // (A) 상태값들
  // ─────────────────────────────────────────
  const [userId, setUserId] = useState(""); // 이메일(아이디)
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // 닉네임
  const [nickname, setNickname] = useState("");
  const [nicknameAvailable, setNicknameAvailable] = useState(null);
  const [nicknameCheckError, setNicknameCheckError] = useState("");

  // 약관동의 체크
  const [checkedTerm1, setCheckedTerm1] = useState(false);
  const [checkedTerm2, setCheckedTerm2] = useState(false);
  const [checkedTerm3, setCheckedTerm3] = useState(false);
  const [checkedAll, setCheckedAll] = useState(false);

  // reCAPTCHA 토큰
  const [captchaToken, setCaptchaToken] = useState("");

  // 소셜 로그인 에러메시지
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  // ─────────────────────────────────────────
  // (B) 닉네임 중복확인
  // ─────────────────────────────────────────
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
        throw new Error(error.message || "서버오류");
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

  // ─────────────────────────────────────────
  // (C) 비밀번호 강도 로직
  // ─────────────────────────────────────────
  function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    return score; // 0~4
  }

  const passwordStrength = getPasswordStrength(password);

  function getBarColor(strength, index) {
    if (strength <= 0) return "bg-gray-200";

    if (strength === 1) {
      return index === 0 ? "bg-red-500" : "bg-gray-200";
    }
    if (strength === 2) {
      return index < 2 ? "bg-yellow-400" : "bg-gray-200";
    }
    if (strength >= 3) {
      return "bg-green-500";
    }
  }

  // ─────────────────────────────────────────
  // (D) reCAPTCHA 체크박스 완료 시 콜백
  // ─────────────────────────────────────────
  function handleRecaptchaChange(token) {
    console.log("reCAPTCHA v2 token:", token);
    setCaptchaToken(token);
  }

  // 민제님 이곳 수정했습니다: handleCheckAll / handleCheckTerm(N) 함수들 추가
  function handleCheckAll() {
    const newVal = !checkedAll;
    setCheckedAll(newVal);
    setCheckedTerm1(newVal);
    setCheckedTerm2(newVal);
    setCheckedTerm3(newVal);
  }

  function handleCheckTerm1() {
    const newVal = !checkedTerm1;
    setCheckedTerm1(newVal);
    // 하위중 하나라도 false면 전체동의 false
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
  // ─────────────────────────────────────────
  // (E) 가입하기
  // ─────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (nicknameAvailable !== true) {
      alert("닉네임 중복확인을 해주세요!");
      return;
    }
    if (!checkedTerm1 || !checkedTerm2 || !checkedTerm3) {
      alert("약관에 모두 동의해주셔야 가입 가능합니다!");
      return;
    }
    if (!captchaToken) {
      alert("로봇이 아님을 인증해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. 먼저 profiles 테이블에서 이메일 중복 체크
      const { data: existingProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', userId);

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (existingProfiles?.length > 0) {
        alert('이미 가입된 이메일입니다. 로그인을 진행해주세요.');
        setIsSubmitting(false);
        return;
      }

      // 2. 이메일 중복이 없으면 회원가입 진행
      const { data, error } = await supabase.auth.signUp({
        email: userId,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      const user_id = data.user?.id;
      if (!user_id) {
        alert("가입 오류: user_id가 없습니다.");
        return;
      }

      // 3. profiles 테이블에 정보 저장
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          user_id,
          email: userId,
          nickname,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      localStorage.setItem("pendingEmail", userId);
      router.push("/email-confirmation");
    } catch (err) {
      alert("프로필 저장 중 오류: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─────────────────────────────────────────
  // (F) 소셜 로그인(구글, 카카오)
  // ─────────────────────────────────────────
  async function handleGoogleLogin() {
    setErrorMessage("");
    try {
      const res = await fetch(`/api/social-login?provider=google`);
      const { url, error } = await res.json();
      if (error || !url) {
        setErrorMessage(error || "구글 로그인 오류");
        return;
      }
      window.location.href = url;
    } catch (err) {
      console.error("구글 로그인 실패:", err);
      setErrorMessage(err.message || "구글 로그인 중 오류 발생");
    }
  }

  async function handleKakaoLogin() {
    setErrorMessage("");
    try {
      const res = await fetch(`/api/social-login?provider=kakao`);
      const { url, error } = await res.json();
      if (error || !url) {
        setErrorMessage(error || "카카오 로그인 오류");
        return;
      }
      window.location.href = url;
    } catch (err) {
      console.error("카카오 로그인 실패:", err);
      setErrorMessage(err.message || "카카오 로그인 중 오류 발생");
    }
  }

  // ─────────────────────────────────────────
  // (G) 약관 모달
  // ─────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");

  function openModal(content) {
    setModalContent(content);
    setIsModalOpen(true);
  }
  function closeModal() {
    setIsModalOpen(false);
  }

  // 모달 배경 클릭 시 닫기
  function handleBackdropClick(e) {
    if (e.currentTarget === e.target) {
      closeModal();
    }
  }

  // 바 4칸
  const bars = [0, 1, 2, 3];

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
const term3 = `제1조 (목적)본 개인정보 처리 방침은 "여기닷(yeogidot.com)"이 회원의 개인정보를 어떻게 수집, 이용, 보호하는지를 설명하기 위함입니다.
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* 메인 카드 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-8">
          {/* 로고 */}
          <div className="text-center">
            <Link href="/">
              <img 
                src="/logo/logo.png" 
                alt="로고" 
                className="h-40 mx-auto object-cover object-center -mt-8 -mb-16 cursor-pointer hover:scale-105 transition-transform duration-200" 
              />
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">회원가입</h2>

          {/* 소셜 로그인 */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex-1 py-3 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <img src="/icons/google.svg" alt="google" width={20} />
              <span>구글 계정으로 가입</span>
            </button>

            <button
              type="button"
              onClick={handleKakaoLogin}
              className="flex-1 py-3 px-4 rounded-xl bg-[#FEE500] text-[#391B1B] font-medium hover:bg-[#FDD800] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <img src="/icons/kakao.svg" alt="kakao" width={20} />
              <span>카카오 계정으로 가입</span>
            </button>
          </div>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">또는 이메일로 가입</span>
            </div>
          </div>

          {/* 약관동의 */}
          <div className="bg-gray-50/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200/70 pb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkedAll}
                  onChange={handleCheckAll}
                  className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-gray-700 font-medium">전체동의</span>
              </div>
            </div>
            <div className="space-y-3 pt-1">
              {/* 약관1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checkedTerm1}
                    onChange={handleCheckTerm1}
                    className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">회원가입약관의 내용에 동의 (필수)</span>
                </div>
                <button
                  type="button"
                  onClick={() => openModal(term1)}
                  className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
                >
                  보기
                </button>
              </div>
              {/* 약관2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checkedTerm2}
                    onChange={handleCheckTerm2}
                    className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">개인정보 이용 및 활용 동의 (필수)</span>
                </div>
                <button
                  type="button"
                  onClick={() => openModal(term2)}
                  className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
                >
                  보기
                </button>
              </div>
              {/* 약관3 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checkedTerm3}
                    onChange={handleCheckTerm3}
                    className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">책임의 한계와 법적고지 동의 (필수)</span>
                </div>
                <button
                  type="button"
                  onClick={() => openModal(term3)}
                  className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
                >
                  보기
                </button>
              </div>
            </div>
          </div>

          {/* 가입 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 */}
            <div>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white"
                placeholder="아이디(이메일)"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <div className="mb-1 flex space-x-1">
                {bars.map((index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${getBarColor(
                      passwordStrength,
                      index
                    )}`}
                  />
                ))}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white"
                placeholder="비밀번호 (8자 이상, 숫자/특수문자/대문자 포함)"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white"
                placeholder="비밀번호 재입력"
              />
            </div>

            {/* 닉네임 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setNicknameAvailable(null);
                  setNicknameCheckError("");
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white"
                placeholder="닉네임"
              />
              <button
                type="button"
                onClick={handleCheckNickname}
                className="px-6 py-3 rounded-xl bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200"
              >
                중복확인
              </button>
            </div>

            {/* 닉네임 확인 메시지 */}
            {nicknameCheckError && (
              <p className={`text-sm ${nicknameAvailable ? 'text-green-500' : 'text-red-500'}`}>
                {nicknameCheckError}
              </p>
            )}

            {/* reCAPTCHA */}
            <div className="flex justify-center pt-2">
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={handleRecaptchaChange}
              />
            </div>

            {/* 가입하기 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 
                text-white font-medium hover:from-orange-600 hover:to-red-600 
                transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg
                ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  <span>가입 중...</span>
                </div>
              ) : (
                "가입하기"
              )}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className="text-center pt-4 border-t border-gray-200">
            <Link 
              href="/login" 
              className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-1 group"
            >
              <span>이미 계정이 있으신가요?</span>
              <svg 
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* 약관 모달 */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-50/95 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">약관 상세</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-orange-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="prose prose-sm max-w-none prose-orange">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600 bg-orange-50/50 p-4 rounded-xl">
                {modalContent}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}