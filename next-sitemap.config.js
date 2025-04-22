/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://yeogidot.com',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 7000,
  exclude: [
    '/api/*',
    '/master/*',
    '/server-sitemap.xml',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api',
          '/master',
        ],
      },
    ],
    additionalSitemaps: [
      'https://yeogidot.com/server-sitemap.xml',
    ],
  },
  additionalPaths: async (config) => {
    // Today용 지역 구조 (기존 구조 유지)
    const todayMainRegions = [
      { name: '전체', region_slug: '전체' },
      { name: '서울', region_slug: '서울' },
      { name: '경기', region_slug: '경기' },
      { name: '인천', region_slug: '인천' },
      { name: '강원', region_slug: '강원' },
      { name: '충북', region_slug: '충북' },
      { name: '충남', region_slug: '충남' },
      { name: '대전', region_slug: '대전' },
      { name: '세종', region_slug: '세종' },
      { name: '전북', region_slug: '전북' },
      { name: '전남', region_slug: '전남' },
      { name: '광주', region_slug: '광주' },
      { name: '경북', region_slug: '경북' },
      { name: '경남', region_slug: '경남' },
      { name: '대구', region_slug: '대구' },
      { name: '울산', region_slug: '울산' },
      { name: '부산', region_slug: '부산' },
      { name: '제주', region_slug: '제주' },
    ];

    // Board와 Club용 새로운 지역 구조
    const boardClubMainRegions = [
      { name: '강남-서초-송파', region_slug: '강남-서초-송파' },
      { name: '서울', region_slug: '서울' },
      { name: '수원-동탄-용인-화성-평택-오산', region_slug: '수원-동탄-용인-화성-평택-오산' },
      { name: '분당-성남-위례-경기광주-하남', region_slug: '분당-성남-위례-경기광주-하남' },
      { name: '인천-부천-부평', region_slug: '인천-부천-부평' },
      { name: '안양-군포-시흥-의왕', region_slug: '안양-군포-시흥-의왕' },
      { name: '일산-김포-파주-고양', region_slug: '일산-김포-파주-고양' },
      { name: '의정부-구리-남양주-포천-동두천', region_slug: '의정부-구리-남양주-포천-동두천' },
      { name: '대전-천안-세종-충청-강원', region_slug: '대전-천안-세종-충청-강원' },
      { name: '부산-대구-울산-경상도-전라도-광주', region_slug: '부산-대구-울산-경상도-전라도-광주' },
      { name: '제주도', region_slug: '제주도' },
    ];

    const boardClubSubRegions = {
      '강남-서초-송파': [
        { name: '강남구', region_slug: '강남구' },
        { name: '서초구', region_slug: '서초구' },
        { name: '송파구', region_slug: '송파구' },
        { name: '신논현역-강남역', region_slug: '신논현역-강남역' },
        { name: '역삼-언주-매봉-양재', region_slug: '역삼-언주-매봉-양재' },
        { name: '선릉-대치', region_slug: '선릉-대치' },
        { name: '학동-논현-청담-강남구청', region_slug: '학동-논현-청담-강남구청' },
        { name: '압구정-신사', region_slug: '압구정-신사' },
        { name: '삼성역-선정릉역-삼성중앙역', region_slug: '삼성역-선정릉역-삼성중앙역' },
        { name: '서초역-교대역-이수역-방배역', region_slug: '서초역-교대역-이수역-방배역' },
        { name: '잠실-송파', region_slug: '잠실-송파' },
        { name: '문정-장지-복정', region_slug: '문정-장지-복정' },
        { name: '가락-석촌', region_slug: '가락-석촌' },
        { name: '방이-삼전', region_slug: '방이-삼전' },
      ],
      '서울': [
        { name: '강북', region_slug: '강북' },
        { name: '강서', region_slug: '강서' },
        { name: '강동', region_slug: '강동' },
        { name: '천호-암사', region_slug: '천호-암사' },
        { name: '길동-둔촌', region_slug: '길동-둔촌' },
        { name: '성북-도봉-노원-강북-수유-미아', region_slug: '성북-도봉-노원-강북-수유-미아' },
        { name: '중랑-상봉-망우-면목', region_slug: '중랑-상봉-망우-면목' },
        { name: '장한평-왕십리-답십리', region_slug: '장한평-왕십리-답십리' },
        { name: '광진구-건대-아차산-구의-성수-성동', region_slug: '광진구-건대-아차산-구의-성수-성동' },
        { name: '종로-동묘-신당-동대문-신설-제기', region_slug: '종로-동묘-신당-동대문-신설-제기' },
        { name: '을지-명동-충무-서울역-회현', region_slug: '을지-명동-충무-서울역-회현' },
        { name: '용산-신용산', region_slug: '용산-신용산' },
        { name: '불광-함정역-홍대-신촌-은평', region_slug: '불광-함정역-홍대-신촌-은평' },
        { name: '마포구청-상암-북가좌', region_slug: '마포구청-상암-북가좌' },
        { name: '마곡-송정-발산-가양-등촌-화곡', region_slug: '마곡-송정-발산-가양-등촌-화곡' },
        { name: '양천-목동-당산-영등포-여의도', region_slug: '양천-목동-당산-영등포-여의도' },
        { name: '구로구-금천구', region_slug: '구로구-금천구' },
        { name: '관악-봉천-신림-신대방-동작-사당-이수', region_slug: '관악-봉천-신림-신대방-동작-사당-이수' },
      ],
      '수원-동탄-용인-화성-평택-오산': [
        { name: '수원', region_slug: '수원' },
        { name: '팔달-수원역-영통-매교-장안-성균관대', region_slug: '팔달-수원역-영통-매교-장안-성균관대' },
        { name: '인계동', region_slug: '인계동' },
        { name: '권선-권선동-세류동-금곡동-호매실동', region_slug: '권선-권선동-세류동-금곡동-호매실동' },
        { name: '화성-동탄-병점', region_slug: '화성-동탄-병점' },
        { name: '용인-수지-광교', region_slug: '용인-수지-광교' },
        { name: '광교', region_slug: '광교' },
        { name: '오산-평택', region_slug: '오산-평택' },
        { name: '매탄동', region_slug: '매탄동' },
      ],
      '분당-성남-위례-경기광주-하남': [
        { name: '경기광주-이천-하남', region_slug: '경기광주-이천-하남' },
        { name: '분당-성남', region_slug: '분당-성남' },
        { name: '모란-단대-중원-신흥-위례', region_slug: '모란-단대-중원-신흥-위례' },
        { name: '오리-미금-정자', region_slug: '오리-미금-정자' },
        { name: '수내-서현', region_slug: '수내-서현' },
        { name: '판교-운중동', region_slug: '판교-운중동' },
        { name: '야탑', region_slug: '야탑' },
      ],
      '인천-부천-부평': [
        { name: '인천시', region_slug: '인천시' },
        { name: '부평구', region_slug: '부평구' },
        { name: '부천시', region_slug: '부천시' },
        { name: '계양구-마전동', region_slug: '계양구-마전동' },
        { name: '연희동-청라-검암-석남-검단', region_slug: '연희동-청라-검암-석남-검단' },
        { name: '삼산-부평역-구청-시장', region_slug: '삼산-부평역-구청-시장' },
        { name: '부개역-송내역', region_slug: '부개역-송내역' },
        { name: '구월-만수동', region_slug: '구월-만수동' },
        { name: '신중동-부천시청-부천역', region_slug: '신중동-부천시청-부천역' },
        { name: '송도-연수-청학-영종도', region_slug: '송도-연수-청학-영종도' },
        { name: '논현-소래-서창-호구포', region_slug: '논현-소래-서창-호구포' },
        { name: '간석-동암', region_slug: '간석-동암' },
        { name: '주안-도화-송의-중산', region_slug: '주안-도화-송의-중산' },
      ],
      '안양-군포-시흥-의왕': [
        { name: '안양-의왕', region_slug: '안양-의왕' },
        { name: '안산', region_slug: '안산' },
        { name: '광명-군포-산본-인근', region_slug: '광명-군포-산본-인근' },
        { name: '시흥-정왕-월곶-소래', region_slug: '시흥-정왕-월곶-소래' },
      ],
      '일산-김포-파주-고양': [
        { name: '고양-일산', region_slug: '고양-일산' },
        { name: '김포', region_slug: '김포' },
        { name: '파주', region_slug: '파주' },
      ],
      '의정부-구리-남양주-포천-동두천': [
        { name: '구리-남양주', region_slug: '구리-남양주' },
        { name: '의정부-양주-동두천-포천', region_slug: '의정부-양주-동두천-포천' },
      ],
      '대전-천안-세종-충청-강원': [
        { name: '천안-충청', region_slug: '천안-충청' },
        { name: '대전', region_slug: '대전' },
        { name: '세종', region_slug: '세종' },
        { name: '충북', region_slug: '충북' },
        { name: '강원', region_slug: '강원' },
      ],
      '부산-대구-울산-경상도-전라도-광주': [
        { name: '부산', region_slug: '부산' },
        { name: '대구', region_slug: '대구' },
        { name: '경남', region_slug: '경남' },
        { name: '경북', region_slug: '경북' },
        { name: '전남', region_slug: '전남' },
        { name: '전북', region_slug: '전북' },
        { name: '울산', region_slug: '울산' },
        { name: '광주', region_slug: '광주' },
      ],
      '제주도': [
        { name: '제주시', region_slug: '제주시' },
        { name: '서귀포시', region_slug: '서귀포시' },
      ],
    };

    const themes = [
      { name: '전체', theme_slug: '전체' },
      { name: '신규업체', theme_slug: '신규업체' },
      { name: '눈썹문신', theme_slug: '눈썹문신' },
      { name: '애견펜션', theme_slug: '애견펜션' },
      { name: '사주', theme_slug: '사주' },
      { name: '타로', theme_slug: '타로' },
      { name: '아이폰-스냅', theme_slug: '아이폰-스냅' },
      { name: '웨딩플래너', theme_slug: '웨딩플래너' },
      { name: '룸카페', theme_slug: '룸카페' },
      { name: '성인용품', theme_slug: '성인용품' },
      { name: '클럽', theme_slug: '클럽' },
      { name: '나이트클럽', theme_slug: '나이트클럽' },
      { name: '네일샵', theme_slug: '네일샵' },
      { name: '애견미용', theme_slug: '애견미용' },
      { name: '태닝샵', theme_slug: '태닝샵' },
      { name: '왁싱샵', theme_slug: '왁싱샵' },
      { name: '라운지바', theme_slug: '라운지바' },
      { name: '헌팅포차', theme_slug: '헌팅포차' },
      { name: '바', theme_slug: '바' },
      { name: '감성주점', theme_slug: '감성주점' },
    ];

    const generateUrls = (mainRegion, subRegion, theme, path) => {
      return {
        loc: `https://yeogidot.com/${path}/${mainRegion.region_slug}/${subRegion.region_slug}/${theme.theme_slug}`,
        changefreq: 'daily',
        priority: 0.8,
      };
    };

    const result = [];

    // 루트 페이지 추가
    result.push({
      loc: 'https://yeogidot.com/',
      changefreq: 'daily',
      priority: 1.0,
    });

    // 정적 페이지 추가
    const staticPages = [
      { path: '/login', priority: 0.7 },
      { path: '/signup', priority: 0.7 },
      { path: '/change-password', priority: 0.7 },
      { path: '/auth/callback', priority: 0.7 },
      { path: '/email-confirmation', priority: 0.7 },
      { path: '/mypage', priority: 0.8 },
      { path: '/mypage/account-setting', priority: 0.7 },
      { path: '/mypage/myComments', priority: 0.7 },
      { path: '/mypage/myCommunityPosts', priority: 0.7 },
      { path: '/messages', priority: 0.7 },
      { path: '/near-me', priority: 0.8 },
      { path: '/partnership', priority: 0.8 },
      { path: '/all', priority: 0.7 },
    ];

    staticPages.forEach(page => {
      result.push({
        loc: `https://yeogidot.com${page.path}`,
        changefreq: 'daily',
        priority: page.priority,
      });
    });

    // Supabase에서 partnershipsubmit 테이블의 id 가져오기
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
      const { data: posts, error } = await supabase
        .from('partnershipsubmit')
        .select('id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 상세 페이지 URL 추가
      posts.forEach(post => {
        result.push({
          loc: `https://yeogidot.com/board/details/${post.id}`,
          lastmod: post.created_at,
          changefreq: 'daily',
          priority: 0.8,
        });
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
    }

    // Today URL 생성 (기존 구조)
    todayMainRegions.forEach(mainRegion => {
      themes.forEach(theme => {
        result.push(generateUrls(mainRegion, { region_slug: '전체' }, theme, 'today'));
      });
    });

    // Board와 Club URL 생성 (새로운 구조)
    boardClubMainRegions.forEach(mainRegion => {
      const subRegionsList = boardClubSubRegions[mainRegion.name] || [];
      
      if (subRegionsList.length === 0) {
        themes.forEach(theme => {
          result.push(generateUrls(mainRegion, { region_slug: '전체' }, theme, 'board'));
          result.push(generateUrls(mainRegion, { region_slug: '전체' }, theme, 'club'));
        });
      } else {
        subRegionsList.forEach(subRegion => {
          themes.forEach(theme => {
            result.push(generateUrls(mainRegion, subRegion, theme, 'board'));
            result.push(generateUrls(mainRegion, subRegion, theme, 'club'));
          });
        });
      }
    });

    return result;
  },
};

