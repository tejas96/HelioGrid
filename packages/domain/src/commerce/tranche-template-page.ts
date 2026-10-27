import { authoredIn, type PackLabel, type UiLanguage } from '../format/languages';
import { type BasisPoints, basisPoints, basisPointsToPercent } from '../money/basis-points';
import { PROJECT_STAGE_CHAIN, type ProjectChainStage } from '../projects/stages';
import {
  type SettingsLastSave,
  type SettingsStanding,
  sameContent,
  standingOf,
} from '../tenancy/settings-page';
import { type AllocationVerdict, allocationVerdict, WHOLE_ALLOCATION } from './tranche-allocation';
import { ON_SIGNING, TRANCHE_LINE_LIMIT } from './tranche-template-defaults';

/**
 * What the Payment terms page reads off its templates and its open editor (`SCR-M01-20`): the
 * cards, the draft and each edit, the one allocation verdict the meter and *Save terms* share,
 * the refusals, what the save sends and what the preview prices. Both screens render it (Law 11).
 */

/** A template as the list read answers it: shares as the wire's two-decimal percent. */
export interface TrancheTemplateRead {
  readonly id: string;
  readonly name: PackLabel;
  readonly isDefault: boolean;
  readonly archived: boolean;
  /** Edited since it was given: a seeded split reads *Platform standard* until it is. */
  readonly changed: boolean;
  readonly lines: readonly TrancheLineRead[];
}

export interface TrancheLineRead {
  readonly label: PackLabel;
  readonly percent: string;
  readonly dueOnStage: ProjectChainStage;
}

/** What a create or a save sends (`trancheTemplateWriteSchema`). */
export interface TrancheTemplateWriteOf {
  readonly name: PackLabel;
  readonly lines: readonly TrancheLineRead[];
}

/** A template as its card draws it: *Platform standard* while it is a seeded split, untouched. */
export interface TrancheCard extends TrancheTemplateRead {
  readonly platformStandard: boolean;
}

/** The cards in the api's order — creation — the terms in use apart from the archived ones. */
export function trancheCardsOf(templates: readonly TrancheTemplateRead[]): {
  readonly inUse: readonly TrancheCard[];
  readonly archived: readonly TrancheCard[];
} {
  const cards = templates.map((template) => ({ ...template, platformStandard: !template.changed }));
  return {
    inUse: cards.filter((card) => !card.archived),
    archived: cards.filter((card) => card.archived),
  };
}

/** The teaching banner: only the two given splits exist, neither touched. */
export function onSeededTermsOnly(templates: readonly TrancheTemplateRead[]): boolean {
  return templates.length > 0 && templates.every((template) => !template.changed);
}

/**
 * The saved line under the title: the newest create or save the list names. An api that names
 * none (absent) reads by what is held, so a company that edited its terms is never told nothing
 * changed since its account was made.
 */
export function trancheStanding(
  lastSaved: SettingsLastSave | null | undefined,
  templates: readonly TrancheTemplateRead[],
): SettingsStanding {
  const saved = standingOf(lastSaved);
  if (saved !== null) return saved;
  const unknown = lastSaved === undefined && !onSeededTermsOnly(templates);
  return unknown ? { kind: 'saved-unknown' } : { kind: 'never-set' };
}

/**
 * A name as the editor holds it: the text shown in the screen's language, and the stored label
 * it came from. A shown text left as it read keeps every language; a typed one replaces them all.
 */
export interface TrancheDraftText {
  readonly shown: string;
  readonly from: PackLabel | null;
}

export interface TrancheDraftLine {
  /** Stable across edits and reorders, for the screen's keys and the edits' aim. */
  readonly key: number;
  readonly label: TrancheDraftText;
  /** Whole basis points; `null` while the share is empty. */
  readonly share: number | null;
  readonly dueOnStage: ProjectChainStage;
}

