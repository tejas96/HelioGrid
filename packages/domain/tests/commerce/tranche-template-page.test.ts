import { describe, expect, it } from 'vitest';
import { allocationVerdict } from '../../src/commerce/tranche-allocation';
import {
  canAddTranche,
  canRemoveTranche,
  onSeededTermsOnly,
  type TrancheDraft,
  type TrancheEdit,
  type TrancheTemplateRead,
  trancheCardsOf,
  trancheDraftChanged,
  trancheDraftOf,
  trancheEdit,
  trancheNewDraft,
  tranchePreviewLines,
  trancheRefusals,
  trancheSendable,
  trancheStanding,
  trancheVerdictOf,
  trancheWriteOf,
} from '../../src/commerce/tranche-template-page';
import { percentToBasisPoints } from '../../src/money/basis-points';
import { standard } from './settings-rows';

const template = (over: Partial<TrancheTemplateRead> = {}): TrancheTemplateRead => ({
  id: 't1',
  name: 'Standard 10/60/20/10',
  isDefault: false,
  archived: false,
  changed: false,
  lines: [
    { label: 'Advance on signing', percent: '10.00', dueOnStage: 'won' },
    { label: 'Before dispatch', percent: '60.00', dueOnStage: 'material_ordered' },
    { label: 'On installation', percent: '20.00', dueOnStage: 'installation' },
    { label: 'On commissioning', percent: '10.00', dueOnStage: 'commissioned' },
  ],
  ...over,
});

const edits = (draft: TrancheDraft, ...all: TrancheEdit[]) => all.reduce(trancheEdit, draft);
const opened = () => trancheDraftOf(template());
const percents = (draft: TrancheDraft) => trancheWriteOf(draft).lines.map((line) => line.percent);

describe('the cards (SCR-M01-20, decision 7)', () => {
  it('parts the terms in use from the archived ones, in the api’s order', () => {
    const cards = trancheCardsOf([
      template({ id: 'a' }),
      template({ id: 'b', archived: true, changed: true }),
      template({ id: 'c', changed: true }),
    ]);
    expect(cards.inUse.map((card) => [card.id, card.platformStandard])).toEqual([
      ['a', true],
      ['c', false],
    ]);
    expect(cards.archived.map((card) => card.id)).toEqual(['b']);
  });

  it.each([
    { templates: [template(), template({ id: 't2' })], seeded: true },
    { templates: [template(), template({ id: 't2', changed: true })], seeded: false },
    { templates: [], seeded: false },
  ])('seeded terms only: $seeded', ({ templates, seeded }) => {
    expect(onSeededTermsOnly(templates)).toBe(seeded);
  });
});

describe('the saved line', () => {
  const at = '2026-08-22T10:00:00.000Z';
  it.each([
    {
      lastSaved: { at, by: { name: 'Rajesh Kulkarni' } },
      templates: [template()],
      standing: { kind: 'saved', at: Date.parse(at), name: 'Rajesh Kulkarni' },
    },
    { lastSaved: null, templates: [template()], standing: { kind: 'never-set' } },
    { lastSaved: undefined, templates: [template()], standing: { kind: 'never-set' } },
    {
      lastSaved: undefined,
      templates: [template({ changed: true })],
      standing: { kind: 'saved-unknown' },
    },
    { lastSaved: null, templates: [template({ changed: true })], standing: { kind: 'never-set' } },
  ])('$lastSaved over $templates.length → $standing.kind', ({ lastSaved, templates, standing }) => {
    expect(trancheStanding(lastSaved, templates)).toEqual(standing);
  });
});

describe('the meter and the save read one verdict (M01-54)', () => {
  it('the meter and the save read one verdict', () => {
    const draft = opened();
    const shares = trancheWriteOf(draft).lines.map((line) => percentToBasisPoints(line.percent));
    expect(trancheVerdictOf(draft)).toEqual(allocationVerdict(shares));
    expect(trancheSendable(draft)).toBe(true);
  });

  it('10/60/20 states 10.00 unallocated', () => {
    const draft = edits(opened(), { kind: 'remove-line', key: 3 });
    expect(trancheVerdictOf(draft)).toMatchObject({ state: 'under', remainder: 1000 });
    expect(trancheSendable(draft)).toBe(false);
  });

  it.each([
    { share: 1000, state: 'met' },
    { share: 999, state: 'under' },
    { share: 1001, state: 'over' },
    { share: null, state: 'under' },
  ])('the last tranche at $share → $state', ({ share, state }) => {
    const draft = edits(opened(), { kind: 'line-share', key: 3, share });
    expect(trancheVerdictOf(draft).state).toBe(state);
  });
});

