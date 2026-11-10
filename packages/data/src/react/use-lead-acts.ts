'use client';
import type { CrmMessageTemplateKey, LeadDetail } from '@heliogrid/contracts';
import {
  type CallOutcome,
  type DisqualifyReason,
  type LeadActFailure,
  type LeadQuickAct,
  type LeadQuickStanding,
  tenantInstantOf,
} from '@heliogrid/domain';
import { useState } from 'react';
import { useAction } from './action';
import { useRepositories } from './context';
import { leadActFailureOf, useLeadDetailCache } from './lead-detail-cache';

/** The sheet open over the lead: one act's form, the message to copy, or a contact. */
export type LeadSheet =
  | { readonly kind: 'log' | 'visit' | 'snooze' | 'disqualify' | 'junk' | 'callBack' }
  | { readonly kind: 'message'; readonly template: CrmMessageTemplateKey }
  | { readonly kind: 'contact'; readonly contactId: string | null };

/** What a sheet's send carries. */
export type LeadSheetSend =
  | {
      readonly kind: 'log';
      readonly log:
        | { readonly kind: 'call'; readonly outcome: CallOutcome; readonly note: string | null }
        | { readonly kind: 'note'; readonly text: string };
    }
  | {
      readonly kind: 'visit';
      readonly visit: {
        readonly date: string;
        readonly time: string;
        readonly surveyorId: string;
        readonly address: string;
      };
      /** The booked visit a no-show reschedule replaces (`M02-48`); null books a first one. */
      readonly replaces: string | null;
    }
  | { readonly kind: 'snooze'; readonly wakeOn: string }
  | { readonly kind: 'disqualify'; readonly reason: DisqualifyReason }
  | { readonly kind: 'junk' }
  | { readonly kind: 'callBack'; readonly date: string; readonly time: string };

export interface LeadActs {
  readonly sheet: LeadSheet | null;
  /** Opens a sheet — none while another's send is out. */
  open(sheet: LeadSheet): void;
  /** Every way out of the sheet — refused while its send is out. */
  close(): void;
  readonly sending: boolean;
  readonly sendFailure: LeadActFailure | null;
  send(send: LeadSheetSend): void;
  /** Wake up now or reopen: no sheet, so the act's own pill says it is out or came back. */
  quick(act: LeadQuickAct): void;
  readonly quickStanding: LeadQuickStanding | null;
}

/**
 * Lead Detail's acts in sheets (`M02-32`, `M02-43`, `M02-46`…`M02-56`): one send at a time, its
 * failure kept in its sheet, and a success closing the sheet onto the lead as it now stands. A
 * booked or rescheduled visit opens its confirmation to copy (`M02-47`, `M02-48`).
 */
export function useLeadActs(leadId: string, timeZone: string): LeadActs {
  const repositories = useRepositories();
  const cache = useLeadDetailCache(leadId);
  const [sheet, setSheet] = useState<LeadSheet | null>(null);
  const [quickAct, setQuickAct] = useState<LeadQuickAct | null>(null);
  const capturedAt = () => new Date().toISOString();

  const sheetSend = useAction(
    async (send: LeadSheetSend): Promise<LeadDetail | null> => {
      const { leadCalls, leadLifecycle, visits, tasks } = repositories;
      switch (send.kind) {
        case 'log':
          return send.log.kind === 'note'
            ? leadCalls.addNote(leadId, { text: send.log.text, capturedAt: capturedAt() })
            : leadCalls.logCall(leadId, {
                outcome: send.log.outcome,
                ...(send.log.note === null ? {} : { note: send.log.note }),
                capturedAt: capturedAt(),
              });
        case 'visit':
          return send.replaces === null
            ? visits.book(leadId, { ...send.visit, capturedAt: capturedAt() })
            : visits.reschedule(send.replaces, { ...send.visit, capturedAt: capturedAt() });
        case 'snooze':
          return leadLifecycle.snooze(leadId, { wakeOn: send.wakeOn, capturedAt: capturedAt() });
        case 'disqualify':
          return leadLifecycle.disqualify(leadId, {
            reason: send.reason,
            capturedAt: capturedAt(),
          });
        case 'junk':
          return leadLifecycle.junk(leadId, { capturedAt: capturedAt() });
        case 'callBack': {
          const due = tenantInstantOf(send.date, send.time, timeZone);
          await tasks.create(leadId, { kind: 'call', dueAt: new Date(due).toISOString() });
          return null;
        }
      }
    },
    {
      onDone: (lead, send) => {
        if (lead === null) cache.refresh();
        else cache.landed(lead);
        const visit = send.kind === 'visit' ? lead?.visit : null;
        setSheet(
          visit === null || visit === undefined
            ? null
            : { kind: 'message', template: 'visit_confirmation' },
        );
      },
    },
  );
  const quick = useAction(
    (act: LeadQuickAct) =>
      act === 'wake'
        ? repositories.leadLifecycle.wake(leadId, { capturedAt: capturedAt() })
        : repositories.leadLifecycle.reopen(leadId, { capturedAt: capturedAt() }),
    { onDone: cache.landed },
  );

  const quickStanding = (): LeadActs['quickStanding'] => {
    if (quickAct === null) return null;
    if (quick.pending) return { kind: 'waiting', act: quickAct };
    return quick.failure === null
      ? null
      : { kind: 'returned', act: quickAct, failure: leadActFailureOf(quick.failure) };
  };

  return {
    sheet,
    open: (next) => {
      if (sheetSend.isOut()) return;
      sheetSend.clear();
      setSheet(next);
    },
    close: () => {
      if (!sheetSend.isOut()) setSheet(null);
    },
    sending: sheetSend.pending,
    sendFailure: sheetSend.failure === null ? null : leadActFailureOf(sheetSend.failure),
    send: (send) => void sheetSend.run(send),
    quick: (act) => {
      if (quick.isOut()) return;
      setQuickAct(act);
      void quick.run(act);
    },
    quickStanding: quickStanding(),
  };
}
