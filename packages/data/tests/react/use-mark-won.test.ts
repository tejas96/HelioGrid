// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type MarkWonDraft, useMarkWon } from '../../src/react/use-mark-won';
import { useTenantId } from '../../src/react/use-tenant-id';
import { refusal } from './origin-wire';
import { LEAD_ID, PEOPLE, PROJECT_ID, READER } from './projects-fixtures';
import { answerNext, mountedOver, origin, readsOf, settle } from './projects-origin';

/**
 * *Mark won* (`M07-62`) through the real client: who can manage the project, read only
 * while the sheet is open; the send with its retry key, so a second tap after a dropped answer
 * finds the project the first made (`F4-07`); and each refusal as the sheet says it.
 */

const DRAFT: MarkWonDraft = {
  finalValue: '450000.00',
  expectedInstallOn: '2026-12-01',
  managerId: READER.userId,
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
/** Long enough that a moment taken again is a different instant. */
const aMomentLater = () => new Promise((resolve) => setTimeout(resolve, 5));
/** The moment a write carried. */
const momentOf = (write: { body: unknown } | undefined) =>
  (write?.body as { capturedAt?: string } | undefined)?.capturedAt;

async function mountedSheet(open = true) {
  const view = mountedOver(() => ({ won: useMarkWon(LEAD_ID), tenantId: useTenantId() }), {});
  await waitFor(() => expect(view.result.current.tenantId).not.toBe(''));
  if (open) act(() => view.result.current.won.open());
  return view;
}

type Sheet = Awaited<ReturnType<typeof mountedSheet>>;
async function sent(view: Sheet, draft: MarkWonDraft) {
  let answer: unknown = null;
  await act(async () => {
    answer = await view.result.current.won.send(draft);
  });
  return answer;
}

describe('Mark won — the managers', () => {
  it('are read only once the sheet opens', async () => {
    const view = await mountedSheet(false);
    await settle();
    expect(readsOf('/projects/people')).toBe(0);
    act(() => view.result.current.won.open());
    await waitFor(() =>
      expect(view.result.current.won.managers).toEqual({ kind: 'ready', value: PEOPLE }),
    );
    expect(readsOf('/projects/people')).toBe(1);
  });

  it('none to pick reads empty', async () => {
    origin.people = [];
    const view = await mountedSheet();
    await waitFor(() => expect(view.result.current.won.managers).toEqual({ kind: 'empty' }));
  });
});

describe('Mark won — the send', () => {
  it('posts the draft with its moment and a retry key, and answers the project made', async () => {
    const view = await mountedSheet();
    const answer = await sent(view, DRAFT);
    expect(answer).toEqual({ kind: 'done', output: { projectId: PROJECT_ID, number: 'PRJ-0042' } });
    expect(origin.writes).toEqual([
      {
        path: `/leads/${LEAD_ID}/won`,
        body: { ...DRAFT, capturedAt: expect.any(String) },
        key: expect.stringMatching(UUID),
      },
    ]);
    expect(view.result.current.won.failure).toBeNull();
  });

  it('the same draft after a dropped answer carries the same key and the same moment', async () => {
    const view = await mountedSheet();
    answerNext('won', 'drop');
    await sent(view, DRAFT);
    expect(view.result.current.won.failure).toBe('failed');
    await aMomentLater();
    expect(await sent(view, DRAFT)).toMatchObject({ kind: 'done' });
    const [first, retry] = origin.writes;
    expect(retry?.key).toBe(first?.key);
    expect(retry?.body).toEqual(first?.body);
  });

  it.each([
    ['a changed draft', (view: Sheet) => sent(view, { ...DRAFT, finalValue: '460000.00' })],
    [
      'the same draft after the sheet was cleared',
      (view: Sheet) => {
        act(() => view.result.current.won.clear());
        return sent(view, DRAFT);
      },
    ],
  ])('%s after a dropped answer is a new submission', async (_, sendAgain) => {
    const view = await mountedSheet();
    answerNext('won', 'drop');
    await sent(view, DRAFT);
    await aMomentLater();
    await sendAgain(view);
    const [first, next] = origin.writes;
    expect(next?.key).not.toBe(first?.key);
    expect(momentOf(next)).not.toBe(momentOf(first));
  });

  it('once it landed, the same draft again is a new submission', async () => {
    const view = await mountedSheet();
    await sent(view, DRAFT);
    await aMomentLater();
    await sent(view, DRAFT);
    const [first, next] = origin.writes;
    expect(next?.key).not.toBe(first?.key);
  });
});

/** A refusal naming the field it is about, as the api's `details[]` does. */
const refusalAt = (code: string, path: string) => ({
  error: { ...refusal(code).error, details: [{ path, issue: path }] },
});

describe('Mark won — refusals as the sheet says them', () => {
  const leadRefused = (reason: string) => ({
    error: { ...refusal('LEAD_TRANSITION_REFUSED').error, facts: { refusal: reason } },
  });
  const blocked = {
    error: {
      ...refusal('ENTITLEMENT_BLOCKED').error,
      blocked: {
        reason: 'cap',
        capability: 'sell_and_deliver',
        key: 'active_projects',
        resetsAt: null,
      },
    },
  };

  it.each([
    ['422 stage_reached', 'already_won', { status: 422, body: leadRefused('stage_reached') }],
    ['422 lead_closed', 'lead_closed', { status: 422, body: leadRefused('lead_closed') }],
    // The plan's limit is told once, by the app's billing denial (`M12-21`): the sheet adds no line.
    ['403 ENTITLEMENT_BLOCKED', null, { status: 403, body: blocked }],
    [
      '400 VALIDATION_FAILED on the value',
      'finer_than_currency',
      { status: 400, body: refusalAt('VALIDATION_FAILED', 'finalValue') },
    ],
    [
      '400 VALIDATION_FAILED on the install date',
      'date_in_past',
      { status: 400, body: refusalAt('VALIDATION_FAILED', 'expectedInstallOn') },
    ],
    [
      '400 VALIDATION_FAILED on the manager',
      'not_a_manager',
      { status: 400, body: refusalAt('VALIDATION_FAILED', 'managerId') },
    ],
    ['500', 'failed', { status: 500, body: refusal('INTERNAL') }],
  ] as const)('%s → %s', async (_, failure, answer) => {
    const view = await mountedSheet();
    answerNext('won', answer);
    expect(await sent(view, DRAFT)).toMatchObject({ kind: 'failed' });
    expect(view.result.current.won.failure).toBe(failure);
  });

  it.each([
    ['a zero value, refused by the contract', '0', 'value_needed'],
    ['a value past the currency, refused by the api', '450000.555', 'finer_than_currency'],
  ] as const)('%s → %s', async (_, finalValue, failure) => {
    const view = await mountedSheet();
    if (finalValue !== '0') {
      answerNext('won', { status: 400, body: refusalAt('VALIDATION_FAILED', 'finalValue') });
    }
    expect(await sent(view, { ...DRAFT, finalValue })).toMatchObject({ kind: 'failed' });
    expect(view.result.current.won.failure).toBe(failure);
  });
});
