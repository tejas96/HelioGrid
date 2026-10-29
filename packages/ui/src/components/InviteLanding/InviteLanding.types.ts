import type { TranslatedText } from '@heliogrid/contracts';
import type { InviteDeclineFrame, InviteLandingFrame, InviteLandingPress } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { TintedBlockProps } from '../TintedBlock/TintedBlock.types';

/** A centred state with its one act and the line under it (`m-empty`, `m-reinvite-requested`). */
export interface InviteLandingPlaceWords {
  title: TranslatedText;
  line: TranslatedText;
  act: TranslatedText;
  note: TranslatedText;
}

/** An in-page statement above the invite: the join or the ask failed, or the invite ran out. */
export interface InviteLandingBannerWords {
  tone: 'danger' | 'warning';
  title: TranslatedText;
  line: TranslatedText | null;
}

/** The decline on the live invite (brief decision 6): its control, its confirm, and why the last one did not go through. */
export interface InviteLandingDeclineWords {
  /** *This invite isn't for me*. */
  open: TranslatedText;
  title: TranslatedText;
  /** Both consequences and the way back: the sheet's body at 375, the dialog's description at 1536. */
  line: TranslatedText;
  keep: TranslatedText;
  go: TranslatedText;
  /** The door's words for a decline with no answer or a refusal (brief ruling 19); `null` when it has not failed. */
  refused: TranslatedText | null;
}

/** The decline's control and its confirm, drawn together wherever the control sits. */
export interface InviteDeclineProps {
  words: InviteLandingDeclineWords;
  decline: InviteDeclineFrame;
  onPress: (control: InviteLandingPress) => void;
}

/**
 * Every word the landing draws for the frame it is on; `@heliogrid/i18n`'s `inviteLandingWords`
 * writes them. `null` where the frame has no such part.
 */
export interface InviteLandingWords {
  /** The loading skeleton's spoken name. */
  loading: TranslatedText;
  /** Who invited, and the label under the name: *EPC Owner · {company}* (brief decision 3). */
  // biome-ignore lint/plugin/copy-prop-type: the inviter's name
  inviter: { name: string; label: TranslatedText } | null;
  title: TranslatedText | null;
  /** The invite card: its overline, the facts, and the line that names the way out. */
  facts: {
    label: TranslatedText;
    rolesLabel: TranslatedText;
    roles: TranslatedText[];
    phoneLabel: TranslatedText;
    line: TranslatedText;
  } | null;
  banner: InviteLandingBannerWords | null;
  /** The code family's own block — a cap, the lock, a send that failed — read as the door reads it. */
  block: Pick<TintedBlockProps, 'tone' | 'title'> | null;
  codeLabel: TranslatedText;
  codeHelper: TranslatedText | null;
  codeError: TranslatedText | null;
  primary: TranslatedText | null;
  /** The resend, live. */
  resend: TranslatedText | null;
  /** The resend gap, in the waiting control's own label and its spoken name. */
  wait: { label: TranslatedText; spoken: TranslatedText } | null;
  /** The line under the expired frame's act. */
  foot: TranslatedText | null;
  /** The centred state that names no live invite: the link is gone, the ask was sent, or it was declined. */
  place: InviteLandingPlaceWords | null;
  /** The read got no answer: nothing about the invite is known. */
  loadError: { title: TranslatedText; line: TranslatedText } | null;
  decline: InviteLandingDeclineWords | null;
}

/**
 * The invite landing (`SCR-M01-08`, `M01-13`): who invited, to which company, the roles and the
 * number the code went to, the code that came by itself, and one act that joins. The onboarding
 * two-pane at 1536 — the invite in the context pane, the code task centred in the task pane — and
 * one column at 375, its actions following the content (brief rulings 13, 14). The structure is
 * `domain`'s frame, the words `i18n`'s; this draws them and raises the presses.
 */
export interface InviteLandingProps {
  /** The language control: nobody is signed in yet (brief decision 7). */
  language: ReactNode;
  words: InviteLandingWords;
  frame: InviteLandingFrame;
  /** The number the invite is keyed to, in E.164; `null` before the invite is read. */
  phone: string | null;
  code: string;
  onCode: (code: string) => void;
  onPress: (control: InviteLandingPress) => void;
  /** *Sign in to HelioGrid* from a state that names no live invite. */
  onSignIn: () => void;
}
