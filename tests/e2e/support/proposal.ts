import { IDEMPOTENCY_KEY_HEADER, type ProposalDetail, type UiLanguage } from '@heliogrid/contracts';
import type { Translator } from '@heliogrid/i18n';
import { expect, type Page } from '@playwright/test';
import { API } from './api-log';
import { CUSTOMER, captureLead, ownerWithCompany } from './project';
import { startProposalBody } from './proposal-flow';

/*
 * The proposals specs' way to a proposal (`M06`). A new company holds none, so each spec captures
 * its lead and starts the lead's draft through the api under the owner's own session, as the start
 * sheet sends it. A generated proposal needs the builder's steps; the builder's own flow drives
 * those (`proposals-[id]-build.spec.ts`).
 */

export { CUSTOMER };

export interface StartedDraft {
  readonly leadId: string;
  readonly proposal: ProposalDetail;
}

/**
 * The lead's draft, started in Quick mode as the start sheet sends it for a home lead; `quickMode`
 * false starts it with every step, as the builder's own flow walks them.
 */
export async function startDraftThroughApi(
  page: Page,
  leadId: string,
  quickMode = true,
): Promise<ProposalDetail> {
  const answer = await page.request.post(`${API}/leads/${leadId}/proposals`, {
    data: startProposalBody(quickMode),
    headers: { [IDEMPOTENCY_KEY_HEADER]: crypto.randomUUID() },
  });
  expect([200, 201]).toContain(answer.status());
  return (await answer.json()) as ProposalDetail;
}

/** A fresh company whose owner holds one lead with a proposal draft on it. */
export async function ownerWithDraft(
  page: Page,
  t: Translator,
  quickMode = true,
): Promise<StartedDraft> {
  await ownerWithCompany(page, t);
  const leadId = await captureLead(page);
  return { leadId, proposal: await startDraftThroughApi(page, leadId, quickMode) };
}

/**
 * A ready draft generated and shared through the api: answers the customer's link. `language` is
 * the lead's own, which the page reads in (`F5-08`); none leaves the company's.
 */
export async function sharedLinkOf(
  page: Page,
  leadId: string,
  language: UiLanguage | null = null,
): Promise<string> {
  const at = () => new Date().toISOString();
  const send = async (method: 'POST' | 'PATCH', path: string, data: object) => {
    const answer = await page.request.fetch(`${API}${path}`, {
      method,
      data: { ...data, capturedAt: at() },
      headers: { [IDEMPOTENCY_KEY_HEADER]: crypto.randomUUID() },
    });
    expect(answer.status(), await answer.text()).toBeLessThan(300);
    return answer.json();
  };
  if (language !== null) await send('PATCH', `/leads/${leadId}`, { preferredLanguage: language });
  let draft = (await send('POST', `/leads/${leadId}/proposals`, {
    quickMode: false,
    copyOf: null,
  })) as ProposalDetail;
  draft = (await send('PATCH', `/proposals/${draft.id}`, {
    revision: draft.revision,
    deal: {
      segment: 'residential',
      area: { area: 'IN-MH', district: 'Pune' },
      siteAddress: '12 Baner Road, Pune',
    },
    fields: {
      system: { ...draft.document.fields.system, capacityKw: 3, priceInclusive: '190575.00' },
      components: FIVE_PARTS,
    },
  })) as ProposalDetail;
  draft = (await send('POST', `/proposals/${draft.id}/energy`, {
    revision: draft.revision,
    mode: 'fill',
  })) as ProposalDetail;
  await send('POST', `/proposals/${draft.id}/generate`, {
    revision: draft.revision,
    changeNote: null,
    belowCostConfirmed: false,
  });
  const shared = (await send('POST', `/proposals/${draft.id}/share`, { channel: 'copy_link' })) as {
    message: { link: string | null };
  };
  if (shared.message.link === null) throw new Error('a share mints the link');
  return shared.message.link;
}

const LINE = {
  description: null,
  count: null,
  source: 'custom',
  catalogItemId: null,
  savedPartId: null,
  tier: 'assumed',
  certifications: [],
} as const;

/** One brand in each of the five mandatory sections, as `apps/api/tests/proposals/support.ts`. */
const FIVE_PARTS = [
  {
    ...LINE,
    category: 'panel',
    brand: 'Waaree',
    count: 6,
    wattPeak: 500,
    technology: 'topcon',
    warranty: '25 years',
    // The subsidy scheme's panel gate (`M06-23`): a home system's panels are domestic cells.
    certifications: [{ scheme: 'DCR', reference: null }],
  },
  {
    ...LINE,
    category: 'inverter',
    brand: 'Growatt',
    count: 1,
    capacityKw: 3,
    inverterType: 'on_grid',
    phases: 1,
    warranty: '10 years',
  },
  {
    ...LINE,
    category: 'cable',
    brand: 'Polycab',
    cableType: 'DC',
    specification: '4 sq mm',
    warranty: null,
  },
  { ...LINE, category: 'electrical', brand: 'Havells', includes: 'ACDB, DCDB', standard: null },
  {
    ...LINE,
    category: 'structure',
    brand: 'Tata',
    warranty: null,
    weightPerKw: null,
    standard: null,
  },
];
