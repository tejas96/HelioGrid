import type { TranslatedText } from '@heliogrid/contracts';
/**
 * The Branding page's words (`SCR-M01-18`, `M01-50`), authored once for both platforms (Law 11) in
 * three languages (`F3-07`). The standing line, the logo's refusal and the switch names are chosen
 * here from the facts the page holds; the colour field's own words are `brand-colour-field.ts`'s.
 * The tax number's name is the market pack's (`taxIdLabel`), never typed here.
 */
import {
  type CompanyLogoLimits,
  type CompanyLogoMiss,
  type CompanyLogoRefusal,
  LETTERHEAD_LIMITS,
  type LetterheadRefusal,
  letterheadFieldRefusal,
  letterheadLinesRefusal,
  megabytesShown,
  type SettingsStanding,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { type AttemptFailureLike, attemptFailureMessageId, INTERNAL_ERROR } from './api-error';
import { brandColourFieldWords } from './brand-colour-field';
import { COMPANY_LOGO } from './company-logo';
import { dropzoneWords } from './dropzone';
import { imageWords } from './image';
import { settingsSavedLine } from './settings';

type T = Translator['t'];

const BRANDING = {
  neverSet: /*i18n*/ { id: 'Nothing set yet · platform defaults in force' },
  preview: /*i18n*/ { id: 'Preview' },
  proposal: /*i18n*/ { id: 'Proposal' },
  linkPage: /*i18n*/ { id: 'Link page' },
  edit: /*i18n*/ { id: 'Edit' },
  logo: /*i18n*/ { id: 'Logo' },
  colour: /*i18n*/ { id: 'Colour' },
  letterhead: /*i18n*/ { id: 'Letterhead' },
  openFullSize: /*i18n*/ { id: 'Open full size' },
  stage: /*i18n*/ { id: 'What your customers get' },
  editor: /*i18n*/ { id: 'Edit your branding' },
  replace: /*i18n*/ { id: 'Replace' },
  remove: /*i18n*/ { id: 'Remove' },
  logoAlt: /*i18n*/ { id: '{company} logo' },
  logoUnavailable: /*i18n*/ { id: "Your logo didn't load" },
  profileRow: /*i18n*/ { id: 'Name, address and {taxLabel}' },
  profileRowFrom: /*i18n*/ { id: 'From your Business profile' },
  sentKeep: /*i18n*/ { id: 'Sent proposals keep their branding.' },
  tagline: /*i18n*/ { id: 'Tagline' },
  lines: /*i18n*/ { id: 'Lines under your address' },
  linesPlaceholder: /*i18n*/ { id: 'Phone, email or website' },
  linesHint: /*i18n*/ { id: 'One per line · up to {count}' },
  footerNote: /*i18n*/ { id: 'Note along the foot of every page' },
  tooManyLines: /*i18n*/ { id: 'Up to {count} lines' },
  tooLong: /*i18n*/ { id: 'Up to {count} characters on a line' },
  loadingCover: /*i18n*/ { id: 'Loading the proposal cover' },
  loading: /*i18n*/ { id: 'Loading your branding' },
  unread: /*i18n*/ { id: "Your branding didn't load" },
  tryAgain: /*i18n*/ { id: 'Try again' },
  notSaved: /*i18n*/ { id: 'Not saved yet' },
  save: /*i18n*/ { id: 'Save branding' },
  discard: /*i18n*/ { id: 'Discard changes' },
  saveFailed: /*i18n*/ { id: "Your branding didn't save" },
  retry: /*i18n*/ { id: 'Retry' },
  coverTitle: /*i18n*/ { id: 'Proposal cover' },
  removeTitle: /*i18n*/ { id: 'Remove your logo?' },
  removeBody: /*i18n*/ {
    id: 'New proposals and link pages will show your company name in its place. You can add a logo again here at any time.',
  },
  removeConfirm: /*i18n*/ { id: 'Remove logo' },
  keep: /*i18n*/ { id: 'Keep it' },
  leaveTitle: /*i18n*/ { id: 'Leave without saving?' },
  leaveBody: /*i18n*/ { id: 'Your changes to branding will be lost.' },
  leaveConfirm: /*i18n*/ { id: 'Discard and leave' },
  keepEditing: /*i18n*/ { id: 'Keep editing' },
} as const;

/**
 * The customer's link page as the preview draws it, before the page itself is built (`T-F5-001`):
 * its words are the customer's, so that task reuses these as they stand.
 */
const LINK_PAGE = {
  ready: /*i18n*/ { id: 'Your proposal is ready.' },
  awaiting: /*i18n*/ { id: 'Awaiting your decision' },
  accept: /*i18n*/ { id: 'Accept proposal' },
  ask: /*i18n*/ { id: 'Ask a question' },
} as const;

/** A declined logo named by its file; whole messages, never joined pieces — word order differs. */
const REFUSED_FILE: Record<CompanyLogoMiss, MessageRef> = {
  size: /*i18n*/ { id: '{file} is too large.' },
  type: /*i18n*/ { id: '{file} is not a PNG or JPG.' },
  width: /*i18n*/ { id: '{file} is too narrow.' },
};
const REFUSED_UNNAMED: Record<CompanyLogoMiss, MessageRef> = {
  size: /*i18n*/ { id: 'That file is too large.' },
  type: /*i18n*/ { id: 'That file is not a PNG or JPG.' },
  width: /*i18n*/ { id: 'That file is too narrow.' },
};

export interface BrandingFormats {
  /** The tenant's date, in its market's form. */
  readonly date: (epochMs: number) => string;
}

/** What the standing line under the title says. */
export function brandingStandingLine(
  t: T,
  standing: SettingsStanding,
  formats: BrandingFormats,
): TranslatedText {
  return settingsSavedLine(t, standing, formats) ?? t(BRANDING.neverSet);
}

/**
 * The logo's refusal as the banner's title: the file by its name and the first limit it missed —
 * never its own size (owner ruling at the M01 board check). The limits line under the mark stays.
 */
export function brandingLogoRefusal(
  t: T,
  refusal: CompanyLogoRefusal | null,
  fileName: string | null,
): TranslatedText | null {
  if (refusal === null) return null;
  const [missed] = refusal.missed;
  if (missed === undefined) return null;
  return fileName === null || fileName === ''
    ? t(REFUSED_UNNAMED[missed])
    : t(REFUSED_FILE[missed], { file: fileName });
}

/** A letterhead field's refusal, or null. */
export function letterheadRefusalWords(
  t: T,
  refusal: LetterheadRefusal | null,
  field: 'tagline' | 'lines' | 'footerNote',
): TranslatedText | null {
  if (refusal === null) return null;
  if (refusal === 'too-many-lines')
    return t(BRANDING.tooManyLines, { count: LETTERHEAD_LIMITS.lines });
  const count = field === 'tagline' ? LETTERHEAD_LIMITS.tagline : LETTERHEAD_LIMITS.line;
  return t(BRANDING.tooLong, { count });
}

/** Every fixed word the Branding page draws, in the reader's language. */
export function brandingWords(
  t: T,
  facts: {
    readonly limits: CompanyLogoLimits;
    readonly companyName: string;
    readonly taxLabel: string;
  },
) {
  return {
    preview: t(BRANDING.preview),
    proposal: t(BRANDING.proposal),
    linkPage: t(BRANDING.linkPage),
    edit: t(BRANDING.edit),
    logo: t(BRANDING.logo),
    colour: t(BRANDING.colour),
    letterhead: t(BRANDING.letterhead),
    openFullSize: t(BRANDING.openFullSize),
    stage: t(BRANDING.stage),
    editor: t(BRANDING.editor),
    addLogo: t(COMPANY_LOGO.add),
    limits: t(COMPANY_LOGO.limits, {
      maxMegabytes: megabytesShown(facts.limits.maxBytes),
      minWidth: facts.limits.minWidthPx,
    }),
    replace: t(BRANDING.replace),
    remove: t(BRANDING.remove),
    logoAlt: t(BRANDING.logoAlt, { company: facts.companyName }),
    logoUnavailable: t(BRANDING.logoUnavailable),
    profileRow: t(BRANDING.profileRow, { taxLabel: facts.taxLabel }),
    profileRowFrom: t(BRANDING.profileRowFrom),
    sentKeep: t(BRANDING.sentKeep),
    tagline: t(BRANDING.tagline),
    lines: t(BRANDING.lines),
    linesPlaceholder: t(BRANDING.linesPlaceholder),
    linesHint: t(BRANDING.linesHint, { count: LETTERHEAD_LIMITS.lines }),
    footerNote: t(BRANDING.footerNote),
    loadingCover: t(BRANDING.loadingCover),
    loading: t(BRANDING.loading),
    unread: t(BRANDING.unread),
    tryAgain: t(BRANDING.tryAgain),
    notSaved: t(BRANDING.notSaved),
    save: t(BRANDING.save),
    discard: t(BRANDING.discard),
    saveFailed: t(BRANDING.saveFailed),
    retry: t(BRANDING.retry),
    coverTitle: t(BRANDING.coverTitle),
    removeTitle: t(BRANDING.removeTitle),
    removeBody: t(BRANDING.removeBody),
    removeConfirm: t(BRANDING.removeConfirm),
    keep: t(BRANDING.keep),
    leaveTitle: t(BRANDING.leaveTitle),
    leaveBody: t(BRANDING.leaveBody),
    leaveConfirm: t(BRANDING.leaveConfirm),
    keepEditing: t(BRANDING.keepEditing),
    documentTitle: t(BRANDING.proposal),
    colourField: brandColourFieldWords(t),
    dropzone: dropzoneWords(t),
    image: imageWords(t),
    linkPreview: {
      ready: t(LINK_PAGE.ready),
      awaiting: t(LINK_PAGE.awaiting),
      accept: t(LINK_PAGE.accept),
      ask: t(LINK_PAGE.ask),
    },
  };
}

export type BrandingWords = ReturnType<typeof brandingWords>;

/** What the page holds that chooses its words — `@heliogrid/data`'s `useBranding()` as it answers. */
export interface BrandingPageFacts {
  /** The last save did not land. */
  readonly saveFailed: boolean;
  readonly standing: SettingsStanding | null;
  readonly logo: { readonly refusal: CompanyLogoRefusal | null };
  readonly chosenName: string | null;
  readonly draft: {
    readonly tagline: string;
    readonly lines: string;
    readonly footerNote: string;
  } | null;
  /** The failed save, as `@heliogrid/data`'s `DataError` describes it; `null` when none failed. */
  readonly saveFailure: AttemptFailureLike | null;
}

/** A letterhead field's refusal in words, or absent. */
function fieldRefusal(t: T, field: 'tagline' | 'lines' | 'footerNote', text: string) {
  const refusal =
    field === 'lines' ? letterheadLinesRefusal(text) : letterheadFieldRefusal(field, text);
  return letterheadRefusalWords(t, refusal, field) ?? undefined;
}

/** The fields' refusals, each present only when its field is refused. */
function fieldErrors(t: T, draft: BrandingPageFacts['draft']) {
  if (draft === null) return {};
  const tagline = fieldRefusal(t, 'tagline', draft.tagline);
  const lines = fieldRefusal(t, 'lines', draft.lines);
  const footerNote = fieldRefusal(t, 'footerNote', draft.footerNote);
  return {
    ...(tagline === undefined ? {} : { taglineError: tagline }),
    ...(lines === undefined ? {} : { linesError: lines }),
    ...(footerNote === undefined ? {} : { footerNoteError: footerNote }),
  };
}

/** The words the page's state chooses, each present only when the page shows it. */
export function brandingPageWords(t: T, page: BrandingPageFacts, formats: BrandingFormats) {
  const failureId =
    page.saveFailure === null ? undefined : attemptFailureMessageId(page.saveFailure);
  const logoRefusal = brandingLogoRefusal(t, page.logo.refusal, page.chosenName);
  return {
    ...(page.standing === null
      ? {}
      : { standing: brandingStandingLine(t, page.standing, formats) }),
    ...(logoRefusal === null ? {} : { logoRefusal }),
    ...(page.saveFailed ? { saveFailure: t(failureId ?? INTERNAL_ERROR) } : {}),
    fieldErrors: fieldErrors(t, page.draft),
  };
}
