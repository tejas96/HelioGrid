'use client';
import { useProfileScreen } from '@heliogrid/data/react';
import {
  nameAndPhotoEditorWords,
  profilePreferencesWords,
  roleCardWords,
  SHELL,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { NameAndPhotoEditor, ProfilePreferences, RoleCardSurface, useFormat } from '@heliogrid/ui';
import { openImagePicker, useImageFile } from '../../lib/use-image-file';

/**
 * Profile & preferences (`SCR-M01-11`): every person's own page, open to every preset (the
 * settings row `profile`). What it draws is `useProfileScreen`'s, the phone's too; the web's own
 * part is the file picker. A language applies through the provider, which saves it (`F3-04`).
 */
export function ProfileScreen() {
  const { t, locale, device, setLocale } = useI18n();
  const { pack } = useFormat();
  const screen = useProfileScreen(device, pack.measurementSystem);
  const chooseFile = useImageFile(screen === null ? () => undefined : screen.editor.choosePhoto);
  if (screen === null) return null;
  const { user, view, editor, role, push, photo } = screen;
  const words = profilePreferencesWords(t, view, { reader: locale, pack, refused: screen.refused });
  const roleWords = roleCardWords(t, role.card, role.facts);
  return (
    <div className="hg-shell-page" data-pad="functional">
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
        onChoosePhoto={() => openImagePicker(chooseFile)}
        onDropPhoto={chooseFile}
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
    </div>
  );
}
