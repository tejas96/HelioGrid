import { useNotificationCentre } from '@heliogrid/data/react';
import {
  centreActToast,
  centreFilterWords,
  centreHeadWords,
  centreHorizonLine,
  centreListWords,
  NOTIFICATION_CENTRE,
  SHELL,
  showOlderLabel,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  NotificationFilterBar,
  NotificationHead,
  NotificationList,
  Sheet,
  ToastHost,
  useFormat,
  useToasts,
} from '@heliogrid/ui';

interface NotificationSheetProps {
  onClose: () => void;
  /** Opens the leads list from the empty centre; absent when this person has no leads list. */
  onGoToLeads?: () => void;
}

/**
 * The notification centre on the phone (`SCR-SHELL-03`): a sheet at 92% over the shell, its filter
 * bar pinned under the title while the list scrolls (brief decision 1). It is mounted only while
 * open, so the list is read only when someone looks; the bell's count is read apart.
 */
export function NotificationSheet({ onClose, onGoToLeads }: NotificationSheetProps) {
  const t = useTranslate();
  const format = useFormat();
  const centre = useNotificationCentre(format.pack.timeZone);
  const toasts = useToasts();
  const say = (toast: ReturnType<typeof centreActToast>) => {
    if (toast !== null) toasts.push(toast);
  };

  return (
    <>
      <Sheet
        title={t(NOTIFICATION_CENTRE.title)}
        onClose={onClose}
        closeLabel={t(SHELL.close)}
        size="full"
        showClose
        state={centre.surface}
        errorTitle={t(NOTIFICATION_CENTRE.errorTitle)}
        errorMessage={t(NOTIFICATION_CENTRE.errorMessage)}
        onRetry={centre.retry}
        retryLabel={t(NOTIFICATION_CENTRE.tryAgain)}
        emptyTitle={t(NOTIFICATION_CENTRE.emptyTitle)}
        emptyMessage={t(NOTIFICATION_CENTRE.emptyMessage)}
        emptyAction={
          onGoToLeads === undefined ? null : (
            <Button variant="secondary" size="sm" onClick={onGoToLeads}>
              {t(NOTIFICATION_CENTRE.goToLeads)}
            </Button>
          )
        }
        meta={
          centre.showsFilters ? (
            <NotificationFilterBar
              {...centreFilterWords(t)}
              unreadOn={centre.unreadOn}
              onUnread={centre.setUnreadOn}
              openGroup={centre.openGroup}
              onGroup={centre.setOpenGroup}
            />
          ) : null
        }
      >
        <NotificationHead
          {...centreHeadWords(t, centre.head)}
          onMarkAll={async () => say(centreActToast(t, await centre.markAllRead()))}
          marking={centre.markingAll}
        />
        <NotificationList
          days={centreListWords(t, centre.view.days, format)}
          onOpen={async (item) => {
            if (!(await centre.markRead(item))) say(centreActToast(t, { kind: 'read-failed' }));
          }}
          olderLabel={centre.view.olderRemain ? showOlderLabel(t, centre.filtered) : undefined}
          onShowOlder={centre.showOlder}
          loadingOlder={centre.loadingOlder}
          olderFailed={centre.olderFailed ? t(NOTIFICATION_CENTRE.olderFailed) : undefined}
          horizon={centreHorizonLine(t)}
        />
      </Sheet>
      <ToastHost toasts={toasts.toasts} onDismiss={toasts.dismiss} />
    </>
  );
}
