import type { DocumentPart } from './DocumentPreview.types';
import type { ResolvedDocument } from './document-model';

/** Which bands the sheet draws: the parts asked for — the money band only with a line in it. */
export function shownBands(doc: ResolvedDocument): Record<DocumentPart, boolean> {
  const has = (part: DocumentPart) => doc.parts.includes(part);
  return {
    cover: has('cover'),
    items: has('items') && doc.lineItems.length > 0,
    sections: has('sections'),
    tranches: has('tranches'),
    terms: has('terms'),
  };
}

/** A section's or a tranche's place in its list, as the sheet prints it: `01`, `02` … */
export function listOrdinal(index: number): string {
  return String(index + 1).padStart(2, '0');
}

/** The band's contact line: the tax number, then what the company wrote (phone, email, website). */
export interface BandContactLine {
  /** The band prints the tax number ITSELF, from `taxId`, so its number can take the mono face. */
  taxed: boolean;
  /** A separator between the tax number and the company's own lines, when both are there. */
  separated: boolean;
  /** `letterhead.lines`, printed as typed. */
  written: string;
}

/** `null` when the band has neither a tax number nor a line of the company's own. */
export function bandContactLine(doc: ResolvedDocument): BandContactLine | null {
  const lines = doc.letterhead?.lines ?? [];
  if (doc.taxId === '' && lines.length === 0) {
    return null;
  }
  return {
    taxed: doc.taxId !== '',
    separated: doc.taxId !== '' && lines.length > 0,
    written: lines.join(' · '),
  };
}

/** Who the document is for, and what it is — the cover draws nothing when it has neither. */
export function coverLines(doc: ResolvedDocument): { named: boolean; titled: boolean } {
  return {
    named: doc.customerName !== '',
    titled: doc.docTitle !== undefined || doc.docNumber !== '' || doc.docDateText !== '',
  };
}
