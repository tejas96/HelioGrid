'use client';
import type { Shell } from '@heliogrid/data/react';
import { firstRunMarkLabels, firstRunMarkWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { CoachMark, firstRunMarkProps } from '@heliogrid/ui';
import type { RefObject } from 'react';

interface FirstRunMarkProps {
  shell: Pick<
    Shell,
    'coachMarkInView' | 'home' | 'centreVerb' | 'passCoachMark' | 'dismissCoachMarks'
  >;
  /** The page region the mark is drawn inside, so it never lies on the rail. */
  within: RefObject<HTMLElement | null>;
  anchors: {
    switchHome: RefObject<HTMLElement | null>;
    action: RefObject<HTMLElement | null>;
  };
}

/**
 * The one first-run mark in view (`M01-16`), on the control it names: the title that switches
 * homes, then the head's verb button. Both sit under their control — the web has no footer for the
 * second to rise from. The run's rules are `firstRunMarkProps`, shared with the phone.
 */
export function FirstRunMark({ shell, within, anchors }: FirstRunMarkProps) {
  const t = useTranslate();
  const inView = shell.coachMarkInView;
  const home = shell.home?.home;
  if (inView === null || home === undefined) return null;
  const words = firstRunMarkWords(t, inView.mark, home, shell.centreVerb);
  if (words === null) return null;
  return (
    <CoachMark
      {...firstRunMarkProps(
        inView,
        { ...words, ...firstRunMarkLabels(t, inView) },
        { onPass: shell.passCoachMark, onDismiss: shell.dismissCoachMarks },
      )}
      anchor={inView.mark === 'switch-home' ? anchors.switchHome : anchors.action}
      within={within}
      placement="bottom"
    />
  );
}
