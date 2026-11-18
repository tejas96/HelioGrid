import { IN_FORMATS, pinText } from '@heliogrid/domain';
import {
  type createTranslator,
  designPageWords,
  siteDetailsPageWords,
  siteDetailsWords,
} from '@heliogrid/i18n';

/*
 * The studio's entry screens in words for their phone flows (`SCR-M05-01`, `SCR-M05-02`,
 * `mobile/site-details.yaml`, `mobile/design.yaml`), handed to Maestro by `mobile-cli.ts`, which
 * reads no file mid-flow — and the one roof both suites pin.
 */

/** A roof in Pune, as a rep types it, and as the form and the record show it. */
export const SITE_POINT = { latitude: 18.5204, longitude: 73.8567 } as const;
export const SITE_POINT_TEXT = pinText(SITE_POINT);

/** What a lead already knows of its site before any design: Site details opens with each filled. */
export const LEAD_SITE = {
  address: 'Plot 12, Altinho, Panaji',
  area: { area: 'IN-GA', district: null },
  supplyPhase: 'three',
  sanctionedLoadKw: 8,
} as const;
/** The lead's state as the State field names it: the market's own name for the area. */
export const LEAD_SITE_STATE =
  IN_FORMATS.areas.find((area) => area.code === LEAD_SITE.area.area)?.name.en ?? '';

/** The lead's site facts as the lead page's own edit sends them (`PATCH /leads/:id`). */
export function leadSiteBody(): Record<string, unknown> {
  return {
    siteAddress: LEAD_SITE.address,
    area: LEAD_SITE.area,
    supplyPhase: LEAD_SITE.supplyPhase,
    sanctionedLoadKw: LEAD_SITE.sanctionedLoadKw,
    capturedAt: new Date().toISOString(),
  };
}

/** The flows make the company's first design, so its page is titled "Design 1". */
const FIRST_DESIGN = 1;

/**
 * The address and the state the lead already holds, Site details' title, its Coordinates switch and two fields, the numbers typed there and the pin
 * they set, why *Start design* is off, and the button; the design page's title, what stands where
 * the studio will, its line before and after the site is set, and its way to Site details.
 */
export function studioFlowWords(
  t: Awaited<ReturnType<typeof createTranslator>>,
): Record<string, string> {
  const site = siteDetailsWords(t.t);
  const design = designPageWords(t.t);
  return {
    SITE_TITLE: siteDetailsPageWords(t.t).title,
    SITE_LEAD_ADDRESS: LEAD_SITE.address,
    SITE_LEAD_STATE: LEAD_SITE_STATE,
    SITE_BY_COORDINATES: site.modes.coordinates,
    SITE_LATITUDE: site.latitude,
    SITE_LONGITUDE: site.longitude,
    SITE_LATITUDE_TYPED: String(SITE_POINT.latitude),
    SITE_LONGITUDE_TYPED: String(SITE_POINT.longitude),
    SITE_PIN: SITE_POINT_TEXT,
    SITE_NEEDS_LOCATION: site.needsLocation,
    SITE_START: site.start,
    DESIGN_TITLE: design.named(FIRST_DESIGN),
    DESIGN_HOLDING: design.holdingTitle,
    DESIGN_NEEDS_SITE: design.holdingLine('roof', false),
    DESIGN_NEXT_ROOF: design.holdingLine('roof', true),
    DESIGN_EDIT_SITE: design.editSite,
  };
}
