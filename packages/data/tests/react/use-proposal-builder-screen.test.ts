// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { bodies, mounted, readyOf, stepOf } from './proposal-builder-mounted';
import { PROPOSAL, proposalDetail } from './proposals-fixtures';
import { refusal, sell } from './proposals-origin';

/**
 * The builder's one view model through the real client (`SCR-M06-02`…`SCR-M06-13`): a step's commit
 * reaches the server in order and its answer's money shows; a refused commit keeps what was typed;
 * Quick mode presents exactly its four steps; a blocked Generate lists every failure and each jump
 * lands on its step; the plan's limit is its own state; and step 4 fills itself once.
 */

describe('a step’s commit — in order, and the server’s figures show', () => {
  it('two fields left one after the other reach the server in order, each on the last revision', async () => {
    sell.writes = [{ status: 200, afterMs: 40 }];
    const { view } = await mounted();

    act(() => stepOf(view.result.current, 'system').onPrice(200000));
    act(() => stepOf(view.result.current, 'system').onCapacity(4));
    expect(readyOf(view.result.current).frame.recomputing).toBe(true);
    await waitFor(() => expect(readyOf(view.result.current).frame.recomputing).toBe(false));

    expect(bodies().map((body) => body.revision)).toEqual([0, 1]);
    expect(bodies()[0]).toMatchObject({ fields: { system: { priceInclusive: '200000.00' } } });
    expect(bodies()[1]).toMatchObject({ fields: { system: { capacityKw: 4 } } });
    expect(readyOf(view.result.current).frame.payableText).toBe('₹2,00,000');
    expect(readyOf(view.result.current).frame.save).toEqual({ kind: 'saved' });
  });

  it('a commit the server does not take keeps what was typed and says not saved, with its retry', async () => {
    sell.writes = [{ status: 500, body: refusal('INTERNAL') }];
    const { view } = await mounted();

    act(() => stepOf(view.result.current, 'system').onPrice(200000));
    await waitFor(() =>
      expect(stepOf(view.result.current, 'system').saves.price?.kind).toBe('unsaved'),
    );

    expect(stepOf(view.result.current, 'system').priceInclusive).toBe(200000);
    expect(readyOf(view.result.current).frame.save).toEqual({ kind: 'unsaved', count: 1 });
    expect(readyOf(view.result.current).frame.payableText).toBe('₹1,90,575');

    act(() => stepOf(view.result.current, 'system').saves.price?.onRetry?.());
    await waitFor(() => expect(readyOf(view.result.current).frame.save).toEqual({ kind: 'saved' }));
    expect(readyOf(view.result.current).frame.payableText).toBe('₹2,00,000');
  });

  it('a lead fact typed on a step is sent as the lead’s own, not as a step', async () => {
    const { view } = await mounted('client');

    act(() => stepOf(view.result.current, 'client').onAddress(' 14 Baner Road '));
    await waitFor(() => expect(sell.sent).toHaveLength(1));

    expect(bodies()[0]).toMatchObject({ deal: { siteAddress: '14 Baner Road' } });
    expect(bodies()[0]).not.toHaveProperty('fields');
  });
});

describe('step 1’s cover — the company’s own photo is always offered (M06-07)', () => {
  it('offers the photo Proposal defaults keep, and picking it sends the company’s own file', async () => {
    const fileId = '01a30000-0000-7000-8000-00000000f001';
    sell.proposal = {
      ...proposalDetail({}),
      companyCover: { fileId, url: 'https://store/own.jpg' },
    };
    const { view } = await mounted('company');

    expect(stepOf(view.result.current, 'company').covers).toContainEqual({
      key: 'own',
      src: 'https://store/own.jpg',
    });
    act(() => stepOf(view.result.current, 'company').onCover('own'));
    await waitFor(() => expect(sell.sent).toHaveLength(1));

    expect(bodies()[0]).toMatchObject({
      fields: { company: { coverPicture: { kind: 'own', fileId } } },
    });
  });
});

