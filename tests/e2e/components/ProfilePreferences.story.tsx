import {
  IN_FORMATS,
  type MeasurementSystem,
  type ProfilePreference,
  profilePreferencesView,
  type RolePreset,
  type UiLanguage,
} from '@heliogrid/domain';
import { createTranslator, profilePreferencesWords } from '@heliogrid/i18n';
import { ProfilePreferences } from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * Profile & preferences as a screen holds it, inside the page's padding: the view and the words from the person, the reader
 * and the India pack; a tap moves the person's choice here, in the browser, and the frame reports
 * it as `data-language` and `data-units`.
 */
export function ProfilePreferencesAsHeld({
  reader,
  roles = ['sales_executive'],
  name = 'Anjali Kulkarni',
  refused = [],
  onlyLanguage = false,
}: {
  reader: UiLanguage;
  roles?: readonly RolePreset[];
  name?: string;
  refused?: readonly ProfilePreference[];
  /** `m-empty`: the set holding only the language in use. */
  onlyLanguage?: boolean;
}) {
  const [language, setLanguage] = useState<UiLanguage>(reader);
  const [units, setUnits] = useState<MeasurementSystem>('metric');
  const user = {
    id: '8f0c2d1e-0000-4000-8000-0000000000a1',
    name,
    phoneE164: '+919876543210',
    interfaceLanguage: language,
    unitPreference: units,
    tenant: { id: 't', roles },
  };
  const whole = profilePreferencesView({ user, device: 'en', marketUnits: 'metric' });
  const view = onlyLanguage
    ? { ...whole, language: { ...whole.language, options: [whole.language.value] } }
    : whole;
  const words = profilePreferencesWords(READERS[reader].t, view, {
    reader,
    pack: IN_FORMATS,
    refused,
  });
  return (
    <div
      lang={reader}
      data-language={language}
      data-units={units}
      style={{ padding: 'var(--sp-4) var(--screen-pad-mobile-fn)' }}
    >
      <ProfilePreferences
        words={words}
        view={view}
        name={name}
        onLanguage={setLanguage}
        onUnits={setUnits}
      />
    </div>
  );
}
