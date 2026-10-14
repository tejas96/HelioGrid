import type { RolePreset, SettingsRow, UiLanguage } from '@heliogrid/domain';
import { createTranslator, settingsListFor } from '@heliogrid/i18n';
import { SettingsList } from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * The settings list as a screen holds it: the groups and words are `settingsListFor` the held
 * presets in the reader's language, and the row last opened lives here, in the browser, as
 * `data-opened` on the frame.
 */
export function SettingsListAsHeld({
  reader,
  held,
  name = 'Rajesh Patil',
}: {
  reader: UiLanguage;
  held: readonly RolePreset[];
  /** The person's name; the default is the board's persona. */
  name?: string;
}) {
  const [opened, setOpened] = useState<SettingsRow | ''>('');
  const list = settingsListFor(READERS[reader].t, held);
  return (
    <div lang={reader} data-opened={opened}>
      <SettingsList title={list.title} person={{ name }} groups={list.groups} onOpen={setOpened} />
    </div>
  );
}
