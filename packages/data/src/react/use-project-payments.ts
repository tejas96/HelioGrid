'use client';
import type { PaymentReceipt, ProjectPayments } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { PaymentActRefusedError } from '../payments/payments-repository';
import { useAction } from './action';
import { useRepositories } from './context';
import type { PickedFile } from './picked-file';
import { recordReadOf } from './read';
import { useConnection } from './use-connection';
import { useTenantId } from './use-tenant-id';

/** The sheet open over the payments screen — one at a time (`SCR-M11-02`, `SCR-M11-03`). */
export type PaymentSheet =
  | { readonly kind: 'collect'; readonly partId: string }
  | { readonly kind: 'record'; readonly partId: string }
  | { readonly kind: 'reverse'; readonly entryId: string }
  | { readonly kind: 'waive'; readonly partId: string };

/** What a person typed to record money that arrived (`M11-34`). */
export interface PaymentTyped {
  readonly partId: string;
  readonly amount: string;
  readonly mode: string;
  readonly reference: string | null;
  readonly receivedOn: string;
}

/** A money act, as the screen sends it. */
export type PaymentSend =
  | { readonly kind: 'record'; readonly typed: PaymentTyped; readonly photo: PickedFile | null }
  | { readonly kind: 'reverse'; readonly entryId: string; readonly reason: string }
  | { readonly kind: 'waive'; readonly partId: string; readonly reason: string }
  | { readonly kind: 'shared'; readonly partId: string };

/** What the toast says after an act. */
export type PaymentToast =
  | { readonly kind: 'recorded'; readonly receiptNumber: string | null }
  | { readonly kind: 'reversed' | 'waived' | 'shared' | 'copied' | 'notCopied' };

/** Why the last act did not land: domain's reason, the receipt a reused UTR is on, or no network. */
export type PaymentFailure =
  | { readonly kind: 'refused'; readonly refusal: string; readonly receiptNumber: string | null }
  | { readonly kind: 'offline' }
  | { readonly kind: 'failed' };

export interface PaymentsScreen {
  readonly read: Exclude<Read<ProjectPayments>, { readonly kind: 'empty' }>;
  readonly sheet: PaymentSheet | null;
  open(sheet: PaymentSheet): void;
  close(): void;
  /** A money act needs the server (`M11-06`): offline, every act is refused, never queued. */
  readonly online: boolean;
  readonly sending: boolean;
  readonly failure: PaymentFailure | null;
  send(act: PaymentSend): void;
  readonly toast: PaymentToast | null;
  say(toast: PaymentToast): void;
  dismissToast(): void;
  /** The receipt as text, in the customer's language, to share. */
  receipt(entryId: string): Promise<PaymentReceipt>;
}

/**
 * The payments screen (`SCR-M11-02`): the project's schedule and ledger, the sheet open over it,
 * and the four acts, each answering the screen as it now stands. Recording carries its receipt
 * photo, stored first against the project, so the entry is written once, with it (`M11-37`).
 */
export function useProjectPayments(projectId: string): PaymentsScreen {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const { online } = useConnection();
  const key = queryKeys.projects.payments(tenantId, projectId);
  const [sheet, setSheet] = useState<PaymentSheet | null>(null);
  const [toast, setToast] = useState<PaymentToast | null>(null);
  const [failure, setFailure] = useState<PaymentFailure | null>(null);
  const payments = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => repositories.payments.payments(projectId, signal),
    enabled: tenantId !== '',
  });
  const money = repositories.payments;
  const action = useAction(
    async (send: PaymentSend): Promise<ProjectPayments> => {
      switch (send.kind) {
        case 'record': {
          const fileId =
            send.photo === null
              ? null
              : (
                  await repositories.file.store({
                    subjectKind: 'project',
                    subjectRef: projectId,
                    contentType: send.photo.contentType,
                    bytes: send.photo.bytes,
                  })
                ).id;
          return money.record(projectId, {
            ...send.typed,
            fileId,
            capturedAt: new Date().toISOString(),
          });
        }
        case 'reverse':
          return money.reverse(projectId, send.entryId, send.reason);
        case 'waive':
          return money.waive(projectId, send.partId, send.reason);
        case 'shared':
          return money.shared(projectId, send.partId);
      }
    },
    {
      onDone: async (answer, send) => {
        queryClient.setQueryData(key, answer);
        // The project's Money card, the board's money reason and Money due read the same money.
        await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(tenantId) });
        setSheet(null);
        setToast(toastOf(send, answer));
      },
      onFailed: (error) => {
        setFailure(
          error instanceof PaymentActRefusedError
            ? { kind: 'refused', refusal: error.refusal, receiptNumber: error.receiptNumber }
            : { kind: 'failed' },
        );
      },
    },
  );
  return {
    read: recordReadOf(payments),
    sheet,
    open: (next) => {
      setFailure(null);
      setSheet(next);
    },
    close: () => {
      setFailure(null);
      setSheet(null);
    },
    online,
    sending: action.pending,
    failure,
    send: (act) => {
      if (!online) {
        setFailure({ kind: 'offline' });
        return;
      }
      setFailure(null);
      void action.run(act);
    },
    toast,
    say: setToast,
    dismissToast: () => setToast(null),
    receipt: (entryId) => money.receipt(projectId, entryId),
  };
}

const TOAST_OF_ACT = {
  reverse: 'reversed',
  waive: 'waived',
  shared: 'shared',
} as const satisfies Record<Exclude<PaymentSend['kind'], 'record'>, PaymentToast['kind']>;

function toastOf(send: PaymentSend, answer: ProjectPayments): PaymentToast {
  if (send.kind === 'record') {
    return { kind: 'recorded', receiptNumber: answer.entries.at(-1)?.receiptNumber ?? null };
  }
  return { kind: TOAST_OF_ACT[send.kind] };
}
