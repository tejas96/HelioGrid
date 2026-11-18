import { IN_FORMATS } from '../../src/format/pack';
import type { StudioSite } from '../../src/studio/site';
import {
  type FoundPlace,
  type SiteForm,
  type SiteFormEvent,
  siteFormOf,
  siteFormStep,
} from '../../src/studio/site-form';

/** What the Site details proofs share: a site with nothing in it, a found place, and the form stepped. */
const { utilities } = IN_FORMATS;
export const SANGLI = { latitude: 16.8367, longitude: 74.5966 };
export const NO_SITE: StudioSite = {
  name: null,
  address: null,
  pin: null,
  area: null,
  utilityOperator: null,
  supplyPhase: null,
  sanctionedLoadKw: null,
};
export const found = (typed: Partial<FoundPlace> = {}): FoundPlace => ({
  address: 'Vishrambag, Sangli',
  pin: SANGLI,
  area: 'IN-MH',
  inMarket: true,
  ...typed,
});
export const stepped = (form: SiteForm, ...events: SiteFormEvent[]): SiteForm =>
  events.reduce((state, event) => siteFormStep(state, event, utilities), form);
export const empty = () => siteFormOf(NO_SITE, 'roof', 'Anil Sharma');
