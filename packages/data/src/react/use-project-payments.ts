'use client';
import type {
  PaymentReceipt,
  PayRequest,
  ProjectPayments,
  RecordedPayment,
} from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { PaymentActRefusedError } from '../payments/payments-repository';
import { useAction } from './action';
import { useRepositories } from './context';
import { recordReadOf } from './read';
import { useConnection } from './use-connection';
import { type PaymentPhoto, usePaymentPhoto } from './use-payment-photo';
import { type ReferenceCheckScreen, useReferenceCheck } from './use-reference-check';
import { useSession } from './use-session';
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

export type { PaymentPhoto } from './use-payment-photo';

/** A money act, as the screen sends it; a record's photo is stored after it (`M11-37`). */
export type PaymentSend =
  | { readonly kind: 'record'; readonly typed: PaymentTyped }
  | { readonly kind: 'reverse'; readonly entryId: string; readonly reason: string }
  | { readonly kind: 'waive'; readonly partId: string; readonly reason: string }
  | { readonly kind: 'shared'; readonly partId: string };

/** What the toast says after an act. */
export type PaymentToast =
  | { readonly kind: 'recorded'; readonly receiptNumber: string | null }
  /** The request left for another app: did it go out? Only a yes records it as shared. */
  | { readonly kind: 'askSent'; readonly partId: string }
  | {
      readonly kind:
        | 'reversed'
        | 'waived'
        | 'shared'
        | 'copied'
        | 'notCopied'
        | 'receiptFailed'
        | 'photoFailed'
        | 'photoNotStored'
        | 'photoAdded'
        | 'receiptPreparing';
    };

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
  /** The field the failure is about — a UTR already on a receipt is said at the UTR. */
  readonly failureField: 'reference' | null;
  send(act: PaymentSend): void;
  /** The receipt photo the record sheet holds until it is saved or closed (`M11-37`). */
  readonly photo: PaymentPhoto | null;
  pickPhoto(photo: PaymentPhoto): void;
  removePhoto(): void;
  /** The payments whose photo is being stored after the save. */
  readonly attaching: readonly string[];
  /** A photo for a payment saved without one. */
  addPhoto(entryId: string, photo: PaymentPhoto): void;
  /** Stores again a photo whose store failed after its payment was saved. */
  retryPhoto(): void;
  /**
   * The request was handed to another app — WhatsApp, the share sheet, the clipboard. The product
   * cannot know it went out, so it asks; only the person's yes records it as shared.
   */
  handedOff(partId: string): void;
  /** Who a recorded payment is saved as — the signed-in person. */
  readonly recorder: string;
  /** The pay QR held up full screen to the customer, over the open collect sheet. */
  readonly fullQr: PayRequest | null;
  showQr(partId: string | null): void;
  readonly toast: PaymentToast | null;
  /** The toast's one act: record the request as sent, or store the failed photo again. */
  readonly toastAct: (() => void) | null;
  say(toast: PaymentToast): void;
  dismissToast(): void;
  /** The receipt as text, in the customer's language, to share. */
  receipt(entryId: string): Promise<PaymentReceipt>;
  /** The receipt PDF's short-lived address; null while it is still being made. */
  receiptPdf(entryId: string): Promise<string | null>;
  /** Whether the reference typed in the record sheet is already on a receipt (`M11-38`). */
  readonly reference: ReferenceCheckScreen;
  /** A stored file's short-lived address — a payment's receipt photo. */
  fileLink(fileId: string): Promise<string>;
}