export interface TrancheDraft {
  /** `null` for *Add payment terms*. */
  readonly id: string | null;
  readonly language: UiLanguage;
  readonly name: TrancheDraftText;
  readonly lines: readonly TrancheDraftLine[];
}

/** A name is the company's own words (`F3-10`): shown in the reader's language where written, else the original. */
const shownIn = (label: PackLabel, language: UiLanguage) => authoredIn(label, language).value;

const textOf = (label: PackLabel, language: UiLanguage): TrancheDraftText => ({
  shown: shownIn(label, language),
  from: label,
});

/** Lines read in the order of their stages; two on one stage keep the order they had. */
function inStageOrder(lines: readonly TrancheDraftLine[]): TrancheDraftLine[] {
  const rank = (line: TrancheDraftLine) => PROJECT_STAGE_CHAIN.indexOf(line.dueOnStage);
  return [...lines].sort((a, b) => rank(a) - rank(b));
}

/** A template opened in the editor. */
export function trancheDraftOf(template: TrancheTemplateRead, language: UiLanguage): TrancheDraft {
  return {
    id: template.id,
    language,
    name: textOf(template.name, language),
    lines: inStageOrder(
      template.lines.map((line, key) => ({
        key,
        label: textOf(line.label, language),
        share: shareOfPercent(line.percent),
        dueOnStage: line.dueOnStage,
      })),
    ),
  };
}

/** *Add payment terms*: no name yet, one tranche of the whole on signing, due at Won. */
export function trancheNewDraft(language: UiLanguage): TrancheDraft {
  return {
    id: null,
    language,
    name: { shown: '', from: null },
    lines: [
      {
        key: 0,
        label: textOf(ON_SIGNING, language),
        share: WHOLE_ALLOCATION,
        dueOnStage: 'won',
      },
    ],
  };
}

export type TrancheEdit =
  | { readonly kind: 'name'; readonly text: string }
  | { readonly kind: 'line-label'; readonly key: number; readonly text: string }
  | { readonly kind: 'line-share'; readonly key: number; readonly share: number | null }
  | { readonly kind: 'line-stage'; readonly key: number; readonly stage: ProjectChainStage }
  /** `label` is the catalog's *Tranche {n}*, already worded for the next line's number. */
  | { readonly kind: 'add-line'; readonly label: string }
  | { readonly kind: 'remove-line'; readonly key: number };

/** One edit applied. A 13th tranche is never added and the last one is never removed. */
export function trancheEdit(draft: TrancheDraft, edit: TrancheEdit): TrancheDraft {
  const lineEdit = (key: number, change: Partial<TrancheDraftLine>) =>
    draft.lines.map((line) => (line.key === key ? { ...line, ...change } : line));
  switch (edit.kind) {
    case 'name':
      return { ...draft, name: { ...draft.name, shown: edit.text } };
    case 'line-label': {
      const line = draft.lines.find((one) => one.key === edit.key);
      const label = line === undefined ? null : { ...line.label, shown: edit.text };
      return label === null ? draft : { ...draft, lines: lineEdit(edit.key, { label }) };
    }
    case 'line-share':
      return { ...draft, lines: lineEdit(edit.key, { share: edit.share }) };
    case 'line-stage':
      return { ...draft, lines: inStageOrder(lineEdit(edit.key, { dueOnStage: edit.stage })) };
    case 'add-line':
      return canAddTranche(draft)
        ? { ...draft, lines: [...draft.lines, newLine(draft, edit.label)] }
        : draft;
    case 'remove-line':
      return canRemoveTranche(draft)
        ? { ...draft, lines: draft.lines.filter((line) => line.key !== edit.key) }
        : draft;
  }
}

/** A new tranche: the name given, no share yet, due where the last one is. */
function newLine(draft: TrancheDraft, label: string): TrancheDraftLine {
  const lastStage = draft.lines.reduce<ProjectChainStage>((_, line) => line.dueOnStage, 'won');
  return {
    key: Math.max(-1, ...draft.lines.map((line) => line.key)) + 1,
    label: { shown: label, from: null },
    share: null,
    dueOnStage: lastStage,
  };
}

