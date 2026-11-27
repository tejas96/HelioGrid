'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import { SUNLIGHT_KEY_FROM, SUNLIGHT_KEY_TO } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { useFormat } from '@heliogrid/ui';
import { StudioHeightKey } from './StudioHeightKey';

const PER_CENT = 100;

/**
 * LiDAR's key (`T-M05-002g`, board frames 5, 7, 15): Sunlight's colours from much shade to none
 * while Sunlight shows, else the heights' from the street to the highest roof near; none in Photo
 * without Sunlight, where no colour needs one.
 */
export function StudioLidarKey({
  studio,
  words,
  inPanel,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  /** Inside Move's Map tab, under its Sunlight switch; else on the 3D. */
  inPanel: boolean;
}) {
  const format = useFormat();
  const { view } = studio.lidar;
  const { key } = studio.site;
  if (view.sunlight) {
    const shareOf = (share: number) => words.sitePercent(format.number(share * PER_CENT));
    return (
      <StudioHeightKey
        name={words.lidarKeySun}
        sun
        low={shareOf(SUNLIGHT_KEY_FROM)}
        high={shareOf(SUNLIGHT_KEY_TO)}
        inPanel={inPanel}
      />
    );
  }
  if (view.look !== 'heights' || key === null) return null;
  const heightOf = (metres: number) => format.roofHeight(metres, studio.units);
  return (
    <StudioHeightKey
      name={words.lidarKeyHeights}
      sun={false}
      low={heightOf(key.lowM)}
      high={heightOf(key.highM)}
      inPanel={inPanel}
    />
  );
}
