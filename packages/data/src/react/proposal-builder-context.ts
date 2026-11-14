import type { ProposalDetail, ProposalFieldSetWire } from '@heliogrid/contracts';
import {
  AMOUNT_TOO_LARGE,
  amountFitsWire,
  type ComponentCategory,
  type FormatPack,
} from '@heliogrid/domain';
import type { BuilderFieldSave } from './proposal-builder-model';
import type { ProposalActFailure } from './proposal-cache';
import type { DraftChange, DraftFieldState, ProposalDealEdit } from './proposal-draft-queue';
import type { BuilderBank } from './use-builder-bank';
import type { TermsDefault } from './use-terms-default';

/** What every step's model is built over: the draft as it stands, and the ways a step changes it. */
export interface StepContext {
  /** The proposal as the server last answered it. */
  readonly detail: ProposalDetail;
  /** The steps as the person left them — the stored ones with every waiting change laid over. */
  readonly fields: ProposalFieldSetWire;
  /** The lead's facts as the person left them. */
  readonly deal: ProposalDetail['document']['deal'];
  readonly formats: FormatPack;
  /** The battery's tax rate for a battery added here — the market pack's; `null` until it is read. */
  readonly batteryTaxPercent: string | null;
  readonly commit: (key: string, change: DraftChange) => void;
  /** Holds a typed value the device refuses, with why; it is never sent. */
  readonly hold: (key: string, change: DraftChange, failure: ProposalActFailure) => void;
  readonly stateOf: (key: string) => DraftFieldState | null;
  readonly retry: (key: string) => void;
  readonly reload: () => void;
  /** A switch's next value: flipped from the last one asked for, never from what the control says. */
  readonly flipped: (key: string, stored: boolean) => boolean;
  readonly acts: StepActs;
}

/** What a step opens or asks for outside its own fields. */
export interface StepActs {
  readonly pickCategory: (category: ComponentCategory) => void;
  readonly editPhase: (index: number) => void;
  readonly addPhase: () => void;
  /** Step 7's part sheet: an existing part, or a new one. */
  readonly editPart: (index: number) => void;
  readonly addPart: () => void;
  /** Whether the market offers this deal its incentive — the pack's rule; `null` until it is read. */
  readonly incentiveOffered: boolean | null;
  /** The pack's incentive as step 3 names it; `null` where the market has none or it is unread. */
  readonly incentiveScheme: {
    readonly name: string;
    readonly requiredScheme: string | null;
    readonly paidTo: 'customer' | 'company';
  } | null;
  /** Generate was asked for: a step marks its own missing field, never before (`M06-22`). */
  readonly checkAsked: boolean;
  readonly resetStep: (step: 'timeline' | 'payment') => void;
  readonly refill: () => void;
  readonly energyState: DraftFieldState | null;
  /** The discount mode the person last chose, kept while no value is typed. */
  readonly discountMode: 'percent' | 'amount' | null;
  readonly chooseDiscountMode: (mode: 'percent' | 'amount') => void;
  readonly termsTyped: ProposalFieldSetWire['terms'] | null;
  readonly typeTerms: (terms: ProposalFieldSetWire['terms']) => void;
  /** Step 9's *Save as default*, for a holder of the settings right alone (`M06-15`). */
  readonly termsDefault: TermsDefault | null;
  /** Step 11's fields, for who may write the company's account; `null` for anyone else. */
  readonly bank: BuilderBank | null;
}

type Wire = ProposalFieldSetWire;

/** A typed figure no step may send: an amount past the wire's whole digits (`amountSchema`). */
const TOO_LARGE: ProposalActFailure = { kind: 'refused', refusal: AMOUNT_TOO_LARGE };

/** Sends a change, or holds it as typed when one of the amounts typed into it cannot travel. */
function sendOrHold(
  ctx: StepContext,
  key: string,
  change: DraftChange,
  amounts: readonly (number | null)[],
): void {
  if (amounts.every((amount) => amount === null || amountFitsWire(amount))) {
    ctx.commit(key, change);
  } else {
    ctx.hold(key, change, TOO_LARGE);
  }
}

/**
 * One step rewritten whole on the field set as the server holds it when the change is sent.
 * `amounts` are the money figures typed into it, each checked before anything is sent.
 */
export function editStep<K extends keyof Wire>(
  ctx: StepContext,
  key: string,
  step: K,
  change: (stored: Wire[K], all: Wire) => Wire[K],
  amounts: readonly (number | null)[] = [],
): void {
  const fields = (stored: Wire) => ({ [step]: change(stored[step], stored) }) as Partial<Wire>;
  sendOrHold(ctx, key, { fields }, amounts);
}

export function editDeal(
  ctx: StepContext,
  key: string,
  deal: ProposalDealEdit,
  amounts: readonly (number | null)[] = [],
): void {
  sendOrHold(ctx, key, { deal }, amounts);
}

/** A field's save as its step draws it; a value the server refused says why, at the field. */
export function saveOf(ctx: StepContext, key: string): BuilderFieldSave | undefined {
  const state = ctx.stateOf(key);
  if (state === null) return undefined;
  if (state.kind === 'saving' || state.kind === 'saved') return { kind: state.kind };
  if (state.kind === 'refused') return { kind: 'refused', failure: state.failure };
  if (state.kind === 'unsaved' && state.reason === 'conflict') {
    return { kind: 'conflict', onReload: ctx.reload };
  }
  return { kind: 'unsaved', onRetry: () => ctx.retry(key) };
}

/** The saves of several fields by their queue keys, the ones at rest left out. */
export function savesOf<Field extends string>(
  ctx: StepContext,
  keys: Readonly<Record<Field, string>>,
): Readonly<Partial<Record<Field, BuilderFieldSave>>> {
  const saves: Partial<Record<Field, BuilderFieldSave>> = {};
  for (const field of Object.keys(keys) as Field[]) {
    const save = saveOf(ctx, keys[field]);
    if (save !== undefined) saves[field] = save;
  }
  return saves;
}

/** A typed major-unit amount as the wire spells it; a typed percent likewise. */
export function amountWire(formats: FormatPack, value: number): string {
  return value.toFixed(formats.minorUnitDigits);
}
const PERCENT_DIGITS = 2;
export function percentWire(value: number): string {
  return value.toFixed(PERCENT_DIGITS);
}
export function typedOf(text: string | null | undefined): number | null {
  return text === null || text === undefined ? null : Number(text);
}
