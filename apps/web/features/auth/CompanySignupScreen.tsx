'use client';
import { createTenantSchema } from '@heliogrid/contracts';
import {
  type CompanySignup,
  failureOf,
  type SignIn,
  useCompanySignup,
  useSession,
  useSessionPhase,
  useSignIn,
  useSteerDroppedOnEdit,
} from '@heliogrid/data/react';
import { homeOf, type SessionUser, signupView } from '@heliogrid/domain';
import { fieldBinder, useZodForm } from '@heliogrid/forms';
import {
  COMPANY_SIGNUP,
  companyFacts,
  companyFieldWords,
  companyStepWords,
  explainerPagerWords,
  homeTitle,
  knownNumberWords,
  numberStepWords,
  requestSentWords,
  SIGN_IN,
  signInWords,
  signupExplainers,
  signupStepsWords,
} from '@heliogrid/i18n';
import { useLanguageChoice, useTranslate } from '@heliogrid/i18n/react';
import {
  DoorCodeStep,
  DoorLanguage,
  DoorNumberStep,
  SignupCompanyStep,
  SignupKnownNumber,
  SignupRequestSent,
  SignupSteps,
  SuccessDwell,
  useFormat,
} from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { HOME_ROUTE, LOGIN_ROUTE } from './constants';
import { keptReturnPath } from './return-path';
import { UnreachableScreen } from './UnreachableScreen';

/**
 * Company signup on the web (`SCR-M01-02` at 1536): the number, the code, then three fields, over
 * the flow `T-M01-036` landed and the door's two-field composition. The open group holds no gate:
 * the screen opens to a new number before any session exists and to a verified number
 * without a company (`M01-10`). Which panel shows is `signupView`'s, over the join steer
 * `useCompanySignup` holds (`M01-09`); this composes, and on the
 * `done` view sends a person who has a company to the link they opened signed out (`M01-61`), else
 * to their home, once the session phase is signed in (`M01-08`) — at once for an owner who arrives
 * signed in, after the beat for a known number entered here.
 */
export function CompanySignupScreen() {
  const t = useTranslate();
  const language = <DoorLanguage {...useLanguageChoice()} />;
  const router = useRouter();
  const session = useSession();
  const phase = useSessionPhase();
  const { pack } = useFormat();
  const signIn = useSignIn(pack, 'signup');
  const signup = useCompanySignup();
  const view = signupView(session, signIn.state.step, signup.steer);
  const sendHome = view === 'done' && phase === 'signedIn';

  useEffect(() => {
    if (sendHome) router.replace(keptReturnPath() ?? HOME_ROUTE);
  }, [sendHome, router]);

  // This route sits outside the gates, so it answers a boot check with no answer itself (`M01-07`).
  if (session.unreachable) return <UnreachableScreen />;

  /** The held account's session ends, and the number step comes back with the field cleared. */
  const leaveForAnotherNumber = () => {
    void session.leaveKnownAccount();
    signIn.press('change-number');
    signIn.typePhone('');
  };

  if (view === 'known' && session.known !== null) {
    return (
      <SignupKnownNumber
        language={language}
        words={knownNumberWords(t)}
        phoneE164={session.known.next.phoneE164}
        onEnter={session.enterKnownAccount}
        onLeave={leaveForAnotherNumber}
      />
    );
  }
  if (view === 'done') {
    const home = homeOf(session.user);
    const destination = home === null ? t(SIGN_IN.companySetup) : homeTitle(t, home);
    return (
      <SuccessDwell title={t(SIGN_IN.youAreIn)} line={t(SIGN_IN.takingYouTo, { destination })} />
    );
  }
  if (view === 'sent' && session.user !== null && signup.found !== null) {
    return (
      <SignupRequestSent
        language={language}
        words={requestSentWords(t, signup.found)}
        name={signup.typedName ?? session.user.name}
        phoneE164={session.user.phoneE164}
        onCreateInstead={() => void signup.createAnyway()}
      />
    );
  }
  if ((view === 'company' || view === 'join') && session.user !== null) {
    return (
      <SignupDetailsStep
        user={session.user}
        restored={session.restored}
        joining={view === 'join'}
        signup={signup}
      />
    );
  }
  if (view === 'code') {
    return (
      <DoorCodeStep
        language={language}
        taskMeasure="steps"
        lead={<SignupSteps words={signupStepsWords(t)} current={1} />}
        words={signInWords(t, signIn.frame, signIn.state, {
          verify: COMPANY_SIGNUP.verifyAndContinue,
          explainer: signupExplainers(t).whatTheCodeDoes,
        })}
        frame={signIn.frame}
        phone={signIn.state.phone}
        code={signIn.state.code}
        onCode={signIn.typeCode}
        busy={signIn.busy}
        googleBusy={signIn.googleBusy}
        onPress={signIn.press}
        helper={t(COMPANY_SIGNUP.codeHelper)}
      />
    );
  }
  return <SignupNumberStep signIn={signIn} onSignIn={() => router.push(LOGIN_ROUTE)} />;
}

