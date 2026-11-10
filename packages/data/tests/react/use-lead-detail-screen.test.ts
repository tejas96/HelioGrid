// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  answerNext,
  holdWrites,
  LEAD_ID,
  mountedLead,
  origin,
  questionOf,
  SURVEYORS,
  transitionRefused,
} from './lead-detail-origin';
import { refusal } from './origin-wire';

/**
 * Lead Detail's answers through the real client (`SCR-M02-04`): each qualify answer saves alone,
 * a refused move says why where the person acted, and an act out keeps its sheet waiting.
 */
describe('Lead Detail — qualify answers save alone (M02-39)', () => {
  it('an answer that fails keeps the others saved, and Try again saves it', async () => {
    const view = await mountedLead();
    answerNext('shading', { status: 500, body: refusal('INTERNAL') });
    act(() => view.result.current.qualify.answer('roofType', 'rcc_flat'));
    act(() => view.result.current.qualify.answer('shading', 'partial'));
    await waitFor(() => expect(questionOf(view, 'shading').save?.status).toBe('failed'));
    await waitFor(() => expect(questionOf(view, 'roofType').saved).toBe('rcc_flat'));
    expect(questionOf(view, 'roofType').save).toBeNull();
    expect(questionOf(view, 'shading').saved).toBeNull();

    act(() => view.result.current.qualify.retry('shading'));
    await waitFor(() => expect(questionOf(view, 'shading').saved).toBe('partial'));
    expect(questionOf(view, 'roofType').saved).toBe('rcc_flat');
    expect(questionOf(view, 'shading').savedMark).toBe(true);
  });

  it('an answer given while its question still saves goes after it, so the later one stands', async () => {
    const view = await mountedLead();
    const release = holdWrites();
    act(() => view.result.current.qualify.answer('roofOwnership', 'rent'));
    await waitFor(() => expect(origin.writes).toHaveLength(1));
    act(() => view.result.current.qualify.answer('roofOwnership', 'own'));
    expect(questionOf(view, 'roofOwnership').shown).toBe('own');
    release();
    await waitFor(() => expect(questionOf(view, 'roofOwnership').saved).toBe('own'));
    expect(
      origin.writes.map((write) => (write.body as { roofOwnership: string }).roofOwnership),
    ).toEqual(['rent', 'own']);
  });

  it.each([
    ['an answer already on the record', 'roofType', 'tile', 'tile'],
    ['a value the question does not offer', 'roofType', 'thatch', null],
  ] as const)('%s sends nothing', async (_, question, value, recorded) => {
    origin.lead.qualify.roofType = recorded;
    const view = await mountedLead();
    act(() => view.result.current.qualify.answer(question, value));
    expect(origin.writes).toHaveLength(0);
    expect(questionOf(view, question).save).toBeNull();
  });
});

describe('Lead Detail — acts and their answers', () => {
  it('a refused transition says why in place and changes nothing', async () => {
    const view = await mountedLead();
    answerNext('wake', { status: 422, body: transitionRefused('not_snoozed') });
    act(() => view.result.current.acts.quick('wake'));
    await waitFor(() =>
      expect(view.result.current.acts.quickStanding).toEqual({
        kind: 'returned',
        act: 'wake',
        failure: { kind: 'refused', refusal: 'not_snoozed' },
      }),
    );
    const { read } = view.result.current;
    expect(read.kind === 'ready' && read.value.lead.lead.state).toBeNull();
  });

  it('a refused snooze keeps its sheet open with the reason', async () => {
    const view = await mountedLead();
    answerNext('snooze', { status: 422, body: transitionRefused('lead_closed') });
    act(() => view.result.current.acts.open({ kind: 'snooze' }));
    act(() => view.result.current.acts.send({ kind: 'snooze', wakeOn: '2099-01-02' }));
    await waitFor(() =>
      expect(view.result.current.acts.sendFailure).toEqual({
        kind: 'refused',
        refusal: 'lead_closed',
      }),
    );
    expect(view.result.current.acts.sheet).toEqual({ kind: 'snooze' });
  });

  it('a call-back to a number no one may call says so in its sheet and sets nothing (M02-44)', async () => {
    const view = await mountedLead();
    answerNext('tasks', { status: 422, body: refusal('NUMBER_NOT_DIALLABLE') });
    act(() => view.result.current.acts.open({ kind: 'callBack' }));
    act(() =>
      view.result.current.acts.send({ kind: 'callBack', date: '2099-01-02', time: '11:30' }),
    );
    await waitFor(() =>
      expect(view.result.current.acts.sendFailure).toEqual({ kind: 'not_diallable' }),
    );
    expect(view.result.current.acts.sheet).toEqual({ kind: 'callBack' });
    expect(origin.writes.map((write) => write.path)).toEqual([`/leads/${LEAD_ID}/tasks`]);
  });

  it('while a send is out its sheet waits, a second press sends nothing, and success closes it', async () => {
    const view = await mountedLead();
    const release = holdWrites();
    act(() => view.result.current.acts.open({ kind: 'snooze' }));
    act(() => view.result.current.acts.send({ kind: 'snooze', wakeOn: '2099-01-02' }));
    await waitFor(() => expect(view.result.current.acts.sending).toBe(true));
    act(() => view.result.current.acts.send({ kind: 'snooze', wakeOn: '2099-01-03' }));
    act(() => view.result.current.acts.close());
    expect(view.result.current.acts.sheet).toEqual({ kind: 'snooze' });
    release();
    await waitFor(() => expect(view.result.current.acts.sheet).toBeNull());
    expect(origin.writes).toHaveLength(1);
    const { read } = view.result.current;
    expect(read.kind === 'ready' && read.value.view.marks.wakeOn).toBe('2099-01-02');
  });

  it('a lead gone from the reader’s scope lands as unavailable, never as a failure to retry', async () => {
    origin.gone = true;
    const view = await mountedLead();
    expect(view.result.current.read).toEqual({ kind: 'unavailable' });
  });
});

describe('Lead Detail — Book visit (M02-46)', () => {
  it('Book visit offers whom the booking read names, read only once the sheet opens', async () => {
    const view = await mountedLead();
    expect(view.result.current.surveyors.kind).not.toBe('ready');
    act(() => view.result.current.acts.open({ kind: 'visit' }));
    await waitFor(() =>
      expect(view.result.current.surveyors).toEqual({ kind: 'ready', value: SURVEYORS }),
    );
  });
});
