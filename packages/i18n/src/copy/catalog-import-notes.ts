import type { TranslatedText } from '@heliogrid/contracts';
import type { Translator } from '../runtime';

type T = Translator['t'];

const NOTE = {
  tooLarge: /*i18n*/ { id: 'This file is over {size} MB. Choose a smaller one.' },
  notSpreadsheet: /*i18n*/ { id: 'Choose an Excel or CSV file.' },
  uploadFailed: /*i18n*/ { id: 'The file did not upload. Try again.' },
  movedTitle: /*i18n*/ { id: 'This import moved on' },
  movedMessage: /*i18n*/ { id: 'It was run or changed elsewhere. Here is where it stands now.' },
  failedTitle: /*i18n*/ { id: 'That did not go through' },
  failedMessage: /*i18n*/ { id: 'Nothing changed. Try again.' },
} as const;

/** Where a chosen file stands, as `useCatalogImport` reports it. */
interface UploadFacts {
  readonly state: 'idle' | 'storing' | 'refused' | 'failed';
  readonly refusal?: 'too-large' | 'type-not-taken';
}

/** The import wizard's refusals (`SCR-M01-17`): a file refused or not uploaded, an act refused. */
export function catalogImportNotes(t: T) {
  return {
    upload: (upload: UploadFacts, maxSizeMB: number): TranslatedText | null => {
      if (upload.state === 'failed') return t(NOTE.uploadFailed);
      if (upload.state !== 'refused') return null;
      return upload.refusal === 'too-large'
        ? t(NOTE.tooLarge, { size: maxSizeMB })
        : t(NOTE.notSpreadsheet);
    },
    notice: (failure: { readonly conflict: boolean } | null) => {
      if (failure === null) return null;
      return failure.conflict
        ? { title: t(NOTE.movedTitle), message: t(NOTE.movedMessage) }
        : { title: t(NOTE.failedTitle), message: t(NOTE.failedMessage) };
    },
  };
}
