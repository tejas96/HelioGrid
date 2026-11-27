'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import { FLOOR_CHOICES } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import type { useFormat } from '@heliogrid/ui';
import { StudioSiteChips } from './StudioSiteChips';

/**
 * The bar's message on the site's data (`T-M05-002`, part g, board group 6), as the bar draws
 * any message: its tone, title, line, chips or act. A reader who may only view gets the words.
 */
export function siteBarMessage(
  studio: StudioScreen,
  words: StudioCanvasWords,
  format: ReturnType<typeof useFormat>,
  editor: boolean,
) {
  const { site } = studio;
  const say = site.say;
  if (say === null) return null;
  const data = site.read.kind === 'ready' ? site.read.value : null;
  const dataOn = data?.dataOn ?? null;
  const month = dataOn === null ? null : format.monthYear(dataOn);
  const { title, line } = words.siteSay(say, month, editor);
  switch (say.kind) {
    case 'floors':
      return {
        tag: 'site-floors',
        tone: 'info' as const,
        title,
        line,
        chips: (
          <StudioSiteChips
            name={words.siteFloorsName}
            chips={FLOOR_CHOICES.map((floors) => ({
              key: String(floors),
              label: words.siteFloor(floors),
              onPress: () => site.setFloors(floors),
            }))}
          />
        ),
        fades: false,
      };
    case 'not_answered':
      return {
        tag: 'site-not-answered',
        tone: 'warning' as const,
        title,
        line,
        act: { label: words.tryAgain, onPress: site.retry },
      };
    default:
      // Where the heights came from, or that newer data moved them: said once, nothing to press.
      return { tag: `site-${say.kind}-${dataOn ?? ''}`, tone: 'info' as const, title, line };
  }
}
