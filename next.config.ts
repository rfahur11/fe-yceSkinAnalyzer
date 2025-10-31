import type { NextConfig } from "next";

// In development, allow next/image to render without optimization to avoid private IP restrictions
const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  // Enable remote images from backend API (development localhost:8000)
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/api/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/api/**",
      },
    ],
    // Disable optimization in dev so next/image doesn't fetch upstream (avoids private IP block)
    unoptimized: isDev,
  },
};

export default nextConfig;
