'use client';
import type { CreateLead, LogEnquiry } from '@heliogrid/contracts';
import type { DedupeChoice, QuickAddDone, QuickAddDuplicate } from '@heliogrid/domain';
import { useState } from 'react';
import { DataError } from '../errors/errors';
import { useAction } from './action';
import { useRepositories } from './context';

/** The sheet's act that is out, or came back undone — drawn under the choice that was pressed. */
export type QuickAddAct =
  | { readonly state: 'waiting'; readonly choice: DedupeChoice }
  | { readonly state: 'failed'; readonly choice: DedupeChoice; readonly failure: DataError };

type KeepBoth = NonNullable<CreateLead['keepBoth']>;

/** One press of the sheet, with what it is sent against. */
type SheetSend =
  | {
      readonly choice: 'open_existing' | 'log_enquiry';
      readonly leadId: string;
      readonly capture: LogEnquiry;
    }
  | { readonly choice: 'keep_both'; readonly keepBoth: KeepBoth; readonly capture: LogEnquiry };

export interface QuickAddSheetActsOptions {
  readonly duplicate: QuickAddDuplicate | null;
  /** What was typed, as an enquiry or a create carries it; `null` while the number is refused. */
  readonly typedCapture: () => LogEnquiry | null;
  readonly finish: (done: QuickAddDone) => void;
  /** The capture's create with *Keep both*'s reason riding along (`M02-12`). */
  readonly create: (capture: LogEnquiry, keepBoth: KeepBoth) => Promise<void>;
  /** *Open existing* on a record in scope: nothing is sent, the lead opens. */
  readonly openLead: (leadId: string) => void;
}

/**
 * The duplicate sheet's three answers (`M02-09`, `M02-11`, `M02-12`), one at a time: an ask to the
 * owner outside the reader's scope (`M02-08`), an enquiry logged on the existing lead, or both kept
 * with a reason. A second press while one is out sends nothing; a failure is said under the choice.
 */
export function useQuickAddSheetActs(options: QuickAddSheetActsOptions) {
  const repositories = useRepositories();
  const [pressed, setPressed] = useState<DedupeChoice | null>(null);
  const action = useAction(async (send: SheetSend) => {
    if (send.choice === 'keep_both') return options.create(send.capture, send.keepBoth);
    if (send.choice === 'log_enquiry') {
      const logged = await repositories.leadCapture.logEnquiry(send.leadId, send.capture);
      const name = logged.kind === 'in_scope' ? logged.lead.customer.name : null;
      return options.finish({ kind: 'enquiry_logged', leadId: send.leadId, name });
    }
    const asked = await repositories.leadCapture.askOwner(send.leadId, send.capture);
    options.finish({ kind: 'owner_asked', ownerName: asked.ownerName });
  });

  /** Sends what the duplicate and the typing allow, unless an act is already out. */
  const send = (
    choice: DedupeChoice,
    sendOf: (capture: LogEnquiry, duplicate: QuickAddDuplicate) => SheetSend,
  ) => {
    const capture = options.typedCapture();
    if (options.duplicate === null || capture === null || action.isOut()) return;
    setPressed(choice);
    void action.run(sendOf(capture, options.duplicate));
  };

  const act: QuickAddAct | null =
    pressed === null
      ? null
      : action.pending
        ? { state: 'waiting', choice: pressed }
        : action.failure instanceof DataError
          ? { state: 'failed', choice: pressed, failure: action.failure }
          : null;

  return {
    act,
    isOut: () => action.isOut(),
    clear: () => {
      action.clear();
      setPressed(null);
    },
    openExisting: () => {
      const duplicate = options.duplicate;
      if (duplicate === null || action.isOut()) return;
      if (duplicate.opens === 'record') return options.openLead(duplicate.match.leadId);
      send('open_existing', (capture) => ({
        choice: 'open_existing',
        leadId: duplicate.match.leadId,
        capture,
      }));
    },
    logEnquiry: () =>
      send('log_enquiry', (capture, duplicate) => ({
        choice: 'log_enquiry',
        leadId: duplicate.match.leadId,
        capture,
      })),
    /* Offered only against a record the person may see, to one who may override (`M02-12`). */
    keepBoth: (reason: string) => {
      const duplicate = options.duplicate;
      if (duplicate?.match.kind !== 'visible' || !duplicate.canKeepBoth) return;
      const keepBoth = { otherCustomerId: duplicate.match.customerId, reason };
      send('keep_both', (capture) => ({ choice: 'keep_both', keepBoth, capture }));
    },
  };
}
