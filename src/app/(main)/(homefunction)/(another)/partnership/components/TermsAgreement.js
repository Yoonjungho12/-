import React from "react";

export default function TermsAgreement({ termsAgreed, setTermsAgreed }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">제휴사 이용 약관 및 면책 조항</h2>

      <div className="prose prose-orange max-w-none mb-8">
        <p className="text-gray-700 leading-relaxed">
          여기닷(이하 "회사")와 제휴사는 인터넷을 통한 중개 서비스 이용과
          관련하여 제휴를 진행하는 데 있어, 아래에 해당하는 사항이 발생할 경우 회사는
          어떠한 책임도 지지 않음을 명확히 하며, 제휴사의 동의를 받고 있습니다.
        </p>

        <div className="space-y-6 mt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">1. 정보의 정확성 및 신뢰성</h3>
            <p className="text-gray-700 leading-relaxed">
              회사는 제휴사를 통해 제공되는 모든 정보(이하 "자료")의 정확성과
              신뢰성을 보장하지 않으며, 자료의 저작권 준수 여부, 재화 및 서비스의 가성비,
              용도, 적법성, 도덕성 등에 대한 법적 책임을 지지 않습니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">2. 제휴사의 법적 책임</h3>
            <p className="text-gray-700 leading-relaxed">
              ① 제휴사는 제공하는 서비스 및 상품이 관련 법령 및 규정을 준수해야 하며,
              불법적이거나 도덕적으로 문제가 있는 상품·서비스를 제공해서는 안 됩니다.
              <br />
              ② 제휴사가 법을 위반하거나 분쟁이 발생할 경우, 해당 책임은 전적으로
              제휴사에 있으며, 회사는 이에 대한 법적 책임을 지지 않습니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">3. 중개 서비스의 한계</h3>
            <p className="text-gray-700 leading-relaxed">
              ① 회사는 중개 서비스만을 제공하며, 제휴사의 실제 운영, 서비스 품질, 고객
              응대 등에 개입하지 않습니다.
              <br />
              ② 제휴사의 사정으로 인해 서비스가 중단되거나 변경될 수 있으며, 이에 대한
              책임은 제휴사에 있습니다.
              <br />
              ③ 회사는 제휴사의 서비스 품질이나 이용자의 만족도를 보장하지 않으며, 이에
              대한 모든 법적 책임은 제휴사에 있습니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">4. 제휴 해지 및 서비스 변경</h3>
            <p className="text-gray-700 leading-relaxed">
              ① 회사는 필요에 따라 제휴사의 중개 서비스를 사전 통보 없이 변경하거나
              종료할 수 있습니다.
              <br />
              ② 제휴사가 본 약관을 위반할 경우, 회사는 제휴 관계를 즉시 해지할 수
              있습니다.
            </p>
          </div>
        </div>

        <p className="text-gray-700 leading-relaxed mt-6">
          본 약관을 충분히 숙지하고 이에 동의하신 경우, 제휴를 진행해 주시기 바랍니다.
        </p>
      </div>

      <div className="flex items-center justify-center mt-8">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={() => setTermsAgreed(!termsAgreed)}
              className="sr-only"
            />
            <div className={`w-6 h-6 rounded-lg border-2 transition-colors duration-200 flex items-center justify-center ${
              termsAgreed 
                ? "bg-orange-500 border-orange-500" 
                : "bg-white border-gray-300 group-hover:border-orange-500"
            }`}>
              {termsAgreed && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-lg font-medium text-gray-700 group-hover:text-orange-500 transition-colors duration-200">
            동의합니다
          </span>
        </label>
      </div>
    </div>
  );
}