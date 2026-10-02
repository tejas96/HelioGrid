import type { Shell } from '@heliogrid/data/react';
import { firstRunMarkWords, SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { CoachMark } from '@heliogrid/ui';
import type { RefObject } from 'react';
import type { View } from 'react-native';

interface FirstRunMarkProps {
  shell: Shell;
  anchors: { switchHome: RefObject<View | null>; action: RefObject<View | null> };
}

/**
 * ONE mark at a time, never a carousel (`M01-16`): the first not yet passed, pointing at its own
 * control. Next passes it; Got it passes them all. A single mark shows no counter — "1 of 1"
 * says nothing. Nothing shows while the count is unknown.
 */
export function FirstRunMark({ shell, anchors }: FirstRunMarkProps) {
  const t = useTranslate();
  const inView = shell.coachMarkInView;
  const home = shell.home?.home;
  if (inView === null || home === undefined) return null;
  const words = firstRunMarkWords(t, inView.mark, home, shell.centreVerb);
  if (words === null) return null;
  const { step, total } = inView;
  const counted = total > 1;
  return (
    <CoachMark
      open
      anchor={inView.mark === 'switch-home' ? anchors.switchHome : anchors.action}
      title={words.title}
      body={words.body}
      placement={inView.mark === 'switch-home' ? 'bottom' : 'top'}
      step={counted ? step : undefined}
      total={counted ? total : undefined}
      counterLabel={t(SHELL.markCount, { step, total })}
      dismissLabel={t(SHELL.gotIt)}
      nextLabel={step < total ? t(SHELL.next) : t(SHELL.gotIt)}
      onNext={step < total ? () => shell.passCoachMark(step) : undefined}
      onDismiss={shell.dismissCoachMarks}
      ring
    />
  );
}
