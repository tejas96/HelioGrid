import {
  type BrandingDraft,
  type BrandingEdit,
  type CompanyLetterhead,
  letterheadLinesOf,
} from '@heliogrid/domain';

/**
 * The Branding page's pure answers from what `useBranding` holds: what the previews print and the
 * letterhead fields the editor shows.
 */

export interface BrandingFields {
  readonly tagline: string;
  readonly lines: string;
  readonly footerNote: string;
  onTagline(text: string): void;
  onLines(text: string): void;
  onFooterNote(text: string): void;
}

/** The cover's facts as the previews take them; a part the tenant has not given is absent. */
export interface BrandingCover {
  readonly companyName: string;
  readonly logoSrc?: string;
  readonly taxId?: string;
  readonly address?: string;
  readonly letterhead: {
    readonly tagline?: string;
    readonly lines: string[];
    readonly footerNote?: string;
  };
}

/** The cover from the company's facts, the draft's letterhead and the logo the draft holds. */
export function coverOf(
  company: CompanyLetterhead,
  draft: BrandingDraft,
  logoSrc: string | null,
): BrandingCover {
  const given = (text: string) => (text.trim() === '' ? undefined : text.trim());
  const tagline = given(draft.tagline);
  const footerNote = given(draft.footerNote);
  const address = given(company.addressLine);
  return {
    companyName: company.companyName,
    ...(logoSrc === null ? {} : { logoSrc }),
    ...(company.registration === null ? {} : { taxId: company.registration.value }),
    ...(address === undefined ? {} : { address }),
    letterhead: {
      ...(tagline === undefined ? {} : { tagline }),
      lines: [...letterheadLinesOf(draft.lines)],
      ...(footerNote === undefined ? {} : { footerNote }),
    },
  };
}

/** The letterhead fields as typed, each edit through the one draft. */
export function fieldsOf(
  draft: BrandingDraft | null,
  apply: (next: BrandingEdit) => void,
): BrandingFields {
  return {
    tagline: draft?.tagline ?? '',
    lines: draft?.lines ?? '',
    footerNote: draft?.footerNote ?? '',
    onTagline: (value) => apply({ kind: 'tagline', value }),
    onLines: (value) => apply({ kind: 'lines', value }),
    onFooterNote: (value) => apply({ kind: 'footerNote', value }),
  };
}
