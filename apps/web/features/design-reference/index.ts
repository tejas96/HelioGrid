/**
 * The ONLY import surface `app/` may use for design-reference (ADR-0022, enforced by
 * dependency-cruiser `web-app-imports-feature-barrel-only`).
 */
export { DesignScreen } from './DesignScreen';
// GalleryScreen is NOT re-exported here — it is `'use client'` and this barrel is reached by
// the Server Component at /design. See ./gallery/index.ts. Import it from
// `features/design-reference/gallery`.
