import type { NextConfig } from "next";

const isPagesExport = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isPagesExport ? { output: "export" } : {}),
  basePath: "",
  serverExternalPackages: ['@resvg/resvg-wasm'],
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/services/hydrafacial',
        destination: '/services/keravive-hydrafacial',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
