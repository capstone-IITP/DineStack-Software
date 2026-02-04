import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === '1';

const nextConfig: NextConfig = {
  output: isVercel ? undefined : 'export',
  images: {
    unoptimized: true,
  },
  // Use relative paths for Electron file:// protocol, but not for Vercel
  assetPrefix: isVercel ? undefined : './',
  trailingSlash: true,
};

export default nextConfig;
