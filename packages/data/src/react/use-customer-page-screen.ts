'use client';
import type { CustomerPage } from '@heliogrid/contracts';
import {
  type ComponentCategory,
  type FormatPack,
  IN_PACK,
  type ProposalVersionSnapshot,
  requiredCategories,
  type UiLanguage,
  uiLanguageOfTag,
} from '@heliogrid/domain';
import { useEffect, useMemo, useState } from 'react';
import type { LinkDeviceClass } from '../customer-link/public-repository';
import { proposalSnapshotOf } from '../proposals/document-snapshot';
import {
  type CustomerLinkPage,
  type LinkAct,
  type LinkActKind,
  useCustomerLinkPage,
} from './use-customer-link-page';

/** The sheets the customer answers on (`SCR-F5-01`): Accept, the four ways to ask, and each of them. */
export type CustomerSheet = 'accept' | 'more' | 'ask' | 'call' | 'change' | 'decline';

/** A two-hour window the customer may ask to be called in, on their own device's clock. */
export interface CallSlot {
  /** The window's start — what the request carries. */
  readonly at: string;
  readonly day: 'today' | 'tomorrow';
  readonly fromHour: number;
  readonly toHour: number;
}

/** "As soon as possible": the request carries no time and the server takes the next lawful moment. */
export const CALL_SOON = 'soon';

const MORNING = { fromHour: 10, toHour: 12 } as const;
const EVENING = { fromHour: 18, toHour: 20 } as const;
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/**
 * The windows offered from `now` (`F5-54`): this evening while it has not begun, tomorrow morning
 * and tomorrow evening. Whether the hour is lawful is the server's to judge (`callRequestDueAt`);
 * a window it cannot use becomes the next lawful moment, and the page then says when.
 */
export function callSlotsFrom(now: number): readonly CallSlot[] {
  const startOf = (dayOffset: number, hour: number) => {
    const at = new Date(now + dayOffset * DAY_MS);
    at.setHours(hour, 0, 0, 0);
    return at;
  };
  const slotOn = (day: CallSlot['day'], window: typeof MORNING | typeof EVENING): CallSlot => ({
    at: startOf(day === 'today' ? 0 : 1, window.fromHour).toISOString(),
    day,
    ...window,
  });
  const tonight = slotOn('today', EVENING);
  const later = [slotOn('tomorrow', MORNING), slotOn('tomorrow', EVENING)];
  return Date.parse(tonight.at) > now ? [tonight, ...later] : later;
}

export interface CustomerPageScreenOptions {
  readonly deviceClass: LinkDeviceClass | null;
  /** The page a server render already read. */
  readonly initial?: CustomerPage;
  /** The tenant market's formats: the document's figures are read back in its minor unit. */
  readonly formats: FormatPack;
}

/**
 * The customer's page as its screen draws it (`SCR-F5-01`…`04`): the link's read and acts
 * (`useCustomerLinkPage`), the proposal's value set as the document's parts take it, and the one
 * answer sheet that is open with what the customer has typed in it. A sheet closes when its act
 * lands; a refusal keeps it open with its reason where the person acted (`F5-47`).
 */
export interface CustomerPageScreen extends CustomerLinkPage {
  /** The proposal the page shows, in the shape `ProposalBlocks` take; `null` on any other page. */
  readonly snapshot: ProposalVersionSnapshot | null;
  /** The part categories the proposal fills (`requiredCategories`); empty on any other page. */
  readonly categories: readonly ComponentCategory[];
  /**
   * The reader's language (`F5-08`), once the page has answered: the contact's, else the customer's,
   * else the company's. `null` before, and for a language this build does not hold (`F3-05`).
   */
  readonly language: UiLanguage | null;
  /**
   * The market's own name for its tax, which the page's words carry. The launch market's, until
   * the page's read carries the company's own market.
   */
  readonly market: { readonly taxName: string };
  readonly sheet: CustomerSheet | null;
  open(sheet: CustomerSheet): void;
  close(): void;
  /** The question, the change asked for, or the reason for declining, as typed or tapped. */
  readonly text: string;
  typed(text: string): void;
  readonly slots: readonly CallSlot[];
  /** The chosen window's `at`, or `CALL_SOON`. */
  readonly slot: string;
  choose(slot: string): void;
  /** Whether the open sheet has what its act needs. */
  readonly canSend: boolean;
  /** Sends the open sheet's act; a second press while one is out sends nothing. */
  send(): void;
}

const LAUNCH_MARKET = { taxName: IN_PACK.tax.scheme } as const;

const ACT_OF_SHEET: Readonly<Record<Exclude<CustomerSheet, 'more'>, LinkActKind>> = {
  accept: 'accept',
  ask: 'question',
  call: 'call',
  change: 'negotiate',
  decline: 'decline',
};

function actOf(
  sheet: CustomerSheet | null,
  versionId: string | null,
  text: string,
  slot: string,
): LinkAct | null {
  const words = text.trim();
  switch (sheet) {
    case 'accept':
      return versionId === null ? null : { kind: 'accept', versionId };
    case 'ask':
      return words === '' ? null : { kind: 'question', text: words };
    case 'call':
      return { kind: 'call', at: slot === CALL_SOON ? null : slot };
    case 'change':
      return versionId === null || words === '' ? null : { kind: 'negotiate', versionId, words };
    case 'decline':
      return versionId === null
        ? null
        : { kind: 'decline', versionId, reason: words === '' ? null : words };
    default:
      return null;
  }
}

export function useCustomerPageScreen(
  token: string,
  { deviceClass, initial, formats }: CustomerPageScreenOptions,
): CustomerPageScreen {
  const page = useCustomerLinkPage(token, { deviceClass, ...(initial ? { initial } : {}) });
  const [sheet, setSheet] = useState<CustomerSheet | null>(null);
  const [text, setText] = useState('');
  const [slots, setSlots] = useState<readonly CallSlot[]>([]);
  const [slot, setSlot] = useState<string>(CALL_SOON);

  const document = page.read.kind === 'ready' ? page.read.value.proposal?.document : undefined;
  const snapshot = useMemo(
    () => (document === undefined ? null : proposalSnapshotOf(document, formats)),
    [document, formats],
  );

  /* The act landed: the page already shows it, so its sheet has nothing left to ask. */
  const { done } = page;
  useEffect(() => {
    if (done === null) return;
    setSheet((open) =>
      open !== null && open !== 'more' && ACT_OF_SHEET[open] === done ? null : open,
    );
    setText('');
  }, [done]);

  const versionId = page.read.kind === 'ready' ? page.read.value.proposal?.versionId : undefined;
  const act = actOf(sheet, versionId ?? null, text, slot);
  return {
    ...page,
    snapshot,
    categories: snapshot === null ? [] : requiredCategories(snapshot.fields),
    language: page.read.kind === 'ready' ? uiLanguageOfTag(page.read.value.language) : null,
    market: LAUNCH_MARKET,
    sheet,
    open: (next) => {
      page.clear();
      setText('');
      if (next === 'call') {
        const offered = callSlotsFrom(Date.now());
        setSlots(offered);
        setSlot(offered[0]?.at ?? CALL_SOON);
      }
      setSheet(next);
    },
    close: () => {
      page.clear();
      setSheet(null);
    },
    text,
    typed: setText,
    slots,
    slot,
    choose: setSlot,
    canSend: act !== null && page.acting === null,
    send: () => {
      if (act !== null) page.act(act);
    },
  };
}
