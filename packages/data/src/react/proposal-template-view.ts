import type { RichTextValueWire } from '@heliogrid/contracts';
import {
  authoredIn,
  hasWords,
  isSectionFloor,
  optionalSectionsShown,
  PROPOSAL_SECTIONS,
  type ProposalSection,
  type RichTextValue,
  type TemplateDraft,
  TIMELINE_PHASE_LIMIT,
  type TimelinePhase,
  templatePartOrigin,
  UI_LANGUAGES,
  type UiLanguage,
} from '@heliogrid/domain';

/**
 * The Proposal template page's pure answers from what `useProposalTemplate` holds, which both
 * screens hand to `ProposalTemplateSettings` with their words: each part's origin, its language
 * strip's state, the section rows and the phase rows. A phase shows in the reader's language where
 * the tenant wrote it, else English (`F3-10`, `authoredIn`).
 */

export type WrittenIn = Readonly<Record<UiLanguage, 'authored' | 'empty'>>;

export interface ProposalTemplateView {
  readonly cover: {
    readonly origin: 'platform' | 'own';
    readonly about: string;
    readonly written: WrittenIn;
    readonly counts: {
      readonly totalCapacityInstalledKw: number | null;
      readonly happyCustomers: number | null;
      readonly citiesServed: number | null;
    };
  };
  readonly sections: {
    readonly origin: 'platform' | 'own';
    readonly rows: readonly {
      readonly key: ProposalSection;
      readonly on: boolean;
      readonly floor: boolean;
    }[];
    readonly printing: number;
    readonly of: number;
  };
  readonly terms: {
    readonly origin: 'platform' | 'own';
    /** In the wire's own lists, which every renderer of rich text takes. */
    readonly value: RichTextValueWire;
    readonly written: WrittenIn;
  };
  readonly timeline: {
    readonly origin: 'platform' | 'own';
    readonly phases: readonly {
      readonly key: number;
      readonly title: string;
      readonly note: string;
      /** The phase as the editor opens it, every language kept. */
      readonly phase: TimelinePhase;
    }[];
    readonly atCap: boolean;
  };
}

const EMPTY_TEXT: RichTextValue = { version: 1, blocks: [] };

/** Rich text as the wire takes it: the same blocks, in lists the client may own. */
export function richTextWireOf(value: RichTextValue): RichTextValueWire {
  return {
    version: value.version,
    blocks: value.blocks.map((block) => {
      if (block.type === 'logo') return { type: 'logo' };
      if ('items' in block) return { ...block, items: block.items.map((item) => [...item]) };
      return { ...block, spans: [...block.spans] };
    }),
  };
}

function writtenIn(has: (language: UiLanguage) => boolean): WrittenIn {
  return Object.fromEntries(
    UI_LANGUAGES.map((language) => [language, has(language) ? 'authored' : 'empty']),
  ) as Record<UiLanguage, 'authored' | 'empty'>;
}

/** What the page draws while its reads are out: no part holds anything yet, and every part is the tenant's to load. */
const NOTHING_READ: ProposalTemplateView = {
  cover: {
    origin: 'own',
    about: '',
    written: writtenIn(() => false),
    counts: { totalCapacityInstalledKw: null, happyCustomers: null, citiesServed: null },
  },
  sections: { origin: 'own', rows: [], printing: 0, of: 0 },
  terms: {
    origin: 'own',
    value: { version: 1, blocks: [] },
    written: writtenIn(() => false),
  },
  timeline: { origin: 'own', phases: [], atCap: false },
};

/**
 * The view for the languages chosen on the Cover and Terms strips, and the reader's own; while the
 * reads are out (`draft` null), an empty view the page's loading frame draws over (m19-n1).
 */
export function templateViewOf(
  draft: TemplateDraft | null,
  chosen: { readonly cover: UiLanguage; readonly terms: UiLanguage },
  reader: UiLanguage,
): ProposalTemplateView {
  if (draft === null) return NOTHING_READ;
  const { cover, sectionsIncluded, defaultTerms } = draft.template;
  const about = cover?.aboutCompany ?? null;
  const shown = optionalSectionsShown(draft);
  return {
    cover: {
      origin: templatePartOrigin(draft, 'cover'),
      about: about?.[chosen.cover] ?? '',
      written: writtenIn((language) => (about?.[language] ?? '').trim() !== ''),
      counts: {
        totalCapacityInstalledKw: cover?.totalCapacityInstalledKw ?? null,
        happyCustomers: cover?.happyCustomers ?? null,
        citiesServed: cover?.citiesServed ?? null,
      },
    },
    sections: {
      origin: templatePartOrigin(draft, 'sections'),
      rows: PROPOSAL_SECTIONS.map((key) => ({
        key,
        on: sectionsIncluded.includes(key),
        floor: isSectionFloor(key),
      })),
      printing: shown.printing,
      of: shown.of,
    },
    terms: {
      origin: templatePartOrigin(draft, 'terms'),
      value: richTextWireOf(
        defaultTerms[chosen.terms] ?? (chosen.terms === 'en' ? EMPTY_TEXT : defaultTerms.en),
      ),
      written: writtenIn((language) => hasWords(defaultTerms[language])),
    },
    timeline: {
      origin: templatePartOrigin(draft, 'timeline'),
      phases: draft.phases.map((phase) => ({
        key: phase.key,
        title: authoredIn(phase.name, reader).value,
        note: authoredIn(phase.description, reader).value,
        phase: { name: phase.name, description: phase.description },
      })),
      atCap: draft.phases.length >= TIMELINE_PHASE_LIMIT,
    },
  };
}
