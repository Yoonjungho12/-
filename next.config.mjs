// next.config.mjs
import bundleAnalyzer from "@next/bundle-analyzer";

// 1) bundleAnalyzer를 import한 뒤 옵션을 넘겨준다.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// 2) Next.js 설정(ESM 형식)
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vejthvawsbsitttyiwzv.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/gunma/**",
      },
       {
        protocol: "https",
        hostname: "zuxdcurogblcfkedqgvy.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/here-it-is/**",
      },
      {
        protocol: "https",
        hostname: "cdn.vipgunma.com",
        port: "",
        pathname: "/assets/banner/**",
      },
    ],
  },
  // etc ...
};

// 3) withBundleAnalyzer로 감싸서 export
export default withBundleAnalyzer(nextConfig);