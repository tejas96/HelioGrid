import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aLead,
  aReadyDraft,
  aStaffedCompany,
  edited,
  fiveComponents,
  generate,
  openProposalsWorld,
  type ProposalsWorld,
  preset,
  start,
  systemOf,
} from './support';

/**
 * The one Generate checklist on the wire (`T-M06-022`, `M06-20`, `M06-23`, `M06-36`, `M06-37`):
 * the same verdict whichever way the person got there; each block and each warning named for its
 * step; a check that could not run said so, never passed in silence.
 */

const here = aStaffedCompany('Proposal Checks EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'PROPOSAL CHECKLIST PROOF',
  'The one Generate checklist is UNPROVEN on the wire in this run.',
);

interface NotReady {
  error: {
    code: string;
    facts: {
      verdict: {
        blocks: Record<string, unknown>[];
        warnings: Record<string, unknown>[];
        skipped: Record<string, unknown>[];
        canGenerate: boolean;
      };
    };
  };
}
/** Three of the five mandatory sections hold a brand: two are still missing. */
const SECTIONS_FILLED = 3;
const verdictOf = (body: unknown) => (body as NotReady).error.facts.verdict;
const _sequenceOf = (number: string) => Number(number.replace(/^PRP-/, ''));

describe.skipIf(skip)('The Generate checklist, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const _tenantId = () => here.company.tenantId;

  beforeAll(async () => {
    world = await openProposalsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('the same content gives the same verdict from Quick mode, from a copy and from the full rail', async () => {
    const full = await aReadyDraft(owner(), await aLead(owner()));
    const broken = await edited(owner(), full, {
      fields: { components: fiveComponents().slice(0, SECTIONS_FILLED) },
    });
    const quick = await edited(owner(), broken, { quickMode: true });
    const made = await start(owner(), await aLead(owner()), { copyOf: broken.id });
    expect(made.status).toBe(HttpStatus.CREATED);
    const copy = await edited(owner(), made.body, {
      deal: {
        segment: 'residential',
        area: { area: 'IN-MH', district: 'Pune' },
        siteAddress: '12 Baner Road, Pune',
      },
    });
    const blocksOf = (detail: { checklist: { blocks: { check: string; category?: string }[] } }) =>
      detail.checklist.blocks
        .filter((block) => block.check === 'component_missing')
        .map((block) => block.category)
        .sort();
    expect(blocksOf(quick)).toEqual(['electrical', 'structure']);
    expect(blocksOf(copy)).toEqual(blocksOf(broken));
    expect(blocksOf(quick)).toEqual(blocksOf(broken));
    // Every component of the source arrived with the copy.
    expect(copy.document.fields.components).toHaveLength(SECTIONS_FILLED);
  });

  it('on the incentive path a panel without the scheme fails by name; leaving the path clears it', async () => {
    const ready = await aReadyDraft(owner(), await aLead(owner()));
    const [dcr, ...rest] = fiveComponents();
    if (dcr === undefined) throw new Error('no panel line');
    const mixed = await edited(owner(), ready, {
      fields: { components: [dcr, { ...dcr, brand: 'Imported', certifications: [] }, ...rest] },
    });
    const unmet = mixed.checklist.blocks.filter((block) => block.check === 'scheme_unmet');
    expect(unmet).toMatchObject([{ brand: 'Imported', category: 'panel', scheme: 'DCR' }]);
    const off = await edited(owner(), mixed, {
      fields: { system: systemOf(mixed, { incentiveClaimed: false }) },
    });
    expect(off.checklist.blocks.filter((block) => block.check === 'scheme_unmet')).toEqual([]);
  });

  it('6 panels of 579 Wp on 3 kW, a three-phase 5 kW inverter, a 2 kW load and a single-phase supply: four warnings, none blocks', async () => {
    const leadId = await aLead(owner());
    const ready = await aReadyDraft(owner(), leadId);
    const [panel, inverter, ...rest] = fiveComponents();
    if (panel === undefined || inverter === undefined) throw new Error('no lines');
    const odd = await edited(owner(), ready, {
      deal: { sanctionedLoadKw: 2, supplyPhase: 'single' },
      fields: {
        components: [
          { ...panel, wattPeak: 579 } as typeof panel,
          { ...inverter, capacityKw: 5, phases: 3 } as typeof inverter,
          ...rest,
        ],
      },
    });
    const checks = odd.checklist.warnings.map((warning) => warning.check).sort();
    expect(checks).toEqual(['inverter_band', 'panel_capacity', 'sanctioned_load', 'supply_phase']);
    expect(odd.checklist.warnings.find((w) => w.check === 'panel_capacity')).toMatchObject({
      count: 6,
      wattPeak: 579,
      systemKw: 3,
    });
    expect(odd.checklist.warnings.find((w) => w.check === 'sanctioned_load')).toMatchObject({
      systemKw: 3,
      sanctionedLoadKw: 2,
    });
    expect(odd.checklist.canGenerate).toBe(true);
    expect((await generate(owner(), odd)).status).toBe(HttpStatus.CREATED);
  });

  it('with no sanctioned load on the lead that check says it was skipped, and why', async () => {
    const ready = await aReadyDraft(owner(), await aLead(owner()));
    expect(ready.checklist.skipped).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ check: 'sanctioned_load', reason: 'sanctioned_load_unknown' }),
      ]),
    );
  });

  it('a payable at or below zero blocks Generate — a zero price with no discount too — and a corrected one passes', async () => {
    const ready = await aReadyDraft(owner(), await aLead(owner()));
    const free = await edited(owner(), ready, {
      fields: { system: systemOf(ready, { priceInclusive: '0.00' }) },
    });
    const refused = await generate(owner(), free);
    expect(refused.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(verdictOf(refused.body).blocks.map((block) => block.check)).toContain(
      'payable_not_positive',
    );
    const priced = await edited(owner(), free, { fields: { system: systemOf(free) } });
    expect((await generate(owner(), priced)).status).toBe(HttpStatus.CREATED);
  });

  it('a price below our cost warns with the loss, and generates once confirmed', async () => {
    const ready = await aReadyDraft(owner(), await aLead(owner()));
    const lossy = await edited(owner(), ready, {
      fields: { system: systemOf(ready, { ourCost: '200000.00' }) },
    });
    const asked = await generate(owner(), lossy);
    expect(asked.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(verdictOf(asked.body)).toMatchObject({ canGenerate: true });
    expect(verdictOf(asked.body).warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ check: 'below_cost', loss: '9425.00' })]),
    );
    const confirmed = await generate(owner(), lossy, { belowCostConfirmed: true });
    expect(confirmed.status).toBe(HttpStatus.CREATED);
  });
});
