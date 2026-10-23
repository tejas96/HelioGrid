'use client';
import { useFirstRunProfile } from '@heliogrid/data/react';
import { firstRunProfileWords } from '@heliogrid/i18n';
import { useLanguageChoice, useTranslate } from '@heliogrid/i18n/react';
import { DoorLanguage, FirstRunProfile } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { openImagePicker, useImageFile } from '../../lib/use-image-file';
import { HOME_ROUTE, WELCOME_ROLE_ROUTE } from '../auth';

/**
 * First-Run Profile on the web (`SCR-M01-09`, `M01-14`): the step after a join, owed only for this
 * visit (ruling 17); once saved, the role card follows (`SCR-M01-10`). Anyone it is not owed to —
 * a reload, a typed address, someone signed out — goes home, whose gate sends a signed-out visitor
 * to the door. The flow is `useFirstRunProfile`'s and
 * every word `firstRunProfileWords`'; this screen holds the file chooser and the navigation.
 */
export function FirstRunProfileScreen() {
  const t = useTranslate();
  const router = useRouter();
  const language = useLanguageChoice();
  const profile = useFirstRunProfile(() => router.replace(WELCOME_ROLE_ROUTE));
  const chooseFile = useImageFile((image) => profile?.choosePhoto(image));
  const owed = profile !== null;

  useEffect(() => {
    if (!owed) router.replace(HOME_ROUTE);
  }, [owed, router]);

  if (profile === null) return null;
  const { carry, state, frame } = profile;
  return (
    <FirstRunProfile
      language={<DoorLanguage {...language} />}
      words={firstRunProfileWords(t, frame, {
        inviterName: carry.inviterName,
        invitedName: carry.name,
        companyName: carry.companyName,
      })}
      frame={frame}
      name={state.name}
      picture={frame.photo.kind === 'chosen' ? (frame.photo.picture ?? undefined) : undefined}
      onName={profile.typeName}
      onChoosePhoto={() => openImagePicker(chooseFile)}
      onDropPhoto={chooseFile}
      onRemovePhoto={profile.removePhoto}
      onRetryPhoto={() => profile.press('retry-photo')}
      onSave={() => profile.press('save')}
    />
  );
}
