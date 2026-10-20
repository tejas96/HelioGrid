'use client';
import { useSetupInvite } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { setupInviteWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { SetupInviteTeam, ToastHost, useDesktopShell, useFormat, useToasts } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { settingsRowPath } from '../settings';
import { useInviteForm } from '../team';

/**
 * The invite step of setup on the web (`SCR-M01-07`, `M01-12`), drawn by the inside group's gate
 * for an owner whose company still owes it. The send and the step's writes are `useSetupInvite`'s,
 * the form `useInviteForm`'s; a send that did not go out is said in this step's own toast host.
 * *Open Team* leaves setup for Team.
 */
export function SetupInviteTeamScreen() {
  const { t } = useI18n();
  const { pack } = useFormat();
  const router = useRouter();
  const toasts = useToasts();
  const invite = useSetupInvite(pack);
  /* The held acts' height, told by the frame: under the breakpoint the toast stands on them, whatever
     their words wrap to; from it the acts sit in the task pane, not at the window's foot. */
  const [actsHeight, setActsHeight] = useState<number | undefined>(undefined);
  const held = useDesktopShell() === false;
  const { words, fields } = useInviteForm(invite, toasts.push, invite.skip);
  return (
    <>
      <SetupInviteTeam
        {...fields}
        leaving={invite.leaving}
        onActsHeight={setActsHeight}
        words={{ ...words, ...setupInviteWords(t) }}
        onSkip={() => void invite.skip()}
        onOpenTeam={() => {
          router.push(settingsRowPath(SETTINGS_SEGMENT.team));
          void invite.openTeam();
        }}
      />
      <ToastHost
        toasts={toasts.toasts}
        onDismiss={toasts.dismiss}
        offset={held ? actsHeight : undefined}
      />
    </>
  );
}
