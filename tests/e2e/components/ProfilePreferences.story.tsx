import {
  IN_FORMATS,
  type MeasurementSystem,
  mayMute,
  type NotificationTypeGroup,
  type ProfilePreference,
  profilePreferencesView,
  pushGroupsShownTo,
  pushSwitches,
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
 * it as `data-language`, `data-units` and `data-muted`, *Try again* as `data-retried` and *Edit name*
 * as `data-edit-opened`. The push
 * rows are what the api answers these presets: the groups shown, Billing locked for the Owner.
 */
export function ProfilePreferencesAsHeld({
  reader,
  roles = ['sales_executive'],
  name = 'Anjali Kulkarni',
  photo,
  refused = [],
  onlyLanguage = false,
  push = 'ready',
  muted: mutedAtFirst = [],
  refusedGroups = [],
}: {
  reader: UiLanguage;
  roles?: readonly RolePreset[];
  name?: string;
  /** The person's saved photo. */
  photo?: string;
  refused?: readonly ProfilePreference[];
  /** `m-empty`: the set holding only the language in use. */
  onlyLanguage?: boolean;
  push?: 'loading' | 'error' | 'ready';
  muted?: readonly NotificationTypeGroup[];
  refusedGroups?: readonly NotificationTypeGroup[];
}) {
  const [language, setLanguage] = useState<UiLanguage>(reader);
  const [units, setUnits] = useState<MeasurementSystem>('metric');
  const [muted, setMuted] = useState<readonly NotificationTypeGroup[]>(mutedAtFirst);
  const [retried, setRetried] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const answered = pushGroupsShownTo(roles).map((group) => ({
    group,
    pushMuted: muted.includes(group),
    mutable: mayMute(group, roles),
  }));
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
      data-muted={muted.join(',')}
      data-retried={retried}
      data-edit-opened={editOpened}
      style={{ padding: 'var(--sp-4) var(--screen-pad-mobile-fn)' }}
    >
      <ProfilePreferences
        words={words}
        view={view}
        name={name}
        photo={photo}
        onEditName={() => setEditOpened(true)}
        onLanguage={setLanguage}
        onUnits={setUnits}
        push={{ surface: push, switches: pushSwitches(answered, roles), refused: refusedGroups }}
        onPush={(group) =>
          setMuted((held) =>
            held.includes(group) ? held.filter((one) => one !== group) : [...held, group],
          )
        }
        onRetry={() => setRetried(true)}
      />
    </div>
  );
}
