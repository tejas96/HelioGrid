import type { Shell } from '@heliogrid/data/react';
import { SHELL, switchMarkWords, verbMarkWords } from '@heliogrid/i18n';
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
 * says nothing. Nothing shows while the count is unknown (`marksToShow`).
 */
export function FirstRunMark({ shell, anchors }: FirstRunMarkProps) {
  const t = useTranslate();
  const [mark] = shell.coachMarksToShow;
  const home = shell.home?.home;
  if (mark === undefined || home === undefined) return null;
  const step = shell.coachMarks.indexOf(mark) + 1;
  const total = shell.coachMarks.length;
  const verb = shell.centreVerb;
  // The action's mark is listed only with a verb (`firstRunMarksFor`), so a null one shows nothing.
  const words =
    mark === 'switch-home'
      ? switchMarkWords(t, home)
      : verb === null
        ? null
        : verbMarkWords(t, verb);
  if (words === null) return null;
  const counted = total > 1;
  return (
    <CoachMark
      open
      anchor={mark === 'switch-home' ? anchors.switchHome : anchors.action}
      title={words.title}
      body={words.body}
      placement={mark === 'switch-home' ? 'bottom' : 'top'}
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
