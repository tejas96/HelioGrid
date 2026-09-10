import type { PackLabel, PerLanguage } from '../format/languages';
import { type RichTextValue, richTextParagraphs } from './rich-text';

/**
 * The sections a proposal document carries (`M01-51`): the builder's content steps (`M06-08`
 * to `M06-17`), in document order. Company and client identity are not sections — a document
 * always says who it is from and for.
 */
export const PROPOSAL_SECTIONS = [
  'achievements',
  'system',
  'performance',
  'financials',
  'timeline',
  'payment_terms',
  'components',
  'terms',
  'bank_details',
] as const;
export type ProposalSection = (typeof PROPOSAL_SECTIONS)[number];

/**
 * Terms print on every proposal — whether they print is not a setting (`SCR-M01-19`, decision 4).
 * Every other section is the tenant's choice.
 */
export const SECTION_FLOOR: readonly ProposalSection[] = ['terms'];

export function isSectionFloor(section: ProposalSection): boolean {
  return SECTION_FLOOR.includes(section);
}

/**
 * The set a tenant chose, made whole: the floor is always in, the order is the document's, and a
 * section named twice counts once. The save and the effective read both pass through here.
 */
export function sectionsIncluded(chosen: readonly ProposalSection[]): readonly ProposalSection[] {
  return PROPOSAL_SECTIONS.filter((section) => chosen.includes(section) || isSectionFloor(section));
}

/** Every section, by default (`M01-28`): a first proposal is complete, never sparse. */
export const DEFAULT_SECTIONS_INCLUDED: readonly ProposalSection[] = PROPOSAL_SECTIONS;

/**
 * The cover's achievements block (`M06-08`): what the tenant says about itself, and three counts
 * the cover prints with their units added. Each count is the tenant's own declaration — its tier
 * is `estimated · declared by you` wherever it renders — and absent by default: a cover with no
 * achievements shows identity alone, never a sample figure.
 */
export interface ProposalCover {
  readonly aboutCompany: PackLabel | null;
  readonly totalCapacityInstalledKw: number | null;
  readonly happyCustomers: number | null;
  readonly citiesServed: number | null;
}

/**
 * The platform terms (`M01-51`, `M01-28`): short, neutral, and the tenant's to replace. Three
 * launch languages, authored here because the effective read serves them to a document from the
 * server. No number lives in them — a validity period or a price is the proposal's own fact.
 */
export const DEFAULT_TERMS: PerLanguage<RichTextValue> = {
  en: richTextParagraphs([
    'This proposal is valid until the date stated on it. Prices and taxes are as itemised in it.',
    'Payment falls due in the tranches listed in the payment schedule. Work at each stage starts once the tranche for that stage is received.',
    'The installation follows the design agreed in this proposal. A change to the design after acceptance may change the price, and a revised proposal is issued before work continues.',
    'Equipment warranties are the manufacturers’ and are handed over at commissioning.',
  ]),
  hi: richTextParagraphs([
    'यह प्रस्ताव इसमें बताई गई तारीख तक मान्य है। कीमतें और कर इसमें दिए गए विवरण के अनुसार हैं।',
    'भुगतान भुगतान-अनुसूची में दी गई किस्तों के अनुसार देय है। हर चरण का काम उस चरण की किस्त मिलने के बाद शुरू होता है।',
    'इंस्टॉलेशन इस प्रस्ताव में तय डिज़ाइन के अनुसार किया जाता है। स्वीकृति के बाद डिज़ाइन में बदलाव से कीमत बदल सकती है, और काम आगे बढ़ने से पहले संशोधित प्रस्ताव जारी किया जाता है।',
    'उपकरणों की वारंटी निर्माताओं की है और कमीशनिंग के समय सौंपी जाती है।',
  ]),
  mr: richTextParagraphs([
    'हा प्रस्ताव त्यात नमूद केलेल्या तारखेपर्यंत वैध आहे. किमती आणि कर त्यात दिलेल्या तपशिलानुसार आहेत.',
    'पेमेंट शेड्यूलमध्ये दिलेल्या हप्त्यांनुसार रक्कम देय आहे. प्रत्येक टप्प्याचे काम त्या टप्प्याचा हप्ता मिळाल्यानंतर सुरू होते.',
    'इन्स्टॉलेशन या प्रस्तावात ठरलेल्या डिझाइननुसार केले जाते. स्वीकृतीनंतर डिझाइनमध्ये बदल केल्यास किंमत बदलू शकते, आणि काम पुढे नेण्यापूर्वी सुधारित प्रस्ताव दिला जातो.',
    'उपकरणांची वॉरंटी उत्पादकांची असते आणि ती कमिशनिंगच्या वेळी सुपूर्द केली जाते.',
  ]),
};
