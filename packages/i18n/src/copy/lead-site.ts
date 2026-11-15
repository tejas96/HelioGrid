import type { TranslatedText, UiLanguage } from '@heliogrid/contracts';
import { type AdministrativeArea, areaOf, type LeadSiteView, packLabel } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';

type T = Translator['t'];

/** One fact of the lead's site as the Site section lists it: its name and its value in words. */
export interface LeadSiteFactRow {
  readonly key: 'area' | 'sanctioned_load' | 'supply_phase';
  readonly label: TranslatedText;
  readonly value: TranslatedText;
}

const SITE = {
  address: /*i18n*/ { id: 'Site address' },
  area: /*i18n*/ { id: 'District' },
  state: /*i18n*/ { id: 'State' },
  sanctionedLoad: /*i18n*/ { id: 'Sanctioned load' },
  supplyPhase: /*i18n*/ { id: 'Supply' },
  load: /*i18n*/ { id: '{load} kW' },
  single: /*i18n*/ { id: 'single phase' },
  three: /*i18n*/ { id: 'three phase' },
} as const;

/** Where the caller's market holds its regions, and the reader's language for their names. */
export interface LeadSiteMarket {
  readonly areas: readonly AdministrativeArea[];
  readonly language: UiLanguage;
}

/** "Pune · Maharashtra" — the district as its state writes it, then the region by its pack name. */
function areaWords(market: LeadSiteMarket, ref: NonNullable<LeadSiteView['area']>): string {
  const region = areaOf(market.areas, ref.area);
  const name = region === null ? ref.area : packLabel(region.name, market.language);
  return ref.district === null ? name : `${ref.district} · ${name}`;
}

/**
 * The Site section's facts beside the address (`M06-09`, `M06-16`): the district, the sanctioned
 * load and the supply, each only once the lead holds it — a fact not known yet is left out.
 */
export function leadSiteFactWords(
  t: T,
  market: LeadSiteMarket,
  site: LeadSiteView,
): readonly LeadSiteFactRow[] {
  const rows: LeadSiteFactRow[] = [];
  if (site.area !== null) {
    rows.push({
      key: 'area',
      label: t(SITE.area),
      value: shownAsSent(areaWords(market, site.area)),
    });
  }
  if (site.sanctionedLoadKw !== null) {
    rows.push({
      key: 'sanctioned_load',
      label: t(SITE.sanctionedLoad),
      value: t(SITE.load, { load: site.sanctionedLoadKw }),
    });
  }
  if (site.supplyPhase !== null) {
    rows.push({
      key: 'supply_phase',
      label: t(SITE.supplyPhase),
      value: phaseWords(t, site.supplyPhase),
    });
  }
  return rows;
}

/** The lead's site fields as a timeline entry names them, keyed by the field the server records. */
const SITE_FIELD_NAME: Readonly<Record<string, MessageRef>> = {
  siteAddress: SITE.address,
  area: SITE.area,
  sanctionedLoadKw: SITE.sanctionedLoad,
  supplyPhase: SITE.supplyPhase,
};

/** The region's code in a recorded area — "Pune · IN-MH" holds `IN-MH`; nothing recorded holds none. */
const regionCodeOf = (value: string | null) => (value === null ? null : value.split(' · ').pop());

/**
 * A site field's name in a timeline entry, or `undefined` for a field that is not the site's. An
 * area entry names what moved: the State when the region changed, else the District.
 */
export function siteFieldNameOf(
  field: string,
  from: string | null,
  to: string | null,
): MessageRef | undefined {
  if (field === 'area' && regionCodeOf(from) !== regionCodeOf(to)) return SITE.state;
  return SITE_FIELD_NAME[field];
}

/**
 * A site field's recorded value in words, or `null` for a field that is not the site's. The server
 * records an area as "Pune · IN-MH": the region's code is never shown, so `regionName` names it.
 */
export function siteFieldValue(
  t: T,
  regionName: (code: string) => string,
  field: string,
  value: string,
): TranslatedText | null {
  if (field === 'sanctionedLoadKw') return t(SITE.load, { load: value });
  if (field === 'supplyPhase') return phaseWords(t, value);
  if (field !== 'area') return null;
  const parts = value.split(' · ');
  const code = parts.pop() ?? '';
  return shownAsSent([...parts, regionName(code)].join(' · '));
}

function phaseWords(t: T, phase: string): TranslatedText {
  if (phase === 'single') return t(SITE.single);
  if (phase === 'three') return t(SITE.three);
  return shownAsSent(phase);
}
