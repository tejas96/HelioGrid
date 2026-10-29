import { useSetupInvite } from '@heliogrid/data/react';
import { DOOR_SEGMENT, SETTINGS_SEGMENT } from '@heliogrid/domain';
import { setupInviteWords, toastHostWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { closeKeyboard, SetupInviteTeam, ToastHost, useFormat, useToasts } from '@heliogrid/ui';
import { useState } from 'react';
import { Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { linkingOptions } from '../../navigation/linking';
import { InsetDoor } from '../shared/InsetDoor';
import { useInviteForm } from '../team';

/* Team's row, by its public address (`M01-61`): leaving the step takes this screen away and brings
   the shell's routes in on the next render, so the row is opened as its link, once they are. */
const TEAM_ROW_LINK = `${linkingOptions.prefixes[0]}${DOOR_SEGMENT.more}/${SETTINGS_SEGMENT.team}`;

/**
 * The invite step of setup on the phone (`SCR-M01-07`, `M01-12`), mounted for an owner whose
 * company still owes it. The send and the step's writes are `useSetupInvite`'s, the form
 * `useInviteForm`'s; a send that did not go out is said in this step's own toast host, standing on
 * its held acts. *Open Team* leaves setup and opens Team (AC-20; `T-M01-006` D2).
 */
export function SetupInviteTeamScreen() {
  const { t } = useI18n();
  const { pack } = useFormat();
  const toasts = useToasts();
  const invite = useSetupInvite(pack);
  const { bottom } = useSafeAreaInsets();
  /* The held acts' height, told by the frame: the toast stands on them, whatever their words wrap to. */
  // biome-ignore lint/plugin/screen-assembly: a native layout measurement of the held acts; the web's toast stands in the page's own flow
  const [actsHeight, setActsHeight] = useState(0);
  const { words, fields } = useInviteForm(invite, toasts.push, invite.skip);
  return (
    <InsetDoor>
      <SetupInviteTeam
        {...fields}
        leaving={invite.leaving}
        onActsHeight={setActsHeight}
        words={{ ...words, ...setupInviteWords(t) }}
        onSend={() => {
          /* The field lets go first, on every way out: on Android a focused field that unmounts
             hands the keyboard to the next screen's field, Team's search among them. */
          closeKeyboard();
          fields.onSend();
        }}
        onSkip={() => {
          closeKeyboard();
          void invite.skip();
        }}
        onOpenTeam={async () => {
          closeKeyboard();
          await invite.openTeam();
          void Linking.openURL(TEAM_ROW_LINK).catch(() => undefined);
        }}
      />
      <ToastHost
        toasts={toasts.toasts}
        onDismiss={toasts.dismiss}
        {...toastHostWords(t)}
        focusAfter={fields.phoneRef}
        offset={bottom + actsHeight}
      />
    </InsetDoor>
  );
}
