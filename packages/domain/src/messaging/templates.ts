/**
 * The keys of every message the product composes for a customer (`F6-26`). The PRD's list is
 * EXHAUSTIVE by owner ruling, so this tuple is closed and the invariant `template-keys-mirror-f6`
 * holds it equal to that row, both ways: a key seeded here and not named there, or named there and
 * missing here, is red before any flow composes it.
 *
 * A key carries no words yet. Each key's starter text and its placeholders are authored by the task
 * that first sends it, the precedent `T-FPLAT-017` set for notification copy, and every version is
 * tenant content under `F3-10`, read through `authoredIn` — never the translation catalog (`F6-27`).
 */
export const MESSAGE_TEMPLATE_KEYS = [
  'proposal_share',
  'follow_up_nudge',
  'payment_reminder',
  'visit_confirmation',
  'survey_complete',
  'handover',
  'crew_arrival',
] as const;
export type MessageTemplateKey = (typeof MESSAGE_TEMPLATE_KEYS)[number];

/** What a composed message reads, and which placeholders had nothing to fill them. */
export interface ComposedMessage {
  readonly text: string;
  readonly omitted: readonly string[];
}

/** `<date>`, as `F6-26` writes it: a name in angle brackets. `<3 kWp>` is text, not a placeholder. */
const PLACEHOLDER = /<([a-z][A-Za-z]*)>/g;

/**
 * Two private-use code points: where an omitted placeholder stood while its gap is closed, and
 * where a supplied value will go. No template a person types contains either, and any that did are
 * dropped first, so the markers and the values always line up.
 */
const GAP = '';
const VALUE = '';
const MARKERS = /[]/g;
/** One or more gaps with the spaces and tabs around them. */
const GAP_RUN = /[ \t]*(?:[ \t]*)+/g;
/** What may follow a gap with no space before it: Latin and Devanagari stops, or a line end. */
const CLOSES_UP = /^(?:[.,!?;:।॥]|\r?\n|$)/;

/**
 * Fills each placeholder from `values`. A placeholder with no value — absent, empty or only
 * spaces — is left out and named in `omitted`, and ONLY the gap it leaves is closed: no space
 * before a stop or a line end, none at the start of a line, one between two words. The template's
 * other text and every supplied value are kept exactly as given. The template is read ONCE: a
 * value is never read as a template, and closing a gap never joins two pieces of text into a new
 * placeholder. The customer never reads a raw `<date>` (`M01-55`: "every variable resolved or
 * safely omitted").
 */
export function composeMessage(
  template: string,
  values: Readonly<Record<string, string | undefined>>,
): ComposedMessage {
  const omitted = new Set<string>();
  const supplied: string[] = [];
  const marked = template.replace(MARKERS, '').replace(PLACEHOLDER, (_, name: string) => {
    const value = valueFor(values, name);
    if (value === undefined) {
      omitted.add(name);
      return GAP;
    }
    supplied.push(value);
    return VALUE;
  });
  const text = String.raw({ raw: closeGaps(marked).split(VALUE) }, ...supplied);
  return { text, omitted: [...omitted] };
}

/** A value the flow supplied — its own key only, never one an object inherits, and never blank. */
function valueFor(values: Readonly<Record<string, string | undefined>>, name: string) {
  const value = Object.hasOwn(values, name) ? values[name]?.trim() : undefined;
  return value ? value : undefined;
}

function closeGaps(text: string): string {
  return text.replace(GAP_RUN, (run: string, offset: number) => {
    const before = text.slice(0, offset);
    const after = text.slice(offset + run.length);
    if (CLOSES_UP.test(after) || before === '' || before.endsWith('\n')) return '';
    return /[ \t]/.test(run) ? ' ' : '';
  });
}
