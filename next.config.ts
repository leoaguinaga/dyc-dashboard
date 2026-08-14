import type { NextConfig } from "next";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3333";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  async rewrites() {
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: `${BACKEND}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
