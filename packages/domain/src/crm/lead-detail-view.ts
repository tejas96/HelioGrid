import { formatMoney } from '../format/money';
import type { FormatPack } from '../format/pack';
import type { ProvenanceTier } from '../format/qualified';
import { isOverdue } from '../tasks/overdue';
import type { DealSegment } from '../tenancy/segment';
import type { DialOffer, LeadDetailSection, LeadStateAct } from './lead-detail-vocabulary';
import {
  type QualifyAnswers,
  type QualifyCardView,
  type QualifyQuestion,
  type QualifySaves,
  qualifyCardOf,
} from './lead-qualify';
import { type LeadSiteFacts, type LeadSiteView, leadSiteViewOf } from './lead-site-view';
import { isClosedState } from './lifecycle-model';
import {
  type ContactRoleSeed,
  LEAD_STAGES,
  type LeadLifecycleState,
  type LeadStage,
  type TaskStatus,
} from './vocabulary';

/**
 * Lead Detail (`SCR-M02-04`, `M02-32`) as both screens draw it: the header, which of the five
 * actions and the state acts the lead's standing offers, the qualify card, the contacts, the open
 * tasks and the six sections. Pure — the lead read comes in as facts, the clock as an epoch.
 */

/** A member as the lead names them — its owner, a surveyor, a task's assignee. */
export interface LeadMember {
  readonly userId: string;
  readonly name: string;
}

/** What the lead read carries that the screen decides on; the wire's lead detail meets it. */
export interface LeadDetailFacts {
  readonly lead: {
    readonly name: string | null;
    readonly phoneE164: string;
    readonly city: string | null;
    readonly segment: DealSegment | null;
    readonly source: string;
    readonly stage: LeadStage;
    readonly state: LeadLifecycleState | null;
    readonly owner: LeadMember | null;
    readonly monthlyBill: { readonly amount: string; readonly tier: ProvenanceTier } | null;
    readonly value: {
      readonly amount: string;
      readonly tier: ProvenanceTier;
      readonly provisional: boolean;
    } | null;
  };
  readonly customer: {
    readonly id: string;
    readonly name: string | null;
    readonly phoneE164: string;
    readonly doNotCall: boolean;
    readonly wrongNumber: boolean;
    readonly primaryContactId: string | null;
    readonly contacts: readonly {
      readonly id: string;
      readonly name: string;
      readonly phoneE164: string;
      readonly role: {
        readonly id: string;
        readonly seed: ContactRoleSeed | null;
        readonly text: string | null;
      } | null;
    }[];
  };
  readonly qualify: Omit<QualifyAnswers, 'monthlyBill'>;
  readonly lifecycle: { readonly wakeOn: string | null };
  readonly unansweredCalls: number;
  readonly canDial: boolean;
  readonly cameFrom: { readonly customerId: string | null; readonly name: string | null } | null;
  readonly visit: { readonly id: string; readonly address: string } | null;
  /** The lead's own site facts; absent on an api built before the lead held them. */
  readonly site?: LeadSiteFacts;
  readonly openTasks: readonly LeadTaskFacts[];
  readonly sections: {
    readonly designs: number;
    readonly proposals: number;
    readonly files: number;
  };
}

/** A follow-up task as the lead read carries it. */
export interface LeadTaskFacts {
  readonly id: string;
  readonly kind: string;
  readonly title: string | null;
  /** What raised it — a customer's answer words its task (`M06-55`); absent on an older read. */
  readonly provenance?: string;
  readonly status: TaskStatus;
  readonly dueAt: string;
  readonly assignee: LeadMember;
}

/** The header's chips beside the name: the parked state and the failed tries (`M02-43`, `M02-51`). */
export interface LeadHeaderMarks {
  readonly state: LeadLifecycleState | null;
  /** The day a snoozed lead wakes — "Snoozed till …"; null for any other state. */
  readonly wakeOn: string | null;
  /** Calls not answered in a row, shown once there is more than one; null otherwise. */
  readonly triesWithoutAnswer: number | null;
}

