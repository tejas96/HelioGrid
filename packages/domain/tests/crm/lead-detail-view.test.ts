import { describe, expect, it } from 'vitest';
import { leadActDaysOf, tenantInstantOf } from '../../src/crm/lead-detail-clock';
import {
  dialOfferOf,
  type LeadDetailFacts,
  type LeadTaskFacts,
  leadActsOf,
  leadContactsOf,
  leadDetailViewOf,
  leadStateActsOf,
  leadTasksOf,
  leadValueShownOf,
} from '../../src/crm/lead-detail-view';
import type { LeadLifecycleState, LeadStage } from '../../src/crm/vocabulary';
import { IN_FORMATS } from '../../src/format/pack';
import { minorUnits, minorUnitsToDecimal } from '../../src/money/minor-units';

const RAJESH = { userId: 'user-rajesh', name: 'Rajesh Jadhav' };

const PRIYA: LeadDetailFacts = {
  lead: {
    name: 'Priya Sharma',
    phoneE164: '+919822014567',
    city: 'Nashik',
    segment: 'residential',
    source: 'referral',
    stage: 'contacted',
    state: null,
    owner: RAJESH,
    monthlyBill: { amount: '4200.00', tier: 'assumed' },
    value: null,
  },
  customer: {
    id: 'customer-priya',
    name: 'Priya Sharma',
    phoneE164: '+919822014567',
    doNotCall: false,
    wrongNumber: false,
    primaryContactId: null,
    contacts: [
      {
        id: 'contact-ravi',
        name: 'Ravi Sharma',
        phoneE164: '+919822077881',
        role: { id: 'label-spouse', seed: 'spouse', text: null },
      },
    ],
  },
  qualify: {
    roofOwnership: 'own',
    roofType: null,
    shading: null,
    timeline: null,
    decisionMaker: null,
  },
  lifecycle: { wakeOn: null },
  unansweredCalls: 0,
  canDial: true,
  cameFrom: { customerId: 'customer-anil', name: 'Anil Patil' },
  visit: null,
  openTasks: [],
  sections: { designs: 0, proposals: 0, files: 2 },
};

const NOW = Date.parse('2026-11-09T10:00:00Z');
const QUIET = { nowEpoch: NOW, saves: {}, lastSaved: null, doneHere: [] } as const;

function withLead(lead: Partial<LeadDetailFacts['lead']>): LeadDetailFacts {
  return { ...PRIYA, lead: { ...PRIYA.lead, ...lead } };
}

function task(id: string, dueAt: string, status: LeadTaskFacts['status'] = 'open'): LeadTaskFacts {
  return { id, kind: 'call', title: null, status, dueAt, assignee: RAJESH };
}

describe('lead detail: the call offer (M02-37, M02-44)', () => {
  it.each([
    [true, false, false, { kind: 'dial', phoneE164: '+919822014567' }],
    [false, true, false, { kind: 'blocked', reason: 'do_not_call' }],
    [false, false, true, { kind: 'blocked', reason: 'wrong_number' }],
    [false, true, true, { kind: 'blocked', reason: 'wrong_number' }],
  ])(
    'can dial %s, do-not-call %s, wrong number %s → %j',
    (canDial, doNotCall, wrongNumber, offer) => {
      const facts = { ...PRIYA, canDial, customer: { ...PRIYA.customer, doNotCall, wrongNumber } };
      expect(dialOfferOf(facts)).toEqual(offer);
    },
  );
});

describe('lead detail: the acts its standing offers (M02-45, M02-51…M02-56)', () => {
  it.each<[LeadLifecycleState | null, readonly string[]]>([
    [null, ['snooze', 'disqualify', 'junk']],
    ['snoozed', ['wake', 'snooze', 'disqualify', 'junk']],
    ['dormant', ['reopen', 'snooze', 'disqualify', 'junk']],
    ['disqualified', ['reopen']],
    ['lost', ['reopen']],
    ['junk', ['reopen']],
  ])('a lead in state %s offers %j', (state, acts) => {
    expect(leadStateActsOf(state)).toEqual(acts);
  });

  it.each<[LeadStage, LeadLifecycleState | null, boolean]>([
    ['new', null, true],
    ['contacted', null, true],
    ['contacted', 'snoozed', true],
    ['qualified', null, false],
    ['survey', null, false],
    ['contacted', 'disqualified', false],
  ])('Mark qualified at stage %s in state %s: %s', (stage, state, offered) => {
    expect(leadActsOf(withLead({ stage, state })).markQualified).toBe(offered);
  });

  it.each<[LeadStage, LeadLifecycleState | null, boolean]>([
    ['new', null, true],
    ['proposal', null, true],
    ['negotiating', 'snoozed', true],
    ['won', null, false],
    ['negotiating', 'lost', false],
    ['contacted', 'junk', false],
  ])('Mark won at stage %s in state %s: %s', (stage, state, offered) => {
    expect(leadActsOf(withLead({ stage, state })).markWon).toBe(offered);
  });

  it.each([
    [null, null, 'book'],
    [{ id: 'visit-1', address: 'Plot 14, Gangapur Road' }, null, 'reschedule'],
    [null, 'junk' as const, 'closed'],
    [{ id: 'visit-1', address: 'Plot 14, Gangapur Road' }, 'lost' as const, 'closed'],
  ])('a visit %j on a lead in state %s is %s', (visit, state, offered) => {
    expect(leadActsOf({ ...withLead({ state }), visit }).visit).toBe(offered);
  });
});

