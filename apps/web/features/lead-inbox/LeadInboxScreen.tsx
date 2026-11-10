'use client';
import {
  type LeadInboxScreen as LeadInboxScreenView,
  useLeadInboxScreen,
} from '@heliogrid/data/react';
import type { LeadSource } from '@heliogrid/domain';
import {
  bulkAssignToasts,
  leadInboxSummary,
  leadInboxWords,
  toastHostWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { LargeTitle, LeadInbox, ToastHost, useFormat, useOwnWidth } from '@heliogrid/ui';
import { notFound, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { DOOR_PATH } from '../shell';
import { INBOX_STAGE_FROM, LEAD_IMPORT_PATH, leadPath } from './constants';
import { useInboxKeys } from './hooks/use-inbox-keys';

/**
 * The Lead Inbox on the web (`SCR-M02-02`): the owner's morning triage. Below the stage's room the
 * phone's deck — the newest lead with the faces under it and Up next below; from it, one wide stage
 * with the team docked inside and the rest of the queue as tiles. What is read, acted on, selected
 * and given is `useLeadInboxScreen`'s and what it draws `LeadInbox`'s, the phone's too; the web's
 * own parts are the width, the keys, the router and the bulk line's toast.
 */
export function LeadInboxScreen() {
  const screen = useLeadInboxScreen();
  if (!screen.allowed) notFound();
  return <LeadInboxIn screen={screen} />;
}

function LeadInboxIn({ screen }: { screen: LeadInboxScreenView }) {
  const { t } = useI18n();
  const format = useFormat();
  const router = useRouter();
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const stage = width !== null && width >= INBOX_STAGE_FROM;
  useInboxKeys(screen, stage);
  const words = leadInboxWords(t);
  const { read, view, bulkReport } = screen;
  const oldest =
    stage && view.oldestElapsedMs !== null ? words.deck.age.age(view.oldestElapsedMs) : null;
  /* Held by its report: a new item each render would restart the toast's clock. */
  const toasts = useMemo(() => bulkAssignToasts(t, bulkReport), [bulkReport, t]);
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target">
      <LargeTitle
        title={words.title}
        summary={
          read.kind === 'ready'
            ? leadInboxSummary(t, { waiting: view.waiting, pastDay: view.pastDay, oldest })
            : read.kind === 'empty'
              ? words.nothingWaiting
              : undefined
        }
      />
      <LeadInbox
        screen={screen}
        layout={stage ? 'stage' : 'deck'}
        words={words}
        money={format.money}
        onAdd={() => router.push(DOOR_PATH.add_lead)}
        onWay={(way) => router.push(wayPath(way))}
        onOpen={(leadId) => router.push(leadPath(leadId))}
        focusAfter={room}
      />
      <ToastHost
        toasts={toasts}
        onDismiss={screen.dismissBulkReport}
        {...toastHostWords(t)}
        focusAfter={room}
      />
    </div>
  );
}

/** A teaching way's door: an import has its own; a quick add and a referral both start at quick add. */
function wayPath(way: LeadSource): string {
  return way === 'import' ? LEAD_IMPORT_PATH : DOOR_PATH.add_lead;
}
