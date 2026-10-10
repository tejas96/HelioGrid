'use client';
import { useSession, useSignIn } from '@heliogrid/data/react';
import { doorView, googleLinkFrame, homeOf } from '@heliogrid/domain';
import {
  doorSwitchWords,
  googleLinkWords,
  homeTitle,
  numberStepWords,
  SIGN_IN,
  signInWords,
} from '@heliogrid/i18n';
import { useLanguageChoice, useTranslate } from '@heliogrid/i18n/react';
import {
  DoorCodeStep,
  DoorLanguage,
  DoorLinkStep,
  DoorNumberStep,
  DoorSwitch,
  SuccessDwell,
  useFormat,
} from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useGoogleReturn, useGoogleSheet } from './hooks/use-google-sheet';

/**
 * The front door on the web (`SCR-M01-01` at 1536): the two-field composition over the flow the
 * phone runs — `useSignIn` decides, `@heliogrid/i18n` speaks, this composes. It also serves Google's
 * return route, so the flow Google's page interrupted resumes in the same door. The success beat stays
 * mounted because the route's gate holds the door until the dwell is over.
 */
export function SignInScreen({ companySignupHref }: { companySignupHref: string }) {
  const t = useTranslate();
  const router = useRouter();
  const session = useSession();
  const { pack, date } = useFormat();
  const language = <DoorLanguage {...useLanguageChoice()} />;
  const signIn = useSignIn(pack, 'sign-in', useGoogleSheet());
  useGoogleReturn(signIn.returnFromGoogle);
  const road = {
    question: t(SIGN_IN.newCompany),
    label: t(SIGN_IN.createCompany),
    onPress: () => router.push(companySignupHref),
  };

  const view = doorView(session, signIn.state.step);
  /** The number step; `task` stands in its form's place while a switch is pending (`F4-37`). */
  const numberStep = (task?: ReactNode) => (
    <DoorNumberStep
      language={language}
      title={{ title: t(SIGN_IN.signIn), intro: t(SIGN_IN.intro) }}
      words={numberStepWords(t, {
        notice: signIn.notice,
        google: signIn.google,
        problem: signIn.state.phoneProblem,
        sending: signIn.sending,
      })}
      phone={signIn.state.phone}
      onPhone={signIn.typePhone}
      busy={signIn.busy}
      sending={signIn.sending}
      googleBusy={signIn.googleBusy}
      onPress={signIn.press}
      road={road}
      task={task}
    />
  );

  if (view === 'switch' && session.switch !== null) {
    const { heldWork, next } = session.switch;
    return numberStep(
      <DoorSwitch
        words={doorSwitchWords(t, {
          name: next.name,
          count: heldWork.count,
          date: date(heldWork.capturedAt),
        })}
        onConfirm={() => void session.completeSwitch()}
      />,
    );
  }
  if (view === 'done') {
    const home = homeOf(session.user);
    const destination = home === null ? t(SIGN_IN.companySetup) : homeTitle(t, home);
    return (
      <SuccessDwell title={t(SIGN_IN.youAreIn)} line={t(SIGN_IN.takingYouTo, { destination })} />
    );
  }
  if (view === 'code') {
    return (
      <DoorCodeStep
        language={language}
        words={signInWords(t, signIn.frame, signIn.state)}
        frame={signIn.frame}
        phone={signIn.state.phone}
        code={signIn.state.code}
        onCode={signIn.typeCode}
        busy={signIn.busy}
        googleBusy={signIn.googleBusy}
        onPress={signIn.press}
      />
    );
  }
  if (view === 'google-link') {
    const frame = googleLinkFrame(signIn.state);
    return (
      <DoorLinkStep
        language={language}
        words={googleLinkWords(
          t,
          frame,
          signIn.state.google?.email ?? '',
          signIn.state.phoneProblem,
        )}
        frame={frame}
        phone={signIn.state.phone}
        onPhone={signIn.typePhone}
        busy={signIn.busy}
        onPress={signIn.press}
      />
    );
  }
  return numberStep();
}
