import type { InviteRefusal } from '@heliogrid/domain';
import type { Ref } from 'react';
import type {
  InviteFieldBinder,
  InviteFormWords,
  InviteRole,
} from '../InviteForm/InviteForm.types';
import type { FocusHandle } from '../SearchField/SearchField.types';

/** One step the brand pane says comes after a send: what happens, and the line under it. */
export interface SetupInviteAfterStep {
  title: string;
  line: string | null;
}

/**
 * Every word the setup step draws, over the form's; `@heliogrid/i18n`'s `inviteWords` and
 * `setupInviteWords` write them.
 */
export interface SetupInviteTeamWords extends InviteFormWords {
  title: string;
  send: string;
  skip: string;
  /** The way on at the cap, where nothing can be sent. */
  continueSetup: string;
  /** The refusal banner's act. */
  openTeam: string;
  differentNumber: string;
  /** *Invite lasts 7 days · cancel it from Team*, under the acts at 375 — at 1536 the brand pane says it. */
  lasts: string;
  /** The brand pane at 1536: its heading, and what happens once the invite is sent. */
  afterYouSend: {
    heading: string;
    message: SetupInviteAfterStep;
    lasts: SetupInviteAfterStep;
    join: SetupInviteAfterStep;
  };
}

/**
 * The invite step of setup (`SCR-M01-07` m-default, d-default and the refusals, `M01-12`): the
 * one invite form in the onboarding frame, with *Skip for now* beside *Send invite*. A number
 * already on Team swaps the send for *Use a different number*; at the cap only *Continue setup*
 * is left. The banner's *Open Team* leaves the step for Team.
 */
export interface SetupInviteTeamProps {
  bind: InviteFieldBinder;
  words: SetupInviteTeamWords;
  /** The twelve presets in F2's order. */
  roles: readonly InviteRole[];
  /** The send is out: *Send invite* shows it is working. */
  sending: boolean;
  /** The step's answer is being recorded: every act holds, and *Continue setup* shows it is working. */
  leaving: boolean;
  /** As `InviteFormProps.presses`. */
  presses?: number;
  /** As `InviteFormProps.refusal`; the acts follow it. */
  refusal?: InviteRefusal | null;
  onSend: () => void;
  /** *Skip for now*, and *Continue setup* at the cap: leaves the step for good. */
  onSkip: () => void;
  onOpenTeam: () => void;
  /** Clears the number, takes the refusal down and sends the focus to the number. */
  onDifferentNumber: () => void;
  phoneRef?: Ref<FocusHandle>;
  /** As `DoorFrameProps.onFooterHeight`: the held acts' height, so the step's toast clears them. */
  onActsHeight?: (height: number) => void;
}
