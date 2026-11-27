'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import {
  HEIGHT_DATA_QUALITIES,
  HEIGHT_DATA_SHARPNESS_M,
  type HeightDataQuality,
  SITE_DATA_CREDITS,
  type SiteDataCredit,
  type SiteDataSource,
} from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import type { useFormat } from '@heliogrid/ui';
import type { StraightDown } from './StudioPictureChip';

const isQuality = (word: string | null): word is HeightDataQuality =>
  (HEIGHT_DATA_QUALITIES as readonly (string | null)[]).includes(word);
const isCredit = (word: string): word is SiteDataCredit =>
  (SITE_DATA_CREDITS as readonly string[]).includes(word);

/**
 * What the picture panel shows of the site's data: the straight-down picture's row, where Google's
 * height data holds one — its line carries the height data's date — and the data's credits.
 */
export function pictureDataOf(
  studio: StudioScreen,
  words: StudioCanvasWords,
  format: ReturnType<typeof useFormat>,
): {
  straight: StraightDown | null;
  dataCredits: readonly TranslatedText[];
} {
  const { site, units } = studio;
  const data = site.read.kind === 'ready' ? site.read.value : null;
  if (data === null) return { straight: null, dataCredits: [] };
  const quality = isQuality(data.quality) ? data.quality : null;
  const sharpness =
    quality === null ? null : format.fineLength(HEIGHT_DATA_SHARPNESS_M[quality], units);
  const date = data.dataOn === null ? null : format.date(data.dataOn);
  const source = (
    data.source === 'google_solar' || data.source === 'openstreetmap' ? data.source : 'none'
  ) as SiteDataSource;
  const straight: StraightDown | null =
    source === 'google_solar' && sharpness !== null && date !== null
      ? {
          line: words.siteStraightDownLine(words.source('google_solar'), sharpness, date),
          on: site.straightDown,
          onPick: site.showStraightDown,
        }
      : null;
  return {
    straight,
    // The far horizon's credit stands on the sun chart, where its data shows.
    dataCredits: data.credits
      .filter(isCredit)
      .filter((credit) => credit !== 'pvgis')
      .map(words.siteCredit),
  };
}
