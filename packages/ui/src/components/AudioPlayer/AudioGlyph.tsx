import type { ReactNode } from 'react';
import type { AudioGlyphName } from './AudioPlayer.types';

const STROKED: Record<Exclude<AudioGlyphName, 'play' | 'pause'>, ReactNode> = {
  back: <path d="M11 6 5 12l6 6M19 6l-6 6 6 6" />,
  fwd: <path d="M13 6l6 6-6 6M5 6l6 6-6 6" />,
  'mic-off': (
    <>
      <path d="M9 9V6a3 3 0 0 1 5.5-1.7" />
      <path d="M15 11v-1" />
      <path d="M19 11a7 7 0 0 1-10.4 6.1M5 11a7 7 0 0 0 2 4.9" />
      <path d="M12 18v3" />
      <path d="m3 3 18 18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
};

/** The transport and reason glyphs. Play and pause are filled; the rest are stroked. */
export function AudioGlyph({ name, size = 20 }: { name: AudioGlyphName; size?: number }) {
  if (name === 'play' || name === 'pause') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        role="presentation"
      >
        {name === 'play' ? (
          <path d="M8 5.2v13.6L19 12z" />
        ) : (
          <>
            <rect x="7" y="5" width="3.6" height="14" rx="1.2" />
            <rect x="13.4" y="5" width="3.6" height="14" rx="1.2" />
          </>
        )}
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="presentation"
    >
      {STROKED[name]}
    </svg>
  );
}
