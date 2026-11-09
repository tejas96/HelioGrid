import { settingsSavedToast, toastHostWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { type FocusAfter, ToastHost, useSavedMoment, useToasts } from '@heliogrid/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { underPill } from '../../shell/styles';

/**
 * A settings page's save, answered as it lands: the `saved` moment in a toast over the pill's
 * place. A save that failed raises nothing here — its failure says itself on the page.
 */
export function SavedToast({
  saving,
  failed,
  focusAfter,
}: {
  saving: boolean;
  failed: boolean;
  /** Where the screen reader goes once the toast is closed — the page that was saved. */
  focusAfter: FocusAfter;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const toasts = useToasts();
  useSavedMoment(toasts.push, saving, failed, settingsSavedToast(t));
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
