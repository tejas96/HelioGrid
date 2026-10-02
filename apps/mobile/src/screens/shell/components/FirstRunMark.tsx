import type { Shell } from '@heliogrid/data/react';
import { firstRunMarkLabels, firstRunMarkWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { CoachMark, firstRunMarkProps } from '@heliogrid/ui';
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
  return (
    <CoachMark
      {...firstRunMarkProps(
        inView,
        { ...words, ...firstRunMarkLabels(t, inView) },
        { onPass: shell.passCoachMark, onDismiss: shell.dismissCoachMarks },
      )}
      anchor={inView.mark === 'switch-home' ? anchors.switchHome : anchors.action}
      placement={inView.mark === 'switch-home' ? 'bottom' : 'top'}
    />
  );
}
