import type { BillingUsage } from '@heliogrid/contracts';
import { storagePausesAboveGb, type TierLimit } from '@heliogrid/domain';
import type { BillingValue } from '../BillingHome/BillingHome.types';
import { figured, plain } from '../BillingHome/BillingHome.values';
import { gbOf, inNeeds, measured, onTrial, percentOf, stepChip } from './UsagePage.rows';
import type { UsageInput, UsageNeedRow, UsageRowKey } from './UsagePage.types';

type Step = BillingUsage['voice']['usage'];

/** `Needs you`'s rows: each meter at 80%, at its cap or paused, and what happens next and when. */
export function needsOf(usage: BillingUsage, input: UsageInput): UsageNeedRow[] {
  const { words, format } = input;
  const date = (at: string | null) => (at === null ? '' : format.date(at));
  const of = (used: string, limit: TierLimit | null, unit: typeof words.minutes | null) => {
    const bound = measured(limit);
    return bound === null ? used : words.usedOf(used, format.number(bound), unit);
  };
  const trial = onTrial(usage);
  const rows: UsageNeedRow[] = [];
  const add = (
    key: UsageRowKey,
    title: typeof words.minutes,
    step: Step,
    percent: number | null,
    shown: string,
    line: BillingValue,
  ) => {
    if (!inNeeds(step)) return;
    const chip = stepChip(step, percent, input);
    rows.push({
      key,
      title,
      chip,
      figure: shown,
      line,
      tone: chip.tone === 'danger' ? 'danger' : 'warning',
    });
  };
  for (const [key, counted, title] of [
    ['proposals', usage.proposals, words.proposals],
    ['projects', usage.activeProjects, words.view.limits.activeProjects],
  ] as const) {
    add(
      key,
      title,
      counted.usage,
      percentOf(counted.used, counted.limit),
      of(format.number(counted.used), counted.limit, null),
      countedLine(counted.usage, input),
    );
  }
  const { voice, storage } = usage;
  const voiceLine = trial
    ? voice.usage.step === 'paused'
      ? plain(words.lines.trialVoicePaused(date(voice.usage.resetsAt)))
      : voice.usage.step === 'warning'
        ? plain(words.lines.trialVoiceWarning())
        : countedLine(voice.usage, input)
    : figured(
        words.lines.bundleWarning(format.number(measured(voice.limit) ?? 0)),
        voice.rate === null ? '' : format.money(voice.rate),
      );
  add(
    'voice',
    words.view.limits.voiceMinutes,
    voice.usage,
    percentOf(voice.usedMinutes, voice.limit),
    of(format.number(voice.usedMinutes), voice.limit, words.minutes),
    voiceLine,
  );
  const ceiling = measured(storage.limitGb);
  const pauseAbove =
    ceiling === null ? '' : words.gbFigure(format.number(storagePausesAboveGb(ceiling)));
  add(
    'storage',
    words.view.limits.storage,
    storage.usage,
    percentOf(gbOf(storage.usedBytes ?? 0), storage.limitGb),
    of(format.number(gbOf(storage.usedBytes ?? 0)), storage.limitGb, words.view.gb),
    plain(
      storage.usage.step === 'paused'
        ? words.lines.storagePaused()
        : words.lines.storageWarning(pauseAbove),
    ),
  );
  return rows;
}

function countedLine(step: Step, input: UsageInput): BillingValue {
  const { words, format } = input;
  if (step.step === 'grace' && step.pausesAt !== null)
    return plain(words.lines.grace(format.date(step.pausesAt)));
  if (step.step === 'paused' && step.resetsAt !== null)
    return plain(words.lines.paused(format.date(step.resetsAt)));
  return plain(words.lines.capWarning());
}
