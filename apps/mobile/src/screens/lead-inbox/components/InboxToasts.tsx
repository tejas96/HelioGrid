import type { InboxActNote, InboxBulkReport } from '@heliogrid/data/react';
import { bulkAssignToasts, inboxNoteToast, toastHostWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { type FocusAfter, ToastHost } from '@heliogrid/ui';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { underPill } from '../../shell/styles';

/**
 * The inbox acts' toasts above the pill — a bulk assign's one line (`M02-29`), a single give, and
 * a junk with its *Undo* (`inboxNoteToast`, the web's too) — the phone's adapter: the pill's
 * clearance over the home indicator. Each item is held by its report or note: a new item each
 * render would restart its timer.
 */
export function InboxToasts({
  report,
  note,
  onUndo,
  onDismissReport,
  onDismissNote,
  focusAfter,
}: {
  report: InboxBulkReport | null;
  note: InboxActNote | null;
  onUndo: () => void;
  onDismissReport: () => void;
  onDismissNote: () => void;
  focusAfter: FocusAfter;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const toasts = useMemo(
    () => [
      ...bulkAssignToasts(t, report),
      ...(note === null ? [] : [inboxNoteToast(t, note, { onUndo, focusAfter })]),
    ],
    [report, note, onUndo, focusAfter, t],
  );
  return (
    <ToastHost
      toasts={toasts}
      onDismiss={(id) => (id === 'bulk' ? onDismissReport() : onDismissNote())}
      {...toastHostWords(t)}
      focusAfter={focusAfter}
      offset={underPill(insets.bottom) + theme.spacing['sp-6']}
    />
  );
}
