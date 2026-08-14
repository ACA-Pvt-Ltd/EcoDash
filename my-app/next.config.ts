import type { NextConfig } from "next";

const BACKEND_API =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://eco-dash-tawny.vercel.app/api";

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
