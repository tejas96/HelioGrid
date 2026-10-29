import type { TranslatedText } from '@heliogrid/contracts';
import type { InviteRefusal, RolePreset } from '@heliogrid/domain';
import type { ReactElement, ReactNode, Ref } from 'react';
import type { ExplainerProps } from '../Explainer/Explainer.types';
import type { FocusHandle } from '../SearchField/SearchField.types';

/**
 * One invite field as its binding hands it over: what it holds, how it changes, and its answer to
 * a press — `@heliogrid/i18n`'s `inviteFieldWords` writes the words.
 */
export interface InviteFieldState<Value> {
  value: Value;
  onChange: (value: Value) => void;
  /** The field's own answer when *Send invite* is pressed; absent until it refuses. */
  error: TranslatedText | undefined;
}

/**
 * Binds one invite field to the screen's form, subscribing to that field alone: a controlled
 * native input whose value lags the keyboard drops characters, so a keystroke re-renders one input.
 * The names are the contract's (`createInvitationSchema`).
 */
export interface InviteFieldBinder {
  (
    name: 'inviteeName' | 'phoneE164',
    draw: (field: InviteFieldState<string>) => ReactElement,
  ): ReactElement;
  (name: 'roles', draw: (field: InviteFieldState<RolePreset[]>) => ReactElement): ReactElement;
}

/** One preset in the role list: its name and what it can do. */
export interface InviteRole {
  value: RolePreset;
  title: TranslatedText;
  description: TranslatedText;
}

/** Every word the form draws; `@heliogrid/i18n`'s `inviteWords` writes them. */
export interface InviteFormWords {
  name: TranslatedText;
  namePlaceholder: TranslatedText;
  phone: TranslatedText;
  phoneHelper: TranslatedText;
  rolesHeading: TranslatedText;
  /** The role list's spoken name. */
  rolesGroup: TranslatedText;
  /** The ask beside the heading (`F7-46`): why a role is needed, and that roles can change later. */
  rolesAsk: ExplainerProps;
  /** The refusal at the top of the role list when *Send invite* is pressed with none ticked (F2-21). */
  noRole: TranslatedText;
  /** A refusal the form draws in place of the send: its title and the line under it, if any. */
  refusal: (refusal: InviteRefusal) => {
    readonly title: TranslatedText;
    readonly body: TranslatedText | null;
  };
}

/**
 * Invite Teammate's form (`SCR-M01-07`): the name, the phone, and the twelve presets as a
 * multi-select `OptionCardGroup` (owner ruling D216). The same form in both lives — the setup step
 * and Team's editor; each host draws the acts around it.
 */
export interface InviteFormProps {
  bind: InviteFieldBinder;
  words: InviteFormWords;
  /** The twelve presets in F2's order. */
  roles: readonly InviteRole[];
  /**
   * `stacked` — one column (375, and the 480 panel at 1536). `wide` — the setup step's task pane at
   * 1536: name and phone side by side, the roles in three columns, and no line under the phone
   * (the brand pane says it).
   */
  layout?: 'stacked' | 'wide';
  /**
   * `section` — *What can they do?* is the step's h2 (`--fs-h3`). `quiet` — inside an editor whose
   * title is the heading: the line is body bold, not a heading.
   */
  heading?: 'section' | 'quiet';
  /**
   * How many times *Send invite* was pressed: each refused press brings the refusal into view again,
   * even when it was already showing and the person scrolled away from it. Web only — the phone's
   * sheet cannot be scrolled from inside it yet (D294).
   */
  presses?: number;
  /**
   * The api turned the send down (`inviteOutcome`): `already_member` and `already_invited` keep the
   * name and the number (no line under it) over an info banner and drop the role list; `not_covered`
   * puts its words on the number and keeps the roles; `cap` draws its banner alone. Null: the form.
   */
  refusal?: InviteRefusal | null;
  /** The banner's own act — the setup step's *Open Team*; Team's editor has none (owner ruling D4 A). */
  refusalAction?: ReactNode;
  /** Where *Use a different number* sends the focus. */
  phoneRef?: Ref<FocusHandle>;
}

/** The editor's own words, over the form's. */
export interface InviteEditorWords extends InviteFormWords {
  title: TranslatedText;
  send: TranslatedText;
  cancel: TranslatedText;
  /** The close control's spoken name. */
  close: TranslatedText;
  /** *Invite lasts 7 days · cancel it from Team*, centred under the acts. */
  lasts: TranslatedText;
  differentNumber: TranslatedText;
}

/**
 * The invite in Team's life (`SCR-M01-07` m-team, d-team): one editor over Team — a bottom sheet at
 * 375, a 480 side panel at 1536 (`F7-21`) — with *Cancel* and *Send invite* and the expiry under
 * them. Closing keeps nothing: the host resets its form.
 */
export interface InviteEditorProps {
  open: boolean;
  onClose: () => void;
  bind: InviteFieldBinder;
  words: InviteEditorWords;
  roles: readonly InviteRole[];
  /** The send is out: *Send invite* shows it is working. */
  sending: boolean;
  onSend: () => void;
  /** As `InviteFormProps.presses`. */
  presses?: number;
  /** As `InviteFormProps.refusal`: the foot follows it — *Cancel* · *Use a different number* for a number already on Team, *Cancel* alone at the cap. */
  refusal?: InviteRefusal | null;
  /** Clears the number, takes the refusal down and sends the focus to the number. */
  onDifferentNumber: () => void;
  phoneRef?: Ref<FocusHandle>;
}
