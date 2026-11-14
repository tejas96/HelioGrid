import { ENERGY_SOURCE_OF_RECORD } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { MemoryEnergySource } from '../../src/modules/proposals/internal/energy-source.memory';
import { skipWithoutDatabase } from '../support/fixture';
import { forgetEnergyAnswersAt } from './energy-support';
import {
  aDraft,
  aLead,
  aStaffedCompany,
  type Caller,
  edited,
  openProposalsWorld,
  type ProposalsWorld,
  systemOf,
} from './support';

/**
 * Step 4's fill on the wire (`T-M06-033`, `M06-10`, `F8-08`, `F8-10`): the source of record for the
 * site's point, named with its database; the built-in estimate with its own label when it does not
 * answer; one ask per point; and the size and the efficiency applied once.
 */

const here = aStaffedCompany('Proposal Energy EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROPOSAL ENERGY PROOF',
  'The energy fill and its fallback are UNPROVEN on the wire in this run.',
);

/** What the source answers in these cases: a flat 100 kWh a month, from a database India never names. */
const MONTHS = 12;
/** A flat 100 kWh for each kWp, every month: 3 kW at 80% is then 240 kWh a month. */
const FLAT_YIELD = 100;
const MONTH_KWH = 240;
const YEAR_KWH = MONTH_KWH * MONTHS;
const DECIMALS = 6;
const TYPED_KWH = 50;
const FLAT = Array.from({ length: MONTHS }, () => FLAT_YIELD);
const MARKER = 'SARAH3' as const;
/** Every site these cases fill, each read only through what this file's own source answered. */
const SITES = [null, 'Nagpur', 'Nashik', 'Kolhapur', 'Satara'].map((district) => ({
  area: 'IN-MH',
  district,
}));

interface Filled {
  status: number;
  body: {
    id: string;
    revision: number;
    document: {
      fields: {
        performance: {
          yieldPerKwp: number[] | null;
          source: unknown;
          grain: string | null;
          editedMonthlyKwh: number[] | null;
        };
      };
      generation: {
        monthlyKwh: number[];
        yearlyKwh: number;
        source: unknown;
        grain: string;
        tier: string;
      } | null;
    };
  };
}

describe.skipIf(skip)('The energy fill, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const source = () =>
    world.http.app.get<MemoryEnergySource>(ENERGY_SOURCE_OF_RECORD, { strict: false });

  /** A 3 kW draft sited in the district given, ready for its fill. */
  async function sitedIn(district: string | null) {
    const draft = await aDraft(owner(), await aLead(owner()));
    return edited(owner(), draft, {
      deal: { segment: 'residential', area: { area: 'IN-MH', district } },
      fields: { system: systemOf(draft) },
    });
  }
  const fill = (
    caller: Caller,
    on: { id: string; revision: number },
    mode: 'fill' | 'reset' = 'fill',
  ) =>
    caller.call('POST', `/proposals/${on.id}/energy`, {
      revision: on.revision,
      mode,
      capturedAt: new Date().toISOString(),
    }) as Promise<Filled>;

  beforeAll(async () => {
    world = await openProposalsWorld([here]);
    await forgetEnergyAnswersAt(world, SITES);
  });

  afterAll(async () => {
    source().answerWith(null);
    await forgetEnergyAnswersAt(world, SITES);
    await world.close();
  });

  it('the source of record fills the months, labelled with the database it named, at the size and efficiency once', async () => {
    source().answerWith({ database: MARKER, yieldPerKwp: FLAT });
    const reply = await fill(owner(), await sitedIn('Nagpur'));
    expect(reply.status).toBe(HttpStatus.OK);
    const { performance } = reply.body.document.fields;
    expect(performance).toMatchObject({
      yieldPerKwp: FLAT,
      source: { kind: 'record', databases: [MARKER] },
      grain: 'district',
    });
    // 100 kWh for 1 kWp × 3 kW × 80 % efficiency, applied once.
    expect(reply.body.document.generation).toMatchObject({
      source: { kind: 'record', databases: [MARKER] },
      tier: 'estimated',
    });
    expect(reply.body.document.generation?.monthlyKwh[0]).toBeCloseTo(MONTH_KWH, DECIMALS);
    expect(reply.body.document.generation?.yearlyKwh).toBeCloseTo(YEAR_KWH, DECIMALS);
  });

  it('a point already answered is not asked again', async () => {
    source().answerWith({ database: MARKER, yieldPerKwp: FLAT });
    await fill(owner(), await sitedIn('Nashik'));
    const asked = source().asked.length;
    source().answerWith(null);
    const again = await fill(owner(), await sitedIn('Nashik'));
    expect(again.body.document.fields.performance.source).toEqual({
      kind: 'record',
      databases: [MARKER],
    });
    expect(source().asked).toHaveLength(asked);
  });

  it('a source that does not answer leaves the built-in estimate, labelled as one, and the step completes', async () => {
    source().answerWith(null);
    const reply = await fill(owner(), await sitedIn('Kolhapur'));
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.document.fields.performance).toMatchObject({
      source: { kind: 'estimate' },
      grain: 'district',
    });
    expect(reply.body.document.fields.performance.yieldPerKwp).toHaveLength(MONTHS);
    expect(reply.body.document.generation?.source).toEqual({ kind: 'estimate' });
  });

  it('a state picked alone is filled for the state’s own point, and said to be the coarser one', async () => {
    source().answerWith(null);
    const reply = await fill(owner(), await sitedIn(null));
    expect(reply.body.document.fields.performance.grain).toBe('area');
  });

  it('with no place picked there is nothing to fill for', async () => {
    const draft = await aDraft(owner(), await aLead(owner()));
    const reply = await fill(owner(), draft);
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('typed month figures stay through a fill, and Reset puts the source’s values back', async () => {
    source().answerWith(null);
    const filled = await fill(owner(), await sitedIn('Satara'));
    const typed = Array.from({ length: MONTHS }, () => TYPED_KWH);
    const own = (await owner().call('PATCH', `/proposals/${filled.body.id}`, {
      revision: filled.body.revision,
      capturedAt: new Date().toISOString(),
      fields: {
        performance: {
          ...filled.body.document.fields.performance,
          editedMonthlyKwh: typed,
          editedAtCapacityKw: 3,
        },
      },
    })) as Filled;
    expect(own.status).toBe(HttpStatus.OK);
    expect(own.body.document.generation?.monthlyKwh).toEqual(typed);
    // What the source answered is never typed over: the edit kept the yield beneath the figures.
    expect(own.body.document.fields.performance.yieldPerKwp).toHaveLength(MONTHS);
    const reset = await fill(owner(), own.body, 'reset');
    expect(reset.body.document.fields.performance.editedMonthlyKwh).toBeNull();
    expect(reset.body.document.generation?.monthlyKwh).not.toEqual(typed);
  });
});
