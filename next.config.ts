import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Development-only settings: only use onDemandEntries in dev mode
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 120 * 1000, // 2 minutes
      pagesBufferLength: 5,
    },
  }),
};

export default nextConfig;
