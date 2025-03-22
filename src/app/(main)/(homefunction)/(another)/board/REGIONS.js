export const REGIONS = [
  // 상위 지역 (id=1~11)
  { id: 1,  name: "강남/서초/송파", parent_id: null, sort_order: 1,  region_slug: "강남-서초-송파" },
  { id: 2,  name: "서울",          parent_id: null, sort_order: 2,  region_slug: "서울" },
  { id: 3,  name: "수원/동탄/용인/화성/평택/오산", parent_id: null, sort_order: 3,  region_slug: "수원-동탄-용인-화성-평택-오산" },
  { id: 4,  name: "분당/성남/위례/경기광주/하남", parent_id: null, sort_order: 4,  region_slug: "분당-성남-위례-경기광주-하남" },
  { id: 5,  name: "인천/부천/부평", parent_id: null, sort_order: 5,  region_slug: "인천-부천-부평" },
  { id: 6,  name: "안양/군포/시흥/의왕", parent_id: null, sort_order: 6,  region_slug: "안양-군포-시흥-의왕" },
  { id: 7,  name: "일산/김포/파주/고양", parent_id: null, sort_order: 7,  region_slug: "일산-김포-파주-고양" },
  { id: 8,  name: "의정부/구리/남양주/포천/동두천", parent_id: null, sort_order: 8,  region_slug: "의정부-구리-남양주-포천-동두천" },
  { id: 9,  name: "대전/천안/세종/충청/강원", parent_id: null, sort_order: 9,  region_slug: "대전-천안-세종-충청-강원" },
  { id: 10, name: "부산/대구/울산/경상도/전라도/광주", parent_id: null, sort_order: 10, region_slug: "부산-대구-울산-경상도-전라도-광주" },
  { id: 11, name: "제주도", parent_id: null, sort_order: 11, region_slug: "제주도" },

  // 하위 지역 (id=13~...)
  // 상위=1 (강남/서초/송파)
  { id: 13, name: "강남구",       parent_id: 1, sort_order: 1,  region_slug: "강남구" },
  { id: 14, name: "서초구",       parent_id: 1, sort_order: 2,  region_slug: "서초구" },
  { id: 15, name: "송파구",       parent_id: 1, sort_order: 3,  region_slug: "송파구" },
  { id: 16, name: "신논현역/강남역", parent_id: 1, sort_order: 4,  region_slug: "신논현역-강남역" },
  { id: 17, name: "역삼/언주/매봉/양재", parent_id: 1, sort_order: 5,  region_slug: "역삼-언주-매봉-양재" },
  { id: 18, name: "선릉/대치",     parent_id: 1, sort_order: 6,  region_slug: "선릉-대치" },
  { id: 19, name: "학동/논현/청담/강남구청", parent_id: 1, sort_order: 7,  region_slug: "학동-논현-청담-강남구청" },
  { id: 20, name: "압구정/신사",    parent_id: 1, sort_order: 8,  region_slug: "압구정-신사" },
  { id: 21, name: "삼성역/선정릉역/삼성중앙역", parent_id: 1, sort_order: 9,  region_slug: "삼성역-선정릉역-삼성중앙역" },
  { id: 22, name: "서초역/교대역/이수역/방배역", parent_id: 1, sort_order: 10, region_slug: "서초역-교대역-이수역-방배역" },
  { id: 23, name: "잠실/송파",     parent_id: 1, sort_order: 11, region_slug: "잠실-송파" },
  { id: 24, name: "문정/장지/복정",  parent_id: 1, sort_order: 12, region_slug: "문정-장지-복정" },
  { id: 25, name: "가락/석촌",     parent_id: 1, sort_order: 13, region_slug: "가락-석촌" },
  { id: 26, name: "방이/삼전",     parent_id: 1, sort_order: 14, region_slug: "방이-삼전" },

  // 상위=2 (서울)
  { id: 27, name: "강북",        parent_id: 2, sort_order: 1,  region_slug: "강북" },
  { id: 28, name: "강서",        parent_id: 2, sort_order: 2,  region_slug: "강서" },
  { id: 29, name: "강동",        parent_id: 2, sort_order: 3,  region_slug: "강동" },
  { id: 30, name: "천호/암사",    parent_id: 2, sort_order: 4,  region_slug: "천호-암사" },
  { id: 31, name: "길동/둔촌",    parent_id: 2, sort_order: 5,  region_slug: "길동-둔촌" },
  { id: 32, name: "성북/도봉/노원/강북/수유/미아", parent_id: 2, sort_order: 6,  region_slug: "성북-도봉-노원-강북-수유-미아" },
  { id: 33, name: "중랑/상봉/망우/면목", parent_id: 2, sort_order: 7,  region_slug: "중랑-상봉-망우-면목" },
  { id: 34, name: "장한평/왕십리/답십리", parent_id: 2, sort_order: 8,  region_slug: "장한평-왕십리-답십리" },
  { id: 35, name: "광진구/건대/아차산/구의/성수/성동", parent_id: 2, sort_order: 9,  region_slug: "광진구-건대-아차산-구의-성수-성동" },
  { id: 36, name: "종로/동묘/신당/동대문/신설/제기", parent_id: 2, sort_order: 10,region_slug: "종로-동묘-신당-동대문-신설-제기" },
  { id: 37, name: "을지/명동/충무/서울역/회현", parent_id: 2, sort_order: 11,region_slug: "을지-명동-충무-서울역-회현" },
  { id: 38, name: "용산/신용산",    parent_id: 2, sort_order: 12,region_slug: "용산-신용산" },
  { id: 39, name: "불광/함정역/홍대/신촌/은평", parent_id: 2, sort_order: 13,region_slug: "불광-함정역-홍대-신촌-은평" },
  { id: 40, name: "마포구청/상암/북가좌", parent_id: 2, sort_order: 14,region_slug: "마포구청-상암-북가좌" },
  { id: 41, name: "마곡/송정/발산/가양/등촌/화곡", parent_id: 2, sort_order: 15,region_slug: "마곡-송정-발산-가양-등촌-화곡" },
  { id: 42, name: "양천/목동/당산/영등포/여의도", parent_id: 2, sort_order: 16,region_slug: "양천-목동-당산-영등포-여의도" },
  { id: 43, name: "구로구/금천구",   parent_id: 2, sort_order: 17,region_slug: "구로구-금천구" },
  { id: 44, name: "관악/봉천/신림/신대방/동작/사당/이수", parent_id: 2, sort_order: 18,region_slug: "관악-봉천-신림-신대방-동작-사당-이수" },

  // 상위=3(수원/동탄...)
  { id: 45, name: "수원",     parent_id: 3, sort_order: 1,  region_slug: "수원" },
  { id: 46, name: "팔달/수원역/영통/매교/장안/성균관대", parent_id: 3, sort_order: 2, region_slug: "팔달-수원역-영통-매교-장안-성균관대" },
  { id: 47, name: "인계동",   parent_id: 3, sort_order: 3,  region_slug: "인계동" },
  { id: 48, name: "권선/권선동/세류동/금곡동/호매실동", parent_id: 3, sort_order: 4, region_slug: "권선-권선동-세류동-금곡동-호매실동" },
  { id: 49, name: "화성/동탄/병점",  parent_id: 3, sort_order: 5,  region_slug: "화성-동탄-병점" },
  { id: 50, name: "용인/수지/광교",  parent_id: 3, sort_order: 6,  region_slug: "용인-수지-광교" },
  { id: 51, name: "광교",     parent_id: 3, sort_order: 7,  region_slug: "광교" },
  { id: 52, name: "오산/평택", parent_id: 3, sort_order: 8,  region_slug: "오산-평택" },
  { id: 53, name: "매탄동",   parent_id: 3, sort_order: 9,  region_slug: "매탄동" },

  // 상위=4(분당/성남/위례/경기광주/하남)
  { id: 54, name: "경기광주/이천/하남", parent_id: 4, sort_order: 1, region_slug: "경기광주-이천-하남" },
  { id: 55, name: "분당/성남",     parent_id: 4, sort_order: 2, region_slug: "분당-성남" },
  { id: 56, name: "모란/단대/중원/신흥/위례", parent_id: 4, sort_order: 3, region_slug: "모란-단대-중원-신흥-위례" },
  { id: 57, name: "오리/미금/정자",   parent_id: 4, sort_order: 4, region_slug: "오리-미금-정자" },
  { id: 58, name: "수내/서현",     parent_id: 4, sort_order: 5, region_slug: "수내-서현" },
  { id: 59, name: "판교/운중동",    parent_id: 4, sort_order: 6, region_slug: "판교-운중동" },
  { id: 60, name: "야탑",       parent_id: 4, sort_order: 7, region_slug: "야탑" },

  // 상위=5(인천/부천/부평)
  { id: 61, name: "인천시",   parent_id: 5, sort_order: 1,  region_slug: "인천시" },
  { id: 62, name: "부평구",   parent_id: 5, sort_order: 2,  region_slug: "부평구" },
  { id: 63, name: "부천시",   parent_id: 5, sort_order: 3,  region_slug: "부천시" },
  { id: 64, name: "계양구/마전동", parent_id: 5, sort_order: 4,  region_slug: "계양구-마전동" },
  { id: 65, name: "연희동/청라/검암/석남/검단", parent_id: 5, sort_order: 5, region_slug: "연희동-청라-검암-석남-검단" },
  { id: 66, name: "삼산/부평역,구청,시장", parent_id: 5, sort_order: 6, region_slug: "삼산-부평역-구청-시장" },
  { id: 67, name: "부개역,송내역",    parent_id: 5, sort_order: 7, region_slug: "부개역-송내역" },
  { id: 68, name: "구월/만수동",     parent_id: 5, sort_order: 8, region_slug: "구월-만수동" },
  { id: 69, name: "신중동,부천시청,부천역", parent_id: 5, sort_order: 9, region_slug: "신중동-부천시청-부천역" },
  { id: 70, name: "송도/연수/청학/영종도", parent_id: 5, sort_order: 10,region_slug: "송도-연수-청학-영종도" },
  { id: 71, name: "논현/소래/서창/호구포", parent_id: 5, sort_order: 11,region_slug: "논현-소래-서창-호구포" },
  { id: 72, name: "간석/동암",       parent_id: 5, sort_order: 12,region_slug: "간석-동암" },
  { id: 73, name: "주안/도화/송의/중산", parent_id: 5, sort_order: 13,region_slug: "주안-도화-송의-중산" },

  // 상위=6(안양/군포/시흥/의왕)
  { id: 74, name: "안양/의왕",    parent_id: 6, sort_order: 1, region_slug: "안양-의왕" },
  { id: 75, name: "안산",       parent_id: 6, sort_order: 2, region_slug: "안산" },
  { id: 76, name: "광명/군포,산본/인근", parent_id: 6, sort_order: 3, region_slug: "광명-군포-산본-인근" },
  { id: 77, name: "시흥/정왕/월곶/소래", parent_id: 6, sort_order: 4, region_slug: "시흥-정왕-월곶-소래" },

  // 상위=7(일산/김포/파주/고양)
  { id: 78, name: "고양/일산",    parent_id: 7, sort_order: 1, region_slug: "고양-일산" },
  { id: 79, name: "김포",       parent_id: 7, sort_order: 2, region_slug: "김포" },
  { id: 80, name: "파주",       parent_id: 7, sort_order: 3, region_slug: "파주" },

  // 상위=8(의정부/구리/남양주/포천/동두천)
  { id: 81, name: "구리/남양주", parent_id: 8, sort_order: 1, region_slug: "구리-남양주" },
  { id: 82, name: "의정부/양주/동두천/포천", parent_id: 8, sort_order: 2, region_slug: "의정부-양주-동두천-포천" },

  // 상위=9(대전/천안/세종/충청/강원)
  { id: 83, name: "천안/충청",   parent_id: 9, sort_order: 1, region_slug: "천안-충청" },
  { id: 84, name: "대전",       parent_id: 9, sort_order: 2, region_slug: "대전" },
  { id: 85, name: "세종",       parent_id: 9, sort_order: 3, region_slug: "세종" },
  { id: 86, name: "충북",       parent_id: 9, sort_order: 4, region_slug: "충북" },
  { id: 87, name: "강원",       parent_id: 9, sort_order: 5, region_slug: "강원" },

  // 상위=10(부산/대구/울산/경상도/전라도/광주)
  { id: 88, name: "부산",       parent_id: 10, sort_order: 1, region_slug: "부산" },
  { id: 89, name: "대구",       parent_id: 10, sort_order: 2, region_slug: "대구" },
  { id: 90, name: "경남",       parent_id: 10, sort_order: 3, region_slug: "경남" },
  { id: 91, name: "경북",       parent_id: 10, sort_order: 4, region_slug: "경북" },
  { id: 92, name: "전남",       parent_id: 10, sort_order: 5, region_slug: "전남" },
  { id: 93, name: "전북",       parent_id: 10, sort_order: 6, region_slug: "전북" },
  { id: 94, name: "울산",       parent_id: 10, sort_order: 7, region_slug: "울산" },
  { id: 95, name: "광주",       parent_id: 10, sort_order: 8, region_slug: "광주" },

  // 상위=11(제주도)
  { id: 96, name: "제주시",    parent_id: 11, sort_order: 1, region_slug: "제주시" },
  { id: 97, name: "서귀포시",   parent_id: 11, sort_order: 2, region_slug: "서귀포시" },
];