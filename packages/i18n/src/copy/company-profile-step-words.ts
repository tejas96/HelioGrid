import type {
  CompanyProfileLife,
  CompanyProfilePart,
  CompanyProfileView,
  ReadKind,
  UiLanguage,
} from '@heliogrid/domain';
import { packWords, type Translator } from '../runtime';
import type { CompanyLogoCaptureFacts } from './company-logo';
import { type CompanyProfileWords, companyProfileWords } from './company-profile-words';

/** The profile as its hook hands it to a screen: its life, what is held, and what it says about it. */
export interface CompanyProfileStepFacts extends CompanyProfileView {
  readonly life: CompanyProfileLife;
  readonly read: { readonly kind: ReadKind };
  readonly saveFailed: boolean;
  readonly arrivedUndeclared: boolean;
  readonly open: CompanyProfilePart | null;
  readonly values: { readonly city: string };
  readonly logo: CompanyLogoCaptureFacts;
}

/**
 * The words of the company profile in the life its hook reads it in (`SCR-M01-05`) — the setup
 * step or the settings page — built once for both screens. Never `skipped`: a recorded step is not
 * asked again, so nobody is back from a skip. The two labels are the format layer's; the format
 * line is the market pack's, in the reader's language.
 */
export function companyProfileStepWords(
  translate: Translator['t'],
  reader: UiLanguage,
  step: CompanyProfileStepFacts,
  labels: { readonly taxIdLabel: string; readonly bankRoutingLabel: string },
): CompanyProfileWords {
  return companyProfileWords(translate, {
    life: step.life,
    read: step.read.kind,
    saveFailed: step.saveFailed,
    skipped: false,
    arrivedUndeclared: step.arrivedUndeclared,
    standings: step.standings,
    open: step.open,
    city: step.values.city,
    taxIdLabel: labels.taxIdLabel,
    taxFormat: step.taxFormat === null ? null : packWords(step.taxFormat, reader),
    bankRoutingLabel: packWords({ en: labels.bankRoutingLabel }, reader),
    letterhead: step.letterhead,
    logo: step.logo,
  });
}
