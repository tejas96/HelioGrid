import { createInvitationSchema } from '@heliogrid/contracts';
import {
  type FormatPack,
  INVITATION_EXPIRY_DAYS,
  INVITATIONS_PER_TENANT_PER_DAY,
  type InviteRefusal,
  nationalNumber,
  phoneDigitsMismatch,
  ROLE_PRESETS,
  type RolePreset,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { type ExplainerWords, explainerPagerWords } from './explainer';
import { presetAbility } from './role-presets';
import { presetName, SHELL } from './shell';
import { SIGN_IN } from './sign-in';
import { REQUIRED_FIELD } from './validation';

/**
 * Invite Teammate's words (`SCR-M01-07`), in both lives — Team's editor and the setup step. Every
 * word of the screen is here (the RFC's part a), so the parts that draw the refusals and the setup
 * step add no catalog entries.
 */
const INVITE = {
  title: /*i18n*/ { id: 'Invite someone' },
  inviteTeammate: /*i18n*/ { id: 'Invite teammate' },
  inviteFirst: /*i18n*/ { id: 'Invite your first teammate' },
  name: /*i18n*/ { id: 'Their name' },
  namePlaceholder: /*i18n*/ { id: 'Anjali Kulkarni' },
  phone: /*i18n*/ { id: 'Their phone number' },
  phoneHelper: /*i18n*/ {
    id: 'HelioGrid sends the message to this number — it does not come from your phone.',
  },
  rolesHeading: /*i18n*/ { id: 'What can they do?' },
  rolesGroup: /*i18n*/ { id: 'Roles for this invite' },
  rolesAskLabel: /*i18n*/ { id: 'About roles' },
  rolesAskTitle: /*i18n*/ { id: 'Roles' },
  rolesAskPick: /*i18n*/ {
    id: 'Pick at least one role. Someone invited with no role would sign in to an empty app.',
  },
  rolesAskMore: /*i18n*/ { id: 'More than one is fine, and roles can change later on Team.' },
  noRole: /*i18n*/ {
    id: 'Tick at least one role before sending — an invite with none would open an empty app.',
  },
  send: /*i18n*/ { id: 'Send invite' },
  cancel: /*i18n*/ { id: 'Cancel' },
  skip: /*i18n*/ { id: 'Skip for now' },
  continueSetup: /*i18n*/ { id: 'Continue setup' },
  openTeam: /*i18n*/ { id: 'Open Team' },
  differentNumber: /*i18n*/ { id: 'Use a different number' },
  lasts: /*i18n*/ {
    id: 'Invite lasts {days, plural, one {# day} other {# days}} · cancel it from Team',
  },
  afterYouSend: /*i18n*/ { id: 'After you send' },
  stepMessage: /*i18n*/ { id: 'HelioGrid messages their phone' },
  stepMessageLine: /*i18n*/ { id: 'Not from your number' },
  stepLasts: /*i18n*/ {
    id: 'The invite works for {days, plural, one {# day} other {# days}}',
  },
  stepLastsLine: /*i18n*/ { id: 'Cancel it on Team' },
  stepJoin: /*i18n*/ { id: 'They join with the roles you pick' },
  alreadyMember: /*i18n*/ { id: 'This number is already on your team' },
  alreadyInvited: /*i18n*/ { id: 'This number already has an invite waiting' },
  alreadyInvitedLine: /*i18n*/ {
    id: 'Nothing to send — to invite this number again, cancel the pending invite on Team.',
  },
  notCovered: /*i18n*/ { id: 'We can’t send invites to this number — check it or use another.' },
  cap: /*i18n*/ {
    id: '{cap} invites in the last 24 hours — the limit for one company',
  },
  capLine: /*i18n*/ { id: 'Each invite counts for 24 hours from when it was sent.' },
  forbidden: /*i18n*/ { id: 'You can no longer invite people to this company.' },
  nameTooLong: /*i18n*/ { id: 'A name can have up to {max} characters.' },
  notSent: /*i18n*/ { id: 'The invite wasn’t sent. Try again.' },
} as const;

/** The longest name an invite carries — the contract's, never a second number. */
const NAME_MAX = longestName();

function longestName(): number {
  const max = createInvitationSchema.shape.inviteeName.maxLength;
  if (max === null) throw new Error('createInvitationSchema.inviteeName has no maximum length');
  return max;
}

/** One preset as the role list draws it: its name and what it can do. */
export interface InviteRoleWords {
  readonly value: RolePreset;
  readonly title: string;
  readonly description: string;
}

/** The invite form's words, both lives; each screen places them. */
export interface InviteWords {
  readonly title: string;
  readonly inviteTeammate: string;
  readonly inviteFirst: string;
  readonly name: string;
  readonly namePlaceholder: string;
  readonly phone: string;
  readonly phoneHelper: string;
  readonly rolesHeading: string;
  readonly rolesGroup: string;
  readonly rolesAsk: ExplainerWords & ReturnType<typeof explainerPagerWords>;
  readonly noRole: string;
  readonly send: string;
  readonly cancel: string;
  /** The editor's close control, spoken. */
  readonly close: string;
  readonly lasts: string;
  /** Why the send did not go out, when nothing usable came back. */
  readonly failed: string;
  /** The twelve presets in F2's order (`ROLE_PRESETS`). */
  readonly roles: readonly InviteRoleWords[];
  /** The phone field's answer to a number with the wrong count of digits for this market. */
  digitsMismatch(typed: number, needed: number): string;
  /** The phone field's answer to a number nothing can be sent to. */
  readonly notCovered: string;
  /** The phone field's answer when nothing was typed — the name field's words for the same. */
  readonly required: string;
  /** The name field's answer past the contract's longest name. */
  readonly nameTooLong: string;
  /** A refusal the form draws in place of the send: its title and the line under it, if any. */
  refusal(refusal: InviteRefusal): { readonly title: string; readonly body: string | null };
  readonly differentNumber: string;
  /** The toast when the reader no longer invites (a 403). */
  readonly forbidden: string;
}

export function inviteWords(translate: Translator['t']): InviteWords {
  return {
    title: translate(INVITE.title),
    inviteTeammate: translate(INVITE.inviteTeammate),
    inviteFirst: translate(INVITE.inviteFirst),
    name: translate(INVITE.name),
    namePlaceholder: translate(INVITE.namePlaceholder),
    phone: translate(INVITE.phone),
    phoneHelper: translate(INVITE.phoneHelper),
    rolesHeading: translate(INVITE.rolesHeading),
    rolesGroup: translate(INVITE.rolesGroup),
    rolesAsk: {
      label: translate(INVITE.rolesAskLabel),
      title: translate(INVITE.rolesAskTitle),
      pages: [translate(INVITE.rolesAskPick), translate(INVITE.rolesAskMore)],
      ...explainerPagerWords(translate),
    },
    noRole: translate(INVITE.noRole),
    send: translate(INVITE.send),
    cancel: translate(INVITE.cancel),
    close: translate(SHELL.close),
    lasts: translate(INVITE.lasts, { days: INVITATION_EXPIRY_DAYS }),
    failed: translate(INVITE.notSent),
    roles: ROLE_PRESETS.map((preset) => ({
      value: preset,
      title: presetName(translate, preset),
      description: presetAbility(translate, preset),
    })),
    digitsMismatch: (typed, needed) => translate(SIGN_IN.digitsMismatch, { typed, needed }),
    notCovered: translate(INVITE.notCovered),
    required: translate(REQUIRED_FIELD),
    nameTooLong: translate(INVITE.nameTooLong, { max: NAME_MAX }),
    refusal: (refusal) => refusalWords(translate, refusal),
    differentNumber: translate(INVITE.differentNumber),
    forbidden: translate(INVITE.forbidden),
  };
}

function refusalWords(
  translate: Translator['t'],
  refusal: InviteRefusal,
): { title: string; body: string | null } {
  switch (refusal) {
    case 'already_member':
      return { title: translate(INVITE.alreadyMember), body: null };
    case 'already_invited':
      return {
        title: translate(INVITE.alreadyInvited),
        body: translate(INVITE.alreadyInvitedLine),
      };
    case 'not_covered':
      return { title: translate(INVITE.notCovered), body: null };
    case 'cap':
      return {
        title: translate(INVITE.cap, { cap: INVITATIONS_PER_TENANT_PER_DAY }),
        body: translate(INVITE.capLine),
      };
  }
}

/**
 * One field's answer to a press (`InviteForm`'s binder): the name's in the form's translated words,
 * the number's in the door's (`phoneDigitsMismatch`, `SIGN_IN.digitsMismatch`) — an empty one as
 * the name's empty field, one whose count is right as a number nothing can be sent to — and the roles' as the refusal over the list (F2-21).
 */
export function inviteFieldWords(
  words: InviteWords,
  pack: FormatPack,
  /* A form names an array's items too (`roles.0`); any of them answers as the list. */
  field: 'inviteeName' | 'phoneE164' | 'roles' | `roles.${number}`,
  state: { readonly value: unknown; readonly error: { readonly message?: string } | undefined },
): { error: string | undefined } {
  if (state.error === undefined) return { error: undefined };
  if (field === 'roles' || field.startsWith('roles.')) return { error: words.noRole };
  if (field === 'inviteeName') {
    const name = typeof state.value === 'string' ? state.value.trim() : '';
    if (name === '') return { error: words.required };
    return { error: name.length > NAME_MAX ? words.nameTooLong : state.error.message };
  }
  const phone = typeof state.value === 'string' ? state.value : '';
  if (nationalNumber(pack, phone) === '') return { error: words.required };
  const problem = phoneDigitsMismatch(pack, phone);
  return {
    error:
      problem === null ? words.notCovered : words.digitsMismatch(problem.typed, problem.needed),
  };
}
