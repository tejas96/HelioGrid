import type {
  PayRequest,
  ProjectPart,
  ProjectPaymentEntry,
  ProjectPayments,
  TranslatedText,
} from '@heliogrid/contracts';
import { daysFrom } from '@heliogrid/domain';
import type { StatusTone } from '../../primitives/StatusMark/StatusMark.types';
import type { MarketFormat } from '../../utils/format';
import type { TimelineItem, TimelineStatus } from '../Timeline/Timeline.types';
import type { ProjectMoneyProps, ProjectMoneyWords } from './ProjectMoney.types';

/*
 * What the payments screen shows, worked out from what the server sent — positions, words and
 * marks, never a figure (`F4-04`): every amount drawn is one the server wrote.
 */

/** A part's state as a mark: its tone beside its word and glyph (`F7-12`). */
export const PART_TONE: Readonly<Record<string, StatusTone>> = {
  upcoming: 'neutral',
  due: 'warning',
  part_received: 'info',
  received: 'success',
  waived: 'neutral',
};

const PART_STATUS: Readonly<Record<string, TimelineStatus>> = {
  upcoming: 'upcoming',
  due: 'current',
  part_received: 'current',
  received: 'done',
  waived: 'skipped',
};

/** The part the hero asks for now: the first request the server put first, when it is due. */
export function nowDueOf(payments: ProjectPayments): {
  readonly part: ProjectPart;
  readonly request: PayRequest;
} | null {
  const request = payments.requests[0];
  const part = payments.parts.find((one) => one.id === request?.partId);
  if (request === undefined || part === undefined || part.dueOn === null) return null;
  return { part, request };
}

/** The first part still to come, for the hero's "next falls due at" line. */
export function nextUpOf(payments: ProjectPayments): ProjectPart | null {
  return payments.parts.find((part) => part.state === 'upcoming') ?? null;
}

/** The money bar's three weights — the server's figures used as they are, never summed here. */
export function barOf(payments: ProjectPayments): readonly {
  readonly key: 'in' | 'due' | 'next';
  readonly weight: number;
}[] {
  return [
    { key: 'in', weight: Number(payments.money.collected) },
    { key: 'due', weight: Number(payments.money.toCollect) },
    { key: 'next', weight: Number(payments.money.next) },
  ].filter((segment) => segment.weight > 0) as {
    key: 'in' | 'due' | 'next';
    weight: number;
  }[];
}

/** One part's line under its name: when it falls due, what is left, when it came in, or why waived. */
export function partLineOf(
  part: ProjectPart,
  payments: ProjectPayments,
  words: ProjectMoneyWords,
  format: MarketFormat,
): TranslatedText {
  if (part.waived !== null) return words.waivedBecause(part.waived.reason);
  if (part.state === 'received') {
    const last = payments.entries.filter((entry) => entry.partId === part.id).at(-1);
    return last?.receivedOn ? words.receivedOn(format.date(last.receivedOn)) : words.received;
  }
  if (part.state === 'part_received') return words.left(format.money(part.outstanding));
  if (part.dueOn !== null) return words.dueSince(format.date(part.dueOn));
  return words.dueAt(format.word('stage', part.dueOnStage));
}

/**
 * What else a part says under its line: money that came in above it, stated and never moved
 * (`M11-36`), and who last shared its request, so nobody asks the customer twice.
 */
export function partNotesOf(
  part: ProjectPart,
  words: ProjectMoneyWords,
  format: MarketFormat,
): TranslatedText[] {
  const shared = part.lastShared;
  return [
    ...(Number(part.extra) > 0 ? [words.extra(format.money(part.extra))] : []),
    ...(shared === null || part.state === 'received'
      ? []
      : [words.sharedBy(shared.by.name, format.date(shared.at))]),
  ];
}

/** The parts as the timeline draws them: name and share, amount, state mark and line. */
export function partItemsOf(
  payments: ProjectPayments,
  words: ProjectMoneyWords,
  format: MarketFormat,
): TimelineItem[] {
  return payments.parts.map((part) => ({
    id: part.id,
    label: words.partShare(part.label, String(Number(part.share))),
    meta: format.money(part.amount),
    description: partLineOf(part, payments, words, format),
    status: PART_STATUS[part.state] ?? 'upcoming',
  }));
}

