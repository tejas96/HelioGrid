import type { UiLanguage } from '@heliogrid/domain';
import { createTranslator, setupLanguageWords } from '@heliogrid/i18n';
import { SetupLanguage } from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * The language step as a screen holds it: the words are `setupLanguageWords`' in the reader's
 * language, and the selected language and the way pressed live here, in the browser. The words hold
 * the ask's pager, a function the component calls while it renders, so they cannot come through
 * `mount`.
 */
export function LanguageStepAsHeld({
  reader,
  device,
  failed,
  saving = false,
}: {
  reader: UiLanguage;
  device: UiLanguage | null;
  failed: boolean;
  saving?: boolean;
}) {
  const [language, setLanguage] = useState(reader);
  const [pressed, setPressed] = useState('');
  return (
    <div lang={reader}>
      <SetupLanguage
        words={setupLanguageWords(READERS[reader].t, { device, failed })}
        language={language}
        onChoose={setLanguage}
        saving={saving}
        onContinue={() => setPressed('continue')}
        onContinueAnyway={() => setPressed('anyway')}
      />
      <span data-testid="chosen">{language}</span>
      <span data-testid="pressed">{pressed}</span>
    </div>
  );
}
