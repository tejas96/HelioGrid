import type { BillingHomeScreen } from '@heliogrid/data/react';
import { billingActFailureWords, billingRecordWords, toastHostWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { type FocusAfter, ToastHost, useFormat, useToasts } from '@heliogrid/ui';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { underPill } from '../../shell/styles';

/**
 * What a landed act says once — cancelled to its last day, refunded with the credit note — and a
 * PDF that would not open, said over the list it was asked from. Each is told once as it arrives;
 * the host stands above the pill, which the package cannot see.
 */
export function BillingToasts({
  screen,
  focusAfter,
}: {
  screen: BillingHomeScreen;
  /** Where the screen reader goes once a toast is closed — the page it spoke about. */
  focusAfter: FocusAfter;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { date } = useFormat();
  const toasts = useToasts();
  const { push } = toasts;
  const { done, failure, clearDone, clearFailure } = screen;
  useEffect(() => {
    /* A kept plan says nothing: its need swapping away is what changed (frame 16). */
    if (done === null || done.kind === 'kept') return;
    const words = billingRecordWords(t);
    push({
      tone: 'success',
      title:
        done.kind === 'cancelled'
          ? words.cancelledToast(date(done.runsUntil))
          : words.refundedToast(done.creditNoteNumber),
    });
    clearDone();
  }, [done, push, clearDone, t, date]);
  useEffect(() => {
    if (failure?.act !== 'pdf') return;
    push({ tone: 'danger', title: billingActFailureWords(t, failure.why) });
    clearFailure();
  }, [failure, push, clearFailure, t]);
  return (
    <ToastHost
      toasts={toasts.toasts}
      onDismiss={toasts.dismiss}
      {...toastHostWords(t)}
      focusAfter={focusAfter}
      offset={underPill(insets.bottom) + theme.spacing['sp-6']}
    />
  );
}
