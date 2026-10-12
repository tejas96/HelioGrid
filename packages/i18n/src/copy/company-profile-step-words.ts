import {
  type CompanyProfilePart,
  type CompanyProfileView,
  inLanguage,
  type UiLanguage,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import {
  type CompanyProfileWordFacts,
  type CompanyProfileWords,
  companyProfileWords,
} from './company-profile-words';

/** The setup step as its hook hands it to a screen: what is held, and what it says about it. */
export interface CompanyProfileStepFacts extends CompanyProfileView {
  readonly status: CompanyProfileWordFacts['status'];
  readonly arrivedUndeclared: boolean;
  readonly open: CompanyProfilePart | null;
  readonly values: { readonly city: string };
}

/**
 * The words of the company profile as a setup step (`SCR-M01-05`), built once for both screens.
 * Never `skipped`: a recorded step is not asked again, so nobody is back from a skip. The two
 * labels are the format layer's; the format line is the market pack's, in the reader's language.
 */
export function companyProfileStepWords(
  translate: Translator['t'],
  reader: UiLanguage,
  step: CompanyProfileStepFacts,
  labels: { readonly taxIdLabel: string; readonly bankRoutingLabel: string },
): CompanyProfileWords {
  return companyProfileWords(translate, {
    status: step.status,
    skipped: false,
    arrivedUndeclared: step.arrivedUndeclared,
    standings: step.standings,
    open: step.open,
    city: step.values.city,
    taxIdLabel: labels.taxIdLabel,
    taxFormat: step.taxFormat === null ? '' : inLanguage(step.taxFormat, reader),
    bankRoutingLabel: labels.bankRoutingLabel,
    letterhead: step.letterhead,
  });
}
