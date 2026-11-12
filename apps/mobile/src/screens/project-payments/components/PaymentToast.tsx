import type { PaymentsScreen } from '@heliogrid/data/react';
import type { paymentsPageWords } from '@heliogrid/i18n';
import type { FocusAfter } from '@heliogrid/ui';
import { OneToast } from '../../shared/OneToast';

/**
 * A money act's one line, with its one act where it has one (`paymentsPageWords`' `line`). Nothing
 * here undoes money: a payment is taken back with *Reverse*, which leaves its own record (`M11-46`).
 */
export function PaymentToast({
  screen,
  words,
  focusAfter,
}: {
  screen: PaymentsScreen;
  words: ReturnType<typeof paymentsPageWords>;
  focusAfter: FocusAfter;
}) {
  return (
    <OneToast
      fact={screen.toast}
      line={(toast) => words.line(toast, screen.toastAct)}
      onDismiss={screen.dismissToast}
      focusAfter={focusAfter}
    />
  );
}
