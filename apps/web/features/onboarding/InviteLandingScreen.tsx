'use client';
import { useFirstRunOwed, useInviteLanding, useSessionPhase } from '@heliogrid/data/react';
import { inviteLandingWords } from '@heliogrid/i18n';
import { useLanguageChoice, useTranslate } from '@heliogrid/i18n/react';
import { DoorLanguage, InviteLanding } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LOGIN_ROUTE, WELCOME_ROLE_ROUTE, WELCOME_ROUTE } from '../auth';

/**
 * The invite landing on the web (`SCR-M01-08`, `M01-13`) — also the phone's, in its browser, until
 * app links exist (brief ruling 16). Once the join admits the session the person goes on: a newly
 * named account to First-Run Profile (`SCR-M01-09`), anyone else straight to the role card
 * (`SCR-M01-10`), whose act opens their home.
 */
export function InviteLandingScreen({ token }: { token: string }) {
  const t = useTranslate();
  const router = useRouter();
  const phase = useSessionPhase();
  const { state, frame, typeCode, press } = useInviteLanding(token);
  const firstRunOwed = useFirstRunOwed();
  const inside = state.join === 'joined' && phase === 'signedIn';

  useEffect(() => {
    if (inside) router.replace(firstRunOwed() ? WELCOME_ROUTE : WELCOME_ROLE_ROUTE);
  }, [inside, router, firstRunOwed]);

  const { cooldownLeft, triesLeft } = state.code;
  return (
    <InviteLanding
      language={<DoorLanguage {...useLanguageChoice()} />}
      words={inviteLandingWords(t, frame, state.invite, { cooldownLeft, triesLeft })}
      frame={frame}
      phone={state.invite?.phoneE164 ?? null}
      code={state.code.code}
      onCode={typeCode}
      onPress={press}
      onSignIn={() => router.push(LOGIN_ROUTE)}
    />
  );
}
