"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseF";

export default function EmailVerificationPage() {
  const router = useRouter();

  // (1) 페이지 로드 시, localStorage에서 pendingEmail을 확인하고 콘솔로 출력
  useEffect(() => {
    const storedEmail = localStorage.getItem("pendingEmail");
    console.log("Stored email from localStorage:", storedEmail);
  }, []);

  // (2) 재발송 버튼 클릭 시, Supabase signUp을 다시 호출
  async function handleResendVerification() {
    try {
      const storedEmail = localStorage.getItem("pendingEmail");
      if (!storedEmail) {
        alert("로컬 스토리지에 이메일 정보가 없습니다. 이미 인증하셨나요?");
        return;
      }

      // 보안을 위해 실제 비밀번호가 아닌 임시 비밀번호를 사용 (이미 가입된 이메일이면 인증만 재시도됨)
      const { data, error } = await supabase.auth.signUp({
        email: storedEmail,
        password: "TemporaryPasswordForResend", // 임시 비밀번호
      });

      if (error) {
        if (error.message === "User already registered") {
          alert("이미 가입된 이메일입니다. 혹시 이미 인증을 완료하셨나요?");
        } else {
          alert("인증 메일 재발송 실패: " + error.message);
        }
        return;
      }

      alert("인증 메일을 다시 보냈습니다! 메일함을 확인해 보세요.");
    } catch (err) {
      alert("재발송 중 오류 발생: " + err.message);
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      {/* 카드 컨테이너 */}
      <div className="max-w-md w-full bg-white shadow-md rounded-md p-6 text-center">
        
        {/* 제목 */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          이메일 인증을 진행해주세요
        </h2>

        {/* 설명 문구 */}
        <p className="text-gray-600 leading-relaxed mb-8">
          가입하신 이메일로 인증 링크를 보냈습니다. <br/>
          메일함을 확인해 주세요!<br />
        </p>

        {/* 편지봉투 (애니메이션) */}
        <div className="mx-auto mb-8 envelope-floating relative w-48 h-32">
          {/* 봉투 본체 */}
          <div className="absolute w-full h-full rounded-md">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 rounded-md" />
          </div>
          {/* 간단히 편지 글씨 */}
          <div className="absolute inset-4 bg-white rounded-sm shadow flex items-center justify-center">
            <span className="font-bold text-gray-700">여기닷 인증 메일</span>
          </div>
        </div>

        {/* 버튼 */}
        <button
          className="bg-[#ff7043] text-white py-2 px-6 rounded font-semibold hover:bg-[#ff5c29] transition-colors mb-4"
          onClick={handleResendVerification}
        >
          인증 메일 재발송
        </button>

        {/* 하단 안내 */}
        <p className="text-sm text-gray-500 leading-relaxed">
          메일이 계속 오지 않으면&nbsp; 
               스팸함도 확인해보시고, 
          <br/>위 버튼으로 재발송을 시도할 수 있습니다.<br/>
          그래도 보이지 않는다면 &nbsp;
          <a href="mailto:support@yeogidot.com" className="text-[#ff7043] font-semibold">
            고객센터
          </a>
          &nbsp;로 문의 부탁드립니다.
        </p>
      </div>

      {/* 애니메이션 정의 (JSX 내부에 Global Style로 선언) */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }
        .envelope-floating {
          animation: float 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}