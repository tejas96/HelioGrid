import { trancheTemplate } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Act } from '../../src/common/auth/session-context';
import { ContractException } from '../../src/common/errors/contract-exception';
import { seedTenantSettings } from '../../src/modules/settings/settings.admin.repository';
import {
  aCompany,
  aMembership,
  aPerson,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { entriesOf, publishIndiaPack, settingsServicesOf } from './support';

/**
 * The payment-term templates against REAL state (`M01-54`): a save whose lines do not total
 * 100.00 is refused naming the remainder and writes nothing; the one default moves and is never
 * archived; an archived template is history. The verdict itself is proven pure in
 * `packages/domain/tests/commerce/tranche-allocation.test.ts`.
 */

const here = aCompany('Splits EPC');
const elsewhere = aCompany('Other Splits EPC');
const owner = aPerson('Kiran Rao');
const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner],
  memberships: [
    aMembership(here, owner, [FOUNDER_ROLE]),
    aMembership(elsewhere, owner, [FOUNDER_ROLE]),
  ],
};

const skip = skipWithoutDatabase(
  'TRANCHE-TEMPLATES PROOF',
  'The tranche templates are UNPROVEN in this run — only the sum rule is.',
);

/** The two seeded splits plus the one this proof adds: what archiving must leave in place. */
const SEEDED_PLUS_ADDED = 3;

const line = (label: string, percent: string, dueOnStage: 'won' | 'commissioned' = 'won') => ({
  label: { en: label },
  percent,
  dueOnStage,
});

describe.skipIf(skip)('the payment-term templates, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let templates: ReturnType<typeof settingsServicesOf>['templates'];
  let seededDefault: string;
  let seededOther: string;
  let added: string;
  const by = (): Act => ({ actorUserId: owner.userId, now: Date.now() });

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await publishIndiaPack(pools);
    await pools.admin.db.transaction((tx) =>
      seedTenantSettings(tx, { tenantId: here.tenantId, now: Date.now() }),
    );
    ({ templates } = settingsServicesOf(pools));
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('lists the two seeded splits — the first the default, neither changed, none archived', async () => {
    const { items } = await templates.trancheTemplates(here.tenantId);
    expect(items.map((item) => [item.isDefault, item.changed, item.archived])).toEqual([
      [true, false, false],
      [false, false, false],
    ]);
    expect(items[0]?.lines.map((one) => one.percent)).toEqual(['10.00', '60.00', '20.00', '10.00']);
    seededDefault = items[0]?.id ?? '';
    seededOther = items[1]?.id ?? '';
  });

  it.each([
    { split: ['10.00', '60.00', '20.00'], words: '10.00% is still unallocated' },
    { split: ['33.33', '33.33', '33.33'], words: '0.01% is still unallocated' },
    { split: ['100.00', '50.00'], words: '50.00% over the whole' },
  ])(
    'refuses $split as TRANCHES_NOT_WHOLE naming $words, and writes nothing',
    async ({ split, words }) => {
      const before = await countOf(here.tenantId);
      const attempt = templates.createTrancheTemplate(
        here.tenantId,
        { name: { en: 'Uneven' }, lines: split.map((percent, i) => line(`Part ${i}`, percent)) },
        by(),
      );
      await expect(attempt).rejects.toBeInstanceOf(ContractException);
      await expect(attempt).rejects.toMatchObject({ code: 'TRANCHES_NOT_WHOLE' });
      await expect(attempt).rejects.toThrow(words);
      expect(await countOf(here.tenantId)).toBe(before);
      expect(
        await entriesOf(pools, here.tenantId, 'settings.tranche_template_created'),
      ).toHaveLength(0);
    },
  );

  it('adds a whole split as a named template — not the default, marked changed, with its entry', async () => {
    const created = await templates.createTrancheTemplate(
      here.tenantId,
      {
        name: { en: 'Half and half' },
        lines: [line('Now', '50.00'), line('Later', '50.00', 'commissioned')],
      },
      by(),
    );
    added = created.id;
    expect(created).toMatchObject({ isDefault: false, archived: false, changed: true });
    expect(created.lines.map((one) => one.dueOnStage)).toEqual(['won', 'commissioned']);
    const [entry] = await entriesOf(pools, here.tenantId, 'settings.tranche_template_created');
    expect(entry).toMatchObject({ actorRef: owner.userId, subjectRef: created.id });
  });

  it('moves the one default — the old one steps down — and refuses to archive whichever holds it', async () => {
    const made = await templates.makeDefaultTrancheTemplate(here.tenantId, added, by());
    expect(made.isDefault).toBe(true);
    const { items } = await templates.trancheTemplates(here.tenantId);
    expect(items.filter((item) => item.isDefault).map((item) => item.id)).toEqual([added]);
    await expect(templates.archiveTrancheTemplate(here.tenantId, added, by())).rejects.toThrow(
      'Make another template the default first.',
    );
    expect(
      await entriesOf(pools, here.tenantId, 'settings.tranche_template_default_changed'),
    ).toHaveLength(1);
  });

  it('archives without deleting; an archived template refuses an edit and the default', async () => {
    await templates.makeDefaultTrancheTemplate(here.tenantId, seededDefault, by());
    const archived = await templates.archiveTrancheTemplate(here.tenantId, added, by());
    expect(archived).toMatchObject({ archived: true, isDefault: false });
    expect(await countOf(here.tenantId)).toBe(SEEDED_PLUS_ADDED);
    await expect(
      templates.saveTrancheTemplate(
        here.tenantId,
        added,
        { name: { en: 'x' }, lines: [line('All', '100.00')] },
        by(),
      ),
    ).rejects.toThrow('That template is archived.');
    await expect(templates.makeDefaultTrancheTemplate(here.tenantId, added, by())).rejects.toThrow(
      'That template is archived.',
    );
    expect(
      await entriesOf(pools, here.tenantId, 'settings.tranche_template_archived'),
    ).toHaveLength(1);
  });

  it('replaces a template’s name and lines, marking it the tenant’s own, with its entry', async () => {
    const saved = await templates.saveTrancheTemplate(
      here.tenantId,
      seededOther,
      {
        name: { en: 'Three stage', mr: 'तीन टप्पे' },
        lines: [line('Booking', '40.00'), line('Done', '60.00', 'commissioned')],
      },
      by(),
    );
    expect(saved).toMatchObject({
      id: seededOther,
      changed: true,
      name: { en: 'Three stage', mr: 'तीन टप्पे' },
    });
    expect(saved.lines.map((one) => one.percent)).toEqual(['40.00', '60.00']);
    const [entry] = await entriesOf(pools, here.tenantId, 'settings.tranche_template_changed');
    expect(entry).toMatchObject({ subjectRef: seededOther });
  });

  it('answers not-found for another company’s template — never that it exists', async () => {
    await expect(
      templates.saveTrancheTemplate(
        elsewhere.tenantId,
        seededDefault,
        { name: { en: 'x' }, lines: [line('All', '100.00')] },
        by(),
      ),
    ).rejects.toThrow('That template is not this company’s.');
  });

  async function countOf(tenantId: string): Promise<number> {
    const rows = await pools.admin.db
      .select({ id: trancheTemplate.id })
      .from(trancheTemplate)
      .where(eq(trancheTemplate.tenantId, tenantId));
    return rows.length;
  }
});
