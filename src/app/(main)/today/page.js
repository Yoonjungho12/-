import ClientUI from "./client";

export default function TodayPage() {
  return (
    <div className="w-full">
      {/* 클라이언트 상호작용 UI를 담당하는 컴포넌트 */}
      <ClientUI />

      {/* 서버에서 렌더링하는 추가 내용 (예시) */}
      <div className="mx-auto max-w-5xl py-8 px-4">
        <h2 className="text-xl font-semibold">SSR 예시: 검색어 없음</h2>
        <p className="mt-2 text-gray-600">
          이 영역은 서버 컴포넌트에서 렌더링된 부분입니다.
        </p>
      </div>
    </div>
  );
}