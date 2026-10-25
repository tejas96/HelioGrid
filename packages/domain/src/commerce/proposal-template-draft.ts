import type { PerLanguage, UiLanguage } from '../format/languages';
import { sameContent } from '../tenancy/settings-page';
import type { ProposalTemplateSettings } from './effective-settings';
import {
  type ProposalCover,
  type ProposalSection,
  sectionsIncluded,
} from './proposal-template-defaults';
import type { RichTextValue } from './rich-text';
import { TIMELINE_PHASE_LIMIT, type TimelinePhase } from './timeline-template-defaults';

/**
 * The Proposal template page's one draft (`M01-51`, `M01-52`, `SCR-M01-19`), which both screens
 * render: the cover, the sections and the terms of one record, the phases of another, and one
 * *Save template* that writes only the record that changed. A part is HelioGrid's while it holds
 * the platform's value and the owner has not chosen *Write our own*.
 */

export const TEMPLATE_PARTS = ['cover', 'sections', 'terms', 'timeline'] as const;
export type TemplatePart = (typeof TEMPLATE_PARTS)[number];

export type CoverCount = 'totalCapacityInstalledKw' | 'happyCustomers' | 'citiesServed';

/** What the page reads: the two records as the api serves them, the platform's filled where unset. */
export interface TemplateSaved {
  readonly template: ProposalTemplateSettings;
  readonly phases: readonly TimelinePhase[];
}

/** A phase as the list holds it: `key` names it while it moves, never sent. */
export interface DraftPhase extends TimelinePhase {
  readonly key: number;
}

export interface TemplateDraft {
  readonly template: ProposalTemplateSettings;
  readonly phases: readonly DraftPhase[];
  /** The parts *Write our own* opened while they still held the platform's value. */
  readonly writing: readonly TemplatePart[];
}

export type TemplateEdit =
  | { readonly kind: 'writeOwn'; readonly part: TemplatePart }
  | { readonly kind: 'about'; readonly language: UiLanguage; readonly text: string }
  | { readonly kind: 'count'; readonly count: CoverCount; readonly value: number | null }
  /** Flips the section from what the draft holds, never from a value a control hands back. */
  | { readonly kind: 'section'; readonly section: ProposalSection }
  | { readonly kind: 'terms'; readonly language: UiLanguage; readonly value: RichTextValue }
  /** `key` null adds the phase at the end. */
  | { readonly kind: 'phase'; readonly key: number | null; readonly phase: TimelinePhase }
  | { readonly kind: 'move'; readonly from: number; readonly to: number }
  | { readonly kind: 'delete'; readonly key: number };

/** What a field says before any save: English is the version every language falls back to. */
export type TemplateRefusal = 'needs-english' | 'too-long';

const EMPTY_COVER: ProposalCover = {
  aboutCompany: null,
  totalCapacityInstalledKw: null,
  happyCustomers: null,
  citiesServed: null,
};

export function templateDraftOf(saved: TemplateSaved): TemplateDraft {
  return {
    template: saved.template,
    phases: saved.phases.map((phase, key) => ({ ...phase, key })),
    writing: [],
  };
}

export function templateEdit(draft: TemplateDraft, edit: TemplateEdit): TemplateDraft {
  switch (edit.kind) {
    case 'writeOwn':
      return draft.writing.includes(edit.part)
        ? draft
        : { ...draft, writing: [...draft.writing, edit.part] };
    case 'about':
    case 'count':
      return withCover(draft, coverEdited(draft.template.cover ?? EMPTY_COVER, edit));
    case 'section':
      return withTemplate(draft, { sectionsIncluded: sectionSwitched(draft, edit) });
    case 'terms':
      return withTemplate(draft, { defaultTerms: termsEdited(draft, edit) });
    default:
      return { ...draft, phases: phasesEdited(draft.phases, edit) };
  }
}

function withTemplate(
  draft: TemplateDraft,
  part: Partial<ProposalTemplateSettings>,
): TemplateDraft {
  return { ...draft, template: { ...draft.template, ...part } };
}

/** A cover holding nothing is no cover: the platform's, identity alone. */
function withCover(draft: TemplateDraft, cover: ProposalCover): TemplateDraft {
  return withTemplate(draft, { cover: sameContent(cover, EMPTY_COVER) ? null : cover });
}

