import {
  firstNameOf,
  type TeamAct,
  type TeamActNote,
  type TeamConfirmState,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { apiErrorMessageId, INTERNAL_ERROR } from './api-error';
import { SHELL } from './shell';

/** The Team row acts' words (`SCR-M01-12`), chosen once for both apps (Law 11). */
const ACT: Record<TeamAct, { id: string }> = {
  deactivate: /*i18n*/ { id: 'Deactivate' },
  revoke: /*i18n*/ { id: 'Revoke invite' },
  'invite-again': /*i18n*/ { id: 'Invite again' },
};

export const TEAM_ACTS = {
  actions: /*i18n*/ { id: 'Actions' },
  onlyOwner: /*i18n*/ { id: 'Only EPC Owner' },
  cancel: /*i18n*/ { id: 'Cancel' },
  deactivateTitle: /*i18n*/ { id: 'Deactivate {name}?' },
  deactivateGo: /*i18n*/ { id: 'Deactivate {first}' },
  deactivateBody: /*i18n*/ {
    id: '{first} loses access to {company}. Everything {first} did stays in {first}’s name.',
  },
  revokeTitle: /*i18n*/ { id: 'Revoke {name}’s invite?' },
  revokeBody: /*i18n*/ {
    id: 'The invite link stops working now. You can invite {first} again any time.',
  },
  refusedTitle: /*i18n*/ { id: 'Not done — {company} must keep one EPC Owner' },
  refusedBody: /*i18n*/ { id: '{name} stopped being an EPC Owner on another device.' },
  refusedReason: /*i18n*/ { id: 'Make someone else an EPC Owner first' },
  deactivated: /*i18n*/ { id: '{name} deactivated' },
  revoked: /*i18n*/ { id: 'Invite to {name} revoked' },
  revokedLine: /*i18n*/ { id: 'Inviting {first} again sends a new link.' },
} as const;

/** A row act as a screen reader hears it: the act's own visible words first, then the person (D291). */
const SPOKEN: Record<TeamAct, { id: string }> = {
  deactivate: /*i18n*/ { id: 'Deactivate {name}' },
  revoke: /*i18n*/ { id: 'Revoke invite for {name}' },
  'invite-again': /*i18n*/ { id: 'Invite again: {name}' },
};

/** A confirm's title, go button and sentence. */
export interface TeamAskWords {
  readonly title: string;
  readonly go: string;
  readonly body: string;
}

export interface TeamActWords {
  act(act: TeamAct): string;
  /** The act's accessible name, with the person in it — `Button`'s `spokenName`. */
  spoken(act: TeamAct, name: string): string;
  /** The table's act column, named for a screen reader only. */
  readonly actions: string;
  readonly onlyOwner: string;
  deactivate(name: string): TeamAskWords;
  revoke(name: string): TeamAskWords;
  /** Why an act was turned down, in the shipped words for its code; an unknown code says INTERNAL's. */
  turnedDown(code: string): string;
  /** The open confirm's words, or null while it is shut. */
  confirm(state: TeamConfirmState): TeamConfirmShown | null;
  /** The toast a settled act raises, or null when the moved list says it all. */
  toast(note: TeamActNote): TeamActToast | null;
}

/** What an open confirm says: its question and act, then either what the act does or the refusal. */
export interface TeamConfirmShown {
  readonly title: string;
  readonly go: string;
  readonly leave: string;
  readonly body?: string;
  readonly refusal?: { readonly title: string; readonly body: string | null };
  /** The go button is off on the refused form, with this route out. */
  readonly goOffReason?: string;
}

export interface TeamActToast {
  readonly tone: 'neutral' | 'danger';
  readonly title: string;
  readonly description?: string;
}

export function teamActWords(translate: Translator['t'], company: string): TeamActWords {
  const turnedDown = (code: string) =>
    translate({ id: apiErrorMessageId(code) ?? INTERNAL_ERROR.id });
  const deactivate = (name: string): TeamAskWords => {
    const first = firstNameOf(name);
    return {
      title: translate(TEAM_ACTS.deactivateTitle, { name }),
      go: translate(TEAM_ACTS.deactivateGo, { first }),
      body: translate(TEAM_ACTS.deactivateBody, { first, company }),
    };
  };
  const revoke = (name: string): TeamAskWords => ({
    title: translate(TEAM_ACTS.revokeTitle, { name }),
    go: translate(ACT.revoke),
    body: translate(TEAM_ACTS.revokeBody, { first: firstNameOf(name) }),
  });
  return {
    act: (act) => translate(ACT[act]),
    spoken: (act, name) => translate(SPOKEN[act], { name }),
    actions: translate(TEAM_ACTS.actions),
    onlyOwner: translate(TEAM_ACTS.onlyOwner),
    deactivate,
    revoke,
    turnedDown,
    confirm: (state) => {
      if (state.kind === 'shut') return null;
      const { name } = state.row;
      if (state.kind === 'refused') {
        const { go } = deactivate(name);
        return {
          title: translate(TEAM_ACTS.deactivateTitle, { name }),
          go,
          leave: translate(SHELL.close),
          refusal: {
            title: translate(TEAM_ACTS.refusedTitle, { company }),
            body:
              state.lostOwner === null
                ? null
                : translate(TEAM_ACTS.refusedBody, { name: state.lostOwner }),
          },
          goOffReason: translate(TEAM_ACTS.refusedReason),
        };
      }
      const asked = state.act === 'deactivate' ? deactivate(name) : revoke(name);
      return { ...asked, leave: translate(TEAM_ACTS.cancel) };
    },
    toast: (note) => {
      switch (note.kind) {
        case 'deactivated':
          return { tone: 'neutral', title: translate(TEAM_ACTS.deactivated, { name: note.name }) };
        case 'revoked':
          return {
            tone: 'neutral',
            title: translate(TEAM_ACTS.revoked, { name: note.name }),
            description: translate(TEAM_ACTS.revokedLine, { first: firstNameOf(note.name) }),
          };
        case 'turned-down':
          return { tone: 'danger', title: turnedDown(note.code) };
        case 'failed':
          return { tone: 'danger', title: turnedDown('INTERNAL') };
        case 'moved':
          return null;
      }
    },
  };
}
