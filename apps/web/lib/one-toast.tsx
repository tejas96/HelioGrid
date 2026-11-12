'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { toastHostWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { type FocusAfter, ToastHost } from '@heliogrid/ui';
import { useMemo } from 'react';

/** The one line an act leaves, as a screen's act state says it. */
export interface ToastLine {
  readonly tone: 'success' | 'warning';
  readonly title: TranslatedText;
  readonly undo?: { readonly label: TranslatedText; readonly onUndo: () => void };
  readonly duration?: number;
}

/**
 * A screen's one toast: the act it reports, said once. The item is held for as long as `fact` is
 * the same act — a new item each render would restart its clock.
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
    />
  );
}
