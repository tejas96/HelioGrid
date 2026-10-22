import {
  INITIAL_INVITE_LANDING,
  type InviteLandingEvent,
  inviteLandingFrame,
  inviteLandingReducer,
  type UiLanguage,
} from '@heliogrid/domain';
import { createTranslator, inviteLandingWords } from '@heliogrid/i18n';
import { InviteLanding } from '@heliogrid/ui';
import { useEffect, useReducer, useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * The landing as its screen holds it, at the frame `events` lead to, its words `inviteLandingWords`
 * in the reader's language. Each press goes through the reducer and writes its name to `pressed`,
 * where a spec reads it.
 */
export function InviteLandingAt({
  reader,
  events,
  later = [],
}: {
  reader: UiLanguage;
  events: readonly InviteLandingEvent[];
  /** Answers that arrive after the mount, as the read's does on a page that opens loading. */
  later?: readonly InviteLandingEvent[];
}) {
  const [state, dispatch] = useReducer(
    inviteLandingReducer,
    events.reduce(inviteLandingReducer, INITIAL_INVITE_LANDING),
  );
  const [pressed, setPressed] = useState('');
  useEffect(() => {
    for (const event of later) dispatch(event);
  }, [later]);
  const frame = inviteLandingFrame(state);
  const { cooldownLeft, triesLeft } = state.code;
  return (
    <div lang={reader}>
      <InviteLanding
        language={<span>{reader}</span>}
        words={inviteLandingWords(READERS[reader].t, frame, state.invite, {
          cooldownLeft,
          triesLeft,
        })}
        frame={frame}
        phone={state.invite?.phoneE164 ?? null}
        code={state.code.code}
        onCode={(code) => dispatch({ type: 'code-typed', code })}
        onPress={(control) => {
          setPressed(control);
          if (control === 'verify' || control === 'resend' || control === 'try-again')
            dispatch({ type: control });
          /* The ask answers at once here, as the api's does on a run-out link. */
          if (control === 'ask') {
            dispatch({ type: 'ask' });
            dispatch({ type: 'ask-ended', outcome: 'asked' });
          }
        }}
        onSignIn={() => setPressed('sign-in')}
      />
      <output data-testid="pressed">{pressed}</output>
    </div>
  );
}
