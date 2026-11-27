'use client';
import type { TranslatedText } from '@heliogrid/contracts';

/**
 * LiDAR's key (`T-M05-002g`, board frames 5 and 7): its name, the colours low to high, and the two
 * ends — heights in the reader's units, or the share of the year's sun.
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
  /** Inside a panel, under the switch it belongs to; else on the map. */
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
      {inPanel ? null : <span className="hg-studio-key-name">{name}</span>}
      <span className="hg-studio-key-bar" />
      <span className="hg-studio-key-ends">
        <span>{low}</span>
        <span>{high}</span>
      </span>
    </div>
  );
}
