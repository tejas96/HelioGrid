import type { InboxBulkReport } from '@heliogrid/data/react';
import { bulkAssignToasts, toastHostWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { type FocusAfter, ToastHost } from '@heliogrid/ui';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { underPill } from '../../shell/styles';

/**
 * A bulk assign's one line (`M02-29`, `bulkAssignToasts`, the web's too) above the pill — the
 * phone's adapter: the pill's clearance over the home indicator. The item is held by its report: a
 * new item each render would restart the timer.
 */
export function InboxBulkToast({
  report,
  onDismiss,
  focusAfter,
}: {
  report: InboxBulkReport | null;
  onDismiss: () => void;
  focusAfter: FocusAfter;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const toasts = useMemo(() => bulkAssignToasts(t, report), [report, t]);
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
