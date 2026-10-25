import { createTranslator, richTextWords } from '@heliogrid/i18n';
import type { RichTextWords } from '@heliogrid/ui';

/**
 * `RichText`'s words as its spec and story both read them. ENGLISH is the editor's own words from
 * the catalog, in English; MARKED gives every word a marker no
 * English default could equal, so a word the editor did not take from its prop shows as itself.
 */
export const RICH_TEXT_ENGLISH: RichTextWords = richTextWords((await createTranslator('en')).t);

export const RICH_TEXT_MARKED: RichTextWords = {
  formatting: '«w-formatting»',
  bold: '«w-b»',
  italic: '«w-i»',
  heading: '«w-h»',
  bulletedList: '«w-ul»',
  numberedList: '«w-ol»',
  link: '«w-a»',
  linkAddress: '«w-href»',
  addLink: '«w-apply»',
  addLogo: '«w-logo-off»',
  logoOn: '«w-logo-on»',
  addTheLogo: '«w-logo-add»',
  removeTheLogo: '«w-logo-remove»',
  logoPrintsHere: '«w-logo-slot»',
  loadTemplate: '«w-load»',
  loadSavedTemplate: '«w-load-name»',
  loadTemplateNamed: (name) => `«w-load:${name}»`,
  editorName: '«w-editor»',
  characters: (count, max) => `«w-count:${count}/${max ?? '-'}»`,
};
