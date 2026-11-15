// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { bodies, mounted, readyOf, stepOf } from './proposal-builder-mounted';
import { proposalDetail } from './proposals-fixtures';
import { refusal, sell } from './proposals-origin';

/**
 * What the builder asks on a sheet of its own, through the real client: the note a version from the
 * second on carries (`M06-42`), a payment part's name and due stage (`T-M06-009`), and a value the
 * server refuses said at its field (`F8-36`).
 */

describe('a later version says what changed (M06-42)', () => {
  const versioned = () => ({
    ...proposalDetail({}),
    versions: [
      {
        version: 1,
        generatedAt: '2026-11-13T12:32:00.000Z',
        generatedBy: null,
        trigger: 'first_generate',
        changeNote: null,
        payable: '190575.00',
        sharedAt: null,
        answer: null,
        answeredAt: null,
        onLink: false,
        inForce: false,
      },
    ],
  });

  it('a first version asks for no note', async () => {
    const { view } = await mounted();
    act(() => view.result.current.openCheck());
    expect(view.result.current.check.changeNote).toBeNull();
  });

  it('from version 2 on, Generate is not sent while the note is empty, and says so', async () => {
    sell.proposal = versioned();
    const { view } = await mounted();

    act(() => view.result.current.openCheck());
    act(() => view.result.current.check.changeNote?.type('   '));
    act(() => view.result.current.check.generate());

    expect(view.result.current.check.noteMissing).toBe(true);
    expect(sell.sent).toHaveLength(0);
  });

  it('the note typed is sent with Generate, trimmed', async () => {
    sell.proposal = versioned();
    const { view } = await mounted();

    act(() => view.result.current.openCheck());
    act(() => view.result.current.check.changeNote?.type(' Bigger inverter, as Anil asked '));
    act(() => view.result.current.check.generate());
    await waitFor(() => expect(sell.sent).toHaveLength(1));

    expect(bodies()[0]).toMatchObject({ changeNote: 'Bigger inverter, as Anil asked' });
    expect(view.result.current.check.noteMissing).toBe(false);
  });
});

describe('step 7 — a part’s own sheet: its name and its due stage (M06-13, T-M06-009)', () => {
  it('Add a part opens the sheet on a new part, due where the last one is, and offers stages', async () => {
    const { view } = await mounted('payment');
    const before = stepOf(view.result.current, 'payment').parts;

    act(() => stepOf(view.result.current, 'payment').onAdd());
    const sheet = view.result.current.paymentPart;

    expect(sheet).toMatchObject({ number: before.length + 1, isNew: true });
    expect(sheet?.part).toEqual({
      label: `Part ${before.length + 1}`,
      dueOnStage: before.at(-1)?.dueOnStage,
    });
    // A home deal on the incentive path visits the claim stage; a business deal's never would.
    expect(sheet?.stages).toContain('incentive_claimed');
    expect(sell.sent).toHaveLength(0);
  });

  it('Done adds the part with the stage picked and what is left of the hundred, off any plan', async () => {
    const { view } = await mounted('payment');
    const before = stepOf(view.result.current, 'payment').parts;

    act(() => stepOf(view.result.current, 'payment').onAdd());
    act(() =>
      view.result.current.paymentPart?.done({ label: 'Retention', dueOnStage: 'commissioned' }),
    );
    await waitFor(() => expect(sell.sent).toHaveLength(1));

    const sent = bodies()[0] as {
      fields: { payment: { templateId: unknown; tranches: unknown[] } };
    };
    expect(sent.fields.payment.templateId).toBeNull();
    expect(sent.fields.payment.tranches).toHaveLength(before.length + 1);
    expect(sent.fields.payment.tranches.at(-1)).toMatchObject({
      label: 'Retention',
      dueOnStage: 'commissioned',
    });
    expect(view.result.current.paymentPart).toBeNull();
  });

  it('a part’s row opens the sheet on that part, and Done renames it in place', async () => {
    const { view } = await mounted('payment');
    const first = stepOf(view.result.current, 'payment').parts[0];

    act(() => stepOf(view.result.current, 'payment').onOpen(0));
    expect(view.result.current.paymentPart).toMatchObject({ number: 1, isNew: false });
    act(() =>
      view.result.current.paymentPart?.done({
        label: 'Booking amount',
        dueOnStage: first?.dueOnStage ?? 'won',
      }),
    );
    await waitFor(() => expect(sell.sent).toHaveLength(1));

    const sent = bodies()[0] as {
      fields: { payment: { tranches: { label: string; percent: string }[] } };
    };
    expect(sent.fields.payment.tranches[0]?.label).toBe('Booking amount');
    expect(Number(sent.fields.payment.tranches[0]?.percent)).toBe(first?.percent);
  });
});

describe('a value the server refuses says why at its field (F8-36)', () => {
  it('a 422 is a refusal with the server’s reason, never a plain not-saved', async () => {
    sell.writes = [{ status: 422, body: refusal('DOMAIN_RULE_VIOLATION') }];
    const { view } = await mounted();

    act(() => stepOf(view.result.current, 'system').onPrice(1));
    await waitFor(() =>
      expect(stepOf(view.result.current, 'system').saves.price?.kind).toBe('refused'),
    );

    expect(stepOf(view.result.current, 'system').saves.price?.failure).toMatchObject({
      kind: 'failed',
      code: 'DOMAIN_RULE_VIOLATION',
    });
    expect(readyOf(view.result.current).frame.save).not.toEqual({ kind: 'saved' });
  });
});

describe('step 8 — a part the server refuses says why at the step (F8-36, M06-27)', () => {
  it('a fourth brand refused reads refused with the server’s field, never nothing', async () => {
    const { view } = await mounted('components');
    act(() => view.result.current.parts.open('panel'));
    sell.writes = [
      {
        status: 422,
        body: {
          error: {
            code: 'DOMAIN_RULE_VIOLATION',
            message: 'A section holds up to 3 brands.',
            requestId: 'test',
            details: [{ path: 'fields.components', issue: 'at most 3 brands in panel' }],
          },
        },
      },
    ];

    act(() =>
      view.result.current.parts.add({
        brand: 'Fourth',
        specification: '550 Wp',
        warranty: '',
      }),
    );
    await waitFor(() =>
      expect(stepOf(view.result.current, 'components').saves.components?.kind).toBe('refused'),
    );

    expect(stepOf(view.result.current, 'components').saves.components?.failure).toMatchObject({
      kind: 'failed',
      code: 'DOMAIN_RULE_VIOLATION',
      details: [{ path: 'fields.components' }],
    });
  });
});
