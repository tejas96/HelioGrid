import type { SignIn } from '@heliogrid/data/react';
import type { DoorRoad } from '@heliogrid/domain';
import { phoneGoogleWords, SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  DoorFrame,
  type DoorTaskMeasure,
  PhoneField,
  Text,
  TextDivider,
  TintedBlock,
} from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { LanguageControl } from './LanguageControl';

/**
 * Frame 1 of either door — the number as it opens, and its answers on the field. The two doors
 * share the field and the primary and differ in their words: the title, the intro and the note
 * in the identity half, the road at the foot (`SCR-M01-02`). `taskMeasure` is the task column's
 * measure, the signup's `steps`. `lead` is the signup's step header atop the task column, absent
 * on the front door. `task` replaces the form when the session holds a pending switch (`F4-37`):
 * on the desktop the switch is the task column's content.
 */
export function PhoneStep({
  signIn,
  taskMeasure,
  lead,
  title,
  intro,
  note,
  road,
  task,
}: {
  signIn: SignIn;
  taskMeasure?: DoorTaskMeasure;
  lead?: ReactNode;
  title: string;
  intro: string;
  note?: string;
  road: DoorRoad;
  task?: ReactNode;
}) {
  const t = useTranslate();
  const { state, busy } = signIn;
  const problem = state.phoneProblem;
  const sending = state.pending?.kind === 'request';
  const google = signIn.google === null ? null : phoneGoogleWords(t, signIn.google);
  return (
    <DoorFrame
      trailing={<LanguageControl />}
      taskMeasure={taskMeasure}
      identity={
        <div className="hg-door-title hg-door-intro">
          <Text variant="h1">{title}</Text>
          <Text variant="body-lg" color="secondary">
            {intro}
          </Text>
          {note === undefined ? null : (
            <Text variant="body-sm" color="secondary">
              {note}
            </Text>
          )}
        </div>
      }
    >
      {task ?? (
        <>
          {lead}
          {google?.failed ? <TintedBlock {...google.failed} /> : null}
          <div className="hg-door-form">
            <PhoneField
              label={t(SIGN_IN.mobileNumber)}
              value={state.phone}
              onChange={signIn.typePhone}
              readOnly={busy}
              announceError
              autoFocus
              error={
                problem === null
                  ? undefined
                  : t(SIGN_IN.digitsMismatch, { typed: problem.typed, needed: problem.needed })
              }
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={sending}
              disabled={busy && !sending}
              onClick={() => signIn.press('send')}
            >
              {sending ? t(SIGN_IN.sendingTheCode) : t(SIGN_IN.sendCode)}
            </Button>
            {google === null ? null : (
              <div className="hg-door-google">
                <TextDivider label={google.or} />
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  loading={signIn.google?.busy}
                  disabled={busy && !signIn.google?.busy}
                  spokenName={google.aria}
                  onClick={() => signIn.press('google')}
                >
                  {google.label}
                </Button>
              </div>
            )}
          </div>
          <div className="hg-door-signup">
            <Text variant="body-sm" color="secondary">
              {road.question}
            </Text>
            <Button variant="ghost" size="md" onClick={road.onPress}>
              {road.label}
            </Button>
          </div>
        </>
      )}
    </DoorFrame>
  );
}
