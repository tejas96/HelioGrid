import {
  useMyPhoto,
  useNameAndPhotoEditor,
  usePushPreferences,
  useSession,
} from '@heliogrid/data/react';
import { PROFILE_PHOTO_MAX_SIDE_PX, profilePreferencesView } from '@heliogrid/domain';
import { nameAndPhotoEditorWords, profilePreferencesWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { NameAndPhotoEditor, ProfilePreferences, useFormat } from '@heliogrid/ui';
import { pickImage } from '../../files/pick-image';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';

/**
 * Profile & preferences behind `More` on the phone (`SCR-M01-11`, `m-default`): under the settings
 * page's bar — its way back, its title and the search. A language applies through the provider,
 * which saves it (`F3-04`); a unit through the session; a push switch through its group's write.
 * A refused save shows on its control (D219). *Edit name* opens the name and photo sheet, whose
 * photo act opens the photo library, shrunk on the device (`SCR-M01-09` ruling 19).
 */
export function ProfileScreen() {
  const drillDown = useSettingsDrillDown('profile');
  const { t, locale, device, setLocale } = useI18n();
  const { pack } = useFormat();
  const { user, refusedPreferences, setUnitPreference } = useSession();
  const push = usePushPreferences();
  const photo = useMyPhoto();
  const editor = useNameAndPhotoEditor();
  if (user === null) return null;
  const view = profilePreferencesView({ user, device, marketUnits: pack.measurementSystem });
  const words = profilePreferencesWords(t, view, {
    reader: locale,
    pack,
    refused: refusedPreferences,
  });
  return (
    <ShellPage inView="more" drillDown={drillDown} pad="functional">
      <ProfilePreferences
        words={words}
        view={view}
        name={user.name}
        photo={photo.picture ?? undefined}
        onEditName={() => editor.open(user.name, photo)}
        onLanguage={(next) => void setLocale(next)}
        onUnits={(next) => void setUnitPreference(next)}
        push={push}
        onPush={push.flip}
        onRetry={push.retry}
      />
      <NameAndPhotoEditor
        open={editor.isOpen}
        words={nameAndPhotoEditorWords(t, editor.frame)}
        frame={editor.frame}
        name={editor.state.name}
        picture={editor.picture}
        onName={editor.typeName}
        onChoosePhoto={() => {
          void pickImage(PROFILE_PHOTO_MAX_SIDE_PX).then((image) => {
            if (image !== null) editor.choosePhoto(image);
          });
        }}
        onRemovePhoto={editor.removePhoto}
        onRetryPhoto={() => editor.press('retry-photo')}
        onSave={() => editor.press('save')}
        onClose={editor.close}
      />
    </ShellPage>
  );
}
