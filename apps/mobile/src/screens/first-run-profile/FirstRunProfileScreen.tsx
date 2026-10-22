import { useFirstRunProfile } from '@heliogrid/data/react';
import { PROFILE_PHOTO_MAX_SIDE_PX } from '@heliogrid/domain';
import { firstRunProfileWords } from '@heliogrid/i18n';
import { useLanguageChoice, useTranslate } from '@heliogrid/i18n/react';
import { DoorLanguage, FirstRunProfile } from '@heliogrid/ui';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { pickImage } from '../../files/pick-image';
import { APP_ENTRY_ROUTES } from '../../navigation/guards';
import { InsetDoor } from '../shared/InsetDoor';

/**
 * First-Run Profile on the phone (`SCR-M01-09`, `M01-14`): the step the invite landing hands a newly
 * named account to after the join, owed only for this visit (ruling 17). The act opens the photo
 * library, shrunk on the device (ruling 19); once the step ends, or when nothing is owed, the
 * person goes on to the App group's first screen. The flow is `useFirstRunProfile`'s.
 */
export function FirstRunProfileScreen() {
  const t = useTranslate();
  const language = useLanguageChoice();
  const goOn = useGoOn();
  const profile = useFirstRunProfile(goOn);
  const owed = profile !== null;

  useEffect(() => {
    if (!owed) goOn();
  }, [owed, goOn]);

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

/** On to the App group's first screen, which the session decides (`landingFor`). */
function useGoOn(): () => void {
  const navigation = useNavigation();
  return useCallback(() => {
    const names: readonly string[] = navigation.getState()?.routeNames ?? [];
    const entry = APP_ENTRY_ROUTES.find((route) => names.includes(route));
    if (entry !== undefined) {
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: entry }] }));
    }
  }, [navigation]);
}
