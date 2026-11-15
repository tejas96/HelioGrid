import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aStaffedCompany,
  auditEntriesOf,
  type Caller,
  openProposalsWorld,
  type ProposalsWorld,
  preset,
  retryKey,
} from './support';

/**
 * The company's saved parts on the wire (`T-M06-034`, `M06-28`): a cable, electrical or structure
 * part added once and offered on every later proposal — with no price and no count — kept clean of
 * the same part typed twice, and written only by who holds the catalog grant.
 */

const here = aStaffedCompany('Saved Parts EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
  finance: [preset.finance],
});
const there = aStaffedCompany('Saved Parts Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'SAVED PARTS PROOF',
  'The company’s saved parts are UNPROVEN on the wire in this run.',
);

interface Part {
  id: string;
  kind: string;
  brand: string;
  specification: string;
  warranty: string | null;
  description: string | null;
  archived: boolean;
}

const polycab = {
  kind: 'cable',
  brand: 'Polycab',
  specification: 'DC/AC cable',
  warranty: '10 years',
  description: 'Copper, UV protected',
} as const;

describe.skipIf(skip)('Saved parts, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const add = (caller: Caller, part: Record<string, unknown>) =>
    caller.call<Part>('POST', '/saved-parts', part, retryKey());
  const listOf = (caller: Caller, query = '') =>
    caller.call<{ items: Part[]; totalCount: number }>('GET', `/saved-parts${query}`);

  beforeAll(async () => {
    world = await openProposalsWorld([here, there]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a part added once is offered in its picker with its words, and holds no price or count', async () => {
    const made = await add(owner(), polycab);
    expect(made.status).toBe(HttpStatus.CREATED);
    const offered = (await listOf(world.as(here.members.seller), '?kind=cable')).body.items;
    expect(offered).toMatchObject([
      {
        brand: 'Polycab',
        specification: 'DC/AC cable',
        warranty: '10 years',
        description: 'Copper, UV protected',
        archived: false,
      },
    ]);
    const stored = Object.keys(offered[0] ?? {});
    expect(stored).not.toEqual(expect.arrayContaining(['price', 'count', 'stock', 'rate']));
    expect((await listOf(owner(), '?kind=structure')).body.items).toEqual([]);
  });

  it('the same brand and specification typed another way is refused, naming the part it is', async () => {
    const first = (await listOf(owner(), '?kind=cable')).body.items[0];
    const twin = await add(owner(), {
      ...polycab,
      brand: ' polycab ',
      specification: 'dc/ac  CABLE',
    });
    expect(twin.status).toBe(HttpStatus.CONFLICT);
    expect(twin.body).toMatchObject({
      error: { code: 'SAVED_PART_DUPLICATE', facts: { partId: first?.id } },
    });
    // The same words are another part in another kind.
    expect((await add(owner(), { ...polycab, kind: 'electrical' })).status).toBe(
      HttpStatus.CREATED,
    );
  });

  it('a Sales Executive adds a part; Finance may not; only the catalog manager edits or archives', async () => {
    const seller = world.as(here.members.seller);
    const made = await add(seller, { ...polycab, kind: 'structure', brand: 'Tata' });
    expect(made.status).toBe(HttpStatus.CREATED);
    const refused = await add(world.as(here.members.finance), { ...polycab, brand: 'Havells' });
    expect(refused.status).toBe(HttpStatus.FORBIDDEN);
    const edit = {
      brand: 'Tata',
      specification: 'GI structure',
      warranty: null,
      description: null,
    };
    expect((await seller.call('PUT', `/saved-parts/${made.body.id}`, edit)).status).toBe(
      HttpStatus.FORBIDDEN,
    );
    expect((await seller.call('POST', `/saved-parts/${made.body.id}/archive`)).status).toBe(
      HttpStatus.FORBIDDEN,
    );
    // Finance holds the catalog grant only to read prices: it changes no part either.
    const finance = world.as(here.members.finance);
    expect((await finance.call('PUT', `/saved-parts/${made.body.id}`, edit)).status).toBe(
      HttpStatus.FORBIDDEN,
    );
    expect((await finance.call('POST', `/saved-parts/${made.body.id}/archive`)).status).toBe(
      HttpStatus.FORBIDDEN,
    );
    const saved = await owner().call<Part>('PUT', `/saved-parts/${made.body.id}`, edit);
    expect(saved.body).toMatchObject({ specification: 'GI structure', warranty: null });
  });

  it('an archived part leaves the picker and returns when restored', async () => {
    const made = await add(owner(), { ...polycab, kind: 'structure', brand: 'Jindal' });
    const archived = await owner().call<Part>('POST', `/saved-parts/${made.body.id}/archive`);
    expect(archived.body.archived).toBe(true);
    const brands = async (query: string) =>
      (await listOf(owner(), query)).body.items.map((part) => part.brand);
    expect(await brands('?kind=structure')).not.toContain('Jindal');
    expect(await brands('?kind=structure&archived=true')).toContain('Jindal');
    const restored = await owner().call<Part>('POST', `/saved-parts/${made.body.id}/restore`);
    expect(restored.body.archived).toBe(false);
    expect(await brands('?kind=structure')).toContain('Jindal');
  });

  it('another company reads none of these parts and cannot change one', async () => {
    const stranger = world.as(there.members.owner);
    expect((await listOf(stranger)).body.items).toEqual([]);
    const mine = (await listOf(owner())).body.items[0];
    const edit = { brand: 'X', specification: 'Y', warranty: null, description: null };
    expect((await stranger.call('PUT', `/saved-parts/${mine?.id}`, edit)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
    expect((await stranger.call('POST', `/saved-parts/${mine?.id}/archive`)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
  });

  it('each change to a part is on the company’s record under who made it; a save that changes nothing is not (F2-22)', async () => {
    const made = await add(owner(), { ...polycab, kind: 'structure', brand: 'Apollo' });
    const id = made.body.id;
    const edit = { brand: 'Apollo', specification: 'GI', warranty: null, description: null };
    await owner().call('PUT', `/saved-parts/${id}`, edit);
    await owner().call('PUT', `/saved-parts/${id}`, edit);
    await owner().call('POST', `/saved-parts/${id}/archive`);
    await owner().call('POST', `/saved-parts/${id}/restore`);
    const onThePart = async (event: string) =>
      (await auditEntriesOf(world, here.company.tenantId, event)).filter(
        (entry) => entry.subjectRef === id,
      );
    for (const event of [
      'saved_parts.part_added',
      'saved_parts.part_changed',
      'saved_parts.part_archived',
      'saved_parts.part_restored',
    ]) {
      const entries = await onThePart(event);
      expect(entries, event).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        subjectKind: 'saved_part',
        actorRef: here.people.owner.userId,
      });
    }
  });

  it('the list comes a page at a time, by kind, brand and id, counting every part that matches', async () => {
    for (const brand of ['Vguard', 'Ukay', 'Wavin']) {
      expect((await add(owner(), { ...polycab, kind: 'electrical', brand })).status).toBe(
        HttpStatus.CREATED,
      );
    }
    const all = (await listOf(owner(), '?kind=electrical')).body;
    const pages = [];
    for (let page = 1; page <= all.totalCount; page += 1) {
      const one = (await listOf(owner(), `?kind=electrical&limit=1&page=${page}`)).body;
      expect(one.items).toHaveLength(1);
      expect(one.totalCount).toBe(all.totalCount);
      pages.push(...one.items.map((part) => part.id));
    }
    expect(pages).toEqual(all.items.map((part) => part.id));
    const brands = all.items.map((part) => part.brand);
    expect(brands).toEqual([...brands].sort((a, b) => (a < b ? -1 : 1)));
    expect((await listOf(owner(), '?limit=0')).status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('an add retried with its key answers the part the first send made', async () => {
    const key = retryKey();
    const body = { ...polycab, kind: 'electrical', brand: 'Schneider' };
    const first = await owner().call<Part>('POST', '/saved-parts', body, key);
    const again = await owner().call<Part>('POST', '/saved-parts', body, key);
    expect([first.status, again.status]).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(again.body.id).toBe(first.body.id);
  });
});