describe('step 5’s monthly bill — the lead’s own, carried both ways (T-M06-007)', () => {
  it('a bill typed on step 5 is sent as the lead’s own fact, not as a step', async () => {
    const { view } = await mounted('financials');

    act(() => stepOf(view.result.current, 'financials').onMonthlyBill(4200));
    await waitFor(() => expect(sell.sent).toHaveLength(1));

    expect(bodies()[0]).toMatchObject({ deal: { monthlyBill: '4200.00' } });
    expect(bodies()[0]).not.toHaveProperty('fields');
  });
});

describe('step 3’s Category — the lead’s own segment, written back (M06-09)', () => {
  it('shows the lead’s segment and sends a pick as the lead’s own fact, not as a step', async () => {
    const { view } = await mounted('system');
    expect(stepOf(view.result.current, 'system').segment).toBe(
      proposalDetail({}).document.deal.segment,
    );

    act(() => stepOf(view.result.current, 'system').onSegment('commercial'));
    await waitFor(() => expect(sell.sent).toHaveLength(1));

    expect(bodies()[0]).toMatchObject({ deal: { segment: 'commercial' } });
    expect(bodies()[0]).not.toHaveProperty('fields');
  });
});

describe('step 3’s incentive switch — named by the pack before any price (M06-38)', () => {
  it('carries the scheme, what it binds and who it pays, whatever the money says', async () => {
    const { view } = await mounted('system');
    await waitFor(() => expect(stepOf(view.result.current, 'system').incentive).toBeDefined());

    expect(stepOf(view.result.current, 'system').incentive).toMatchObject({
      name: 'PM Surya Ghar',
      requiredScheme: 'DCR',
      paidTo: 'customer',
    });
  });
});

describe('Quick mode — four steps presented, none lost (M06-18, M06-19)', () => {
  it('presents exactly steps 1, 3, 8 and 10, and still lists all eleven', async () => {
    sell.proposal = proposalDetail({ quickMode: true });
    const { view } = await mounted(null);

    const { frame } = readyOf(view.result.current);
    expect(frame.steps.map((one) => one.step)).toEqual([
      'company',
      'system',
      'components',
      'client',
    ]);
    expect(frame.allSteps).toHaveLength(11);
    expect(frame.allSteps.filter((one) => one.quiet).map((one) => one.step)).toEqual([
      'achievements',
      'performance',
      'financials',
      'timeline',
      'payment',
      'terms',
      'bank',
    ]);
    expect(frame.current).toBe('company');
  });

  it('opening a step Quick mode hides leaves the mode and goes there', async () => {
    sell.proposal = proposalDetail({ quickMode: true });
    const { view, moves } = await mounted('system');

    act(() => view.result.current.goStep('payment'));

    // Quick mode's own fill of steps 4 and 5 may reach the origin first; the switch is its own write.
    await waitFor(() =>
      expect(bodies()).toContainEqual(expect.objectContaining({ quickMode: false })),
    );
    expect(moves.toStep).toHaveBeenCalledWith('payment');
  });
});