/**
 * Step 3 — the three fields over the verified number, and the one write this screen owns
 * (`M01-01`). The form holds only its fields; the write, the steer and their waits are
 * `useCompanySignup`'s, and every word is `companyStepWords`'. Each field is bound alone
 * (`fieldBinder`), so a keystroke re-renders one input and never this step.
 */
function SignupDetailsStep({
  user,
  restored,
  joining,
  signup,
}: {
  user: SessionUser;
  restored: boolean;
  /** The view is `join` (`signupView`): the steer replaces the primary. */
  joining: boolean;
  signup: CompanySignup;
}) {
  const t = useTranslate();
  const format = useFormat();
  const language = <DoorLanguage {...useLanguageChoice()} />;
  const form = useZodForm(createTenantSchema, {
    defaultValues: { companyName: '', ownerName: user.name, city: '' },
  });
  useSteerDroppedOnEdit(signup, form.watch);
  const steered = joining ? signup.found : null;
  const writing = signup.creation === 'creating';
  const sending = signup.requesting === 'sending';
  const { helpers, ...words } = companyStepWords(t, {
    restored,
    writing,
    failure: failureOf(signup.creation),
    fieldRefused: form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0,
    steer:
      steered === null
        ? null
        : {
            company: steered,
            groupedPhone: format.phone(user.phoneE164),
            failure: failureOf(signup.requesting),
          },
  });
  return (
    <SignupCompanyStep
      language={language}
      words={words}
      phoneE164={user.phoneE164}
      bind={fieldBinder(form.control, (name, field) =>
        companyFieldWords(t, name, { helpers, ...field }),
      )}
      facts={writing || sending ? companyFacts(t, form.getValues()) : null}
      busy={writing || signup.checking || sending}
      onCreate={form.handleSubmit((values) => void signup.submit(values))}
      onRequestToJoin={() => void signup.requestToJoin()}
      onCreateAnyway={() => void signup.createAnyway()}
    />
  );
}

/** Step 1 — the number, under the step header, with the road back to the front door. */
function SignupNumberStep({ signIn, onSignIn }: { signIn: SignIn; onSignIn: () => void }) {
  const t = useTranslate();
  const language = <DoorLanguage {...useLanguageChoice()} />;
  return (
    <DoorNumberStep
      language={language}
      taskMeasure="steps"
      lead={<SignupSteps words={signupStepsWords(t)} current={0} />}
      title={{
        title: t(COMPANY_SIGNUP.createYourCompany),
        intro: t(COMPANY_SIGNUP.intro),
        explainer: { ...signupExplainers(t).whatSignupAsks, ...explainerPagerWords(t) },
      }}
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
      helper={t(COMPANY_SIGNUP.numberHelper)}
      road={{
        question: t(COMPANY_SIGNUP.alreadyOnHelioGrid),
        label: t(COMPANY_SIGNUP.signInInstead),
        onPress: onSignIn,
      }}
    />
  );
}
