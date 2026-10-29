import { useProfileScreen } from '@heliogrid/data/react';
import { PROFILE_PHOTO_MAX_SIDE_PX } from '@heliogrid/domain';
import {
  nameAndPhotoEditorWords,
  profilePreferencesWords,
  roleCardWords,
  SHELL,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { NameAndPhotoEditor, ProfilePreferences, RoleCardSurface, useFormat } from '@heliogrid/ui';
import { pickImage } from '../../files/pick-image';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';

/**
 * Profile & preferences behind `More` on the phone (`SCR-M01-11`, `m-default`): under the settings
 * page's bar — its way back, its title and the search. What it draws is `useProfileScreen`'s, the
 * web's too; the phone's own part is the photo library, the photo shrunk on the device
 * (`SCR-M01-09` ruling 19). A language applies through the provider, which saves it (`F3-04`).
 */
export function ProfileScreen() {
  const drillDown = useSettingsDrillDown('profile');
  const { t, locale, device, setLocale } = useI18n();
  const { pack } = useFormat();
  const screen = useProfileScreen(device, pack.measurementSystem);
  if (screen === null) return null;
  const { user, view, editor, role, push, photo } = screen;
  const words = profilePreferencesWords(t, view, { reader: locale, pack, refused: screen.refused });
  const roleWords = roleCardWords(t, role.card, role.facts);
  return (
    <ShellPage inView="more" drillDown={drillDown} pad="functional">
      <ProfilePreferences
        words={words}
        view={view}
        name={user.name}
        photo={photo.picture ?? undefined}
        onEditName={screen.editName}
        onRole={role.open}
        onLanguage={(next) => void setLocale(next)}
        onUnits={screen.chooseUnits}
        read={push.read}
        refused={push.refused}
        onPush={push.flip}
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
      <RoleCardSurface
        open={role.isOpen}
        onClose={role.close}
        title={roleWords.surfaceTitle}
        closeLabel={t(SHELL.close)}
        words={roleWords}
        read={role.read}
      />
    </ShellPage>
  );
}
