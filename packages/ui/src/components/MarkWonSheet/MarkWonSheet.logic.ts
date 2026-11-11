import type { TranslatedText } from '@heliogrid/contracts';
import { isPromisableInstallDate, minorUnitsOfDecimal, type Read } from '@heliogrid/domain';
import type { SelectProps } from '../Select/Select.types';
import type {
  MarkWonManager,
  MarkWonManagerFieldProps,
  MarkWonSheetDraft,
  MarkWonSheetFailure,
  MarkWonWords,
} from './MarkWonSheet.types';

/** The only person who may manage the project — picked for the person — else none. */
export function onlyManagerOf(managers: Read<readonly MarkWonManager[]>): MarkWonManager | null {
  if (managers.kind !== 'ready' || managers.value.length !== 1) return null;
  return managers.value[0] ?? null;
}

/** The draft as it would be sent: the manager the person chose, else the only one there is. */
export function draftToSend(
  draft: MarkWonSheetDraft,
  managers: Read<readonly MarkWonManager[]>,
): MarkWonSheetDraft {
  if (draft.managerId !== '') return draft;
  const only = onlyManagerOf(managers);
  return only === null ? draft : { ...draft, managerId: only.userId };
}

/** What the draft still lacks — each said under its own field once a send was tried. */
export interface MarkWonGaps {
  readonly value: boolean;
  readonly date: boolean;
  readonly manager: boolean;
}

export function gapsOf(draft: MarkWonSheetDraft): MarkWonGaps {
  return {
    value: draft.finalValue.trim() === '',
    date: draft.expectedInstallOn === '',
    manager: draft.managerId === '',
  };
}

/**
 * What is wrong with the draft as it is typed — said at once, never only after a send: a value with
 * more decimal places than the currency has (refused, never rounded — domain's
 * `minorUnitsOfDecimal`), a value of nothing, and a promised day before today.
 */
export interface MarkWonFaults {
  readonly finer: boolean;
  readonly zero: boolean;
  readonly past: boolean;
}

export function faultsOf(
  draft: MarkWonSheetDraft,
  today: string,
  minorUnitDigits: number,
): MarkWonFaults {
  const typed = draft.finalValue.trim();
  return {
    finer: typed !== '' && !isWholeMinorUnits(typed, minorUnitDigits),
    zero: typed !== '' && Number(typed) <= 0,
    past:
      draft.expectedInstallOn !== '' && !isPromisableInstallDate(draft.expectedInstallOn, today),
  };
}

function isWholeMinorUnits(typed: string, digits: number): boolean {
  try {
    minorUnitsOfDecimal(typed, digits);
    return true;
  } catch {
    return false;
  }
}

export function isComplete(gaps: MarkWonGaps, faults: MarkWonFaults): boolean {
  return (
    !gaps.value && !gaps.date && !gaps.manager && !faults.finer && !faults.zero && !faults.past
  );
}

/** The line under the value: too fine for the currency, none at all — as typed, or as refused. */
export function valueErrorOf(
  words: MarkWonWords,
  faults: MarkWonFaults,
  missing: boolean,
  failure: MarkWonSheetFailure | null,
): TranslatedText | undefined {
  if (faults.finer || failure === 'finer_than_currency') return words.finerThanCurrency;
  if (faults.zero || missing || failure === 'value_needed') return words.valueNeeded;
  return undefined;
}

/** The line under the date: a day before today, or none picked once a send was tried. */
export function dateErrorOf(
  words: MarkWonWords,
  faults: MarkWonFaults,
  missing: boolean,
  failure: MarkWonSheetFailure | null,
): TranslatedText | undefined {
  if (faults.past || failure === 'date_in_past') return words.dateInPast;
  return missing ? words.dateNeeded : undefined;
}

/** The chosen manager, for the line under the field: how many live projects they already hold. */
export function chosenManagerOf(
  managerId: string,
  managers: Read<readonly MarkWonManager[]>,
): MarkWonManager | null {
  if (managers.kind !== 'ready') return null;
  return managers.value.find((manager) => manager.userId === managerId) ?? null;
}

/**
 * The failure said above the send. Too fine a value is said under the value field instead, where
 * the person fixes it.
 */
export function sendFailureOf(
  failure: MarkWonSheetFailure | null,
  words: MarkWonWords,
): TranslatedText | null {
  switch (failure) {
    case 'already_won':
      return words.alreadyWon;
    case 'lead_closed':
      return words.closedLead;
    case 'not_a_manager':
      return words.notManager;
    case 'failed':
      return words.failed;
    default:
      return null;
  }
}

/** A typed decimal as the field's figure; `''` is unset, never `0`. */
export function figureOf(typed: string): number | undefined {
  return typed.trim() === '' ? undefined : Number(typed);
}

/** The line under the manager field: the only one picked for you, else the chosen one's load. */
export function managerHelperOf(
  words: MarkWonWords,
  managers: Read<readonly MarkWonManager[]>,
  managerId: string,
): TranslatedText | undefined {
  if (onlyManagerOf(managers) !== null) return words.managerOnly;
  const chosen = chosenManagerOf(managerId, managers);
  return chosen === null ? undefined : words.liveProjects(chosen.liveProjects);
}

/** The manager field's choice once the managers are read: the chosen one, its load or the gap. */
export function managerSelectOf({
  words,
  managers,
  managerId,
  missing,
  disabled,
  onChoose,
}: MarkWonManagerFieldProps): SelectProps {
  return {
    label: words.manager,
    placeholder: words.managerNeeded,
    closeLabel: words.close,
    value: managerId === '' ? undefined : managerId,
    options: (managers.kind === 'ready' ? managers.value : []).map((manager) => ({
      value: manager.userId,
      label: manager.name,
    })),
    onChange: onChoose,
    disabled,
    helper: managerHelperOf(words, managers, managerId),
    error: missing ? words.managerNeeded : undefined,
  };
}
