/**
 * A deactivation's open leads (`SCR-M01-12`, `M02-30`): the words `TeamConfirm`'s reassign part says — how
 * many the person holds and who takes them — and the reason the moved leads' trail records.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { Read, TeamConfirmState } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { assignPickerWords } from './assign-picker';
import { SHELL } from './shell';

type T = Translator['t'];

const REASSIGN = {
  holds: /*i18n*/ { id: '{count, plural, one {Holds # open lead} other {Holds # open leads}}' },
  none: /*i18n*/ { id: 'No open leads to move.' },
  moveTo: /*i18n*/ { id: 'Move them to' },
  choose: /*i18n*/ { id: 'Choose who takes them' },
  stay: /*i18n*/ { id: 'Not moved, they stay with {name}.' },
  loading: /*i18n*/ { id: 'Reading their open leads' },
  failed: /*i18n*/ { id: "Couldn't read their open leads." },
  reason: /*i18n*/ { id: 'Deactivated' },
} as const;

/** `TeamConfirm`'s reassign words for deactivating `name`. */
export function deactivateReassignWords(t: T, name: string) {
  return {
    holds: (count: number) => t(REASSIGN.holds, { count }),
    none: t(REASSIGN.none),
    moveTo: t(REASSIGN.moveTo),
    choose: t(REASSIGN.choose),
    stay: t(REASSIGN.stay, { name }),
    loading: t(REASSIGN.loading),
    failed: t(REASSIGN.failed),
    retry: t(SHELL.tryAgain),
  };
}

/**
 * Why the leads moved, as the assignment trail records it (`M02-30`): a reason the person giving
 * them would type, so it is written in their language, as any typed reason is.
 */
export function deactivatedReason(t: T): TranslatedText {
  return t(REASSIGN.reason);
}

/**
 * The confirm's reassign part (`SCR-M01-12`) for `TeamActConfirm`: the open work as read, its words for the
 * person going, and the picker's words for how many leads it gives.
 */
export function confirmReassignOf<Facts extends { readonly open: Read<number> | null }>(
  t: T,
  screen: { readonly acts: { readonly confirm: TeamConfirmState }; readonly reassign: Facts },
) {
  const { confirm } = screen.acts;
  const { open } = screen.reassign;
  return {
    reassign: screen.reassign,
    reassignWords: deactivateReassignWords(t, confirm.kind === 'asking' ? confirm.row.name : ''),
    pickerWords: assignPickerWords(t, { count: open?.kind === 'ready' ? open.value : 0 }),
  };
}
