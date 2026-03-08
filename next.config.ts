import type { NextConfig } from "next";

const isPagesExport = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isPagesExport ? { output: "export" } : {}),
  basePath: "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
