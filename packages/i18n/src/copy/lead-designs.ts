import type { DesignWire, TranslatedText } from '@heliogrid/contracts';
import { DESIGN_STATUSES, type DesignStatus } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';

type T = Translator['t'];

/** What the caller holds: how long ago a moment was, and who is reading. */
export interface LeadDesignsFormats {
  /** "2 min ago", "3 days ago" — the caller's relative clock. */
  readonly ago: (instant: string) => string;
  /** The reader, so their own designs say "You"; `null` while nobody is known. */
  readonly readerId: string | null;
}

const SECTION = {
  noneTitle: /*i18n*/ { id: 'No design yet' },
  noneLine: /*i18n*/ {
    id: 'Start a design for this roof. The address and the connection come from this lead.',
  },
  create: /*i18n*/ { id: 'Create design' },
  named: /*i18n*/ { id: 'Design {number}' },
  recommended: /*i18n*/ { id: 'Recommended' },
  noPanels: /*i18n*/ { id: 'No panels yet' },
  byWhen: /*i18n*/ { id: '{name} · {when}' },
  you: /*i18n*/ { id: 'You' },
  continue: /*i18n*/ { id: 'Continue' },
  view: /*i18n*/ { id: 'View' },
  openNamed: /*i18n*/ { id: 'Open Design {number}' },
  moreNamed: /*i18n*/ { id: 'More for Design {number}' },
  copy: /*i18n*/ { id: 'Copy as a variant' },
  recommend: /*i18n*/ { id: 'Mark as Recommended' },
  unrecommend: /*i18n*/ { id: 'Remove Recommended' },
  viewOnly: /*i18n*/ { id: 'You can view these designs. You cannot change them.' },
  closedLine: /*i18n*/ { id: 'Reopen the lead to create a design.' },
  loading: /*i18n*/ { id: 'Loading designs' },
  creating: /*i18n*/ { id: 'Creating the design' },
  opening: /*i18n*/ { id: 'Opening the design' },
  failedTitle: /*i18n*/ { id: 'The designs did not load' },
  failedLine: /*i18n*/ { id: 'Check the connection and try again.' },
  retry: /*i18n*/ { id: 'Try again' },
  actFailed: /*i18n*/ { id: 'That did not save. Check the connection and try again.' },
  leadClosed: /*i18n*/ { id: 'This lead is closed. Reopen it to change its designs.' },
} as const;

/**
 * The placeholder where a design's 3D model picture will be (`CLAUDE.md` §3): the studio draws no
 * model yet, so it says the preview is coming.
 */
const PREVIEW = /*i18n*/ { id: '3D preview coming soon' };
export const designPreviewWord = (t: T): TranslatedText => t(PREVIEW);

/** A design's status in words — a `Record`, so a status domain adds fails to compile here. */
const STATUS_WORD: Readonly<Record<DesignStatus, MessageRef>> = {
  draft: /*i18n*/ { id: 'Design draft' },
};

/** A status the catalog names by its word; one a newer server learned is shown as sent (`F3-05`). */
export function designStatusWord(t: T, status: string): TranslatedText {
  const known = (DESIGN_STATUSES as readonly string[]).includes(status);
  return known ? t(STATUS_WORD[status as DesignStatus]) : shownAsSent(status);
}

/** The lead's Designs section in words (`T-M05-001`). */
export function leadDesignsWords(t: T, formats: LeadDesignsFormats) {
  const number = (design: DesignWire) => ({ number: design.ordinal });
  return {
    noneTitle: t(SECTION.noneTitle),
    noneLine: t(SECTION.noneLine),
    create: t(SECTION.create),
    named: (design: DesignWire) => t(SECTION.named, number(design)),
    status: (status: string) => designStatusWord(t, status),
    recommended: t(SECTION.recommended),
    noPanels: t(SECTION.noPanels),
    preview: designPreviewWord(t),
    line: (design: DesignWire) => {
      const by = design.createdBy;
      const when = formats.ago(design.updatedAt);
      if (by === null) return shownAsSent(when);
      const name = by.userId === formats.readerId ? t(SECTION.you) : by.name;
      return t(SECTION.byWhen, { name, when });
    },
    continue: t(SECTION.continue),
    view: t(SECTION.view),
    openNamed: (design: DesignWire) => t(SECTION.openNamed, number(design)),
    moreNamed: (design: DesignWire) => t(SECTION.moreNamed, number(design)),
    copy: t(SECTION.copy),
    recommend: t(SECTION.recommend),
    unrecommend: t(SECTION.unrecommend),
    viewOnly: t(SECTION.viewOnly),
    closedLine: t(SECTION.closedLine),
    loading: t(SECTION.loading),
    creating: t(SECTION.creating),
    opening: t(SECTION.opening),
    failedTitle: t(SECTION.failedTitle),
    failedLine: t(SECTION.failedLine),
    retry: t(SECTION.retry),
  };
}

/** Why an act on the lead's designs came back undone, in the reader's words. */
export function leadDesignActFailure(t: T, refused: 'host_closed' | 'other'): TranslatedText {
  return t(refused === 'host_closed' ? SECTION.leadClosed : SECTION.actFailed);
}
