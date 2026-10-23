import { useFirstRunProfile } from '@heliogrid/data/react';
import { PROFILE_PHOTO_MAX_SIDE_PX } from '@heliogrid/domain';
import { firstRunProfileWords } from '@heliogrid/i18n';
import { useLanguageChoice, useTranslate } from '@heliogrid/i18n/react';
import { DoorLanguage, FirstRunProfile } from '@heliogrid/ui';
import { useEffect } from 'react';
import { pickImage } from '../../files/pick-image';
import { roleExplainerRoute } from '../../navigation/guards';
import { InsetDoor } from '../shared/InsetDoor';
import { useGoInside } from '../shared/use-go-inside';

/**
 * First-Run Profile on the phone (`SCR-M01-09`, `M01-14`): the step the invite landing hands a newly
 * named account to after the join, owed only for this visit (ruling 17). The act opens the photo
 * library, shrunk on the device (ruling 19); once the step ends the role card follows
 * (`SCR-M01-10`), and when nothing is owed the person goes on to the App group's first screen. The
 * flow is `useFirstRunProfile`'s.
 */
export function FirstRunProfileScreen() {
  const t = useTranslate();
  const language = useLanguageChoice();
  const goInside = useGoInside();
  const profile = useFirstRunProfile(() => goInside(roleExplainerRoute));
  const owed = profile !== null;

  useEffect(() => {
    if (!owed) goInside();
  }, [owed, goInside]);

  if (profile === null) return null;
  const { carry, state, frame } = profile;
  return (
    <InsetDoor>
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
        onChoosePhoto={() => {
          void pickImage(PROFILE_PHOTO_MAX_SIDE_PX).then((image) => {
            if (image !== null) profile.choosePhoto(image);
          });
        }}
        onRemovePhoto={profile.removePhoto}
        onRetryPhoto={() => profile.press('retry-photo')}
        onSave={() => profile.press('save')}
      />
    </InsetDoor>
  );
}
