import type { StudioDocument } from './document';
import { roofKindOf } from './roof-kind';
import type { RoofFacts } from './roof-levels';
import {
  changedQuestionOpen,
  dataHeightsApply,
  heightFromFloors,
  type SiteDataGap,
  type SiteDataSource,
  type SiteDataStamp,
} from './site-data';
import type { SiteReads } from './site-heights';

/**
 * What the bar says of the site's data (`T-M05-002`, part g), one thing at a time: the data the
 * heights came from, said once; "Has the building changed?" where the data is a year old or a
 * drawn roof has no building under it; how many floors, where there is no data or the building
 * changed; or which source did not answer. Nothing before a roof is drawn.
 */
export type SiteSay =
  /** "Heights from Google's data of Oct 2025": nothing to press, it goes by itself. */
  | { readonly kind: 'from_data'; readonly dataOn: string | null }
  | { readonly kind: 'changed_question'; readonly dataOn: string | null }
  /** The floors chips: G, G+1, G+2, G+3+. */
  | { readonly kind: 'floors'; readonly why: 'no_data' | 'changed' }
  /** "Google's height data did not answer. Heights are estimates." — with Try again. */
  | { readonly kind: 'not_answered' }
  /** "Heights updated from Google's newer data. Your own values are kept." */
  | { readonly kind: 'updated' };

/** The roofs a floors tap sets: on the ground, neither a hole nor a dormer. */
const floorsRoofs = (document: StudioDocument) =>
  document.roofs.flatMap((roof, index) => {
    const kind = roofKindOf(roof);
    return roof.on === undefined && kind !== 'hole' && kind !== 'dormer' ? [index] : [];
  });

export interface SiteSayFacts {
  readonly document: StudioDocument;
  readonly source: SiteDataSource;
  readonly dataOn: string | null;
  readonly gaps: readonly SiteDataGap[];
  readonly reads: SiteReads | null;
  /** `YYYY-MM-DD` on the reader's clock. */
  readonly today: string;
  /** The data the design's heights were made from, as it was saved before this opening. */
  readonly stampBefore?: SiteDataStamp;
}

export function siteSayOf(input: SiteSayFacts): SiteSay | null {
  const { document } = input;
  if (document.roofs.length === 0) return null;
  // A person who set the floors, or every roof's height, has answered what the bar would ask.
  const floorsAsked =
    document.site?.floors === undefined &&
    floorsRoofs(document).some((index) => document.roofs[index]?.height?.setBy !== 'person');
  return input.source === 'google_solar'
    ? googleSay(input, floorsAsked)
    : noGoogleSay(input, floorsAsked);
}

/** Where Google has no heights: which source did not answer, else the floors. */
function noGoogleSay(input: SiteSayFacts, floorsAsked: boolean): SiteSay | null {
  if (input.gaps.includes('heights_not_answered') || input.gaps.includes('capped')) {
    return { kind: 'not_answered' };
  }
  return floorsAsked ? { kind: 'floors', why: 'no_data' } : null;
}

/** With Google's heights: the changed-roof question, the floors after a yes, else the data's date. */
function googleSay(input: SiteSayFacts, floorsAsked: boolean): SiteSay | null {
  const { document, dataOn } = input;
  const noBuilding = Object.values(input.reads?.roofs ?? {}).some(
    (read) => read.kind === 'no_building',
  );
  if (changedQuestionOpen(document.site, dataOn, input.today, noBuilding)) {
    return { kind: 'changed_question', dataOn };
  }
  if (!dataHeightsApply(document.site, dataOn)) {
    return floorsAsked ? { kind: 'floors', why: 'changed' } : null;
  }
  const before = input.stampBefore?.dataOn ?? null;
  if (before !== null && dataOn !== null && dataOn > before) return { kind: 'updated' };
  return { kind: 'from_data', dataOn };
}

/** A person's answer to "Has the building changed?" for the data of `dataOn`. */
export function siteChangedAnswered(
  document: StudioDocument,
  dataOn: string | null,
  changed: boolean,
): StudioDocument {
  return { ...document, site: { ...document.site, changed: { dataOn, changed } } };
}

/**
 * A floors tap (G, G+1, G+2, G+3): every roof on the ground stands at the plinth and its storeys,
 * the person's value — the data never replaces it; a reset hands the roof back.
 */
export function floorsSet(
  document: StudioDocument,
  floorsAbove: number,
  facts: RoofFacts,
): StudioDocument {
  const metres = heightFromFloors(floorsAbove, {
    plinthHeightM: facts.plinthHeightM,
    storeyHeightM: facts.storeyHeightM,
  });
  const set = new Set(floorsRoofs(document));
  return {
    ...document,
    roofs: document.roofs.map((roof, index) =>
      set.has(index) ? { ...roof, height: { metres, setBy: 'person', tier: 'estimated' } } : roof,
    ),
    site: { ...document.site, floors: floorsAbove },
  };
}
