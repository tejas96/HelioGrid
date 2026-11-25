import type { NextConfig } from 'next';

/**
 * apps/web is pure frontend/BFF — no domain logic (CLAUDE.md). Route handlers exist only
 * for cookie/session BFF glue; everything domain-shaped calls apps/api via ts-rest.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  transpilePackages: ['@heliogrid/ui', '@heliogrid/theme'],
};

export default nextConfig;
