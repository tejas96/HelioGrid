import type {
  ProposalDetail,
  ProposalTemplateRead,
  TimelineTemplateRead,
} from '@heliogrid/contracts';
import {
  FOUNDER_ROLE,
  PROPOSAL_LIMITS,
  PROPOSAL_VALIDITY_DAYS,
  richTextParagraphs,
  termsPagesOf,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aDraft,
  aGenerated,
  aLead,
  aStaffedCompany,
  type Caller,
  detailOf,
  edit,
  edited,
  openProposalsWorld,
  ownLead,
  type ProposalsWorld,
  preset,
} from './support';

/**
 * The company's templates in the builder (`T-M06-027`, `M06-49`, `M06-12`, `M06-13`, `M06-15`): a
 * new proposal opens on the company's saved template, or on HelioGrid's where none is saved; a
 * rep's edit stays on its proposal; and a template the owner changes reaches an open draft only
 * through that step's Reset.
 */

const here = aStaffedCompany('Proposal Templates EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
});
const untouched = aStaffedCompany('Proposal Defaults EPC', { owner: [FOUNDER_ROLE] });
const ownTerms = aStaffedCompany('Proposal Own Terms EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROPOSAL TEMPLATES PROOF',
  'The templates a proposal opens on, and Reset, are UNPROVEN on the wire in this run.',
);

const OWN_PHASES = [
  { name: 'Site visit', description: 'We measure your roof.' },
  { name: 'Install', description: 'Two days on site.' },
];
const LATER_PHASES = [{ name: 'One visit', description: 'Everything in a day.' }];

