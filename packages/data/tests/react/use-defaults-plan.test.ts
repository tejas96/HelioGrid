// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDefaultsPlan } from '../../src/react/use-defaults-plan';
import { useTrancheTemplates } from '../../src/react/use-tranche-templates';
import { providedTerms, refusal, STANDARD_SPLIT, termsOrigin } from './tranche-templates-origin';

/**
 * Proposal defaults' Payment part (`T-M01-030`), through the real client: the default plan edited
 * with step 7's rows, held until the page's one *Save*, which writes the plan where it lives — the
 * company's tranche template. A failed save keeps every change and says so.
 */

async function mountedPlan() {
  const view = renderHook(
    () => {
      const terms = useTrancheTemplates(STANDARD_SPLIT);
      const card = terms.cards.inUse.find((each) => each.isDefault) ?? null;
      return { terms, plan: useDefaultsPlan(card, (n) => `Part ${n}`) };
    },
    { wrapper: providedTerms() },
  );
  await waitFor(() => expect(view.result.current.plan.lines).not.toBeNull());
  return view;
}

const shares = (lines: readonly { percent: string }[] | null) =>
  (lines ?? []).map((line) => line.percent);
const writes = () => termsOrigin.sent.filter((write) => write.method === 'PUT');

describe('the default plan, edited inline and saved with the page', () => {
  it('reads the default plan as saved, nothing held', async () => {
    const view = await mountedPlan();
    expect(shares(view.result.current.plan.lines)).toEqual(['10.00', '60.00', '20.00', '10.00']);
    expect(view.result.current.plan.changed).toBe(false);
  });

  it('a share moved, a part removed and one added are held, and nothing is sent', async () => {
    const view = await mountedPlan();
    act(() => view.result.current.plan.share(0, 15));
    act(() => view.result.current.plan.remove(3));
    act(() => view.result.current.plan.add());

    expect(shares(view.result.current.plan.lines)).toEqual(['15.00', '60.00', '20.00', '5.00']);
    expect(view.result.current.plan.lines?.at(-1)).toMatchObject({
      label: 'Part 4',
      dueOnStage: 'installation',
    });
    expect(view.result.current.plan.changed).toBe(true);
    expect(writes()).toHaveLength(0);
  });

  it('Save writes the plan whole to its own template, then holds nothing', async () => {
    const view = await mountedPlan();
    act(() => view.result.current.plan.share(0, 15));
    act(() => view.result.current.plan.share(1, 55));
    act(() => view.result.current.plan.save());

    await waitFor(() => expect(view.result.current.plan.changed).toBe(false));
    expect(writes()).toHaveLength(1);
    expect(writes()[0]?.path).toBe(
      `/settings/tranche-templates/${view.result.current.terms.cards.inUse[0]?.id}`,
    );
    expect(writes()[0]?.body).toMatchObject({
      name: 'Standard 10/60/20/10',
      lines: [
        { percent: '15.00' },
        { percent: '55.00' },
        { percent: '20.00' },
        { percent: '10.00' },
      ],
    });
  });

  it('nothing changed sends nothing', async () => {
    const view = await mountedPlan();
    act(() => view.result.current.plan.save());
    expect(writes()).toHaveLength(0);
  });

  it('a save that fails says so and keeps every change', async () => {
    termsOrigin.writes = [{ status: 500, body: refusal('INTERNAL') }];
    const view = await mountedPlan();
    act(() => view.result.current.plan.share(0, 15));
    act(() => view.result.current.plan.save());

    await waitFor(() => expect(view.result.current.plan.failed).toBe(true));
    expect(shares(view.result.current.plan.lines)[0]).toBe('15.00');
    expect(view.result.current.plan.changed).toBe(true);
  });

  it('Reset goes back to the plan as saved', async () => {
    const view = await mountedPlan();
    act(() => view.result.current.plan.share(0, 15));
    act(() => view.result.current.plan.reset());
    expect(shares(view.result.current.plan.lines)[0]).toBe('10.00');
    expect(view.result.current.plan.changed).toBe(false);
  });
});
