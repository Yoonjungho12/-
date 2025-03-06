/** @type {import('next').NextConfig} */
const nextConfig = {
  // 기존 설정들...
  images: {
    // domains: ['vejthvawsbsitttyiwzv.supabase.co'], // 간단 설정
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vejthvawsbsitttyiwzv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/gunma/**',
      },
    ],
  },
};

export default nextConfig;