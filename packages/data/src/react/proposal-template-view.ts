import type { RichTextValueWire } from '@heliogrid/contracts';
import {
  type CoverPictureKey,
  DEFAULT_COVER_PICTURE,
  isPageOptional,
  PROPOSAL_PAGES,
  type ProposalCover,
  type ProposalPage,
  type RichTextValue,
  sectionOfPage,
  type TemplateDraft,
  TIMELINE_PHASE_LIMIT,
  type TimelinePhase,
} from '@heliogrid/domain';

/**
 * Proposal defaults' pure answers from what `useProposalTemplate` holds (`SCR-M01-19`,
 * `T-M01-030`), which both screens hand to `ProposalTemplateSettings` with their words: the cover
 * picture, the track record, the page rows, the phases and the terms. What the tenant wrote is one
 * value, shown as written in every language (`F3-10`).
 */

export interface ProposalTemplateView {
  readonly look: {
    /** The picture in force: one of the platform's, or the company's own photo. */
    readonly chosen: CoverPictureKey | 'own';
  };
  readonly record: ProposalCover;
  readonly pages: {
    readonly rows: readonly {
      readonly page: ProposalPage;
      readonly on: boolean;
      readonly always: boolean;
    }[];
  };
  readonly terms: {
    /** In the wire's own lists, which every renderer of rich text takes. */
    readonly value: RichTextValueWire;
  };
  readonly timeline: {
    readonly phases: readonly {
      readonly key: number;
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

const NO_RECORD: ProposalCover = {
  aboutCompany: null,
  totalCapacityInstalledKw: null,
  happyCustomers: null,
  citiesServed: null,
};

/** What the page draws while its reads are out: no part holds anything yet. */
const NOTHING_READ: ProposalTemplateView = {
  look: { chosen: DEFAULT_COVER_PICTURE.kind === 'platform' ? DEFAULT_COVER_PICTURE.key : 'own' },
  record: NO_RECORD,
  pages: { rows: [] },
  terms: { value: { version: 1, blocks: [] } },
  timeline: { phases: [], atCap: false },
};

/** The view of the draft; while the reads are out (`draft` null), an empty view the loading frame draws over. */
export function templateViewOf(draft: TemplateDraft | null): ProposalTemplateView {
  if (draft === null) return NOTHING_READ;
  const { cover, sectionsIncluded, defaultTerms } = draft.template;
  const picture = draft.template.coverPicture ?? DEFAULT_COVER_PICTURE;
  return {
    look: { chosen: picture.kind === 'platform' ? picture.key : 'own' },
    record: cover ?? NO_RECORD,
    pages: {
      rows: PROPOSAL_PAGES.map((page) => {
        const section = sectionOfPage(page);
        return {
          page,
          on: section === null || sectionsIncluded.includes(section),
          always: !isPageOptional(page),
        };
      }),
    },
    terms: { value: richTextWireOf(defaultTerms) },
    timeline: {
      phases: draft.phases.map((phase) => ({
        key: phase.key,
        phase: { name: phase.name, description: phase.description },
      })),
      atCap: draft.phases.length >= TIMELINE_PHASE_LIMIT,
    },
  };
}
