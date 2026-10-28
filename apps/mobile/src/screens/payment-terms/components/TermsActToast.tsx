import { theme } from '@heliogrid/theme';
import { ToastHost, type ToastItem } from '@heliogrid/ui';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { underPill } from '../../shell/styles';

/**
 * A refused act's toast (archive, restore, *Use for new proposals*): the api's words, and nothing
 * else changes. The host draws its portal only while a toast shows, so one raised from inside the
 * editor mounts after the sheet and stands above it. The item is held by its words: a new item each
 * render would restart the host's timer.
 */
export function TermsActToast({
  failure,
  onDismiss,
}: {
  /** The refused act's words; `null` while nothing is refused. */
  failure: string | null;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const toasts = useMemo<ToastItem[]>(
    () => (failure === null ? [] : [{ id: 'act', tone: 'danger', title: failure }]),
    [failure],
  );
  return (
    <ToastHost
      toasts={toasts}
      onDismiss={onDismiss}
      offset={underPill(insets.bottom) + theme.spacing['sp-6']}
    />
  );
}
