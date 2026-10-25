import { createTranslator, languageSwitcherWords } from '@heliogrid/i18n';
import { LanguageSwitcher, type LanguageSwitcherProps } from '@heliogrid/ui';
import { useState } from 'react';

const WORDS = languageSwitcherWords((await createTranslator('en')).t);

/**
 * The switcher as an editor holds it (`SCR-M01-19`'s Cover, Terms and Timeline parts): the chosen
 * language lives here, in the browser, arriving only through `onChange` — a value handed to
 * `mount` never changes — and its words are the catalog's, bound here because they are functions.
 */
export function HeldLanguageSwitcher({
  initial,
  ...props
}: Omit<LanguageSwitcherProps, 'value' | 'onChange' | 'words'> & { initial: string }) {
  const [value, setValue] = useState(initial);
  return <LanguageSwitcher {...props} words={WORDS} value={value} onChange={setValue} />;
}