function coverEdited(
  cover: ProposalCover,
  edit: Extract<TemplateEdit, { kind: 'about' | 'count' }>,
): ProposalCover {
  if (edit.kind === 'count') return { ...cover, [edit.count]: edit.value };
  const about = withLanguage(cover.aboutCompany, edit.language, edit.text, '');
  return { ...cover, aboutCompany: about };
}

function sectionSwitched(
  draft: TemplateDraft,
  edit: Extract<TemplateEdit, { kind: 'section' }>,
): readonly ProposalSection[] {
  const others = draft.template.sectionsIncluded.filter((section) => section !== edit.section);
  const on = !draft.template.sectionsIncluded.includes(edit.section);
  return sectionsIncluded(on ? [...others, edit.section] : others);
}

function termsEdited(
  draft: TemplateDraft,
  edit: Extract<TemplateEdit, { kind: 'terms' }>,
): PerLanguage<RichTextValue> {
  const blank: RichTextValue = { version: 1, blocks: [] };
  const value = hasWords(edit.value) ? edit.value : blank;
  return withLanguage(draft.template.defaultTerms, edit.language, value, blank) ?? { en: blank };
}

/**
 * One language's version set or cleared. A cleared Hindi or Marathi keeps no entry, so a reader
 * falls back to English; a cleared English stays as an empty English until it is written again —
 * the refusal says so — and the whole value goes once no language holds anything.
 */
function withLanguage<T>(
  stored: PerLanguage<T> | null,
  language: UiLanguage,
  value: T,
  empty: T,
): PerLanguage<T> | null {
  // Words of spaces are no words: the wire trims them and refuses what is left empty.
  const cleared = typeof value === 'string' ? value.trim() === '' : sameContent(value, empty);
  const { [language]: _gone, ...rest } = stored ?? { en: empty };
  const kept = language === 'en' ? { ...rest, en: empty } : rest;
  const next = (cleared ? kept : { ...rest, [language]: value }) as PerLanguage<T>;
  const others = Object.entries(next).filter(([code]) => code !== 'en');
  return sameContent(next.en, empty) && others.length === 0 ? null : next;
}

function phasesEdited(
  phases: readonly DraftPhase[],
  edit: Extract<TemplateEdit, { kind: 'phase' | 'move' | 'delete' }>,
): readonly DraftPhase[] {
  switch (edit.kind) {
    case 'phase':
      if (edit.key === null) {
        if (phases.length >= TIMELINE_PHASE_LIMIT) return phases;
        const key = phases.reduce((top, phase) => Math.max(top, phase.key + 1), 0);
        return [...phases, { ...edit.phase, key }];
      }
      return phases.map((phase) =>
        phase.key === edit.key ? { ...edit.phase, key: phase.key } : phase,
      );
    case 'move': {
      const moved = phases[edit.from];
      if (moved === undefined || edit.to < 0 || edit.to >= phases.length) return phases;
      const rest = phases.filter((_, index) => index !== edit.from);
      return [...rest.slice(0, edit.to), moved, ...rest.slice(edit.to)];
    }
    case 'delete':
      return phases.length <= 1 ? phases : phases.filter((phase) => phase.key !== edit.key);
  }
}

/** A new phase as the editor opens it: nothing written yet. */
export const EMPTY_PHASE: TimelinePhase = { name: { en: '' }, description: { en: '' } };

/**
 * One field of a phase in one language, as the phase editor types it. A cleared Hindi or Marathi
 * keeps no entry; a cleared English stays empty, which the editor refuses (`phaseRefusals`).
 */
export function phaseWithText(
  phase: TimelinePhase,
  field: 'name' | 'description',
  language: UiLanguage,
  text: string,
): TimelinePhase {
  return { ...phase, [field]: withLanguage(phase[field], language, text, '') ?? { en: '' } };
}

/** Rich text holds a word: a heading, a paragraph or a list item with text that is not blank. */
export function hasWords(value: RichTextValue | undefined): boolean {
  return (value?.blocks ?? []).some((block) => {
    if (block.type === 'logo') return false;
    const spans = 'items' in block ? block.items.flat() : block.spans;
    return spans.some((span) => span.text.trim() !== '');
  });
}
