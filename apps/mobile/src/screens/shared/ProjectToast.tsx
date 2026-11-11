import type { ProjectScreen } from '@heliogrid/data/react';
import { UNDO_TOAST_MS } from '@heliogrid/domain';
import { type ProjectToastCopy, toastHostWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { type FocusAfter, ToastHost } from '@heliogrid/ui';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { underPill } from '../shell/styles';

/**
 * An act's one line above the pill, with its *Undo* where a person's own move can be taken back
 * (ruling 16) — the phone's adapter: the pill's clearance over the home indicator. The item is held
 * by its toast: a new item each render would restart its clock.
 */
export function ProjectToast({
  screen,
  words,
  focusAfter,
}: {
  screen: ProjectScreen;
  words: ProjectToastCopy;
  focusAfter: FocusAfter;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { toast, undo } = screen;
  // biome-ignore lint/correctness/useExhaustiveDependencies: held by its toast — new words each render are the same words
  const toasts = useMemo(
    () =>
      toast === null
        ? []
        : [
            {
              id: 'project',
              tone: 'success' as const,
              title: words.title(toast),
              ...('undoable' in toast && toast.undoable
                ? { undo: { label: words.undo, onUndo: undo, focusAfter }, duration: UNDO_TOAST_MS }
                : {}),
            },
          ],
    [toast],
  );
  return (
    <ToastHost
      toasts={toasts}
      onDismiss={screen.dismissToast}
      {...toastHostWords(t)}
      focusAfter={focusAfter}
      offset={underPill(insets.bottom) + theme.spacing['sp-6']}
    />
  );
}
