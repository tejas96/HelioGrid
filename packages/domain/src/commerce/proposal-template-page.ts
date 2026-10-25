import type { PackLabel } from '../format/languages';
import {
  type SettingsLastSave,
  type SettingsStanding,
  sameContent,
  standingOf,
} from '../tenancy/settings-page';
import type { ProposalTemplateSettings } from './effective-settings';
import {
  DEFAULT_SECTIONS_INCLUDED,
  DEFAULT_TERMS,
  isSectionFloor,
  PROPOSAL_SECTIONS,
} from './proposal-template-defaults';
import {
  hasWords,
  TEMPLATE_PARTS,
  type TemplateDraft,
  type TemplatePart,
  type TemplateRefusal,
  type TemplateSaved,
} from './proposal-template-draft';
import {
  DEFAULT_TIMELINE_PHASES,
  PHASE_NAME_LIMIT,
  TIMELINE_PHASE_LIMIT,
  type TimelinePhase,
} from './timeline-template-defaults';

/**
 * What the Proposal template page reads off its draft (`SCR-M01-19`): whose each part is, which
 * record changed and what *Save template* sends, what each field refuses, the sections count and
 * the standing line. The draft and its edits are `proposal-template-draft.ts`'s.
 */

export interface PhaseRefusals {
  readonly name: TemplateRefusal | null;
  readonly description: TemplateRefusal | null;
}

/** Whether a part still reads HelioGrid's (`ValueSource`, *Write our own*). */
export function templatePartOrigin(draft: TemplateDraft, part: TemplatePart): 'platform' | 'own' {
  if (draft.writing.includes(part)) return 'own';
  const held: Record<TemplatePart, boolean> = {
    cover: draft.template.cover === null,
    sections: sameContent(draft.template.sectionsIncluded, DEFAULT_SECTIONS_INCLUDED),
    terms: sameContent(draft.template.defaultTerms, DEFAULT_TERMS),
    timeline: sameContent(phasesOf(draft), DEFAULT_TIMELINE_PHASES),
  };
  return held[part] ? 'platform' : 'own';
}

/** The teaching banner shows while every part is HelioGrid's. */
export function onPlatformTemplate(draft: TemplateDraft): boolean {
  return TEMPLATE_PARTS.every((part) => templatePartOrigin(draft, part) === 'platform');
}

function phasesOf(draft: TemplateDraft): readonly TimelinePhase[] {
  return draft.phases.map(({ name, description }) => ({ name, description }));
}

/** Which record differs from what is saved: the act bar rises on either; the stage notes only the template. */
export function templateChanged(
  saved: TemplateSaved,
  draft: TemplateDraft,
): { readonly template: boolean; readonly timeline: boolean } {
  return {
    template: !sameContent(draft.template, saved.template),
    timeline: !sameContent(phasesOf(draft), saved.phases),
  };
}

/** What *Save template* sends: only the records that changed, the template first. */
export function templateWritesOf(
  saved: TemplateSaved,
  draft: TemplateDraft,
): {
  readonly template?: ProposalTemplateSettings;
  readonly timeline?: { readonly phases: readonly TimelinePhase[] };
} {
  const changed = templateChanged(saved, draft);
  return {
    ...(changed.template ? { template: draft.template } : {}),
    ...(changed.timeline ? { timeline: { phases: phasesOf(draft) } } : {}),
  };
}

/** The *About* field's refusal: another language's words need an English version to fall back to. */
export function aboutRefusal(draft: TemplateDraft): TemplateRefusal | null {
  const about = draft.template.cover?.aboutCompany;
  return about !== null && about !== undefined && about.en.trim() === '' ? 'needs-english' : null;
}

/** The terms always print, so English must hold words (`SCR-M01-19`, decision 4). */
export function termsRefusal(draft: TemplateDraft): TemplateRefusal | null {
  return hasWords(draft.template.defaultTerms.en) ? null : 'needs-english';
}

/** The phase editor's refusals: a phase prints its English name and sentence in every language's fallback. */
export function phaseRefusals(phase: { name: PackLabel; description: PackLabel }): PhaseRefusals {
  const tooLong = Object.values(phase.name).some((name) => name.trim().length > PHASE_NAME_LIMIT);
  return {
    name: phase.name.en.trim() === '' ? 'needs-english' : tooLong ? 'too-long' : null,
    description: phase.description.en.trim() === '' ? 'needs-english' : null,
  };
}

/** The draft can be sent: no field refuses and the timeline holds 1 to `TIMELINE_PHASE_LIMIT` phases. */
export function templateSendable(draft: TemplateDraft): boolean {
  const phasesWhole = draft.phases.every((phase) => {
    const refusals = phaseRefusals(phase);
    return refusals.name === null && refusals.description === null;
  });
  return (
    aboutRefusal(draft) === null &&
    termsRefusal(draft) === null &&
    phasesWhole &&
    draft.phases.length >= 1 &&
    draft.phases.length <= TIMELINE_PHASE_LIMIT
  );
}

/** *{n} of 8 optional sections print*: the floor is not a choice, so it is not counted. */
export function optionalSectionsShown(draft: TemplateDraft): {
  readonly printing: number;
  readonly of: number;
} {
  const optional = PROPOSAL_SECTIONS.filter((section) => !isSectionFloor(section));
  return {
    printing: optional.filter((section) => draft.template.sectionsIncluded.includes(section))
      .length,
    of: optional.length,
  };
}

/**
 * The standing line: the later of the two saves the reads name. An api that names neither (absent)
 * reads by what is held, so a company with its own template is never told nothing is set.
 */
export function templateStanding(
  draft: TemplateDraft,
  template: SettingsLastSave | null | undefined,
  timeline: SettingsLastSave | null | undefined,
): SettingsStanding {
  const saves = [standingOf(template), standingOf(timeline)].filter((save) => save !== null);
  const later = saves.sort((a, b) => b.at - a.at)[0];
  if (later !== undefined) return later;
  const unknown = template === undefined && timeline === undefined && !onPlatformTemplate(draft);
  return unknown ? { kind: 'saved-unknown' } : { kind: 'never-set' };
}

/** The part whose field refuses the draft, to open on a refused *Save template*; `null` when none does. */
export function templateRefusedPart(draft: TemplateDraft): 'cover' | 'terms' | null {
  if (termsRefusal(draft) !== null) return 'terms';
  return aboutRefusal(draft) === null ? null : 'cover';
}
