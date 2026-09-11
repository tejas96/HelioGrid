import type { SignInDoor } from '@heliogrid/data';
import type { SignIn } from '@heliogrid/data/react';
import { SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, PhoneField, Text } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { DoorFrame } from './DoorFrame';
import { LanguageControl } from './LanguageControl';

/** The door at the foot of the number step: the question, the road, and where it goes. */
export interface DoorRoad {
  readonly question: string;
  readonly label: string;
  readonly onPress: () => void;
}

/**
 * Frame 1 of either door — the number as it opens, and its answers on the field. The two doors
 * share the field and the primary and differ in their words: the title, the intro and the note
 * in the identity half, the road at the foot (`SCR-M01-02`). `door` names which door this is, for the task column's measure. `lead` is the signup's step header
 * atop the task column, absent on the front door. `task` replaces the form when the session holds
 * a pending switch (`F4-37`): on the desktop the switch is the task column's content.
 */
export function PhoneStep({
  signIn,
  door,
  lead,
  title,
  intro,
  note,
  road,
  task,
}: {
  signIn: SignIn;
  door?: SignInDoor;
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
  return (
    <DoorFrame
      trailing={<LanguageControl />}
      door={door}
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
