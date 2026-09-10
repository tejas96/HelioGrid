import type { SignIn } from '@heliogrid/data/react';
import { SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, PhoneField, Text } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { DoorFrame } from './DoorFrame';
import { LanguageControl } from './LanguageControl';

/**
 * Frame 1 — the door as it opens, and its answers on the field. `task` replaces the form when the
 * session holds a pending switch (`F4-37`): on the desktop the switch is the task column's content.
 */
export function PhoneStep({
  signIn,
  onCreateCompany,
  task,
}: {
  signIn: SignIn;
  onCreateCompany: () => void;
  task?: ReactNode;
}) {
  const t = useTranslate();
  const { state, busy } = signIn;
  const problem = state.phoneProblem;
  return (
    <DoorFrame
      trailing={<LanguageControl />}
      identity={
        <div className="hg-door-title hg-door-intro">
          <Text variant="h1">{t(SIGN_IN.signIn)}</Text>
          <Text variant="body-lg" color="secondary">
            {t(SIGN_IN.intro)}
          </Text>
        </div>
      }
    >
      {task ?? (
        <>
          <div className="hg-door-form">
            <PhoneField
              label={t(SIGN_IN.mobileNumber)}
              value={state.phone}
              onChange={signIn.typePhone}
              disabled={busy}
              announceError
              autoFocus
              error={
                problem === null
                  ? undefined
                  : t(SIGN_IN.digitsMismatch, { typed: problem.typed, needed: problem.needed })
              }
              helper={busy ? t(SIGN_IN.lockedWhileSending) : t(SIGN_IN.willSendBySms)}
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={busy}
              onClick={() => signIn.press('send')}
            >
              {busy ? t(SIGN_IN.sendingTheCode) : t(SIGN_IN.sendCode)}
            </Button>
          </div>
          <div className="hg-door-signup">
            <Text variant="body-sm" color="secondary">
              {t(SIGN_IN.newCompany)}
            </Text>
            <Button variant="ghost" size="md" onClick={onCreateCompany}>
              {t(SIGN_IN.createCompany)}
            </Button>
          </div>
        </>
      )}
    </DoorFrame>
  );
}
