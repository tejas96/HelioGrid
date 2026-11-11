import type { ChosenSpreadsheet } from '@heliogrid/data/react';
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';
import { bytesOfLocalFile } from './local-file';

/** Older Android pickers report a CSV by its other name; the store takes the one. */
const CSV_ALIASES: readonly string[] = ['text/comma-separated-values'];

/**
 * One spreadsheet from the system's document picker (`SCR-M01-17`), which asks for no permission:
 * its name, its type and its bytes, read from a copy kept in the app's cache — a picked `content://`
 * address may stop reading once the picker closes. `null` when the person closed the picker. The
 * picker gives no saved date, so `savedAt` is `null`.
 */
export async function pickSpreadsheet(): Promise<ChosenSpreadsheet | null> {
  try {
    const [picked] = await pick({ type: [types.csv, types.xlsx], allowMultiSelection: false });
    const name = picked.name ?? 'spreadsheet';
    const [copy] = await keepLocalCopy({
      files: [{ uri: picked.uri, fileName: name }],
      destination: 'cachesDirectory',
    });
    if (copy.status !== 'success') return null;
    const bytes = await bytesOfLocalFile(copy.localUri);
    const type = picked.type ?? '';
    return {
      name,
      savedAt: null,
      contentType: CSV_ALIASES.includes(type) ? 'text/csv' : type,
      bytes,
    };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) return null;
    throw error;
  }
}
