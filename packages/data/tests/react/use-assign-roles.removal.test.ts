// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  DESIGN,
  mounted,
  origin,
  READ_RETRIES_MS,
  refusal,
  rowOf,
  SURVEY,
  VIKRAM,
  type View,
} from './assign-roles-origin';

/**
 * A save that takes presets away, end to end through the real client (`T-M01-013` part c): it asks
 * first, writes once on the confirm, hands the screen its undo, and the undo writes the old set back
 * once — AC-20 … AC-22, AC-27.
 */
function openAndClearDesign(view: View) {
  act(() => view.result.current.editor.openerOf(rowOf(view, VIKRAM.membershipId))?.());
  act(() => view.result.current.editor.pick([SURVEY]));
}

describe('Assign Roles — a removal, through the real client', () => {
  it('Save asks first: the confirm names what leaves and nothing is written', async () => {
    const view = await mounted();
    openAndClearDesign(view);
    act(() => view.result.current.editor.save());
    expect(view.result.current.editor.confirm).toEqual({
      added: [],
      removed: [DESIGN],
      lost: [DESIGN],
    });
    expect(origin.puts).toBe(0);
  });

  it('Cancel goes back to the editor with the ticks kept', async () => {
    const view = await mounted();
    openAndClearDesign(view);
    act(() => view.result.current.editor.save());
    act(() => view.result.current.editor.cancelRemove());
    expect(view.result.current.editor.confirm).toBeNull();
    expect(view.result.current.editor.open).toBe(true);
    expect(view.result.current.editor.picked).toEqual([SURVEY]);
    expect(origin.puts).toBe(0);
  });

  it('Remove role writes once, closes, draws the new set at once and hands on the undo', async () => {
    const view = await mounted();
    openAndClearDesign(view);
    act(() => view.result.current.editor.save());
    act(() => view.result.current.editor.removeConfirmed());
    await waitFor(() => expect(view.result.current.editor.open).toBe(false));
    expect(origin.puts).toBe(1);
    expect(rowOf(view, VIKRAM.membershipId).roles).toEqual([SURVEY]);
    expect(view.told.removed).toHaveLength(1);
    expect(view.told.removed[0]?.removal).toMatchObject({
      id: VIKRAM.membershipId,
      before: VIKRAM.roles,
      removed: [DESIGN],
    });
  });

  it('Undo writes the old set back, once however often it is called', async () => {
    const view = await mounted();
    openAndClearDesign(view);
    act(() => view.result.current.editor.save());
    act(() => view.result.current.editor.removeConfirmed());
    await waitFor(() => expect(view.told.removed).toHaveLength(1));
    const undo = view.told.removed[0]?.undo;
    act(() => {
      undo?.();
      undo?.();
    });
    await waitFor(() => expect(rowOf(view, VIKRAM.membershipId).roles).toEqual(VIKRAM.roles));
    expect(origin.puts).toBe(2);
    expect(view.told.undoFailed).toHaveLength(0);
  });

  it('an undo that lands while the person is open brings their sheet level with the server', async () => {
    const view = await mounted();
    openAndClearDesign(view);
    act(() => view.result.current.editor.save());
    act(() => view.result.current.editor.removeConfirmed());
    await waitFor(() => expect(view.told.removed).toHaveLength(1));
    act(() => view.result.current.editor.openerOf(rowOf(view, VIKRAM.membershipId))?.());
    expect(view.result.current.editor.picked).toEqual([SURVEY]);
    act(() => view.told.removed[0]?.undo());
    await waitFor(() => expect(view.result.current.editor.picked).toEqual(VIKRAM.roles));
    expect(view.result.current.editor.saveOff).toBe('unchanged');
  });

  it(
    'an undo that gets no answer, with the list unread too, says so by its failure (AC-27)',
    async () => {
      const view = await mounted();
      openAndClearDesign(view);
      act(() => view.result.current.editor.save());
      act(() => view.result.current.editor.removeConfirmed());
      await waitFor(() => expect(view.told.removed).toHaveLength(1));
      origin.saves = ['drop'];
      origin.dropReads = true;
      act(() => view.told.removed[0]?.undo());
      await waitFor(() => expect(view.told.undoFailed).toHaveLength(1), {
        timeout: READ_RETRIES_MS,
      });
      expect(view.told.undoFailed[0]?.refusal).toMatchObject({ kind: 'unconfirmed' });
      expect(rowOf(view, VIKRAM.membershipId).roles).toEqual([SURVEY]);
    },
    READ_RETRIES_MS + 5_000,
  );

  it('an undo refused 500 says nothing changed', async () => {
    const view = await mounted();
    openAndClearDesign(view);
    act(() => view.result.current.editor.save());
    act(() => view.result.current.editor.removeConfirmed());
    await waitFor(() => expect(view.told.removed).toHaveLength(1));
    origin.saves = [{ status: 500, body: refusal('INTERNAL') }];
    act(() => view.told.removed[0]?.undo());
    await waitFor(() => expect(view.told.undoFailed).toHaveLength(1));
    expect(view.told.undoFailed[0]?.refusal).toEqual({ kind: 'failed' });
  });
});
