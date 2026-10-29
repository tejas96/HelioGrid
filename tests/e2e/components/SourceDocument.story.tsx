import {
  createTranslator,
  imageWords,
  SOURCE_DOCUMENT,
  sourceDocumentWords,
} from '@heliogrid/i18n';
import { SourceDocument } from '@heliogrid/ui';

const en = await createTranslator('en');
const words = sourceDocumentWords(en.t, imageWords(en.t));

/**
 * A document with no pages, its words bound in the browser: `named` and `loading` are functions
 * the document calls while it renders, so they cannot be handed to `mount`. The file's name is a
 * fact, not a word.
 */
export function WordedSourceDocument() {
  return (
    <SourceDocument
      name="survey-sheet.pdf"
      words={words}
      openLabel={en.t(SOURCE_DOCUMENT.openLabel)}
      unsupportedTitle={en.t(SOURCE_DOCUMENT.unsupportedTitle)}
      failedTitle={en.t(SOURCE_DOCUMENT.failedTitle)}
      emptyTitle={en.t(SOURCE_DOCUMENT.emptyTitle)}
      emptyMessage={en.t(SOURCE_DOCUMENT.emptyMessage)}
    />
  );
}
