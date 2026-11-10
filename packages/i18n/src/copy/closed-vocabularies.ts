import type { UiLanguage } from '@heliogrid/contracts';
import type { MessageRef } from '../runtime';
import { COMPANY_PROFILE_PART_TITLE, COMPANY_PROFILE_STANDING_WORD } from './company-profile';
import {
  ACTIVITY_KIND_WORD,
  BUYING_TIMELINE_WORD,
  CALL_OUTCOME_WORD,
  CONTACT_ROLE_SEED_WORD,
  DEAL_SEGMENT_WORD,
  DECISION_MAKER_WORD,
  DISQUALIFY_REASON_WORD,
  LEAD_SOURCE_WORD,
  LEAD_STAGE_WORD,
  LEAD_STATE_WORD,
  LOST_REASON_WORD,
  QUALIFY_QUESTION_LABEL,
  ROOF_OWNERSHIP_WORD,
  ROOF_TYPE_WORD,
  SHADING_WORD,
  TASK_KIND_WORD,
} from './crm-vocabulary';
import { DISCLOSURE_LEAD_WORD } from './disclosure';
import { BASIS_LINE_WORD } from './document-basis';
import { ENERGY_SOURCE_WORD } from './energy-source';
import { FRESHNESS_WORD, PACK_KEY_WORD, PINNED_INPUT_WORD } from './freshness';
import { PROVENANCE_STANDING_WORD, PROVENANCE_TIER_WORD } from './provenance';
import { REFERENCE_ROW, REFERENCE_SCOPE } from './role-matrix';
import { PRESET_SUMMARY } from './role-presets';
import { TENANT_SEGMENT_WORD } from './setup-what-you-sell';
import { TEAM, TEAM_EMPTY_CHIP, TEAM_STATUS_WORD } from './team';

/**
 * The words one surface shows together. Every member of every vocabulary in a group must read as
 * its own word, in every language (`F3-12`) — a tier word equal to a standing word would print one
 * word twice with two meanings on the same label.
 */
export interface ClosedVocabularyGroup {
  readonly surface: string;
  readonly vocabularies: Readonly<Record<string, Readonly<Record<string, MessageRef>>>>;
}

/**
 * Every closed vocabulary with a translated display. A new one joins here: nothing else can tell
 * a vocabulary's display from a screen title, which may repeat on purpose (`copy/homes.ts`).
 */
export const CLOSED_VOCABULARY_GROUPS: readonly ClosedVocabularyGroup[] = [
  {
    surface: 'provenance label',
    vocabularies: {
      tier: PROVENANCE_TIER_WORD,
      standing: PROVENANCE_STANDING_WORD,
      source: ENERGY_SOURCE_WORD,
      freshness: FRESHNESS_WORD,
      movedInput: PINNED_INPUT_WORD,
      movedPackKey: PACK_KEY_WORD,
    },
  },
  {
    surface: 'roles reference',
    vocabularies: { row: REFERENCE_ROW, scope: REFERENCE_SCOPE, summary: PRESET_SUMMARY },
  },
  {
    surface: 'disclosure set',
    vocabularies: { lead: DISCLOSURE_LEAD_WORD },
  },
  {
    surface: 'document basis',
    vocabularies: { line: BASIS_LINE_WORD },
  },
  {
    surface: 'what a company sells',
    vocabularies: { segment: TENANT_SEGMENT_WORD },
  },
  {
    surface: 'company profile',
    vocabularies: { part: COMPANY_PROFILE_PART_TITLE, standing: COMPANY_PROFILE_STANDING_WORD },
  },
  {
    surface: 'a lead in a list',
    vocabularies: {
      stage: LEAD_STAGE_WORD,
      state: LEAD_STATE_WORD,
      source: LEAD_SOURCE_WORD,
      segment: DEAL_SEGMENT_WORD,
    },
  },
  {
    surface: 'qualify card',
    vocabularies: {
      question: QUALIFY_QUESTION_LABEL,
      roofOwnership: ROOF_OWNERSHIP_WORD,
      roofType: ROOF_TYPE_WORD,
      shading: SHADING_WORD,
      timeline: BUYING_TIMELINE_WORD,
      decisionMaker: DECISION_MAKER_WORD,
    },
  },
  {
    surface: 'disqualify reasons',
    vocabularies: { reason: DISQUALIFY_REASON_WORD },
  },
  {
    surface: 'lost reasons',
    vocabularies: { reason: LOST_REASON_WORD },
  },
  {
    surface: 'a contact and a call',
    vocabularies: { role: CONTACT_ROLE_SEED_WORD, outcome: CALL_OUTCOME_WORD },
  },
  {
    surface: 'lead timeline',
    vocabularies: { activity: ACTIVITY_KIND_WORD },
  },
  {
    surface: 'a follow-up task',
    vocabularies: { task: TASK_KIND_WORD },
  },
  {
    surface: 'team list',
    vocabularies: {
      status: TEAM_STATUS_WORD,
      chip: { all: TEAM.all },
      emptyChip: TEAM_EMPTY_CHIP,
    },
  },
];

const INVISIBLE_FORMAT_CHARACTER = /\p{Cf}/gu;
const SPACE_RUN = /\s+/gu;

/**
 * A word as a reader sees it: joiners, zero-width spaces and soft hyphens draw nothing, a run of
 * spaces reads as one, and one Devanagari word composed two ways is one word.
 */
export function readerForm(language: UiLanguage, word: string): string {
  return word
    .replace(INVISIBLE_FORMAT_CHARACTER, '')
    .replace(SPACE_RUN, ' ')
    .trim()
    .normalize('NFC')
    .toLocaleLowerCase(language);
}

/** Every pair of members in the group that a reader of `language` would read as one word. */
export function membersReadAsOneWord(
  language: UiLanguage,
  /** Only compares how members read, so any reading of a message will do — a test's ids included. */
  translate: (message: MessageRef) => string,
  group: ClosedVocabularyGroup,
): [string, string][] {
  const firstMemberByWord = new Map<string, string>();
  const collisions: [string, string][] = [];
  for (const [vocabulary, words] of Object.entries(group.vocabularies)) {
    for (const [member, message] of Object.entries(words)) {
      const name = `${vocabulary}.${member}`;
      const word = readerForm(language, translate(message));
      const earlier = firstMemberByWord.get(word);
      if (earlier === undefined) firstMemberByWord.set(word, name);
      else collisions.push([earlier, name]);
    }
  }
  return collisions;
}