/** Which acts the lead's standing offers now — the same rules the server holds (`lifecycle*.ts`). */
export interface LeadActsView {
  readonly stateActs: readonly LeadStateAct[];
  /** From `new` or `contacted`, on a lead not closed (`M02-45`). */
  readonly markQualified: boolean;
  /** From any stage before Won, on a lead not closed — the deal becomes a project (`M07-62`). */
  readonly markWon: boolean;
  /** A first booking, the no-show reschedule of the one booked, or none while the lead is closed. */
  readonly visit: 'book' | 'reschedule' | 'closed';
}

/** One person to reach on the lead: the customer themself (`id` null) or one of their contacts. */
export interface LeadContactView {
  readonly id: string | null;
  readonly name: string | null;
  readonly phoneE164: string;
  readonly role: { readonly seed: ContactRoleSeed | null; readonly text: string | null } | null;
  /** Exactly one of the customer and their contacts is primary (`M02-34`). */
  readonly primary: boolean;
  /** Whether a call to this number is offered (`M02-37`, `M02-44`). */
  readonly dial: boolean;
}

export interface LeadTaskView extends LeadTaskFacts {
  /** Derived from the due moment, never stored (`M07-05`). */
  readonly overdue: boolean;
}

export interface LeadDetailView {
  readonly marks: LeadHeaderMarks;
  readonly dial: DialOffer;
  readonly acts: LeadActsView;
  readonly qualify: QualifyCardView;
  readonly contacts: readonly LeadContactView[];
  readonly tasks: readonly LeadTaskView[];
  /** Where the system goes and its supply; the address is confirmed once a visit is booked. */
  readonly site: LeadSiteView;
  /** Each section's count where it has one; the timeline and the site have none. */
  readonly counts: Readonly<Record<LeadDetailSection, number | null>>;
}

/** What the screen holds beside the read: the clock, the qualify saves and the tasks done here. */
export interface LeadDetailMoment {
  readonly nowEpoch: number;
  readonly saves: QualifySaves;
  readonly lastSaved: QualifyQuestion | null;
  /** Tasks marked done on this screen, so each keeps its row and its Reopen until the next read. */
  readonly doneHere: readonly LeadTaskFacts[];
}

/** The lead's value as the hero shows it (`M02-38`): its tier kept, provisional as the server says. */
export interface LeadValueShown {
  readonly text: string;
  readonly tier: ProvenanceTier;
  readonly provisional: boolean;
}

/**
 * The value in the tenant market's money: the wire's decimal text, scaled to the minor unit —
 * `3450.00`, 3,45,000 paise — reads `₹3,450` in every language; null until a proposal supplies one.
 */
export function leadValueShownOf(
  value: LeadDetailFacts['lead']['value'],
  pack: FormatPack,
): LeadValueShown | null {
  if (value === null) return null;
  return {
    text: formatMoney(pack, value.amount),
    tier: value.tier,
    provisional: value.provisional,
  };
}

/** The customer's number is dialled unless the server says no; the reason names which flag. */
export function dialOfferOf(facts: LeadDetailFacts): DialOffer {
  if (facts.canDial) return { kind: 'dial', phoneE164: facts.customer.phoneE164 };
  return { kind: 'blocked', reason: facts.customer.wrongNumber ? 'wrong_number' : 'do_not_call' };
}

/**
 * The state acts by where the lead stands: a closed lead only reopens; a parked one also wakes or
 * reopens. A won lead is a project (`M07-62`): no close reaches it, so it offers neither disqualify
 * nor junk (`lifecycle-close.ts` refuses both with `not_open`).
 */
export function leadStateActsOf(
  state: LeadLifecycleState | null,
  stage: LeadStage,
): readonly LeadStateAct[] {
  const acts = stateActsOf(state);
  return stage === 'won' ? acts.filter((act) => act !== 'disqualify' && act !== 'junk') : acts;
}

