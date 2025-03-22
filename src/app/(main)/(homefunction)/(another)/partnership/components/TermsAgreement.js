import React from "react";

export default function TermsAgreement({ termsAgreed, setTermsAgreed }) {
  return (
    <div className="border border-gray-300 rounded p-4 mb-4 bg-gray-50 text-sm">
      <h2 className="font-bold mb-2">제휴사 이용 약관 및 면책 조항</h2>

      {/* 쌍따옴표("회사") => &quot;회사&quot; 로 변경 */}
      <p>
        여기닷(이하 &quot;회사&quot;)와 제휴사는 인터넷을 통한 중개 서비스 이용과
        관련하여 제휴를 진행하는 데 있어, 아래에 해당하는 사항이 발생할 경우 회사는
        어떠한 책임도 지지 않음을 명확히 하며, 제휴사의 동의를 받고 있습니다.
      </p>
      <br />

      {/* 쌍따옴표("자료") => &quot;자료&quot; 로 변경 */}
      <p>
        <strong>1. 정보의 정확성 및 신뢰성</strong>
        <br />
        회사는 제휴사를 통해 제공되는 모든 정보(이하 &quot;자료&quot;)의 정확성과
        신뢰성을 보장하지 않으며, 자료의 저작권 준수 여부, 재화 및 서비스의 가성비,
        용도, 적법성, 도덕성 등에 대한 법적 책임을 지지 않습니다.
      </p>
      <br />

      <p>
        <strong>2. 제휴사의 법적 책임</strong>
        <br />
        ① 제휴사는 제공하는 서비스 및 상품이 관련 법령 및 규정을 준수해야 하며,
        불법적이거나 도덕적으로 문제가 있는 상품·서비스를 제공해서는 안 됩니다.
        <br />
        ② 제휴사가 법을 위반하거나 분쟁이 발생할 경우, 해당 책임은 전적으로
        제휴사에 있으며, 회사는 이에 대한 법적 책임을 지지 않습니다.
      </p>
      <br />

      <p>
        <strong>3. 중개 서비스의 한계</strong>
        <br />
        ① 회사는 중개 서비스만을 제공하며, 제휴사의 실제 운영, 서비스 품질, 고객
        응대 등에 개입하지 않습니다.
        <br />
        ② 제휴사의 사정으로 인해 서비스가 중단되거나 변경될 수 있으며, 이에 대한
        책임은 제휴사에 있습니다.
        <br />
        ③ 회사는 제휴사의 서비스 품질이나 이용자의 만족도를 보장하지 않으며, 이에
        대한 모든 법적 책임은 제휴사에 있습니다.
      </p>
      <br />

      <p>
        <strong>4. 제휴 해지 및 서비스 변경</strong>
        <br />
        ① 회사는 필요에 따라 제휴사의 중개 서비스를 사전 통보 없이 변경하거나
        종료할 수 있습니다.
        <br />
        ② 제휴사가 본 약관을 위반할 경우, 회사는 제휴 관계를 즉시 해지할 수
        있습니다.
      </p>
      <br />

      <p>
        본 약관을 충분히 숙지하고 이에 동의하신 경우, 제휴를 진행해 주시기 바랍니다.
      </p>

      <div className="flex items-center justify-center mt-5">
        <input
          type="checkbox"
          id="termsCheck"
          checked={termsAgreed}
          onChange={() => setTermsAgreed(!termsAgreed)}
          className="mr-2"
          style={{
            transform: "scale(1.5)",
            marginRight: "0.5rem",
          }}
        />
        <label htmlFor="termsCheck" className="font-semibold text-xl">
          동의합니다
        </label>
      </div>
    </div>
  );
}