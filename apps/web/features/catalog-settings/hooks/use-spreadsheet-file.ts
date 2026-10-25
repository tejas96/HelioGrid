'use client';
import type { ChosenSpreadsheet } from '@heliogrid/data/react';
import type { PickedFile } from '@heliogrid/ui';

/**
 * A spreadsheet chosen or dropped in the browser, as the import takes it: its name, the date the
 * browser says it was last saved, its type and its bytes.
 */
export function useSpreadsheetFile(
  choose: (file: ChosenSpreadsheet) => void,
): (picked: readonly PickedFile[]) => void {
  return ([picked]) => {
    const file = picked?.source;
    if (!(file instanceof File)) return;
    void file.arrayBuffer().then((buffer) =>
      choose({
        name: file.name,
        savedAt: new Date(file.lastModified).toISOString(),
        contentType: typeOf(file),
        bytes: new Uint8Array(buffer),
      }),
    );
  };
}

/** The types a spreadsheet's extension names; a browser's own report of a CSV varies by system. */
const BY_EXTENSION: Readonly<Record<string, string>> = {
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * A spreadsheet's type by its extension first: Windows with Excel reports a CSV as
 * `application/vnd.ms-excel`, and some browsers report nothing. Any other file keeps the browser's.
 */
function typeOf(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return BY_EXTENSION[extension] ?? file.type;
}
