import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  outputFileTracingRoot: '/root/trustinn/client',
  onDemandEntries: {
    // Extend the default 2 minute retention period
    maxInactiveAge: 120 * 1000, // 2 minutes
    pagesBufferLength: 5,
  },
};

export default nextConfig;
