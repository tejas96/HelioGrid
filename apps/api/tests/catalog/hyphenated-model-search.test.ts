import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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
import {
  actBy,
  aPanelSpec,
  aRunTag,
  catalogServiceOf,
  noKey,
  preset,
  publishIndiaPack,
} from './support';

/**
 * A model typed as written finds its item: the document's parser stores `NP-1` as the words
 * `np` and `-1`, a signed number, so the search's digits must match that sign. Each of this run's
 * own SKUs carries the run's one word as its brand, so the case reads only its own rows.
 */

/** One word, led by a letter, so no typed number begins it whatever the random tag holds. */
const brand = `x${aRunTag()}`;
const here = aCompany('Hyphen Search EPC');
const owner = aPerson('Neha Desai');
const fixture: Fixture = {
  companies: [here],
  people: [owner],
  memberships: [aMembership(here, owner, [preset.epc_owner])],
};
const OWNER = [preset.epc_owner];
const MODELS = ['NP-1', 'NP-2', 'PE-575 TOPCon', 'Bi-55-550 Bifacial', 'SUN2000-12KTL-M5'];

const skip = skipWithoutDatabase(
  'HYPHENATED MODEL SEARCH PROOF',
  "Catalog search's hyphenated models are UNPROVEN in this run.",
);

describe.skipIf(skip)(
  'a hyphenated model in the catalog search, against a migrated database',
  () => {
    let pools: ReturnType<typeof openPools>;
    let catalog: ReturnType<typeof catalogServiceOf>;

    const modelsFound = async (typed: string) => {
      const query = { q: `${brand} ${typed}`, limit: 50, page: 1 };
      const found = await catalog.list(here.tenantId, OWNER, query, Date.now());
      return found.items.map((item) => item.model).sort();
    };

    beforeAll(async () => {
      pools = openPools();
      await seed(pools.admin.db, fixture);
      await publishIndiaPack(pools);
      catalog = catalogServiceOf(pools);
      for (const model of MODELS) {
        const sku = { brand, model, spec: aPanelSpec(), certifications: [], preferred: false };
        await catalog.createItem(here.tenantId, OWNER, sku, noKey, actBy(owner.userId));
      }
    });

    afterAll(async () => {
      await unseed(pools.admin.db, fixture);
      await pools.close();
    });

    it.each([
      ['NP-1', ['NP-1']],
      ['np-1', ['NP-1']],
      ['NP', ['NP-1', 'NP-2']],
      ['PE-575', ['PE-575 TOPCon']],
      ['Bi-55', ['Bi-55-550 Bifacial']],
      ['550', ['Bi-55-550 Bifacial']],
      ['SUN2000-12', ['SUN2000-12KTL-M5']],
      ['NP-3', []],
    ])('%j typed as written finds %j', async (typed, models) => {
      expect(await modelsFound(typed)).toEqual(models);
    });
  },
);
