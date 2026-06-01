import type { NextConfig } from "next";

const BACKEND_API =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000/api"
    : "https://waste-management-app-five.vercel.app/api";

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
