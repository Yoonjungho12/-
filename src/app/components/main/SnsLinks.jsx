import Image from 'next/image';
import Link from 'next/link';

export default function SnsLinks() {
  return (
    <div className="max-w-7xl mx-auto my-16 px-4">
      {/* VIP인포 SNS 소식 제목 */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">여기닷 SNS 소식</h2>
        <p className="text-lg text-gray-600">더 많은 소식을 SNS로 만나보세요</p>
      </div>

      {/* SNS 링크 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 유튜브 */}
        <Link href="https://youtube.com" target="_blank" rel="noopener noreferrer"
          className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300">
          <div className="p-8 flex flex-col items-center text-center bg-[#FFF5F5] hover:bg-[#FFE6E6] transition-colors h-full">
            <div className="w-16 h-16 mb-6">
              <Image src="/icons/youtube.svg" alt="유튜브" width={64} height={64} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">유튜브</h3>
            <p className="text-base text-gray-600 mb-6">매일 새롭게 업데이트되는<br />일상을 확인해보세요</p>
            <div className="mt-auto">
              <span className="inline-flex items-center px-6 py-3 rounded-full text-base font-medium text-red-500 bg-white shadow-sm group-hover:bg-red-50 transition-colors">
                바로가기 <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </span>
            </div>
          </div>
        </Link>

        {/* 네이버 블로그 */}
        <Link href="https://blog.naver.com" target="_blank" rel="noopener noreferrer"
          className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300">
          <div className="p-8 flex flex-col items-center text-center bg-[#F5F9F5] hover:bg-[#E8F3E8] transition-colors h-full">
            <div className="w-16 h-16 mb-6">
              <Image src="/icons/naver.svg" alt="네이버 블로그" width={64} height={64} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">네이버 블로그</h3>
            <p className="text-base text-gray-600 mb-6">가볼만한 지금 바로 찾아보고<br />인포와 함께하는 일상!</p>
            <div className="mt-auto">
              <span className="inline-flex items-center px-6 py-3 rounded-full text-base font-medium text-green-600 bg-white shadow-sm group-hover:bg-green-50 transition-colors">
                바로가기 <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </span>
            </div>
          </div>
        </Link>

        {/* 인스타그램 */}
        <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer"
          className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300">
          <div className="p-8 flex flex-col items-center text-center bg-[#F9F5F9] hover:bg-[#F3E8F3] transition-colors h-full">
            <div className="w-16 h-16 mb-6">
              <Image src="/icons/instagram.svg" alt="인스타그램" width={64} height={64} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">인스타그램</h3>
            <p className="text-base text-gray-600 mb-6">새로운 즐거움이 가득한<br />인포와 함께해요</p>
            <div className="mt-auto">
              <span className="inline-flex items-center px-6 py-3 rounded-full text-base font-medium text-purple-600 bg-white shadow-sm group-hover:bg-purple-50 transition-colors">
                바로가기 <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </span>
            </div>
          </div>
        </Link>

        {/* 페이스북 */}
        <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer"
          className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300">
          <div className="p-8 flex flex-col items-center text-center bg-[#F5F8FF] hover:bg-[#E6F0FF] transition-colors h-full">
            <div className="w-16 h-16 mb-6">
              <Image src="/icons/facebook.svg" alt="페이스북" width={64} height={64} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">페이스북</h3>
            <p className="text-base text-gray-600 mb-6">페이스북에서 다양한 실 친구와<br />유용한 컨텐츠를 만나 보세요</p>
            <div className="mt-auto">
              <span className="inline-flex items-center px-6 py-3 rounded-full text-base font-medium text-blue-600 bg-white shadow-sm group-hover:bg-blue-50 transition-colors">
                바로가기 <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
} 