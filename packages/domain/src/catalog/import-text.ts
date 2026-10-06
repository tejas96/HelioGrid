/**
 * The comparable form of a spreadsheet's text (`M01-41`), shared by the column guess every device
 * may show and the cell readers the server runs.
 */

const DEVANAGARI_ZERO = 0x0966;

/** Devanagari digits as ASCII, so `१३२००` reads as `13200`. */
export function asciiDigits(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[०-९]/g, (digit) => String(digit.charCodeAt(0) - DEVANAGARI_ZERO));
}

/**
 * The comparable form of a cell or a header: ASCII digits, lower case, anything in brackets
 * dropped (a header's unit), and every run of non-letters one space. Letters include the combining
 * marks Devanagari is written with, so a Hindi word survives whole.
 */
export function importTextKey(text: string): string {
  return asciiDigits(text)
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim();
}
