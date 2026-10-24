// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  FINANCE,
  ISHA,
  mounted,
  openAndTick,
  origin,
  READ_RETRIES_MS,
  refusal,
  rowOf,
  VIKRAM,
} from './assign-roles-origin';

/**
 * Assign Roles' save, end to end through the real client: every answer the origin can give a save
 * — what QA once drove by hand on three surfaces (`T-M01-013` AC-13 … AC-16, AC-25, AC-29, AC-30).
 */
describe('Assign Roles — every answer to a save, through the real client', () => {
  it('200: the sheet closes and the row reads the new set', async () => {
    const view = await mounted();
    openAndTick(view, VIKRAM, FINANCE);
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.open).toBe(false));
    await waitFor(() => expect(rowOf(view, VIKRAM.membershipId).roles).toContain(FINANCE));
    expect(view.result.current.editor.refusal).toBeNull();
  });

  it('500: nothing changed, the ticks stay, Save is the retry', async () => {
    const view = await mounted();
    origin.saves = [{ status: 500, body: refusal('INTERNAL') }];
    openAndTick(view, VIKRAM, FINANCE);
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.refusal).toEqual({ kind: 'failed' }));
    expect(view.result.current.editor.open).toBe(true);
    expect(view.result.current.editor.picked).toContain(FINANCE);
    expect(view.result.current.editor.saveOff).toBeNull();
  });

  it('409: gone, the person read again as deactivated, Save off', async () => {
    const view = await mounted();
    origin.saves = [{ status: 409, body: refusal('CONFLICT') }];
    openAndTick(view, VIKRAM, FINANCE);
    const vikram = origin.roster.find((m) => m.membershipId === VIKRAM.membershipId);
    if (vikram) vikram.status = 'deactivated';
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.refusal).toEqual({ kind: 'gone' }));
    expect(view.result.current.editor.person?.status).toBe('deactivated');
    expect(view.result.current.editor.saveOff).toBe('gone');
  });

  it.each([
    ['LAST_OWNER', 'last-owner'],
    ['OWN_ADMIN', 'own-admin'],
  ] as const)('422 %s: the sheet says why and keeps the ticks', async (code, kind) => {
    const view = await mounted();
    origin.saves = [{ status: 422, body: refusal(code) }];
    openAndTick(view, VIKRAM, FINANCE);
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.refusal).toEqual({ kind }));
    expect(view.result.current.editor.picked).toContain(FINANCE);
  });

  it('403: the sheet closes and the person is read again', async () => {
    const view = await mounted();
    const before = origin.sessionReads;
    origin.saves = [{ status: 403, body: refusal('FORBIDDEN') }];
    openAndTick(view, VIKRAM, FINANCE);
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.open).toBe(false));
    await waitFor(() => expect(origin.sessionReads).toBeGreaterThan(before));
  });

  it('no answer, and it landed (F8-36): read back, the sheet closes as on a 200', async () => {
    const view = await mounted();
    const vikram = origin.roster.find((m) => m.membershipId === VIKRAM.membershipId);
    origin.saves = ['drop'];
    openAndTick(view, VIKRAM, FINANCE);
    if (vikram) vikram.roles = [...VIKRAM.roles, FINANCE];
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.open).toBe(false));
    expect(view.result.current.editor.refusal).toBeNull();
  });

  it('no answer, and it did not land: nothing changed', async () => {
    const view = await mounted();
    origin.saves = ['drop'];
    openAndTick(view, VIKRAM, FINANCE);
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.refusal).toEqual({ kind: 'failed' }));
    expect(view.result.current.editor.open).toBe(true);
  });

  it(
    'no answer, and the list does not answer either: unconfirmed, by its failure',
    async () => {
      const view = await mounted();
      origin.saves = ['drop'];
      openAndTick(view, VIKRAM, FINANCE);
      origin.dropReads = true;
      act(() => view.result.current.editor.save());
      // The read retries twice on no answer before it gives up (packages/data/CLAUDE.md, Retry).
      await waitFor(
        () => expect(view.result.current.editor.refusal).toMatchObject({ kind: 'unconfirmed' }),
        { timeout: READ_RETRIES_MS },
      );
      expect(view.result.current.editor.saveOff).toBeNull();
    },
    READ_RETRIES_MS + 5_000,
  );

  it('a late answer lands only on the sheet it was sent from (AC-29)', async () => {
    const view = await mounted();
    origin.saves = [{ status: 500, body: refusal('INTERNAL'), afterMs: 300 }];
    openAndTick(view, VIKRAM, FINANCE);
    act(() => view.result.current.editor.save());
    act(() => view.result.current.editor.close());
    act(() => view.result.current.editor.openerOf(rowOf(view, ISHA.membershipId))?.());
    expect(view.result.current.editor.saving).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(view.result.current.editor.person?.id).toBe(ISHA.membershipId);
    expect(view.result.current.editor.refusal).toBeNull();
    expect(view.result.current.editor.saving).toBe(false);
  });

  it('a second tap while the save is out sends nothing more', async () => {
    const view = await mounted();
    origin.saves = [{ status: 200, afterMs: 200 }];
    openAndTick(view, VIKRAM, FINANCE);
    act(() => {
      view.result.current.editor.save();
      view.result.current.editor.save();
    });
    await waitFor(() => expect(view.result.current.editor.open).toBe(false));
    expect(origin.puts).toBe(1);
  });
});
