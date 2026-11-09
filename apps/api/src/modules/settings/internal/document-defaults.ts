import type { DocumentDefaults, UiLanguage } from '@heliogrid/domain';
import { createTranslator, documentDefaults } from '@heliogrid/i18n';

/** The platform's document defaults in one reader's words (`F3-10`): catalog copy, translated here. */
export async function documentDefaultsIn(reader: UiLanguage): Promise<DocumentDefaults> {
  return documentDefaults((await createTranslator(reader)).t);
}