/**
 * The payments screen (`SCR-M11-02`): the project's schedule and ledger, the sheet open over it,
 * and the four acts, each answering the screen as it now stands. A payment is saved first and its
 * receipt photo stored against it after, so a slow photo never holds the money back (`M11-37`).
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
  const [photo, setPhoto] = useState<PaymentPhoto | null>(null);
  const [qrPart, setQrPart] = useState<string | null>(null);
  const recorder = useSession().user?.name ?? '';
  const reference = useReferenceCheck();
  const payments = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => repositories.payments.payments(projectId, signal),
    enabled: tenantId !== '',
  });
  const money = repositories.payments;
  const photos = usePaymentPhoto(projectId, (outcome) =>
    setToast({ kind: outcome === 'added' ? 'photoAdded' : 'photoNotStored' }),
  );
  /*
   * The moment a payment was first saved, kept until it lands or the sheet closes: the server
   * matches a retry by its whole body, so a press again after a lost answer must send it unchanged.
   */
  const firstCaptured = useRef<string | null>(null);
  const capturedAt = () => {
    firstCaptured.current ??= new Date().toISOString();
    return firstCaptured.current;
  };
  const action = useAction(
    async (send: PaymentSend): Promise<ProjectPayments | RecordedPayment> => {
      switch (send.kind) {
        case 'record':
          return money.record(projectId, { ...send.typed, capturedAt: capturedAt() });
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
        const { recordedId, ...payments } = { recordedId: null, ...answer };
        queryClient.setQueryData(key, payments);
        // The project's Money card, the board's money reason and Money due read the same money.
        await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(tenantId) });
        firstCaptured.current = null;
        reference.check('');
        setSheet(null);
        setPhoto(null);
        setToast(toastOf(send, answer));
        // After the payment's own line, so a photo that fails is what the person reads last.
        if (recordedId !== null && photo !== null) photos.attach(recordedId, photo, true);
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
  const read = recordReadOf(payments);
  return {
    read,
    sheet,
    open: (next) => {
      firstCaptured.current = null;
      setFailure(null);
      setPhoto(null);
      reference.check('');
      setSheet(next);
    },
    close: () => {
      firstCaptured.current = null;
      setFailure(null);
      setPhoto(null);
      reference.check('');
      setQrPart(null);
      setSheet(null);
    },
    online,
    sending: action.pending,
    failure,
    failureField:
      failure?.kind === 'refused' && failure.refusal === 'reference_used' ? 'reference' : null,
    send: (act) => {
      if (!online) {
        setFailure({ kind: 'offline' });
        return;
      }
      setFailure(null);
      void action.run(act);
    },
    photo,
    pickPhoto: setPhoto,
    removePhoto: () => setPhoto(null),
    attaching: photos.attaching,
    addPhoto: (entryId, picked) => photos.attach(entryId, picked, false),
    retryPhoto: photos.retry,
    // The sheet's work is done once the message has left it: it closes, so the ask is not drawn
    // over its buttons.
    handedOff: (partId) => {
      setQrPart(null);
      setSheet(null);
      setToast({ kind: 'askSent', partId });
    },
    recorder,
    fullQr:
      read.kind === 'ready'
        ? (read.value.requests.find((one) => one.partId === qrPart && one.upiUri !== null) ?? null)
        : null,
    showQr: setQrPart,
    toast,
    toastAct: actOf(toast, {
      sent: (partId) => {
        setToast(null);
        if (online) void action.run({ kind: 'shared', partId });
      },
      retryPhoto: photos.retry,
    }),
    say: setToast,
    dismissToast: () => setToast(null),
    receipt: (entryId) => money.receipt(projectId, entryId),
    receiptPdf: (entryId) =>
      money.receiptPdf(projectId, entryId).then((pdf) => pdf.download?.url ?? null),
    reference,
    fileLink: (fileId) => repositories.file.downloadUrl(fileId).then((link) => link.url),
  };
}

const TOAST_OF_ACT = {
  reverse: 'reversed',
  waive: 'waived',
  shared: 'shared',
} as const satisfies Record<Exclude<PaymentSend['kind'], 'record'>, PaymentToast['kind']>;

function toastOf(send: PaymentSend, answer: ProjectPayments | RecordedPayment): PaymentToast {
  if (send.kind === 'record') {
    // The payment this save wrote — a colleague's may have landed after it.
    const recordedId = 'recordedId' in answer ? answer.recordedId : null;
    const entry = answer.entries.find((one) => one.id === recordedId);
    return { kind: 'recorded', receiptNumber: entry?.receiptNumber ?? null };
  }
  return { kind: TOAST_OF_ACT[send.kind] };
}

/** What the toast's one button does, where it has one. */
function actOf(
  toast: PaymentToast | null,
  acts: { sent(partId: string): void; retryPhoto(): void },
): (() => void) | null {
  if (toast?.kind === 'askSent') return () => acts.sent(toast.partId);
  if (toast?.kind === 'photoNotStored') return acts.retryPhoto;
  return null;
}
