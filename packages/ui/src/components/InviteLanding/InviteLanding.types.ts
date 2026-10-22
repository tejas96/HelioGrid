import type { InviteLandingFrame, InviteLandingPress } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { TintedBlockProps } from '../TintedBlock/TintedBlock.types';

/** A centred state with its one act and the line under it (`m-empty`, `m-reinvite-requested`). */
export interface InviteLandingPlaceWords {
  title: string;
  line: string;
  act: string;
  note: string;
}

/** An in-page statement above the invite: the join or the ask failed, or the invite ran out. */
export interface InviteLandingBannerWords {
  tone: 'danger' | 'warning';
  title: string;
  line: string | null;
}

/**
 * Every word the landing draws for the frame it is on; `@heliogrid/i18n`'s `inviteLandingWords`
 * writes them. `null` where the frame has no such part.
 */
export interface InviteLandingWords {
  /** The loading skeleton's spoken name. */
  loading: string;
  /** Who invited, and the label under the name: *EPC Owner · {company}* (brief decision 3). */
  inviter: { name: string; label: string } | null;
  title: string | null;
  /** The invite card: its overline, the facts, and the line that names the way out. */
  facts: {
    label: string;
    rolesLabel: string;
    roles: string[];
    phoneLabel: string;
    line: string;
  } | null;
  banner: InviteLandingBannerWords | null;
  /** The code family's own block — a cap, the lock, a send that failed — read as the door reads it. */
  block: Pick<TintedBlockProps, 'tone' | 'title'> | null;
  codeLabel: string;
  codeHelper: string | null;
  codeError: string | null;
  primary: string | null;
  /** The resend, live. */
  resend: string | null;
  /** The resend gap, in the waiting control's own label and its spoken name. */
  wait: { label: string; spoken: string } | null;
  /** The line under the expired frame's act. */
  foot: string | null;
  /** The centred state that names no invite: the link is gone, or the ask was sent. */
  place: InviteLandingPlaceWords | null;
  /** The read got no answer: nothing about the invite is known. */
  loadError: { title: string; line: string } | null;
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
