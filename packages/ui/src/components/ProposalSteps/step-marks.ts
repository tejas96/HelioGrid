import type { TranslatedText } from '@heliogrid/contracts';
import type { FieldMark, FieldMarks } from './ProposalSteps.shared.types';
import type { StepControl } from './step-controls';

/** Where a step draws a field the checklist names: the key trail of its control in the step's list. */
const FIELD_AT: Readonly<Record<string, string>> = {
  'system.capacityKw': 'size/field',
  'system.priceInclusive': 'price/field',
  'financials.tariffPerKwh': 'bill/tariff/field',
};

/** Fields a step's own part marks at the field itself: step 10's address and State (`M06-09`). */
const MARKED_BY_THE_STEP: readonly string[] = ['deal.siteAddress', 'deal.area'];

function marked(control: StepControl, trail: string, at: ReadonlyMap<string, FieldMark>) {
  const here = trail === '' ? control.key : `${trail}/${control.key}`;
  const mark = at.get(here);
  if (control.kind === 'number' && mark !== undefined) {
    return { ...control, field: { ...control.field, error: mark.title } };
  }
  if (control.kind === 'group' || control.kind === 'pair' || control.kind === 'grid') {
    const items: StepControl[] = control.items.map((item) => marked(item, here, at));
    return { ...control, items };
  }
  return control;
}

/**
 * A step's controls with the checklist's fields marked: a field the step draws in view wears the
 * field's own error look with the block's words; any other — a whole list, a field in a closed
 * fold — is said in one danger note at the top, so no blocking row lands on an unmarked step.
 */
export function markedControls(controls: readonly StepControl[], marks: FieldMarks): StepControl[] {
  const at = new Map<string, FieldMark>();
  for (const [path, mark] of Object.entries(marks)) {
    const place = FIELD_AT[path];
    if (place !== undefined) at.set(place, mark);
  }
  const drawn = Object.keys(marks).filter((path) => FIELD_AT[path] !== undefined);
  return [...markNotes(marks, drawn), ...controls.map((control) => marked(control, '', at))];
}

/** The marks no field of the step wears, as notes — one for each block, however many fields it names. */
export function markNotes(marks: FieldMarks, drawn: readonly string[] = []): StepControl[] {
  const said = new Set<TranslatedText>(drawn.flatMap((path) => marks[path]?.title ?? []));
  const notes: StepControl[] = [];
  for (const [path, mark] of Object.entries(marks)) {
    if (drawn.includes(path) || MARKED_BY_THE_STEP.includes(path) || said.has(mark.title)) continue;
    said.add(mark.title);
    notes.push({
      kind: 'note',
      key: `mark-${path}`,
      notice: { title: mark.title, line: mark.line },
      tone: 'danger',
      glyph: 'alert-circle',
    });
  }
  return notes;
}
