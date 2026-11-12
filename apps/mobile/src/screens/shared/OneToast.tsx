import type { TranslatedText } from '@heliogrid/contracts';
import { toastHostWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { type FocusAfter, ToastHost } from '@heliogrid/ui';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { underPill } from '../shell/styles';

/** The one line an act leaves, as a screen's act state says it. */
export interface ToastLine {
  readonly tone: 'success' | 'warning';
  readonly title: TranslatedText;
  readonly undo?: { readonly label: TranslatedText; readonly onUndo: () => void };
  readonly duration?: number;
}

/**
 * A screen's one toast above the pill — the phone's adapter: the pill's clearance over the home
 * indicator. The item is held for as long as `fact` is the same act — a new item each render would
 * restart its clock.
 */
export function OneToast<Fact extends object>({
  fact,
  line,
  onDismiss,
  focusAfter,
}: {
  fact: Fact | null;
  line: (fact: Fact) => ToastLine;
  onDismiss: () => void;
  focusAfter: FocusAfter;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  // biome-ignore lint/correctness/useExhaustiveDependencies: held by its act — new words each render are the same words
  const toasts = useMemo(() => {
    if (fact === null) return [];
    const { undo, ...said } = line(fact);
    return [
      { id: 'act', ...said, ...(undo === undefined ? {} : { undo: { ...undo, focusAfter } }) },
    ];
  }, [fact]);
  return (
    <ToastHost
      toasts={toasts}
      onDismiss={onDismiss}
      {...toastHostWords(t)}
      focusAfter={focusAfter}
      offset={underPill(insets.bottom) + theme.spacing['sp-6']}
    />
  );
}
