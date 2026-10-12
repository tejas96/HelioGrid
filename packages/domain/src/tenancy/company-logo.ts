import { FILE_SUBJECT_RULES, type FileSubjectRule, judgeFileDeclaration } from '../files/rules';
import { FILE_CONTENT_TYPES } from '../files/vocabulary';

/** What a company's logo may be (`SCR-M01-05`, `logo-invalid-limits-stated`). */
export interface CompanyLogoLimits extends Pick<FileSubjectRule, 'contentTypes' | 'maxBytes'> {
  readonly minWidthPx: number;
}

/**
 * The type and the size are the file rule's own, so a screen never states a limit the api does not
 * refuse by. The width is checked on the device alone: the api reads no image.
 */
export const COMPANY_LOGO_LIMITS: CompanyLogoLimits = {
  contentTypes: FILE_SUBJECT_RULES.tenant.contentTypes,
  maxBytes: FILE_SUBJECT_RULES.tenant.maxBytes,
  minWidthPx: 400,
};

/** A limit an image can miss. */
export type CompanyLogoMiss = 'type' | 'size' | 'width';

/** An image as a device reads it before any upload; the width is `null` when it cannot be read. */
export interface ChosenImage {
  readonly contentType: string;
  readonly byteSize: number;
  readonly widthPx: number | null;
}

export interface CompanyLogoRefusal {
  /** Every limit missed, in the order a refusal names them. A wrong type stands alone. */
  readonly missed:
    | readonly ['type']
    | readonly ['size']
    | readonly ['width']
    | readonly ['size', 'width'];
  /** The image's own size, as `megabytesShown` prints it. */
  readonly megabytes: number;
  readonly widthPx: number | null;
}

/**
 * Why an image is not taken as the logo, `null` when it is. A refusal names every limit missed, so
 * the owner is not sent back with half the fix. The type and the size are judged as the api judges
 * a declared file. An image of another type, or one whose width no device can read, is not
 * measured: the right file is another file, with its own size and width.
 */
export function companyLogoRefusal(
  image: ChosenImage,
  limits: CompanyLogoLimits,
): CompanyLogoRefusal | null {
  const { byteSize, widthPx } = image;
  const measured = { megabytes: megabytesShown(byteSize), widthPx };
  const declared = FILE_CONTENT_TYPES.find((known) => known === image.contentType);
  const verdict =
    declared === undefined ? 'type-not-taken' : judgeFileDeclaration(limits, declared, byteSize);
  if (verdict === 'type-not-taken' || widthPx === null) return { missed: ['type'], ...measured };
  const tooLarge = verdict === 'too-large';
  const tooNarrow = widthPx < limits.minWidthPx;
  if (tooLarge && tooNarrow) return { missed: ['size', 'width'], ...measured };
  if (tooLarge) return { missed: ['size'], ...measured };
  return tooNarrow ? { missed: ['width'], ...measured } : null;
}

const BYTES_PER_TENTH_OF_A_MEGABYTE = 100_000;

/**
 * A size in megabytes to one decimal, rounded up: a file one byte over a limit must never read as
 * the limit itself. A limit printed through this must be a whole tenth of a megabyte, or it would
 * read above what is taken.
 */
export function megabytesShown(bytes: number): number {
  return Math.ceil(bytes / BYTES_PER_TENTH_OF_A_MEGABYTE) / 10;
}
