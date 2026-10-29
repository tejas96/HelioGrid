'use client';
import {
  useMyPhoto,
  useNameAndPhotoEditor,
  usePushPreferences,
  useRoleCard,
  useSession,
} from '@heliogrid/data/react';
import { profilePreferencesView } from '@heliogrid/domain';
import {
  nameAndPhotoEditorWords,
  profilePreferencesWords,
  roleCardWords,
  SHELL,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { NameAndPhotoEditor, ProfilePreferences, RoleCardSurface, useFormat } from '@heliogrid/ui';
import { useState } from 'react';
import { openImagePicker, useImageFile } from '../../lib/use-image-file';

/**
 * Profile & preferences (`SCR-M01-11`): every person's own page, open to every preset (the
 * settings row `profile`). A language applies through the provider, which saves it (`F3-04`); a
 * unit through the session; a push switch through its group's write. A refused save shows on the
 * control that made it (D219). *Edit name* opens the name and photo editor over the page; *Your role* the role card.
 */
export function ProfileScreen() {
  const { t, locale, device, setLocale } = useI18n();
  const { pack } = useFormat();
  const { user, refusedPreferences, setUnitPreference } = useSession();
  const push = usePushPreferences();
  const photo = useMyPhoto();
  const editor = useNameAndPhotoEditor();
  const role = useRoleCard();
  const [roleOpen, setRoleOpen] = useState(false);
  const chooseFile = useImageFile(editor.choosePhoto);
  if (user === null) return null;
  const view = profilePreferencesView({ user, device, marketUnits: pack.measurementSystem });
  const words = profilePreferencesWords(t, view, {
    reader: locale,
    pack,
    refused: refusedPreferences,
  });
  const roleWords = roleCardWords(t, role.card, role.facts);
  return (
    <div className="hg-shell-page" data-pad="functional">
      <ProfilePreferences
        words={words}
        view={view}
        name={user.name}
        photo={photo.picture ?? undefined}
        onEditName={() => editor.open(user.name, photo)}
        onRole={() => {
          role.refresh();
          setRoleOpen(true);
        }}
        onLanguage={(next) => void setLocale(next)}
        onUnits={(next) => void setUnitPreference(next)}
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
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        title={roleWords.surfaceTitle}
        closeLabel={t(SHELL.close)}
        words={roleWords}
        read={role.read}
      />
    </div>
  );
}
