import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/aprender', destination: '/pt/learn', permanent: true },
    ];
  },
};

export default nextConfig;
