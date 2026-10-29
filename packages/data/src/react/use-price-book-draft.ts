'use client';
import type {
  PriceBookActiveWire,
  PriceBookPublish,
  PriceBookRateWire,
  PriceBookVersionHeadWire,
} from '@heliogrid/contracts';
import {
  PRICE_BOOK_RATE_BASES,
  type PriceBookRateBasis,
  percentWireOf,
  UI_LANGUAGES,
  UI_SOURCE_LOCALE,
  type UiLanguage,
} from '@heliogrid/domain';
import { useRef, useState } from 'react';
import type { Action } from './action';
import { usePublishPriceBookVersion } from './use-price-book';

/** One rate being written: its name per language, how it is charged, and its amount. */
export interface DraftRate {
  readonly key: string;
  readonly name: Partial<Record<UiLanguage, string>>;
  readonly basis: PriceBookRateBasis;
  readonly amount: string;
  /** The version in force's amount for this rate; `null` for a rate added here. */
  readonly was: string | null;
}

/** The rate the sheet edits: a copy, so *Cancel* leaves the draft as it was. */
export interface EditedRate {
  readonly rate: DraftRate;
  /** Added from *Add a rate*: not in the list until *Done*. */
  readonly added: boolean;
  /** No English name yet: *Done* waits for one (`F3-10`). */
  readonly nameless: boolean;
}

export interface PriceBookDraft {
  readonly open: boolean;
  /** The version this one starts from; `null` before the first. */
  readonly from: number | null;
  readonly margin: string;
  readonly note: string;
  readonly rows: readonly DraftRate[];
  readonly editing: EditedRate | null;
  /** How many rates have no name yet in each language — English is required, the rest fall back. */
  readonly missing: Readonly<Record<UiLanguage, number>>;
  /** The draft cannot be sent: a rate without an English name or an amount, or no note. */
  readonly incomplete: boolean;
  /** Everything else is ready and only *What changed* is empty — the editor says so. */
  readonly noteMissing: boolean;
  readonly publishing: Action<PriceBookPublish, PriceBookVersionHeadWire>;
  start(active: PriceBookActiveWire): void;
  close(): void;
  setMargin(margin: string): void;
  setNote(note: string): void;
  setAmount(key: string, amount: string): void;
  /** Opens the rate sheet on a rate of the list. */
  edit(key: string): void;
  /** Opens the rate sheet on a new rate. */
  addRate(): void;
  setEditName(language: UiLanguage, name: string): void;
  setEditBasis(basis: PriceBookRateBasis): void;
  /** Keeps the sheet's edits; waits while the rate has no English name. */
  doneEdit(): void;
  cancelEdit(): void;
  removeEdited(): void;
  /** The new version's number once it is in force; `null` when it did not land or is incomplete. */
  publish(): Promise<number | null>;
}

const named = (rate: DraftRate, language: UiLanguage) => (rate.name[language] ?? '').trim() !== '';

/**
 * The new price-book version's draft (`M01-48`, `F3-10`): it starts as a copy of the version in
 * force, every rate's name written per language with English required and the others falling
 * back to it (`F3-10`), and publishes as the whole set — never an edit of the one before.
 */
export function usePriceBookDraft(): PriceBookDraft {
  const [open, setOpen] = useState(false);
  const publishing = usePublishPriceBookVersion(() => setOpen(false));
  const [from, setFrom] = useState<number | null>(null);
  const [margin, setMargin] = useState('');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<readonly DraftRate[]>([]);
  const [edited, setEdited] = useState<{ rate: DraftRate; added: boolean } | null>(null);
  const next = useRef(0);
  const keyOf = () => {
    next.current += 1;
    return `rate-${next.current}`;
  };
  const change = (key: string, patch: (rate: DraftRate) => DraftRate) =>
    setRows((now) => now.map((rate) => (rate.key === key ? patch(rate) : rate)));
  const patchEdited = (patch: (rate: DraftRate) => DraftRate) =>
    setEdited((now) => (now === null ? now : { ...now, rate: patch(now.rate) }));

  const missing = Object.fromEntries(
    UI_LANGUAGES.map((lang) => [lang, rows.filter((rate) => !named(rate, lang)).length]),
  ) as Record<UiLanguage, number>;
  const ratesReady =
    margin.trim() !== '' &&
    rows.every((rate) => named(rate, UI_SOURCE_LOCALE) && rate.amount.trim() !== '');
  const incomplete = note.trim() === '' || !ratesReady;

  const body = (): PriceBookPublish => ({
    note: note.trim(),
    defaultMarginPct: percentWireOf(margin),
    rates: rows.map(wireRateOf),
  });

  return {
    open,
    from,
    margin,
    note,
    rows,
    editing:
      edited === null ? null : { ...edited, nameless: !named(edited.rate, UI_SOURCE_LOCALE) },
    missing,
    incomplete,
    noteMissing: ratesReady && note.trim() === '',
    publishing,
    start(active) {
      setFrom(active.version?.number ?? null);
      setMargin(active.defaultMarginPct);
      setNote('');
      setEdited(null);
      setRows(
        active.rates.map((rate) => ({
          key: keyOf(),
          name: { ...rate.name },
          basis: rate.basis,
          amount: rate.amount,
          was: rate.amount,
        })),
      );
      setOpen(true);
    },
    close: () => setOpen(false),
    setMargin,
    setNote,
    setAmount: (key, amount) => change(key, (rate) => ({ ...rate, amount })),
    edit(key) {
      const rate = rows.find((each) => each.key === key);
      if (rate !== undefined) setEdited({ rate, added: false });
    },
    addRate: () =>
      setEdited({
        rate: { key: keyOf(), name: {}, basis: PRICE_BOOK_RATE_BASES[0], amount: '', was: null },
        added: true,
      }),
    setEditName: (lang, name) =>
      patchEdited((rate) => ({ ...rate, name: { ...rate.name, [lang]: name } })),
    setEditBasis: (basis) => patchEdited((rate) => ({ ...rate, basis })),
    doneEdit() {
      if (edited === null || !named(edited.rate, UI_SOURCE_LOCALE)) return;
      const { rate, added } = edited;
      setRows((now) =>
        added ? [...now, rate] : now.map((each) => (each.key === rate.key ? rate : each)),
      );
      setEdited(null);
    },
    cancelEdit: () => setEdited(null),
    removeEdited() {
      if (edited === null) return;
      const { key } = edited.rate;
      setRows((now) => now.filter((rate) => rate.key !== key));
      setEdited(null);
    },
    async publish() {
      if (incomplete) return null;
      /* The number the server gave the version this publish put in force. */
      const answer = await publishing.run(body());
      return answer.kind === 'done' ? answer.output.number : null;
    },
  };
}

/** The rate as the wire takes it: English always, another language only where it is written. */
function wireRateOf(rate: DraftRate): PriceBookRateWire {
  const written = UI_LANGUAGES.filter((lang) => named(rate, lang)).map(
    (lang) => [lang, (rate.name[lang] ?? '').trim()] as const,
  );
  return {
    name: { en: (rate.name.en ?? '').trim(), ...Object.fromEntries(written) },
    basis: rate.basis,
    amount: rate.amount.trim(),
  };
}
