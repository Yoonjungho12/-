/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://yeogidot.com',
  generateRobotsTxt: true,
  exclude: ['/api/*', '/master/*'],
  generateIndexSitemap: true,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 7000,
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://yeogidot.com/server-sitemap.xml'
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/*', '/master/*']
      }
    ]
  },
  additionalPaths: async (config) => {
    const regions = ['서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종', '전북', '전남', '광주', '경북', '경남', '대구', '울산', '부산', '제주'];
    const themes = ['맛집', '카페', '관광', '숙소', '액티비티'];
    
    const paths = [];
    
    // 지역별 경로
    regions.forEach(region => {
      paths.push({
        loc: `/search/${encodeURIComponent(region)}`,
        changefreq: 'daily',
        priority: 0.8,
      });
    });
    
    // 테마별 경로
    themes.forEach(theme => {
      paths.push({
        loc: `/search/theme/${encodeURIComponent(theme)}`,
        changefreq: 'daily',
        priority: 0.8,
      });
    });
    
    return paths;
  }
};