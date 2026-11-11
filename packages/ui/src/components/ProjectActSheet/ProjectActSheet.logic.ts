import type { TranslatedText } from '@heliogrid/contracts';
import {
  BLOCKER_PARTIES,
  BLOCKER_REASONS_BY_PARTY,
  type BlockerParty,
  type BlockerReason,
  type Read,
} from '@heliogrid/domain';
import type { ButtonProps } from '../Button/Button.types';
import type { TimelineItem } from '../Timeline/Timeline.types';
import type {
  ProjectActForm,
  ProjectActSheetWords,
  ProjectFormFrame,
  ProjectPersonChoice,
} from './ProjectActSheet.types';

/** The sheet's title and the line under it: what the act is, and what it does — none for a pick. */
export function headOf(
  form: ProjectActForm,
  words: ProjectActSheetWords,
): { title: TranslatedText; line: TranslatedText | null } {
  switch (form.kind) {
    case 'dispatch':
      return { title: words.dispatch.title, line: words.lead(form.name, form.place) };
    case 'wait':
      return { title: words.wait.title, line: words.wait.line(form.name) };
    case 'earlyProof':
      return {
        title: words.early.title(form.row),
        line: words.early.line(form.name, form.at, form.to),
      };
    case 'notNeeded':
      return { title: words.notNeeded.title, line: words.notNeeded.line(form.row) };
    case 'cancel':
      return { title: words.cancel.title, line: words.cancel.line(form.name) };
    case 'date':
      return { title: words.date.title, line: words.date.line };
    case 'manager':
      return { title: words.manager.title, line: null };
    case 'access':
      return { title: words.access.title, line: words.access.line };
    case 'fileName':
      return { title: words.file.name, line: null };
  }
}

/** Another row's *Not needed*, another file's name, starts a fresh draft. */
export function draftKeyOf(form: ProjectActForm): string {
  if (form.kind === 'notNeeded') return `notNeeded:${form.row}`;
  if (form.kind === 'fileName') return `fileName:${form.start}`;
  return form.kind;
}

/** The party a card names, or null for a value that is not one of the four. */
export function partyOf(value: string): BlockerParty | null {
  return BLOCKER_PARTIES.find((party) => party === value) ?? null;
}

/** The reasons a party offers, in the order a person is shown them (domain's one list). */
export function reasonsOf(party: BlockerParty): readonly BlockerReason[] {
  return BLOCKER_REASONS_BY_PARTY[party];
}

/** A reason kept only while it fits the party picked; another party starts with none. */
export function reasonFor(party: BlockerParty, reason: BlockerReason | null): BlockerReason | null {
  return reason !== null && reasonsOf(party).includes(reason) ? reason : null;
}

/** One person ticked or unticked, the rest kept in the order they were ticked. */
export function toggled(chosen: readonly string[], userId: string): readonly string[] {
  return chosen.includes(userId) ? chosen.filter((id) => id !== userId) : [...chosen, userId];
}

/** The crew to send: those ticked who are still on the team the read lists. */
export function crewOf(
  chosen: readonly string[],
  people: readonly ProjectPersonChoice[],
): readonly string[] {
  return chosen.filter((id) => people.some((person) => person.userId === id));
}

/** Typed words as a value: trimmed, and an empty field is none. */
export function typedOf(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === '' ? null : trimmed;
}

/** A form's foot as its send reads it: busy while the send is out, and why it came back undone. */
export function footOf({ sending, refusal }: Pick<ProjectFormFrame, 'sending' | 'refusal'>): {
  readonly pending: boolean;
  readonly failure: TranslatedText | null;
} {
  return { pending: sending, failure: refusal };
}

/** A send that sleeps until the form holds a value, and then sends that value. */
export function sendWhen<V>(
  value: V | null,
  onSend: (value: V) => void,
): { readonly ready: boolean; readonly onSend: () => void } {
  return {
    ready: value !== null,
    onSend: () => {
      if (value !== null) onSend(value);
    },
  };
}

/** Cancel's way out, *Keep it* — which waits, as every way out does, while the send is out. */
export function keepOf({
  sending,
  onClose,
}: Pick<ProjectFormFrame, 'sending' | 'onClose'>): Omit<ButtonProps, 'children'> {
  return {
    variant: 'secondary',
    size: 'lg',
    fullWidth: true,
    onClick: () => {
      if (!sending) onClose();
    },
  };
}

/** The people a read holds once it has landed; none before. */
function peopleOf(read: Read<readonly ProjectPersonChoice[]>): readonly ProjectPersonChoice[] {
  return read.kind === 'ready' ? read.value : [];
}

/**
 * *Dispatched*'s crew to send: those ticked still on the team — one at least, unless the team has
 * none (ruling 6) — or null while no one is picked to go, which the sheet then says (W14).
 */
export function dispatchCrewOf(
  form: Extract<ProjectActForm, { kind: 'dispatch' }>,
  chosen: readonly string[],
): readonly string[] | null {
  const crew = crewOf(chosen, peopleOf(form.people));
  return crew.length > 0 || form.people.kind === 'empty' ? crew : null;
}

/** The day the crew left: inside the days it can have left on, else none to send. */
export function leftOnOf(
  form: Extract<ProjectActForm, { kind: 'dispatch' }>,
  day: string | null,
): string | null {
  return day !== null && day >= form.firstDay && day <= form.today ? day : null;
}

/** A cancel's note: needed for *Something else*, which names no reason of its own. */
export function cancelNoteNeeded(reason: string | null, note: string | null): boolean {
  return reason === 'something_else' && note === null;
}

/**
 * The manager's send: the person picked, while they are still among who may manage — every one of
 * them listed with the live projects they hold, never a list a small sheet could clip (W1).
 */
export function managerSendOf(
  form: Extract<ProjectActForm, { kind: 'manager' }>,
  managerId: string,
): ReturnType<typeof sendWhen> {
  const picked = peopleOf(form.people).find((person) => person.userId === managerId) ?? null;
  return sendWhen(picked === null ? null : picked.userId, form.onSend);
}

/** The early proof's mini journey: where it stands now, the stages passed, the stage it moves to. */
export function earlyStepsOf(
  form: Extract<ProjectActForm, { kind: 'earlyProof' }>,
  words: ProjectActSheetWords,
): TimelineItem[] {
  return [
    { id: form.at, label: words.early.stage(form.at), status: 'current', meta: words.early.now },
    ...form.passed.map(
      (stage): TimelineItem => ({
        id: stage,
        label: words.early.stage(stage),
        status: 'skipped',
        meta: words.early.passed,
      }),
    ),
    { id: form.to, label: words.early.stage(form.to), status: 'upcoming', meta: words.early.with },
  ];
}
