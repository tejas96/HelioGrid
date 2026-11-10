import type { ChosenSpreadsheet } from '@heliogrid/data/react';
import { pickSpreadsheet } from '../../../files/pick-document';

/**
 * The phone's way to a spreadsheet: the system's document picker, its file handed to the import.
 * A file the phone could not read is said as an upload that failed; the person picks again.
 */
export function usePickSpreadsheet(wizard: {
  choose(file: ChosenSpreadsheet): void;
  couldNotRead(name: string): void;
}): () => void {
  return () =>
    void pickSpreadsheet()
      .then((file) => {
        if (file !== null) wizard.choose(file);
      })
      .catch(() => wizard.couldNotRead(''));
}