/** How long a part has waited, as its mark says it: "Due today", "Due 18 days". */
export function dueForOf(dueOn: string, today: string, words: ProjectMoneyWords): TranslatedText {
  return words.dueFor(words.days(daysFrom(dueOn, today)));
}

/** The money received, newest first; a reversal sits beside the payment it takes back. */
export function entriesNewestFirst(
  entries: readonly ProjectPaymentEntry[],
): readonly ProjectPaymentEntry[] {
  return [...entries].reverse();
}

/** A part's own acts: share its request, waive what it still owes — each only where it may. */
export function partActsOf(
  props: ProjectMoneyProps & { readonly payments: ProjectPayments },
  part: ProjectPayments['parts'][number],
) {
  const { payments, words, online } = props;
  if (Number(part.outstanding) <= 0) return [];
  return [
    payments.acts.share
      ? { key: 'share', label: words.shareRequest, onSelect: () => props.onShareRequest(part.id) }
      : null,
    payments.acts.waive
      ? {
          key: 'waive',
          label: words.waive,
          destructive: true,
          disabled: !online,
          onSelect: () => props.onWaive(part.id),
        }
      : null,
  ].flatMap((item) => (item === null ? [] : [item]));
}

/**
 * A payment's acts: its receipt as a PDF or as text, its photo — opened, or added where it has
 * none — and reverse. A reversed payment offers no receipt and is never reversed again.
 */
export function entryActsOf(
  props: ProjectMoneyProps & { readonly payments: ProjectPayments },
  entry: ProjectPaymentEntry,
) {
  const { payments, words, online } = props;
  const { fileId } = entry;
  const stands = !entry.reversed;
  const mayRecord = payments.acts.record && stands;
  const items = [
    stands
      ? { key: 'pdf', label: words.receiptPdf, onSelect: () => props.onReceiptPdf(entry.id) }
      : null,
    stands
      ? {
          key: 'receipt',
          label: words.shareReceipt,
          onSelect: () => props.onShareReceipt(entry.id),
        }
      : null,
    fileId !== null
      ? { key: 'photo', label: words.receiptPhoto, onSelect: () => props.onOpenPhoto(fileId) }
      : mayRecord && !props.attaching.includes(entry.id)
        ? {
            key: 'add-photo',
            label: words.addReceiptPhoto,
            disabled: !online,
            onSelect: () => props.onAddPhoto(entry.id),
          }
        : null,
    mayRecord
      ? {
          key: 'reverse',
          label: words.reverse,
          destructive: true,
          disabled: !online,
          onSelect: () => props.onReverse(entry.id),
        }
      : null,
  ];
  return items.flatMap((item) => (item === null ? [] : [item]));
}

/**
 * The parts as the timeline draws them, each with what it says under its line and its own acts —
 * `more` is null where a part has neither, so no empty box is drawn.
 */
export function partRowsOf(
  props: ProjectMoneyProps & { readonly payments: ProjectPayments },
  format: MarketFormat,
) {
  const { payments, words } = props;
  return partItemsOf(payments, words, format).map((item, index) => {
    const part = payments.parts[index];
    const notes = part === undefined ? [] : partNotesOf(part, words, format);
    const acts = part === undefined ? [] : partActsOf(props, part);
    const more =
      part === undefined || (notes.length === 0 && acts.length === 0)
        ? null
        : { label: words.partMenu(part.label), notes, acts };
    return { item, more };
  });
}

/**
 * The hero's two acts for the part due now: Collect — the QR and the message, which writes no
 * money, so it works offline — and Record, which needs the server (`M11-06`).
 */
export function heroActsOf(
  props: ProjectMoneyProps & { readonly payments: ProjectPayments },
  partId: string,
) {
  const { payments, words, online } = props;
  return {
    collect:
      payments.acts.record || payments.acts.share
        ? { label: words.collect, onClick: () => props.onCollect(partId) }
        : null,
    record: payments.acts.record
      ? {
          label: words.record,
          disabled: !online,
          disabledReason: online ? undefined : words.offline,
          onClick: () => props.onRecord(partId),
        }
      : null,
  };
}
