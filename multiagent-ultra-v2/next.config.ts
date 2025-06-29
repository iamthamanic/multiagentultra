import type { NextConfig } from "next";

// Clean App Router config
const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["localhost"],
  },
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
