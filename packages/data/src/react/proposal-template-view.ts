import type { RichTextValueWire } from '@heliogrid/contracts';
import {
  isSectionFloor,
  optionalSectionsShown,
  PROPOSAL_SECTIONS,
  type ProposalSection,
  type RichTextValue,
  type TemplateDefaults,
  type TemplateDraft,
  TIMELINE_PHASE_LIMIT,
  type TimelinePhase,
  templatePartOrigin,
} from '@heliogrid/domain';

/**
 * The Proposal template page's pure answers from what `useProposalTemplate` holds, which both
 * screens hand to `ProposalTemplateSettings` with their words: each part's origin, the cover and
 * the terms, the section rows and the phase rows. What the tenant wrote is one value, shown as
 * written in every language (`F3-10`).
 */

export interface ProposalTemplateView {
  readonly cover: {
    readonly origin: 'platform' | 'own';
    readonly about: string;
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
  };
  readonly timeline: {
    readonly origin: 'platform' | 'own';
    readonly phases: readonly {
      readonly key: number;
      readonly title: string;
      readonly note: string;
      /** The phase as the editor opens it. */
      readonly phase: TimelinePhase;
    }[];
    readonly atCap: boolean;
  };
}

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

/** What the page draws while its reads are out: no part holds anything yet, and every part is the tenant's to load. */
const NOTHING_READ: ProposalTemplateView = {
  cover: {
    origin: 'own',
    about: '',
    counts: { totalCapacityInstalledKw: null, happyCustomers: null, citiesServed: null },
  },
  sections: { origin: 'own', rows: [], printing: 0, of: 0 },
  terms: {
    origin: 'own',
    value: { version: 1, blocks: [] },
  },
  timeline: { origin: 'own', phases: [], atCap: false },
};

/**
 * The view of the draft against the platform's defaults in the reader's words; while the reads are
 * out (`draft` null), an empty view the page's loading frame draws over (m19-n1).
 */
export function templateViewOf(
  draft: TemplateDraft | null,
  defaults: TemplateDefaults,
): ProposalTemplateView {
  if (draft === null) return NOTHING_READ;
  const { cover, sectionsIncluded, defaultTerms } = draft.template;
  const shown = optionalSectionsShown(draft);
  return {
    cover: {
      origin: templatePartOrigin(draft, 'cover', defaults),
      about: cover?.aboutCompany ?? '',
      counts: {
        totalCapacityInstalledKw: cover?.totalCapacityInstalledKw ?? null,
        happyCustomers: cover?.happyCustomers ?? null,
        citiesServed: cover?.citiesServed ?? null,
      },
    },
    sections: {
      origin: templatePartOrigin(draft, 'sections', defaults),
      rows: PROPOSAL_SECTIONS.map((key) => ({
        key,
        on: sectionsIncluded.includes(key),
        floor: isSectionFloor(key),
      })),
      printing: shown.printing,
      of: shown.of,
    },
    terms: {
      origin: templatePartOrigin(draft, 'terms', defaults),
      value: richTextWireOf(defaultTerms),
    },
    timeline: {
      origin: templatePartOrigin(draft, 'timeline', defaults),
      phases: draft.phases.map((phase) => ({
        key: phase.key,
        title: phase.name,
        note: phase.description,
        phase: { name: phase.name, description: phase.description },
      })),
      atCap: draft.phases.length >= TIMELINE_PHASE_LIMIT,
    },
  };
}
