import { FOUNDER_ROLE, SKY_TICKET_SECONDS, skyTileRange } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ENV } from '../../src/config/env';
import { mintSkyTicket } from '../../src/modules/studio/internal/sky-ticket';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aSitedDesign,
  roundThePin,
  sangli,
  sourceOf,
  ticketed,
  tileAt,
  tileOf,
  tilesOf,
  zoomCap,
  zoomCoarsest,
} from './sky-support';
import {
  aDesign,
  aLead,
  aStaffedCompany,
  openStudioWorld,
  ownLead,
  preset,
  type StudioWorld,
  saveSite,
} from './support';

/**
 * Who may fetch a site's sky tiles (`T-M05-002a`). Who may read the design may read its picture
 * and its tiles; another company, a lead out of scope, another person's ticket and another design's
 * are no such design; a ticket this api did not sign, a changed one or one that ran out is refused;
 * and no one fetches more tiles in a minute than a studio needs.
 */

const here = aStaffedCompany('Sky Tiles Access EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
  seller: [preset.sales_executive],
  other: [preset.sales_executive],
  /** Fetches tiles until the cap stops them: no other case shares their count. */
  greedy: [preset.sales_manager],
});
const there = aStaffedCompany('Sky Tiles Access Other EPC', { owner: [FOUNDER_ROLE] });

/** One more than a person may fetch in a minute (`TILES_PER_MINUTE`). */
const PAST_THE_CAP = 301;
/** The finest zoom any service cuts: a ticket changed to allow it is not the one that was signed. */
const ZOOM_CEILING = 22;

const MS_PER_SECOND = 1_000;

const skip = skipWithoutDatabase(
  'SKY TILES ACCESS PROOF',
  'Who may fetch a site’s sky tiles, and that another company gets none, are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('Who may fetch the sky tiles, over HTTP against a migrated database', () => {
  let world: StudioWorld;
  const owner = () => world.as(here.members.owner);
  const underThePin = () => tileAt(zoomCap);

  beforeAll(async () => {
    world = await openStudioWorld([here, there]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await world.close();
  });

  it('a ticket this api did not sign, a changed one and one that ran out are refused', async () => {
    const designId = await aSitedDesign(owner());
    const { ticket } = await ticketed(owner(), designId);
    const [body = '', signature = ''] = ticket.split('.');
    const facts = {
      tenantId: here.company.tenantId,
      designId,
      userId: here.people.owner.userId,
      region: 'IN',
      language: 'en-IN',
      zoomMin: zoomCoarsest,
      zoomMax: zoomCap,
      reach: skyTileRange(sangli, roundThePin, zoomCap),
    };
    const forged = mintSkyTicket('a key that is not this api’s', facts, Date.now()).ticket;
    // The same facts with every zoom allowed, under the first ticket's signature.
    const [widened] = mintSkyTicket(
      ENV.AUTH_TOKEN_SECRET,
      { ...facts, zoomMax: ZOOM_CEILING },
      Date.now(),
    ).ticket.split('.');
    const ranOut = mintSkyTicket(
      ENV.AUTH_TOKEN_SECRET,
      facts,
      Date.now() - (SKY_TICKET_SECONDS + 1) * MS_PER_SECOND,
    ).ticket;
    const asked = vi.spyOn(sourceOf(world), 'tile');
    for (const bad of [forged, `${widened}.${signature}`, `${body}.`, 'nothing', ranOut]) {
      const reply = await tileOf(owner(), designId, underThePin(), bad);
      expect(reply.status).toBe(HttpStatus.FORBIDDEN);
    }
    expect(asked).not.toHaveBeenCalled();
    // The ticket as it was given still opens the tile: only the changed ones were refused.
    expect((await tileOf(owner(), designId, underThePin(), ticket)).status).toBe(HttpStatus.OK);
  });

  it('a tile asked for with no ticket is a malformed request', async () => {
    const designId = await aSitedDesign(owner());
    expect((await tileOf(owner(), designId, underThePin(), null)).status).toBe(
      HttpStatus.BAD_REQUEST,
    );
  });

  it('a ticket opens only its own design, for the person it was given to', async () => {
    const mine = await aSitedDesign(owner());
    const other = await aSitedDesign(owner());
    const { ticket } = await ticketed(owner(), mine);
    const manager = world.as(here.members.manager);
    // The manager may read the design, and gets their own ticket; the owner's is not theirs.
    expect((await tileOf(manager, mine, underThePin(), ticket)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await tileOf(owner(), other, underThePin(), ticket)).status).toBe(HttpStatus.NOT_FOUND);
    const theirs = await ticketed(manager, mine);
    expect((await tileOf(manager, mine, underThePin(), theirs.ticket)).status).toBe(HttpStatus.OK);
  });

  it('a Sales Executive reads the picture of a lead they own, and finds none of a lead they do not', async () => {
    const mine = await aDesign(owner(), await aLead(owner()));
    const theirs = await aDesign(owner(), await aLead(owner()));
    await saveSite(owner(), mine.design.id);
    await saveSite(owner(), theirs.design.id);
    await ownLead(world, mine.subject.leadId, here.people.seller.userId);
    await ownLead(world, theirs.subject.leadId, here.people.other.userId);
    const seller = world.as(here.members.seller);
    const { ticket } = await ticketed(seller, mine.design.id);
    expect((await tileOf(seller, mine.design.id, underThePin(), ticket)).status).toBe(
      HttpStatus.OK,
    );
    expect((await tilesOf(seller, theirs.design.id)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await tileOf(seller, theirs.design.id, underThePin(), ticket)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
  });

  it('another company’s design is not found: not its picture, and no tile under any ticket', async () => {
    const designId = await aSitedDesign(owner());
    const stranger = world.as(there.members.owner);
    expect((await tilesOf(stranger, designId)).status).toBe(HttpStatus.NOT_FOUND);
    // The stranger's own ticket, for a design of their own company.
    const strangers = await ticketed(stranger, await aSitedDesign(stranger));
    // The owner's ticket, as if it had leaked.
    const leaked = await ticketed(owner(), designId);
    const asked = vi.spyOn(sourceOf(world), 'tile');
    for (const ticket of [strangers.ticket, leaked.ticket]) {
      const reply = await tileOf(stranger, designId, underThePin(), ticket);
      expect(reply.status).toBe(HttpStatus.NOT_FOUND);
    }
    expect(asked).not.toHaveBeenCalled();
  });

  it('a person who asks for more tiles in a minute than a studio needs is stopped', async () => {
    const greedy = world.as(here.members.greedy);
    const designId = await aSitedDesign(owner());
    const { ticket } = await ticketed(greedy, designId);
    const replies: number[] = [];
    for (let asked = 0; asked < PAST_THE_CAP; asked += 1) {
      replies.push((await tileOf(greedy, designId, underThePin(), ticket)).status);
    }
    expect(replies.slice(0, -1).every((status) => status === HttpStatus.OK)).toBe(true);
    expect(replies.at(-1)).toBe(HttpStatus.TOO_MANY_REQUESTS);
    // The cap is each person's own: the owner still gets theirs.
    const mine = await ticketed(owner(), designId);
    expect((await tileOf(owner(), designId, underThePin(), mine.ticket)).status).toBe(
      HttpStatus.OK,
    );
  });
});
