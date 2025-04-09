/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cdn.vipgunma.com',
      'zuxdcurogblcfkedqgvy.supabase.co'
    ]
  },
  async rewrites() {
    return [
      {
        source: '/mok/mok_std_request',
        destination: 'https://dream-security.fly.dev/mok/mok_std_request',
      },
      {
        source: '/mok/mok_std_result',
        destination: 'https://dream-security.fly.dev/mok/mok_std_result',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/mok/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://www.yeogidot.com', // ✅ 여기에 도메인 확정
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  }
}

module.exports = nextConfig;