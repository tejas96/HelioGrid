// @vitest-environment happy-dom
import { IN_FORMATS, richTextParagraphs } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { queryKeys } from '../../src/cache/keys';
import { useRepositories } from '../../src/react/context';
import { richTextWireOf } from '../../src/react/proposal-template-view';
import { useProposalBuilderScreen } from '../../src/react/use-proposal-builder-screen';
import { useTenantId } from '../../src/react/use-tenant-id';
import { intents, readyOf } from './proposal-builder-mounted';
import { PROPOSAL } from './proposals-fixtures';
import { PLATFORM_TERMS, provided, refusal, sell } from './proposals-origin';

/**
 * Step 9's *Save as default* (`M06-15`) through the real client: it lands where Proposal defaults
 * reads the template, says it saved or why not, and never stores the platform's own words — in
 * whatever language they were read — as the company's.
 */

const OWN = richTextWireOf(richTextParagraphs(['Our own terms: 50% on order.']));
const labels = { newPart: (n: number) => `Part ${n}`, warrantyYears: (n: number) => `${n} years` };

/** The builder on step 9 beside Proposal defaults' own read, held as that page holds it. */
async function mounted() {
  sell.proposal = {
    ...sell.proposal,
    rights: { ...sell.proposal.rights, writesCompanyFacts: true },
  };
  const view = renderHook(
    () => {
      const repositories = useRepositories();
      const tenantId = useTenantId();
      return {
        screen: useProposalBuilderScreen(PROPOSAL, {
          step: 'terms',
          formats: IN_FORMATS,
          reader: 'en',
          intents: intents(),
          labels,
        }),
        defaults: useQuery({
          queryKey: queryKeys.settings.proposalTemplate(tenantId, 'en'),
          queryFn: ({ signal }) => repositories.settings.proposalTemplate('en', signal),
          staleTime: Number.POSITIVE_INFINITY,
          enabled: tenantId !== '',
        }),
      };
    },
    { wrapper: provided() },
  );
  await waitFor(() => expect(view.result.current.screen.read.kind).toBe('ready'));
  await waitFor(() => expect(view.result.current.defaults.data).toBeDefined());
  return view;
}

const terms = (view: Awaited<ReturnType<typeof mounted>>) => {
  const step = readyOf(view.result.current.screen).step;
  if (step.step !== 'terms') throw new Error(`the step in view is ${step.step}`);
  return step;
};
const templateWrites = () => sell.sent.filter((one) => one.path === '/settings/proposal-template');

describe('step 9 — the terms saved as the company’s default', () => {
  it('lands where Proposal defaults reads the template, and the step says it saved', async () => {
    const view = await mounted();

    act(() => terms(view).onChange(OWN));
    act(() => terms(view).onSaveAsDefault?.());
    await waitFor(() => expect(terms(view).defaultSaved).toBe(true));

    expect(templateWrites()[0]?.body).toMatchObject({ defaultTerms: OWN });
    expect(view.result.current.defaults.data?.defaultTerms).toEqual(OWN);
    expect(terms(view).defaultFailure).toBeNull();
  });

  it('a save the server does not take says so on the step, and claims nothing', async () => {
    sell.writes = [{ status: 500, body: refusal('INTERNAL') }];
    const view = await mounted();

    act(() => terms(view).onChange(OWN));
    act(() => terms(view).onSaveAsDefault?.());
    await waitFor(() => expect(terms(view).defaultFailure).not.toBeNull());

    expect(terms(view).defaultSaved).toBe(false);
    expect(view.result.current.defaults.data?.defaultTerms).toEqual(PLATFORM_TERMS);
  });

  it('terms as the template already words them are not stored as the company’s own', async () => {
    const view = await mounted();

    act(() => terms(view).onChange(richTextWireOf(PLATFORM_TERMS)));
    act(() => terms(view).onSaveAsDefault?.());
    await waitFor(() => expect(terms(view).defaultSaved).toBe(true));

    expect(templateWrites()).toHaveLength(0);
  });
});