describe('the refusals (AC-13)', () => {
  it.each([
    { share: 0, refused: 'range' },
    { share: 1, refused: null },
    { share: 10_000, refused: null },
    { share: 10_001, refused: 'range' },
    { share: null, refused: 'range' },
  ])('a share outside its range is refused: $share → $refused', ({ share, refused }) => {
    const draft = edits(opened(), { kind: 'line-share', key: 0, share });
    expect(trancheRefusals(draft).lines.get(0)?.share).toBe(refused);
  });

  it.each([
    { text: '', refused: 'required' },
    { text: '   ', refused: 'required' },
    { text: 'A', refused: null },
  ])('a name is required: “$text” → $refused', ({ text, refused }) => {
    const draft = edits(opened(), { kind: 'name', text }, { kind: 'line-label', key: 1, text });
    const refusals = trancheRefusals(draft);
    expect([refusals.name, refusals.lines.get(1)?.label]).toEqual([refused, refused]);
    expect(trancheSendable(draft)).toBe(refused === null);
  });

  it('twelve tranches is the most', () => {
    let draft = opened();
    for (let n = 5; n <= 13; n += 1)
      draft = trancheEdit(draft, { kind: 'add-line', label: `Tranche ${n}` });
    expect(draft.lines).toHaveLength(12);
    expect(canAddTranche(draft)).toBe(false);
    expect(canAddTranche(opened())).toBe(true);
  });

  it('the last tranche stays', () => {
    const one = edits(opened(), ...[0, 1, 2].map((key) => ({ kind: 'remove-line' as const, key })));
    expect(one.lines.map((line) => line.key)).toEqual([3]);
    expect(canRemoveTranche(one)).toBe(false);
    expect(trancheEdit(one, { kind: 'remove-line', key: 3 })).toBe(one);
    expect(canRemoveTranche(opened())).toBe(true);
  });

  it('an edit aimed at no tranche changes nothing', () => {
    expect(trancheEdit(opened(), { kind: 'line-label', key: 99, text: 'x' })).toEqual(opened());
  });
});

describe('the lines (brief: no reorder control)', () => {
  it('lines list in stage order', () => {
    const shuffled = template({
      lines: [
        { label: 'Late', percent: '50.00', dueOnStage: 'commissioned' },
        { label: 'Early', percent: '50.00', dueOnStage: 'won' },
      ],
    });
    const draft = trancheDraftOf(shuffled);
    expect(draft.lines.map((line) => line.label)).toEqual(['Early', 'Late']);
    const moved = trancheEdit(draft, { kind: 'line-stage', key: 1, stage: 'handed_over' });
    expect(moved.lines.map((line) => line.label)).toEqual(['Late', 'Early']);
  });

  it('two tranches may share a name and a stage', () => {
    const draft = edits(
      opened(),
      { kind: 'line-label', key: 1, text: 'Advance on signing' },
      { kind: 'line-stage', key: 1, stage: 'won' },
    );
    expect(
      trancheWriteOf(draft)
        .lines.slice(0, 2)
        .map((line) => [line.label, line.dueOnStage]),
    ).toEqual([
      ['Advance on signing', 'won'],
      ['Advance on signing', 'won'],
    ]);
    expect(trancheSendable(draft)).toBe(true);
  });

  it('a new tranche is named as given, has no share, and falls due where the last one does', () => {
    const draft = trancheEdit(opened(), { kind: 'add-line', label: 'Tranche 5' });
    expect(draft.lines[4]).toEqual({
      key: 4,
      label: 'Tranche 5',
      share: null,
      dueOnStage: 'commissioned',
    });
  });
});

