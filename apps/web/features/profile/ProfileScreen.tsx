'use client';
import { usePushPreferences, useSession } from '@heliogrid/data/react';
import { profilePreferencesView } from '@heliogrid/domain';
import { profilePreferencesWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { ProfilePreferences, useFormat } from '@heliogrid/ui';

/**
 * Profile & preferences (`SCR-M01-11`): every person's own page, open to every preset (the
 * settings row `profile`). A language applies through the provider, which saves it (`F3-04`); a
 * unit through the session; a push switch through its group's write. A refused save shows on the
 * control that made it (D219).
 */
export function ProfileScreen() {
  const { t, locale, device, setLocale } = useI18n();
  const { pack } = useFormat();
  const { user, refusedPreferences, setUnitPreference } = useSession();
  const push = usePushPreferences();
  if (user === null) return null;
  const view = profilePreferencesView({ user, device, marketUnits: pack.measurementSystem });
  const words = profilePreferencesWords(t, view, {
    reader: locale,
    pack,
    refused: refusedPreferences,
  });
  return (
    <div className="hg-shell-page" data-pad="functional">
      <ProfilePreferences
        words={words}
        view={view}
        name={user.name}
        onLanguage={(next) => void setLocale(next)}
        onUnits={(next) => void setUnitPreference(next)}
        push={push}
        onPush={push.flip}
        onRetry={push.retry}
      />
    </div>
  );
}
