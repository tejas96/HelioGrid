// @vitest-environment happy-dom
import { IN_FORMATS } from '@heliogrid/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProposalTemplateScreen } from '../../src/react/use-proposal-template-screen';
import { DEFAULTS, providedTemplate, refusal, templateOrigin } from './proposal-template-origin';
import { STANDARD_SPLIT, termsOrigin } from './tranche-templates-origin';

/**
 * Proposal defaults as both screens draw it (`T-M01-030`), through the real client: the page's one
 * *Save* sends each record that changed — the page's template, the default payment plan and the
 * account typed here — each to its own route; a plan that does not save keeps its changes and says
 * so, while what did save is let go.
 */

const SAID = {
  formats: IN_FORMATS,
  newPart: (n: number) => `Part ${n}`,
  customer: { name: 'Anil Sharma', siteAddress: '12 Baner Road', area: 'IN-MH', district: 'Pune' },
};

async function mounted() {
  const view = renderHook(() => useProposalTemplateScreen(DEFAULTS, STANDARD_SPLIT, SAID), {
    wrapper: providedTemplate(),
  });
  await waitFor(() => expect(view.result.current.page.read.kind).toBe('ready'));
  await waitFor(() => expect(view.result.current.plan.lines).not.toBeNull());
  return view;
}

const planWrites = () => termsOrigin.sent.filter((write) => write.method === 'PUT');
const shares = (lines: readonly { percent: string }[] | null) =>
  (lines ?? []).map((line) => line.percent);

describe('Proposal defaults — one Save for the page, the plan and the account', () => {
  it('nothing changed holds nothing', async () => {
    const view = await mounted();
    expect(view.result.current.held).toBe(false);
  });

  it('sends the page, the plan and the account, each once, then holds nothing', async () => {
    const view = await mounted();
    act(() => view.result.current.page.edit({ kind: 'section', section: 'performance' }));
    act(() => view.result.current.plan.share(0, 15));
    act(() => view.result.current.plan.share(1, 55));
    act(() => view.result.current.page.bank.edit('accountNumber', '50200099990000'));
    expect(view.result.current.held).toBe(true);

    act(() => view.result.current.save());

    await waitFor(() => expect(view.result.current.held).toBe(false));
    expect(templateOrigin.templateBodies).toHaveLength(1);
    expect(templateOrigin.timelineBodies).toHaveLength(0);
    expect(planWrites()).toHaveLength(1);
    const sent = planWrites()[0]?.body as { lines: { percent: string }[] } | undefined;
    expect(shares(sent?.lines ?? null)).toEqual(['15.00', '55.00', '20.00', '10.00']);
    expect(templateOrigin.profileBodies).toEqual([
      expect.objectContaining({
        bankDetails: expect.objectContaining({ accountNumber: '50200099990000' }),
      }),
    ]);
  });

  it('a plan alone changed sends the plan alone', async () => {
    const view = await mounted();
    act(() => view.result.current.plan.share(0, 15));
    act(() => view.result.current.plan.share(1, 55));

    act(() => view.result.current.save());

    await waitFor(() => expect(view.result.current.held).toBe(false));
    expect(planWrites()).toHaveLength(1);
    expect(templateOrigin.templateBodies).toHaveLength(0);
    expect(templateOrigin.profileBodies).toHaveLength(0);
  });

  it('a plan that does not save keeps its changes and says so; the page that saved is let go', async () => {
    const view = await mounted();
    termsOrigin.writes = [{ status: 500, body: refusal('INTERNAL') }];
    act(() => view.result.current.page.edit({ kind: 'section', section: 'performance' }));
    act(() => view.result.current.plan.share(0, 15));
    act(() => view.result.current.plan.share(1, 55));

    act(() => view.result.current.save());

    await waitFor(() => expect(view.result.current.plan.failed).toBe(true));
    await waitFor(() => expect(view.result.current.page.changed.template).toBe(false));
    expect(templateOrigin.templateBodies).toHaveLength(1);
    expect(view.result.current.plan.changed).toBe(true);
    expect(shares(view.result.current.plan.lines)).toEqual(['15.00', '55.00', '20.00', '10.00']);
    expect(view.result.current.held).toBe(true);
  });
});
