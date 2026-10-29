import type { TranslatedText } from '@heliogrid/contracts';
/**
 * The words of a roles save that takes presets away (`SCR-M01-13` m-confirm, m-after) — authored
 * once for both platforms (Law 11). The confirm names every preset leaving and, in the grant line's
 * own clauses, what the person can no longer do (`T-M01-013` Decision 2A); the toast after it holds
 * the undo, and its line the way back once the toast has gone (brief decision 5).
 */

import {
  type AssignRolesRefusal,
  firstNameOf,
  type RoleChange,
  type RolePreset,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { assignRolesRefusalWords, presetClause } from './assign-roles';
import { joinAnd } from './list-join';
import { presetName } from './shell';
import { TEAM_ACTS } from './team-acts';

export const REMOVE_ROLES = {
  title: /*i18n*/ { id: 'Remove {list} from {first}?' },
  goOne: /*i18n*/ { id: 'Remove role' },
  goMany: /*i18n*/ { id: 'Remove roles' },
  lost: /*i18n*/ { id: 'Once saved, {first} can no longer {list}.' },
  backOne: /*i18n*/ { id: 'You can give it back at any time' },
  backMany: /*i18n*/ { id: 'You can give them back at any time' },
  backRest: /*i18n*/ { id: " — tick {list} on {first}'s row again." },
  removed: /*i18n*/ { id: '{list} removed from {name}' },
  againOne: /*i18n*/ { id: "Tick it again on {first}'s row whenever you like." },
  againMany: /*i18n*/ { id: "Tick them again on {first}'s row whenever you like." },
  undo: /*i18n*/ { id: 'Undo' },
};

/** The confirm's words, in the shape `TeamConfirm` draws with `look="roles"`. */
export interface RemoveRolesWords {
  readonly title: TranslatedText;
  readonly go: TranslatedText;
  readonly leave: TranslatedText;
  /** What the person can no longer do; absent when a kept preset covers every loss. */
  readonly body?: TranslatedText;
  /** The way back: a bold lead, then the rest of the sentence. */
  readonly note: { readonly lead: TranslatedText; readonly rest: TranslatedText };
}

/** `change` is `roleChange(before, after)`; only a change that removes something is confirmed. */
export function removeRolesWords(
  translate: Translator['t'],
  facts: { readonly name: string; readonly change: RoleChange },
): RemoveRolesWords {
  const first = firstNameOf(facts.name);
  const { removed, lost } = facts.change;
  const names = joinAnd(
    translate,
    removed.map((preset) => presetName(translate, preset)),
  );
  const one = removed.length === 1;
  return {
    title: translate(REMOVE_ROLES.title, { list: names, first }),
    go: translate(one ? REMOVE_ROLES.goOne : REMOVE_ROLES.goMany),
    leave: translate(TEAM_ACTS.cancel),
    ...(lost.length === 0
      ? {}
      : {
          body: translate(REMOVE_ROLES.lost, {
            first,
            list: joinAnd(
              translate,
              lost.map((preset) => presetClause(translate, preset)),
            ),
          }),
        }),
    note: {
      lead: translate(one ? REMOVE_ROLES.backOne : REMOVE_ROLES.backMany),
      rest: translate(REMOVE_ROLES.backRest, { list: names, first }),
    },
  };
}

/** The toast a landed removal raises, and the words of its *Undo*. */
export interface RolesRemovedToast {
  readonly tone: 'neutral';
  readonly title: TranslatedText;
  readonly description: TranslatedText;
  readonly undoLabel: TranslatedText;
}

export function rolesRemovedToast(
  translate: Translator['t'],
  facts: { readonly name: string; readonly removed: readonly RolePreset[] },
): RolesRemovedToast {
  const first = firstNameOf(facts.name);
  const one = facts.removed.length === 1;
  return {
    tone: 'neutral',
    title: translate(REMOVE_ROLES.removed, {
      list: joinAnd(
        translate,
        facts.removed.map((preset) => presetName(translate, preset)),
      ),
      name: facts.name,
    }),
    description: translate(one ? REMOVE_ROLES.againOne : REMOVE_ROLES.againMany, { first }),
    undoLabel: translate(REMOVE_ROLES.undo),
  };
}

/**
 * The toast an undo that did not land raises: the save's own refusal words (`m-error`), save that a
 * failed undo points at the row, not at a Save the closed editor no longer shows. When no one can
 * say whether it landed (F8-36) the words have no title, so their line leads alone.
 */
export function rolesUndoFailedToast(
  translate: Translator['t'],
  refusal: AssignRolesRefusal,
  facts: {
    readonly name: string;
    readonly removed: readonly RolePreset[];
    readonly companyName: string;
  },
): {
  readonly tone: 'danger';
  readonly title: TranslatedText;
  readonly description?: TranslatedText;
} {
  const first = firstNameOf(facts.name);
  const words = assignRolesRefusalWords(translate, refusal, {
    firstName: first,
    companyName: facts.companyName,
  });
  if (words.title === null) return { tone: 'danger', title: words.body };
  const description =
    refusal.kind === 'failed'
      ? translate(facts.removed.length === 1 ? REMOVE_ROLES.againOne : REMOVE_ROLES.againMany, {
          first,
        })
      : words.body;
  return { tone: 'danger', title: words.title, description };
}
