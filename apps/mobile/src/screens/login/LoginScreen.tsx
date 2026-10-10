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
  type DoorLinkStepProps,
  DoorNumberStep,
  DoorSwitch,
  SuccessDwell,
  useFormat,
} from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { openGoogle } from '../../auth/google-sign-in';
import { InsetDoor } from '../shared/InsetDoor';
import { useHardwareBack } from './hooks/use-hardware-back';

/**
 * The front door (`SCR-M01-01`): phone, then code, then the success beat — which stays mounted
 * for `DONE_DWELL_MS` because the navigator swaps groups only after the dwell (`phase.tsx`).
 * The flow is `useSignIn`'s and the session's; this composes.
 */
export function LoginScreen() {
  const t = useTranslate();
  const navigation = useNavigation();
  const session = useSession();
  const { pack, date } = useFormat();
  const language = <DoorLanguage {...useLanguageChoice()} />;
  const signIn = useSignIn(pack, 'sign-in', openGoogle);
  const road = {
    question: t(SIGN_IN.newCompany),
    label: t(SIGN_IN.createCompany),
    onPress: () => navigation.navigate('CompanySignup'),
  };

  const view = doorView(session, signIn.state.step);
  const numberStep = () => (
    <InsetDoor>
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
      />
    </InsetDoor>
  );

  if (view === 'switch' && session.switch !== null) {
    const { heldWork, next } = session.switch;
    return (
      <>
        {numberStep()}
        <DoorSwitch
          words={doorSwitchWords(t, {
            name: next.name,
            count: heldWork.count,
            date: date(heldWork.capturedAt),
          })}
          onConfirm={() => void session.completeSwitch()}
        />
      </>
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
      <InsetDoor>
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
      </InsetDoor>
    );
  }
  if (view === 'google-link') {
    const frame = googleLinkFrame(signIn.state);
    return (
      <LinkStep
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

/**
 * The link step under the phone's insets. Android's back button takes its way back: the step is a
 * state of the door, not a route, so the navigator would close the app.
 */
function LinkStep(props: DoorLinkStepProps) {
  useHardwareBack(() => props.onPress('use-number'));
  return (
    <InsetDoor>
      <DoorLinkStep {...props} />
    </InsetDoor>
  );
}