function stateActsOf(state: LeadLifecycleState | null): readonly LeadStateAct[] {
  if (isClosedState(state)) return ['reopen'];
  if (state === 'snoozed') return ['wake', 'snooze', 'disqualify', 'junk'];
  if (state === 'dormant') return ['reopen', 'snooze', 'disqualify', 'junk'];
  return ['snooze', 'disqualify', 'junk'];
}

export function leadActsOf(facts: LeadDetailFacts): LeadActsView {
  const { stage, state } = facts.lead;
  const closed = isClosedState(state);
  return {
    stateActs: leadStateActsOf(state, stage),
    markQualified: !closed && LEAD_STAGES.indexOf(stage) < LEAD_STAGES.indexOf('qualified'),
    // Offered from Qualified on: a lead no one has qualified is not a deal to win yet.
    markWon:
      !closed &&
      LEAD_STAGES.indexOf(stage) >= LEAD_STAGES.indexOf('qualified') &&
      LEAD_STAGES.indexOf(stage) < LEAD_STAGES.indexOf('won'),
    visit: closed ? 'closed' : facts.visit === null ? 'book' : 'reschedule',
  };
}

/**
 * The customer first, then each contact; the primary is the named contact, else the customer
 * (`primaryContactId` null). Do-not-call stops every number; a wrong number stops only its own.
 */
export function leadContactsOf(facts: LeadDetailFacts): readonly LeadContactView[] {
  const { customer } = facts;
  const self: LeadContactView = {
    id: null,
    name: customer.name,
    phoneE164: customer.phoneE164,
    role: null,
    primary: customer.primaryContactId === null,
    dial: facts.canDial,
  };
  const others = customer.contacts.map(
    (contact): LeadContactView => ({
      id: contact.id,
      name: contact.name,
      phoneE164: contact.phoneE164,
      role: contact.role === null ? null : { seed: contact.role.seed, text: contact.role.text },
      primary: customer.primaryContactId === contact.id,
      dial: !customer.doNotCall,
    }),
  );
  return [self, ...others];
}

/** Open tasks soonest first, each marked overdue by its due moment; one done here keeps its row. */
export function leadTasksOf(
  open: readonly LeadTaskFacts[],
  doneHere: readonly LeadTaskFacts[],
  nowEpoch: number,
): readonly LeadTaskView[] {
  const doneIds = new Set(doneHere.map((task) => task.id));
  const shown = [...open.filter((task) => !doneIds.has(task.id)), ...doneHere];
  return shown
    .map((task) => ({
      ...task,
      overdue: isOverdue({ status: task.status, dueAt: Date.parse(task.dueAt) }, nowEpoch),
    }))
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
}

export function leadDetailViewOf(facts: LeadDetailFacts, moment: LeadDetailMoment): LeadDetailView {
  const { lead } = facts;
  const answers: QualifyAnswers = {
    ...facts.qualify,
    monthlyBill: lead.monthlyBill?.amount ?? null,
  };
  return {
    marks: {
      state: lead.state,
      wakeOn: lead.state === 'snoozed' ? facts.lifecycle.wakeOn : null,
      triesWithoutAnswer: facts.unansweredCalls > 1 ? facts.unansweredCalls : null,
    },
    dial: dialOfferOf(facts),
    acts: leadActsOf(facts),
    qualify: qualifyCardOf(answers, moment.saves, moment.lastSaved),
    contacts: leadContactsOf(facts),
    tasks: leadTasksOf(facts.openTasks, moment.doneHere, moment.nowEpoch),
    site: leadSiteViewOf(facts.visit, facts.site),
    counts: {
      timeline: null,
      site: null,
      designs: facts.sections.designs,
      proposals: facts.sections.proposals,
      tasks: facts.openTasks.length,
      files: facts.sections.files,
    },
  };
}