export function canAddTranche(draft: TrancheDraft): boolean {
  return draft.lines.length < TRANCHE_LINE_LIMIT;
}

/** A template keeps one tranche (the contract's `min(1)`). */
export function canRemoveTranche(draft: TrancheDraft): boolean {
  return draft.lines.length > 1;
}

/** The ONE verdict the meter draws and *Save terms* reads (`M01-54`); an empty share counts as none. */
export function trancheVerdictOf(draft: TrancheDraft): AllocationVerdict {
  return allocationVerdict(draft.lines.map((line) => shareOf(line.share)));
}

/** A share the field committed, held to the whole: the field's own range refuses the rest. */
function shareOf(share: number | null): BasisPoints {
  return basisPoints(Math.min(Math.max(share ?? 0, 0), WHOLE_ALLOCATION));
}

function shareOfPercent(percent: string): number {
  return Math.round(Number(percent) * 100);
}

export interface TrancheRefusals {
  readonly name: 'required' | null;
  readonly lines: ReadonlyMap<
    number,
    { readonly label: 'required' | null; readonly share: 'range' | null }
  >;
}

/** What each field refuses on *Save terms*: a name, each tranche's name, a share of 0.01% to 100%. */
export function trancheRefusals(draft: TrancheDraft): TrancheRefusals {
  const lines = new Map(
    draft.lines.map((line) => [
      line.key,
      {
        label: line.label.shown.trim() === '' ? ('required' as const) : null,
        share:
          line.share === null || line.share < 1 || line.share > WHOLE_ALLOCATION
            ? ('range' as const)
            : null,
      },
    ]),
  );
  return { name: draft.name.shown.trim() === '' ? 'required' : null, lines };
}

/** *Save terms* sends: every field holds and the split is whole. */
export function trancheSendable(draft: TrancheDraft): boolean {
  const refusals = trancheRefusals(draft);
  const linesHold = [...refusals.lines.values()].every(
    (line) => line.label === null && line.share === null,
  );
  return refusals.name === null && linesHold && trancheVerdictOf(draft).state === 'met';
}

/** A name as stored: the label it came from when the text still reads it, else the typed text alone. */
function labelWriteOf(text: TrancheDraftText, language: UiLanguage): PackLabel {
  const kept = text.from !== null && shownIn(text.from, language) === text.shown;
  return kept && text.from !== null ? text.from : { en: text.shown.trim() };
}

/** What *Save terms* sends, in the lines' stage order. */
export function trancheWriteOf(draft: TrancheDraft): TrancheTemplateWriteOf {
  return {
    name: labelWriteOf(draft.name, draft.language),
    lines: draft.lines.map((line) => ({
      label: labelWriteOf(line.label, draft.language),
      percent: basisPointsToPercent(shareOf(line.share)),
      dueOnStage: line.dueOnStage,
    })),
  };
}

/** Whether the draft differs from what it opened as — *Save terms* sends nothing, and leaving asks nothing, when it does not. */
export function trancheDraftChanged(opened: TrancheDraft, draft: TrancheDraft): boolean {
  if (draft.id === null) return true;
  return !sameContent(trancheWriteOf(opened), trancheWriteOf(draft));
}

/**
 * The schedule the preview shows (`SCR-M01-20`, *live-customer-preview*): the saved lines until
 * the edit is whole, then the edit; a new template shows nothing until its first whole edit.
 */
export function tranchePreviewLines(
  saved: TrancheTemplateRead | null,
  draft: TrancheDraft,
): { readonly source: 'saved' | 'draft'; readonly lines: readonly TrancheLineRead[] } | null {
  if (trancheVerdictOf(draft).state === 'met') {
    return { source: 'draft', lines: trancheWriteOf(draft).lines };
  }
  return saved === null ? null : { source: 'saved', lines: saved.lines };
}
