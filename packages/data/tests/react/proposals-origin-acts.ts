import type { ProposalDetail } from '@heliogrid/contracts';
import { afterEach } from 'vitest';

/**
 * What the sell origin (`proposals-origin.ts`) does beyond storing a commit, each switched on by the
 * case that needs it: the follow-up a share raises, how often a PDF was asked for, the company's
 * timeline a step's Reset puts back, and the generation a fill or ↺ answers.
 */

type Phase = ProposalDetail['document']['fields']['timeline'][number];

interface OriginActs {
  /** The day the share's follow-up falls; `null` where the share raised none. */
  followUpOn: string | null;
  pdfReads: number;
  /** The company's timeline template in force; `null` leaves a Reset to the plain commit. */
  companyTimeline: readonly Omit<Phase, 'durationDays'>[] | null;
  /** The month figures the source of record answers; `null` leaves a fill to the plain commit. */
  filledMonths: readonly number[] | null;
}

const fresh = (): OriginActs => ({
  followUpOn: '2026-11-15',
  pdfReads: 0,
  companyTimeline: null,
  filledMonths: null,
});

export const originActs: OriginActs = fresh();

afterEach(() => {
  Object.assign(originActs, fresh());
});

/** A PDF read, counted. */
export function pdfAsked<T>(download: T): T {
  originActs.pdfReads += 1;
  return download;
}

/** The proposal after a Reset or a fill the case switched on; `null` for every other write. */
export function actedOn(was: ProposalDetail, path: string, body: unknown): ProposalDetail | null {
  const { companyTimeline, filledMonths } = originActs;
  const step = (body as { step?: string }).step;
  const next = structuredClone(was);
  next.revision = was.revision + 1;
  const { fields } = next.document;
  if (path.endsWith('/reset') && step === 'timeline' && companyTimeline !== null) {
    fields.timeline = companyTimeline.map((phase) => ({ ...phase, durationDays: null }));
    return next;
  }
  if (path.endsWith('/energy') && filledMonths !== null) {
    const source = { kind: 'record' as const, databases: ['ERA5' as const] };
    fields.performance = {
      ...fields.performance,
      source,
      grain: 'district',
      editedMonthlyKwh: null,
      editedAtCapacityKw: null,
    };
    next.document.generation = {
      monthlyKwh: [...filledMonths],
      yearlyKwh: filledMonths.reduce((sum, month) => sum + month, 0),
      bestMonth: filledMonths.indexOf(Math.max(...filledMonths)),
      source,
      grain: 'district',
      tier: 'estimated',
      capacityChangedSinceEdit: false,
    };
    return next;
  }
  return null;
}
