'use client';
import type { TranslatedText } from '@heliogrid/contracts';

/**
 * The height view's key (`T-M05-002`, part g, board G7 and G25): the colours low to high, and the
 * two ends — heights in the reader's units, or the share of the year's sun.
 */
export function StudioHeightKey({
  name,
  sun,
  low,
  high,
  inPanel,
}: {
  name: TranslatedText;
  /** Sunlight's key, else the heights'. */
  sun: boolean;
  low: string;
  high: string;
  /** Inside the View panel; else on the map while the view is on. */
  inPanel: boolean;
}) {
  return (
    <div
      className={inPanel ? 'hg-studio-key' : 'hg-studio-key hg-studio-glass'}
      data-in={inPanel ? 'panel' : 'map'}
      data-sun={sun}
      role="img"
      aria-label={`${name}: ${low} – ${high}`}
    >
      <span className="hg-studio-key-bar" />
      <span className="hg-studio-key-ends">
        <span>{low}</span>
        <span>{high}</span>
      </span>
    </div>
  );
}
