'use client';
import { useQuickAddScreen } from '@heliogrid/data/react';
import { quickAddDoneToast, quickAddWords, toastHostWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  EditorSurface,
  type FocusAfter,
  QuickAddForm,
  quickAddFormPropsOf,
  quickAddSurfaceOf,
  ToastHost,
  useFormat,
  useToasts,
} from '@heliogrid/ui';
import { notFound } from 'next/navigation';
import { useReopenOnArrival } from '../hooks/use-reopen-on-arrival';
import { QuickAddDuplicateSheet } from './QuickAddDuplicateSheet';

/**
 * Quick add on the web (`SCR-M02-01`): the four fields in a side panel from the editor breakpoint
 * up and a sheet below it, the duplicate sheet over them, and the toast a finished capture leaves.
 * Everything it reads, checks and sends is `useQuickAddScreen`'s, the phone's too; this composes.
 * `onLeft` is the route's move once the panel has gone — closed, or its capture finished.
 */
export function QuickAddLead({
  referredBy,
  onLeft,
  onOpenLead,
  focusAfter,
}: {
  referredBy: string | null;
  onLeft: () => void;
  onOpenLead: (address: string) => void;
  /** Where focus lands once the toast is closed: the page the capture stood over. */
  focusAfter: FocusAfter;
}) {
  const t = useTranslate();
  const format = useFormat();
  const toasts = useToasts();
  const screen = useQuickAddScreen({
    pack: format.pack,
    referredBy,
    onClosed: onLeft,
    onOpenLead,
    onDone: (done) => {
      toasts.push(quickAddDoneToast(t, done, screen.openLead));
      onLeft();
    },
  });
  useReopenOnArrival(screen.reopen);
  /* A person who may not add a lead meets the page that does not exist (`F7-48`). */
  if (!screen.allowed) notFound();

  const { referrer } = screen;
  const words = quickAddWords(t, {
    check: screen.check,
    phoneRefusal: screen.phoneRefusal,
    saveFailure: screen.saveFailure,
    referrer: referrer === null ? null : (referrer.name ?? format.phone(referrer.phoneE164)),
  });
  return (
    <>
      <EditorSurface {...quickAddSurfaceOf(screen, words)}>
        <QuickAddForm {...quickAddFormPropsOf(screen, words)} />
      </EditorSurface>
      <QuickAddDuplicateSheet screen={screen} />
      <ToastHost
        toasts={toasts.toasts}
        onDismiss={toasts.dismiss}
        {...toastHostWords(t)}
        focusAfter={focusAfter}
      />
    </>
  );
}
