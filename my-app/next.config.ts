import type { NextConfig } from "next";

const BACKEND_API = "https://waste-management-app-five.vercel.app/api";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_API}/:path*`,
      },
    ];
  },
};

export default nextConfig;