describe.skipIf(skip)('The company’s templates in a proposal, over HTTP', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const seller = () => world.as(here.members.seller);
  const fieldsOf = (detail: ProposalDetail) => detail.document.fields;
  const phasesOf = (detail: ProposalDetail) =>
    fieldsOf(detail).timeline.map(({ name, description }) => ({ name, description }));
  const saveTimeline = async (phases: typeof OWN_PHASES) => {
    const saved = await owner().call('PUT', '/settings/timeline-template', { phases });
    expect(saved.status).toBe(HttpStatus.OK);
  };
  const savedTimeline = async () =>
    (await owner().call<TimelineTemplateRead>('GET', '/settings/timeline-template')).body.phases;
  const reset = (caller: Caller, on: ProposalDetail, step: 'timeline' | 'payment') =>
    caller.call<ProposalDetail>('POST', `/proposals/${on.id}/reset`, {
      revision: on.revision,
      step,
      capturedAt: new Date().toISOString(),
    });

  beforeAll(async () => {
    world = await openProposalsWorld([here, untouched, ownTerms]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a company that never opened Settings gets every templated step on HelioGrid’s defaults', async () => {
    const lone = world.as(untouched.members.owner);
    const fields = fieldsOf(await aDraft(lone, await aLead(lone)));
    expect(fields.timeline.length).toBeGreaterThan(0);
    expect(fields.payment.tranches.length).toBeGreaterThan(0);
    expect(fields.payment.templateId).toEqual(expect.any(String));
    expect(fields.terms).not.toBeNull();
    // The platform's phases are what its own timeline page reads back.
    const platform = (await lone.call<TimelineTemplateRead>('GET', '/settings/timeline-template'))
      .body.phases;
    expect(fields.timeline.map(({ name, description }) => ({ name, description }))).toEqual(
      platform,
    );
  });

  it('HelioGrid’s terms state the validity in days from the proposal’s date; a company’s own terms are kept as written (M06-15)', async () => {
    const lone = world.as(untouched.members.owner);
    const onDefaults = await aDraft(lone, await aLead(lone));
    const platform = fieldsOf(onDefaults).terms;
    expect(JSON.stringify(platform.blocks[0])).toContain(
      `valid for ${PROPOSAL_VALIDITY_DAYS} days from its date`,
    );
    expect(onDefaults.document.validityDays).toBe(PROPOSAL_VALIDITY_DAYS);
    const generated = await aGenerated(lone, await aLead(lone));
    const frozen = await lone.call<{ document: { validityDays: number | null } }>(
      'GET',
      `/proposals/${generated.proposal.id}/versions/1`,
    );
    expect(frozen.body.document.validityDays).toBe(PROPOSAL_VALIDITY_DAYS);

    const company = world.as(ownTerms.members.owner);
    const read = await company.call<ProposalTemplateRead>('GET', '/settings/proposal-template');
    const own = richTextParagraphs(['Valid until the end of the month.']);
    const saved = await company.call('PUT', '/settings/proposal-template', {
      cover: read.body.cover,
      sectionsIncluded: read.body.sectionsIncluded,
      defaultTerms: own,
    });
    expect(saved.status).toBe(HttpStatus.OK);
    const onOwn = await aDraft(company, await aLead(company));
    expect(fieldsOf(onOwn).terms).toEqual(own);
    expect(onOwn.document.validityDays).toBeNull();
  });

  it('HelioGrid’s terms edited by the rep state no validity the page can print (M06-15)', async () => {
    const lone = world.as(untouched.members.owner);
    const draft = await aDraft(lone, await aLead(lone));
    const terms = fieldsOf(draft).terms;
    const added = {
      ...terms,
      blocks: [...terms.blocks, { type: 'p' as const, spans: [{ text: 'Extra.' }] }],
    };
    const saved = await edited(lone, draft, { fields: { terms: added } });
    expect(saved.document.validityDays).toBeNull();
  });

  it('a new proposal opens in the customer’s language: unsaved terms read in Marathi for a Marathi customer (T-M06-017)', async () => {
    const lone = world.as(untouched.members.owner);
    const leadId = await aLead(lone);
    const marathi = await lone.call('PATCH', `/leads/${leadId}`, {
      preferredLanguage: 'mr',
      capturedAt: new Date().toISOString(),
    });
    expect(marathi.status).toBe(HttpStatus.OK);
    const read = await lone.call<ProposalTemplateRead>(
      'GET',
      '/settings/proposal-template?reader=mr',
    );
    const draft = await aDraft(lone, leadId);
    expect(fieldsOf(draft).terms).toEqual(read.body.defaultTerms);
    expect(draft.document.validityDays).toBe(PROPOSAL_VALIDITY_DAYS);
  });

  it('a new proposal opens on the company’s saved timeline, in the order it was saved', async () => {
    await saveTimeline(OWN_PHASES);
    const draft = await aDraft(seller(), await ownedLead());
    expect(phasesOf(draft)).toEqual(OWN_PHASES);
  });

  it('a rep’s edit stays on its proposal: the company’s template and another proposal keep theirs', async () => {
    await saveTimeline(OWN_PHASES);
    const first = await aDraft(seller(), await ownedLead());
    const other = await aDraft(seller(), await ownedLead());
    const mine = [{ name: 'Only here', description: 'For this customer.', durationDays: 3 }];
    const changed = await edited(seller(), first, { fields: { timeline: mine } });
    expect(fieldsOf(changed).timeline).toEqual(mine);
    expect(await savedTimeline()).toEqual(OWN_PHASES);
    expect(phasesOf((await detailOf(seller(), other.id)).body)).toEqual(OWN_PHASES);
  });

  it('terms that print on three pages save; terms past three pages are refused and the draft keeps its own (M06-15)', async () => {
    const draft = await aDraft(seller(), await ownedLead());
    const clause =
      'Each clause reads in full, with the time, the approval and the plan it rests on. ';
    const clauses = (count: number) => ({
      version: 1 as const,
      blocks: Array.from({ length: count }, () => ({
        type: 'p' as const,
        spans: [{ text: clause.repeat(2) }],
      })),
    });
    const atTheLimit = (count: number) => termsPagesOf(clauses(count)).length;
    let count = 1;
    while (atTheLimit(count + 1) <= PROPOSAL_LIMITS.termsPages) count += 1;
    const three = clauses(count);
    expect(termsPagesOf(three)).toHaveLength(PROPOSAL_LIMITS.termsPages);
    const saved = await edited(seller(), draft, { fields: { terms: three } });
    expect(fieldsOf(saved).terms).toEqual(three);
    const four = clauses(count + 1);
    expect(termsPagesOf(four).length).toBeGreaterThan(PROPOSAL_LIMITS.termsPages);
    const refused = await edit(seller(), saved, { fields: { terms: four } });
    expect(refused.status).toBe(HttpStatus.BAD_REQUEST);
    expect(fieldsOf((await detailOf(seller(), draft.id)).body).terms).toEqual(three);
  });

  it('a template the owner changes reaches an open draft only when its step is Reset', async () => {
    await saveTimeline(OWN_PHASES);
    const open = await aDraft(seller(), await ownedLead());
    await saveTimeline(LATER_PHASES);
    const still = (await detailOf(seller(), open.id)).body;
    expect(phasesOf(still)).toEqual(OWN_PHASES);
    expect(still.revision).toBe(open.revision);
    const back = await reset(seller(), still, 'timeline');
    expect(back.status).toBe(HttpStatus.OK);
    expect(phasesOf(back.body)).toEqual(LATER_PHASES);
  });

  it('Reset on the payment step puts the company’s default plan back', async () => {
    const open = await aDraft(seller(), await ownedLead());
    const plan = fieldsOf(open).payment;
    const edit = await edited(seller(), open, {
      fields: { payment: { templateId: null, tranches: [...plan.tranches].reverse() } },
    });
    expect(fieldsOf(edit).payment.templateId).toBeNull();
    const back = await reset(seller(), edit, 'payment');
    expect(fieldsOf(back.body).payment).toEqual(plan);
  });

  it('a Reset on a stale revision is refused, and a step with no template is not offered one', async () => {
    const open = await aDraft(seller(), await ownedLead());
    const stale = await reset(seller(), { ...open, revision: open.revision + 1 }, 'timeline');
    expect(stale.status).toBe(HttpStatus.CONFLICT);
    const terms = await seller().call('POST', `/proposals/${open.id}/reset`, {
      revision: open.revision,
      step: 'terms',
      capturedAt: new Date().toISOString(),
    });
    expect(terms.status).toBe(HttpStatus.BAD_REQUEST);
  });

  async function ownedLead(): Promise<string> {
    const leadId = await aLead(owner());
    // The lead is the Sales Executive's, so their scope reaches it.
    await ownLead(world, leadId, here.people.seller.userId);
    return leadId;
  }
});
