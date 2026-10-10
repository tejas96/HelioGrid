'use client';
import { useSessionPhase } from '@heliogrid/data/react';
import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, DoorFrame, DoorTitle } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { LanguageControl } from './components/LanguageControl';
import { HOME_ROUTE, LOGIN_ROUTE } from './constants';

/**
 * An address no route serves (`SCR-M01-01` `m-not-found`, `d-not-found`): what happened, in the
 * reader's language, under the front door's header, and one way home — sign in when signed out,
 * the home when signed in. A door the shell does not offer is the shell's own `ShellNotFoundScreen`.
 */
export function NotFoundScreen() {
  const t = useTranslate();
  const router = useRouter();
  const signedIn = useSessionPhase() === 'signedIn';
  return (
    <DoorFrame
      trailing={<LanguageControl />}
      column="centred"
      identity={<DoorTitle title={t(SHELL.notFound)} />}
    >
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={() => router.push(signedIn ? HOME_ROUTE : LOGIN_ROUTE)}
      >
        {t(signedIn ? SHELL.goToHome : SHELL.goToSignIn)}
      </Button>
    </DoorFrame>
  );
}
