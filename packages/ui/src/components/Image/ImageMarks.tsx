import type { ReactNode } from 'react';
import type { ImageGlyphName } from './Image.missing';

/* The three marks the frame can draw. Split out of Image.tsx so the missing panel, the photo and
   the reference badge all reach for the same one. */

const GLYPH_PATHS: Record<ImageGlyphName, ReactNode> = {
  'no-image': (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="m5 17 4.5-4.5L13 16l2.5-2.5L21 19" />
      <path d="m3 3 18 18" />
    </>
  ),
  'no-cloud': (
    <>
      <path d="M7 18a4 4 0 0 1 .6-8 6 6 0 0 1 11.3 1.6A3.5 3.5 0 0 1 18 18z" />
      <path d="m3 3 18 18" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

export function Glyph({ name, size = 24 }: { name: ImageGlyphName; size?: number }) {
  return (
    <svg
      className="hg-image-glyph"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {GLYPH_PATHS[name]}
    </svg>
  );
}