describe('a name is one value, shown as written to every reader (F3-10)', () => {
  it('opens as stored, whatever language the company wrote it in', () => {
    const hindi = template({
      name: 'मानक शर्तें',
      lines: [{ label: 'हस्ताक्षर पर अग्रिम', percent: '100.00', dueOnStage: 'won' }],
    });
    expect(trancheWriteOf(trancheDraftOf(hindi))).toMatchObject({
      name: 'मानक शर्तें',
      lines: [{ label: 'हस्ताक्षर पर अग्रिम' }],
    });
  });

  it.each([
    { field: 'name', text: ' नई शर्तें ', sent: 'नई शर्तें', changed: true },
    { field: 'name', text: 'Standard 10/60/20/10 ', sent: 'Standard 10/60/20/10', changed: false },
    { field: 'name', text: 'Standard  10/60/20/10', sent: 'Standard  10/60/20/10', changed: true },
    { field: 'tranche', text: ' बुकिंग ', sent: 'बुकिंग', changed: true },
    { field: 'tranche', text: 'Advance on signing ', sent: 'Advance on signing', changed: false },
  ])('a $field typed “$text” sends “$sent”, changed $changed', ({ field, text, sent, changed }) => {
    const edit: TrancheEdit =
      field === 'name' ? { kind: 'name', text } : { kind: 'line-label', key: 0, text };
    const draft = trancheEdit(opened(), edit);
    const write = trancheWriteOf(draft);
    expect(field === 'name' ? write.name : write.lines[0]?.label).toBe(sent);
    expect(trancheDraftChanged(opened(), draft)).toBe(changed);
  });
});

describe('what Save sends and whether anything changed (AC-6)', () => {
  it('sends the shares as the wire’s two-decimal percent', () => {
    expect(percents(opened())).toEqual(['10.00', '60.00', '20.00', '10.00']);
  });

  it.each<{ edit: TrancheEdit; changed: boolean }>([
    { edit: { kind: 'name', text: 'Standard 10/60/20/10' }, changed: false },
    { edit: { kind: 'name', text: 'Renamed' }, changed: true },
    { edit: { kind: 'line-share', key: 0, share: 1000 }, changed: false },
    { edit: { kind: 'line-share', key: 0, share: 1500 }, changed: true },
    { edit: { kind: 'line-stage', key: 1, stage: 'dispatched' }, changed: true },
  ])('$edit.kind → changed $changed', ({ edit, changed }) => {
    expect(trancheDraftChanged(opened(), trancheEdit(opened(), edit))).toBe(changed);
  });

  it.each([
    { edit: null, changed: false },
    { edit: { kind: 'name', text: 'All upfront' } as const, changed: true },
  ])('a new template untouched is no change; edited, it is ($changed)', ({ edit, changed }) => {
    const draft = trancheNewDraft(standard);
    expect(trancheDraftChanged(draft, edit === null ? draft : trancheEdit(draft, edit))).toBe(
      changed,
    );
  });

  it('a new template from a split with no tranches starts its one tranche unnamed', () => {
    expect(trancheNewDraft({ ...standard, lines: [] }).lines[0]?.label).toBe('');
  });

  it('a new template starts as one whole tranche named as the default split’s first, due at Won, with no name', () => {
    const draft = trancheNewDraft({ ...standard, lines: [...standard.lines].reverse() });
    expect(draft).toMatchObject({ id: null, name: '' });
    expect(draft.lines).toEqual([
      {
        key: 0,
        label: 'On commissioning',
        share: 10_000,
        dueOnStage: 'won',
      },
    ]);
    expect(trancheSendable(draft)).toBe(false);
    expect(trancheSendable(trancheEdit(draft, { kind: 'name', text: 'All upfront' }))).toBe(true);
  });
});

describe('the preview’s schedule (AC-16)', () => {
  it('shows the saved lines until the edit is whole, then the edit', () => {
    const short = trancheEdit(opened(), { kind: 'line-share', key: 3, share: 500 });
    expect(tranchePreviewLines(template(), short)).toEqual({
      source: 'saved',
      lines: template().lines,
    });
    const whole = edits(short, { kind: 'line-share', key: 2, share: 2500 });
    const shown = tranchePreviewLines(template(), whole);
    expect(shown?.source).toBe('draft');
    expect(shown?.lines.map((line) => line.percent)).toEqual(['10.00', '60.00', '25.00', '5.00']);
  });

  it('a new template shows nothing until its first whole edit', () => {
    const short = trancheEdit(trancheNewDraft(standard), {
      kind: 'line-share',
      key: 0,
      share: 5000,
    });
    expect(tranchePreviewLines(null, short)).toBeNull();
    expect(tranchePreviewLines(null, trancheNewDraft(standard))?.source).toBe('draft');
  });
});
