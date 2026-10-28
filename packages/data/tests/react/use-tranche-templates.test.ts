// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mounted, refusal, seededTemplates, termsOrigin } from './tranche-templates-origin';

/**
 * The Payment terms page through the real client (`SCR-M01-20`): the list, one editor and its
 * one save, the three acts, and the preview the api prices. A failure keeps what was typed, a
 * second press sends nothing, and only the answer for the lines on screen is drawn.
 */

const [standard] = seededTemplates();
const STANDARD = standard?.id ?? '';
const OTHER = seededTemplates()[1]?.id ?? '';

describe('the Payment terms page — its list, its editor and its acts, through the real client', () => {
  it('reads the two given splits as seeded, never saved', async () => {
    const view = await mounted();

    expect(view.result.current.cards.inUse).toHaveLength(2);
    expect(view.result.current.seededOnly).toBe(true);
    expect(view.result.current.standing).toEqual({ kind: 'never-set' });
    expect(view.result.current.editor).toBeNull();
  });

  it('a failed read says so', async () => {
    termsOrigin.lists = [1, 2, 3].map(() => ({ status: 500, body: refusal('INTERNAL') }));
    const view = await mounted(false);

    await waitFor(() => expect(view.result.current.status).toBe('unread'), { timeout: 5000 });
  });

  it('a save with nothing changed closes and sends nothing', async () => {
    const view = await mounted();

    act(() => view.result.current.open(STANDARD));
    expect(view.result.current.editor?.changed).toBe(false);
    act(() => view.result.current.save());

    expect(view.result.current.editor).toBeNull();
    expect(termsOrigin.sent).toHaveLength(0);
  });

  it('a saved share reads back on its card and names who saved', async () => {
    const view = await mounted();

    act(() => view.result.current.open(STANDARD));
    act(() => view.result.current.edit({ kind: 'line-share', key: 2, share: 1500 }));
    act(() => view.result.current.edit({ kind: 'line-share', key: 3, share: 1500 }));
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.editor).toBeNull());

    const card = view.result.current.cards.inUse[0];
    expect(card?.lines.map((one) => one.percent)).toEqual(['10.00', '60.00', '15.00', '15.00']);
    await waitFor(() =>
      expect(view.result.current.standing).toMatchObject({
        kind: 'saved',
        name: 'Rajesh Kulkarni',
      }),
    );
  });

  it('a refused draft shows its refusals and sends nothing', async () => {
    const view = await mounted();

    act(() => view.result.current.open(STANDARD));
    act(() => view.result.current.edit({ kind: 'remove-line', key: 3 }));
    act(() => view.result.current.save());

    expect(view.result.current.editor?.refusalsShown).toBe(true);
    expect(view.result.current.editor?.verdict).toMatchObject({ state: 'under', remainder: 1000 });
    expect(termsOrigin.sent).toHaveLength(0);
  });

  it('a failed save keeps the draft', async () => {
    const view = await mounted();
    termsOrigin.writes = [{ status: 500, body: refusal('INTERNAL') }];

    act(() => view.result.current.open(STANDARD));
    act(() => view.result.current.edit({ kind: 'name', text: 'Renamed' }));
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.editor?.saveFailure).not.toBeNull());

    expect(view.result.current.editor?.saveConflict).toBe(false);
    expect(view.result.current.editor?.draft.name.shown).toBe('Renamed');
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.editor).toBeNull());
  });

  it('a refused connection keeps the draft', async () => {
    const view = await mounted();
    termsOrigin.writes = ['drop'];

    act(() => view.result.current.open(STANDARD));
    act(() => view.result.current.edit({ kind: 'name', text: 'Renamed' }));
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.editor?.saveFailure).not.toBeNull());

    expect(view.result.current.editor?.changed).toBe(true);
  });

  it('a second save while one runs sends nothing', async () => {
    const view = await mounted();
    termsOrigin.writes = [{ status: 200, afterMs: 200 }];

    act(() => view.result.current.open(STANDARD));
    act(() => view.result.current.edit({ kind: 'name', text: 'Renamed' }));
    act(() => {
      view.result.current.save();
      view.result.current.save();
    });
    await waitFor(() => expect(view.result.current.editor).toBeNull());

    expect(termsOrigin.sent).toHaveLength(1);
  });

  it('a create carries one key across a retry', async () => {
    const view = await mounted();
    termsOrigin.writes = ['drop'];

    act(() => view.result.current.openNew());
    act(() => view.result.current.edit({ kind: 'name', text: 'All upfront' }));
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.editor?.saveFailure).not.toBeNull());
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.editor).toBeNull());

    const [first, retry] = termsOrigin.sent;
    expect(first?.key).toBeDefined();
    expect(retry?.key).toBe(first?.key);
    expect(view.result.current.cards.inUse).toHaveLength(3);
  });

  it('a create answered after an edit is never sent twice', async () => {
    const view = await mounted();
    termsOrigin.writes = [{ status: 200, afterMs: 200 }];

    act(() => view.result.current.openNew());
    act(() => view.result.current.edit({ kind: 'name', text: 'All upfront' }));
    act(() => view.result.current.save());
    act(() => view.result.current.edit({ kind: 'name', text: 'All upfront, kept' }));
    await waitFor(() => expect(view.result.current.editor?.saving).toBe(false));
    expect(view.result.current.editor?.made).toBe(true);
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.editor).toBeNull());

    expect(termsOrigin.sent.map((one) => one.method)).toEqual(['POST', 'PUT']);
    expect(view.result.current.cards.inUse).toHaveLength(3);
  });

  it('a create answered while another new editor is open leaves that editor as it is', async () => {
    const view = await mounted();
    termsOrigin.writes = [{ status: 200, afterMs: 200 }];

    act(() => view.result.current.openNew());
    act(() => view.result.current.edit({ kind: 'name', text: 'All upfront' }));
    act(() => view.result.current.save());
    act(() => view.result.current.openNew());
    await waitFor(() => expect(view.result.current.cards.inUse).toHaveLength(3));

    expect(view.result.current.editor?.draft.id).toBeNull();
    expect(view.result.current.editor?.draft.name.shown).toBe('');
    expect(view.result.current.editor?.made).toBe(true);
  });

  it('the preview prices the saved lines, then the edit once it is whole', async () => {
    const view = await mounted();

    act(() => view.result.current.open(STANDARD));
    await waitFor(() => expect(view.result.current.editor?.preview?.schedule).not.toBeNull());
    expect(view.result.current.editor?.preview?.schedule?.amounts[1]).toBe('252000.00');

    act(() => view.result.current.edit({ kind: 'line-share', key: 1, share: 5000 }));
    expect(view.result.current.editor?.preview?.source).toBe('saved');
    act(() => view.result.current.edit({ kind: 'line-share', key: 2, share: 3000 }));
    await waitFor(() =>
      expect(view.result.current.editor?.preview?.schedule?.amounts[2]).toBe('126000.00'),
    );
    expect(view.result.current.editor?.preview?.source).toBe('draft');
  });

  it('an older preview answer is never drawn over a newer one', async () => {
    const view = await mounted();
    termsOrigin.previews = [{ status: 200 }, { status: 200, afterMs: 300 }, { status: 200 }];

    act(() => view.result.current.open(STANDARD));
    await waitFor(() => expect(view.result.current.editor?.preview?.schedule).not.toBeNull());
    act(() => {
      view.result.current.edit({ kind: 'line-share', key: 1, share: 5000 });
      view.result.current.edit({ kind: 'line-share', key: 2, share: 3000 });
    });
    act(() => view.result.current.edit({ kind: 'line-share', key: 2, share: 2000 }));
    act(() => view.result.current.edit({ kind: 'line-share', key: 3, share: 2000 }));
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(view.result.current.editor?.preview?.schedule?.amounts).toEqual([
      '42000.00',
      '210000.00',
      '84000.00',
      '84000.00',
    ]);
  });

  it('a failed preview never prices other lines', async () => {
    const view = await mounted();
    termsOrigin.previews = [
      { status: 200 },
      ...[1, 2, 3, 4].map(() => ({ status: 500, body: refusal('INTERNAL') })),
    ];

    act(() => view.result.current.open(STANDARD));
    await waitFor(() => expect(view.result.current.editor?.preview?.schedule).not.toBeNull());
    act(() => {
      view.result.current.edit({ kind: 'line-share', key: 1, share: 3000 });
      view.result.current.edit({ kind: 'line-share', key: 2, share: 5000 });
    });
    // The read and its two retries are refused; one refusal stays unasked.
    await waitFor(() => expect(termsOrigin.previews).toHaveLength(1), { timeout: 8000 });

    await waitFor(() => {
      const preview = view.result.current.editor?.preview;
      expect(preview?.lines.map((one) => one.percent)).toEqual([
        '10.00',
        '60.00',
        '20.00',
        '10.00',
      ]);
      expect(preview?.schedule?.amounts).toEqual(['42000.00', '252000.00', '84000.00', '42000.00']);
    });
  }, 12_000);

  it('a refused act changes nothing', async () => {
    const view = await mounted();
    termsOrigin.writes = [{ status: 500, body: refusal('INTERNAL') }];

    act(() => view.result.current.act(OTHER, 'archive'));
    await waitFor(() => expect(view.result.current.actFailure).not.toBeNull());

    expect(view.result.current.cards.archived).toHaveLength(0);
    act(() => view.result.current.dismissActFailure());
    expect(view.result.current.actFailure).toBeNull();
  });

  it('a conflict reloads the list', async () => {
    const view = await mounted();
    termsOrigin.writes = [{ status: 409, body: refusal('CONFLICT') }];
    const reads = termsOrigin.listReads;

    act(() => view.result.current.act(OTHER, 'make-default'));
    await waitFor(() => expect(view.result.current.actFailure).not.toBeNull());

    await waitFor(() => expect(termsOrigin.listReads).toBe(reads + 1));
  });

  it('a save refused by a conflict says so and reloads the list', async () => {
    const view = await mounted();
    termsOrigin.writes = [{ status: 409, body: refusal('CONFLICT') }];
    const reads = termsOrigin.listReads;

    act(() => view.result.current.open(STANDARD));
    act(() => view.result.current.edit({ kind: 'name', text: 'Renamed' }));
    act(() => view.result.current.save());
    await waitFor(() => expect(view.result.current.editor?.saveConflict).toBe(true));

    await waitFor(() => expect(termsOrigin.listReads).toBe(reads + 1));
    expect(view.result.current.editor?.draft.name.shown).toBe('Renamed');
  });

  it('an archive closes the editor and moves the card; a restore puts it back', async () => {
    const view = await mounted();

    act(() => view.result.current.open(OTHER));
    act(() => view.result.current.act(OTHER, 'archive'));
    await waitFor(() => expect(view.result.current.cards.archived).toHaveLength(1));
    expect(view.result.current.editor).toBeNull();

    act(() => view.result.current.act(OTHER, 'restore'));
    await waitFor(() => expect(view.result.current.cards.archived).toHaveLength(0));
    expect(view.result.current.cards.inUse.map((card) => card.isDefault)).toEqual([true, false]);
  });
});
