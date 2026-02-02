import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Use relative paths for Electron file:// protocol
  assetPrefix: './',
  trailingSlash: true,
};

export default nextConfig;
