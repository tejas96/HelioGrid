import type { BillingUsage } from '@heliogrid/contracts';
import type { TierLimit } from '@heliogrid/domain';
import {
  designFigure,
  gbOf,
  isSignal,
  measured,
  money,
  noLimitNote,
  onTrial,
  type rowsOf,
} from './UsagePage.rows';
import type { UsageInput, UsageTableRow } from './UsagePage.types';

/** The 1536 tables (decision 7), from the same rows the cards draw. */
export function tableRowsOf(
  usage: BillingUsage,
  input: UsageInput,
  cards: ReturnType<typeof rowsOf>,
) {
  const { words, format } = input;
  const allowed = (limit: TierLimit | null, perMonth: boolean) => {
    const bound = measured(limit);
    if (bound !== null) return perMonth ? words.aMonth(format.number(bound)) : format.number(bound);
    return noLimitNote(limit, usage, input) ?? '';
  };
  const row = (
    base: Pick<UsageTableRow, 'key' | 'label' | 'used' | 'included'> & Partial<UsageTableRow>,
  ): UsageTableRow => ({
    chip: null,
    usedSub: null,
    rate: [],
    rateGap: null,
    charges: '',
    ledger: null,
    plans: false,
    ...base,
  });
  const limits = [
    row({
      key: 'proposals',
      label: words.proposals,
      used: format.number(usage.proposals.used),
      included: allowed(usage.proposals.limit, true),
      plans: isSignal(usage.proposals.usage),
    }),
    row({
      key: 'projects',
      label: words.view.limits.activeProjects,
      used: format.number(usage.activeProjects.used),
      included: allowed(usage.activeProjects.limit, false),
      plans: isSignal(usage.activeProjects.usage),
    }),
    row({
      key: 'design',
      label: words.view.limits.biggestDesign,
      used: '',
      included: designFigure(usage.designCeilingKw, input),
    }),
  ];
  const { voice, storage } = usage;
  const bundle = measured(voice.limit);
  const included = [
    row({
      key: 'voice',
      label: words.view.limits.voiceMinutes,
      used: words.minutesFigure(format.number(voice.usedMinutes)),
      included:
        bundle === null
          ? onTrial(usage)
            ? ''
            : words.payAsYouGo
          : words.minutesFigure(format.number(bundle)),
      rate: cards.rate?.value ?? [],
      charges: voice.soFar === null ? '' : money(voice.soFar, input),
      ledger: 'voice_minutes',
      plans: isSignal(voice.usage),
    }),
    row({
      key: 'storage',
      label: words.view.limits.storage,
      used: words.gbFigure(format.number(gbOf(storage.usedBytes ?? 0))),
      usedSub: cards.asOf,
      included:
        measured(storage.limitGb) === null
          ? allowed(storage.limitGb, false)
          : words.gbFigure(format.number(measured(storage.limitGb) ?? 0)),
      plans: isSignal(storage.usage),
    }),
    row({
      key: 'otp',
      label: words.otpCodes,
      chip: { word: words.notBilled, tone: 'neutral' },
      used: format.number(usage.otpCodes),
      included: words.trackedOnly,
      ledger: 'otp_delivery',
    }),
  ];
  return { limits, included };
}
