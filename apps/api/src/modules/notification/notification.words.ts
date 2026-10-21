import { UI_LANGUAGES, type UiLanguage } from '@heliogrid/domain';
import { createTranslator, type Translator } from '@heliogrid/i18n';

/** The words of one notice, in the language they were rendered in (`F6-08`). */
export interface NoticeWords {
  readonly title: string;
  readonly body: string;
}

/**
 * The notice rendered once per language before the write, so the transaction picks each
 * recipient's without loading a catalog while it holds its locks.
 */
export async function renderedInEveryLanguage(
  render: (translate: Translator['t']) => NoticeWords,
): Promise<(language: UiLanguage) => NoticeWords> {
  const rendered = await Promise.all(
    UI_LANGUAGES.map(async (language) => ({
      language,
      words: render((await createTranslator(language)).t),
    })),
  );
  return (language) => {
    const found = rendered.find((one) => one.language === language);
    if (found === undefined) throw new Error(`no words were rendered in ${language}`);
    return found.words;
  };
}