describe('lead detail: contacts (M02-34)', () => {
  it('the customer is primary until a contact is named, and exactly one is primary', () => {
    const own = leadContactsOf(PRIYA);
    expect(own.map((contact) => [contact.id, contact.primary])).toEqual([
      [null, true],
      ['contact-ravi', false],
    ]);
    const named = leadContactsOf({
      ...PRIYA,
      customer: { ...PRIYA.customer, primaryContactId: 'contact-ravi' },
    });
    expect(named.map((contact) => [contact.id, contact.primary])).toEqual([
      [null, false],
      ['contact-ravi', true],
    ]);
  });

  it.each([
    [false, false, true, true],
    [true, false, false, false],
    [false, true, false, true],
  ])(
    'do-not-call %s, wrong number %s: the customer dials %s, a contact %s',
    (doNotCall, wrongNumber, self, other) => {
      const facts = {
        ...PRIYA,
        canDial: !doNotCall && !wrongNumber,
        customer: { ...PRIYA.customer, doNotCall, wrongNumber },
      };
      expect(leadContactsOf(facts).map((contact) => contact.dial)).toEqual([self, other]);
    },
  );
});

describe('lead detail: tasks (M07-05)', () => {
  it.each([
    ['2026-11-09T09:59:00Z', true],
    ['2026-11-09T10:00:00Z', false],
    ['2026-11-10T09:00:00Z', false],
  ])('an open task due %s is overdue: %s', (dueAt, overdue) => {
    expect(leadTasksOf([task('t1', dueAt)], [], NOW)[0]?.overdue).toBe(overdue);
  });

  it('tasks stand soonest first, and one done here keeps its row as done, never overdue', () => {
    const later = task('later', '2026-11-12T09:00:00Z');
    const past = task('past', '2026-11-08T09:00:00Z');
    const done = { ...past, status: 'done' as const };
    const shown = leadTasksOf([later, past], [done], NOW);
    expect(shown.map((row) => [row.id, row.status, row.overdue])).toEqual([
      ['past', 'done', false],
      ['later', 'open', false],
    ]);
  });
});

describe('lead detail: the header and sections (M02-32, M02-43, M02-51)', () => {
  it.each([
    [0, null],
    [1, null],
    [2, 2],
    [3, 3],
  ])('%i calls without an answer shows the count %s', (unansweredCalls, shown) => {
    expect(leadDetailViewOf({ ...PRIYA, unansweredCalls }, QUIET).marks.triesWithoutAnswer).toBe(
      shown,
    );
  });

  it.each<[LeadLifecycleState | null, string | null]>([
    ['snoozed', '2026-12-02'],
    ['dormant', null],
    [null, null],
  ])('a lead in state %s shows the wake day %s', (state, wakeOn) => {
    const facts = { ...withLead({ state }), lifecycle: { wakeOn: '2026-12-02' } };
    expect(leadDetailViewOf(facts, QUIET).marks.wakeOn).toBe(wakeOn);
  });

  it('the six sections carry their counts, and the site is the booked address or a gap', () => {
    const view = leadDetailViewOf(PRIYA, QUIET);
    expect(view.counts).toEqual({
      timeline: null,
      site: null,
      designs: 0,
      proposals: 0,
      tasks: 0,
      files: 2,
    });
    expect(view.siteAddress).toBeNull();
    const booked = { ...PRIYA, visit: { id: 'visit-1', address: 'Plot 14, Gangapur Road' } };
    expect(leadDetailViewOf(booked, QUIET).siteAddress).toBe('Plot 14, Gangapur Road');
  });

  it('the qualify card reads the bill from the lead and the five answers from the read', () => {
    const card = leadDetailViewOf(PRIYA, QUIET).qualify;
    expect(card.answered).toBe(2);
    expect(card.questions.map((question) => question.saved)).toEqual([
      '4200.00',
      'own',
      null,
      null,
      null,
      null,
    ]);
  });
});

describe('lead detail: the days its acts name, on the tenant clock (F1-10, M02-51)', () => {
  it.each([
    ['2026-11-09T18:29:00Z', '2026-11-09', '2026-11-10'],
    ['2026-11-09T18:30:00Z', '2026-11-10', '2026-11-11'],
    ['2026-12-31T20:00:00Z', '2027-01-01', '2027-01-02'],
  ])('at %s Kolkata reads today %s and tomorrow %s', (instant, today, tomorrow) => {
    expect(leadActDaysOf(Date.parse(instant), 'Asia/Kolkata')).toEqual({ today, tomorrow });
  });

  it.each([
    ['2026-11-14', '11:30', 'Asia/Kolkata', '2026-11-14T06:00:00.000Z'],
    ['2026-11-14', '00:00', 'Asia/Kolkata', '2026-11-13T18:30:00.000Z'],
    ['2026-11-14', '09:00', 'UTC', '2026-11-14T09:00:00.000Z'],
  ])('a call-back on %s at %s in %s is due at %s', (date, time, zone, due) => {
    expect(new Date(tenantInstantOf(date, time, zone)).toISOString()).toBe(due);
  });
});

describe('lead detail: the hero’s value in the tenant’s money (M02-38, F3-20)', () => {
  it.each([
    [345_000, '₹3,450'],
    [123_456_700, '₹12,34,567'],
    [0, '₹0'],
  ])('%i paise, sent as the wire’s decimal text, reads %s', (paise, shown) => {
    const amount = minorUnitsToDecimal(minorUnits(paise), IN_FORMATS.minorUnitDigits);
    const value = { amount, tier: 'estimated', provisional: true } as const;
    expect(leadValueShownOf(value, IN_FORMATS)).toEqual({
      text: shown,
      tier: 'estimated',
      provisional: true,
    });
  });

  it('a lead no proposal has priced yet shows no figure', () => {
    expect(leadValueShownOf(null, IN_FORMATS)).toBeNull();
  });
});
