import { type HeaderWords, type ImportColumnGuess, importColumnGuesser } from '../import/columns';
import {
  columnsProblemOf,
  type ImportCells,
  type ImportColumnsProblem,
  type ImportMappedRow,
  type ImportMapping,
  type ImportMappingProblem,
  mappingProblemOf,
} from '../import/mapping';
import type { ImportSheet } from '../import/sheet';

/**
 * The columns a lead import fills (`M02-18`, `M02-19`) and the words a sheet's headers name them by,
 * in English, Hindi and Marathi — an old spreadsheet comes in whatever language the office kept it
 * in. The words of every language are read together, so a word both languages write is listed
 * once. The guess, the mapping and its rows are the shared import's (`import/`).
 */

export const LEAD_IMPORT_FIELDS = ['name', 'phone', 'city', 'segment', 'monthly_bill'] as const;
export type LeadImportField = (typeof LEAD_IMPORT_FIELDS)[number];

/** The phone is the customer's identity (`M02-02`): a row without one names nobody. */
const REQUIRED_FIELDS: readonly LeadImportField[] = ['phone'];

/**
 * A word that could name two of these fields names none: `contact` is a name or a number, `number`
 * a phone or a serial, `area` a city or a roof — the person places such a column.
 */
const LEAD_HEADER_WORDS: Readonly<Record<LeadImportField, HeaderWords>> = {
  name: {
    en: ['name', 'customer name', 'customer', 'client name', 'client', 'full name', 'lead name'],
    hi: ['नाम', 'ग्राहक का नाम', 'ग्राहक नाम', 'ग्राहक', 'पूरा नाम'],
    mr: ['नाव', 'ग्राहकाचे नाव', 'पूर्ण नाव'],
  },
  phone: {
    en: [
      'phone',
      'phone no',
      'phone number',
      'mobile',
      'mobile no',
      'mobile number',
      'mob no',
      'contact no',
      'contact number',
      'whatsapp',
      'whatsapp no',
      'whatsapp number',
    ],
    hi: ['मोबाइल', 'मोबाइल नंबर', 'मोबाइल नं', 'फोन', 'फ़ोन', 'फोन नंबर', 'फ़ोन नंबर', 'संपर्क नंबर'],
    mr: ['मोबाईल', 'मोबाईल नंबर', 'मोबाईल क्रमांक', 'फोन क्रमांक', 'संपर्क क्रमांक'],
  },
  city: {
    en: ['city', 'town', 'village', 'location', 'place'],
    hi: ['शहर', 'गांव', 'गाँव', 'नगर', 'स्थान'],
    mr: ['गाव', 'ठिकाण'],
  },
  segment: {
    en: ['segment', 'category', 'type', 'customer type', 'customer category', 'lead type'],
    hi: ['श्रेणी', 'प्रकार', 'ग्राहक प्रकार'],
    mr: ['वर्ग', 'ग्राहक वर्ग'],
  },
  monthly_bill: {
    en: [
      'monthly bill',
      'bill',
      'bill amount',
      'bill amt',
      'electricity bill',
      'light bill',
      'average bill',
      'avg bill',
    ],
    hi: ['बिल', 'मासिक बिल', 'बिजली बिल', 'बिजली का बिल', 'महीने का बिल', 'बिल राशि'],
    mr: ['वीज बिल', 'लाईट बिल', 'मासिक वीज बिल', 'बिलाची रक्कम'],
  },
};

/** The lead import's guesses: header row, columns and the mapping the device proposes. */
export const LEAD_IMPORT_COLUMNS = importColumnGuesser(LEAD_IMPORT_FIELDS, LEAD_HEADER_WORDS);

export type LeadImportMapping = ImportMapping<LeadImportField>;
export type LeadImportCells = ImportCells<LeadImportField>;
export type LeadImportMappedRow = ImportMappedRow<LeadImportField>;
export type LeadImportColumnGuess = ImportColumnGuess<LeadImportField>;

/** Why the columns step's *Continue* waits: the phone unplaced, or one field placed twice. */
export function leadImportColumnsProblem(
  columns: readonly (LeadImportField | null)[],
): ImportColumnsProblem | null {
  return columnsProblemOf(columns, REQUIRED_FIELDS);
}

/** The server's refusal of a mapping, by the same rule the wizard holds its confirm to (Law 11). */
export function leadImportMappingProblem(
  mapping: LeadImportMapping,
  sheets: readonly ImportSheet[],
): ImportMappingProblem | null {
  return mappingProblemOf(mapping, sheets, REQUIRED_FIELDS);
}