describe('the check before Generate (M06-22, M06-23, T-M06-028)', () => {
  it('lists every failure, and each jump lands on its own step and shuts the sheet', async () => {
    sell.proposal = {
      ...proposalDetail({}),
      checklist: {
        blocks: [
          { step: 'components', fields: [], check: 'component_missing', category: 'structure' },
          {
            step: 'payment',
            fields: ['payment.tranches'],
            check: 'tranches_not_whole',
            allocatedPercent: '88.00',
            remainderPercent: '12.00',
          },
        ],
        warnings: [],
        skipped: [],
        canGenerate: false,
      },
    };
    const { view, moves } = await mounted();

    act(() => view.result.current.openCheck());
    const { check } = view.result.current;
    expect(check.open).toBe(true);
    expect(check.verdict?.blocks).toEqual([
      { step: 'components', fields: [], check: 'component_missing', category: 'structure' },
      {
        step: 'payment',
        fields: ['payment.tranches'],
        check: 'tranches_not_whole',
        allocated: 88,
        remainder: 12,
      },
    ]);
    expect(readyOf(view.result.current).frame.toFix).toBe(2);

    act(() => view.result.current.check.fix('payment'));
    expect(moves.toStep).toHaveBeenCalledWith('payment');
    expect(view.result.current.check.open).toBe(false);
  });

  it('the plan’s limit is its own state, and the draft stays', async () => {
    const blocked = {
      reason: 'cap',
      key: 'proposals_per_cycle',
      capability: 'sell_and_deliver',
      resetsAt: '2026-12-01T00:00:00.000Z',
    };
    sell.writes = [
      { status: 403, body: { error: { ...refusal('ENTITLEMENT_BLOCKED').error, blocked } } },
    ];
    const { view } = await mounted();

    act(() => view.result.current.openCheck());
    act(() => view.result.current.check.generate());
    await waitFor(() =>
      expect(view.result.current.check.failure).toEqual({ kind: 'billing', blocked }),
    );
    expect(view.result.current.ready).toBeNull();
    expect(view.result.current.read.kind).toBe('ready');
  });

  it('a Generate that lands opens the screen after it, with the server’s number', async () => {
    const { view, moves } = await mounted();

    act(() => view.result.current.openCheck());
    act(() => view.result.current.check.generate());
    await waitFor(() => expect(view.result.current.ready).not.toBeNull());

    expect(view.result.current.ready?.made).toEqual({ number: 'PRP-0042', version: 1 });
    expect(view.result.current.check.open).toBe(false);
    act(() => view.result.current.ready?.share());
    expect(moves.toProposal).toHaveBeenCalledWith(PROPOSAL);
  });
});

describe('step 10 marks its own missing State once Generate is asked (M06-22)', () => {
  it.each([
    ['no state on the lead, check asked', null, true, true],
    ['no state on the lead, check not asked', null, false, false],
    ['a state on the lead, check asked', { area: 'IN-MH', district: null }, true, false],
  ] as const)('%s', async (_, area, asked, missing) => {
    const detail = proposalDetail({});
    sell.proposal = {
      ...detail,
      document: { ...detail.document, deal: { ...detail.document.deal, area } },
    };
    const { view } = await mounted('client');

    if (asked) act(() => view.result.current.openCheck());

    expect(stepOf(view.result.current, 'client').areaMissing).toBe(missing);
  });
});

describe('step 4 fills itself — once (T-M06-006)', () => {
  it('asks for the generation the first time the step opens with a place and a size, and not again', async () => {
    const { view } = await mounted('performance');

    await waitFor(() => expect(sell.sent).toHaveLength(1));
    expect(sell.sent[0]?.path).toBe(`/proposals/${PROPOSAL}/energy`);
    expect(bodies()[0]).toMatchObject({ mode: 'fill' });

    /* Another field saved after the fill: the fill's own state is no longer the last word, and the
       answer left the generation unfilled — only the once-guard keeps the step from asking again. */
    await waitFor(() => expect(readyOf(view.result.current).frame.recomputing).toBe(false));
    act(() => stepOf(view.result.current, 'performance').onEfficiency(85));
    await waitFor(() => expect(sell.sent).toHaveLength(2));
    view.rerender();
    await waitFor(() => expect(readyOf(view.result.current).frame.recomputing).toBe(false));
    expect(sell.sent.map((write) => write.path)).toEqual([
      `/proposals/${PROPOSAL}/energy`,
      `/proposals/${PROPOSAL}`,
    ]);
  });

  it('another step asks for nothing', async () => {
    await mounted('system');
    expect(sell.sent).toHaveLength(0);
  });

  it('Quick mode fills steps 4 and 5 by itself on any step, since it never shows them (M06-18)', async () => {
    sell.proposal = proposalDetail({ quickMode: true });
    await mounted('system');

    await waitFor(() => expect(sell.sent).toHaveLength(1));
    expect(sell.sent[0]?.path).toBe(`/proposals/${PROPOSAL}/energy`);
    expect(bodies()[0]).toMatchObject({ mode: 'fill' });
  });
});
