import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // Increase this limit as needed, e.g., '10mb', '50mb'
    },
  },
};

export default nextConfig;
