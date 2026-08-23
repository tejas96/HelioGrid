import type { NextConfig } from 'next';

/**
 * apps/web is pure frontend/BFF — no domain logic (CLAUDE.md). Route handlers exist only
 * for cookie/session BFF glue; everything domain-shaped calls apps/api via ts-rest.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // transpilePackages: re-add '@heliogrid/ui' and '@heliogrid/theme' when the screens land
  // (they ship SOURCE, not dist). docs/17-ui-architecture-v2.md; docs/harness/README.md.
};

export default nextConfig;
