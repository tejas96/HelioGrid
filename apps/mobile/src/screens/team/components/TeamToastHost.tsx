import { toastHostWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { type FocusAfter, ToastHost, type ToastQueue } from '@heliogrid/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { underPill } from '../../shell/styles';

/** Team's toasts, above the pill, which stands on the device's home-bar inset — the package reads no inset. */
export function TeamToastHost({
  toasts,
  focusAfter,
}: {
  toasts: ToastQueue;
  /** Where the screen reader goes once a toast is closed — the list's search. */
  focusAfter: FocusAfter;
}) {
  const insets = useSafeAreaInsets();
  const t = useTranslate();
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
