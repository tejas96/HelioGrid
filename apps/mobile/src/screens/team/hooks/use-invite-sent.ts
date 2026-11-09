import { TEAM } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { type ToastQueue, useRiseMoment } from '@heliogrid/ui';
import { useMemo } from 'react';

/** A new invite now on the team plays the `sent` moment in the page's toast. */
export function useInviteSent(push: ToastQueue['push'], invites: number | null): void {
  const { t } = useI18n();
  const toast = useMemo(
    () => ({ tone: 'success' as const, title: t(TEAM.inviteSent), moment: 'sent' as const }),
    [t],
  );
  useRiseMoment(push, invites, toast);
}
