import type { TranslatedText, VersionInForcePreview } from '@heliogrid/contracts';
import {
  customerShortNameOf,
  type DealSegment,
  percentToBasisPoints,
  shareTextOf,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import type { ProposalVersionsFormats } from './proposal-after-versions';

type T = Translator['t'];

const IN_FORCE = {
  title: /*i18n*/ { id: 'Put version {version} in force?' },
  close: /*i18n*/ { id: 'Close' },
  newTotal: /*i18n*/ { id: 'New total' },
  paid: /*i18n*/ { id: 'Already paid — stays as it is' },
  remaining: /*i18n*/ { id: 'Still to collect' },
  surplus: /*i18n*/ { id: 'Collected above the new total' },
  planTitle: /*i18n*/ { id: 'New plan for what is left' },
  statePaid: /*i18n*/ { id: 'Paid' },
  statePartPaid: /*i18n*/ { id: 'Part paid' },
  paidOn: /*i18n*/ { id: 'Paid {date} · receipt kept' },
  dueShare: /*i18n*/ { id: '{stage} · {share}% of what is left' },
  dueRest: /*i18n*/ { id: '{stage} · the rest' },
  share: /*i18n*/ { id: '{share}% of what is left' },
  hint: /*i18n*/ {
    id: 'Every receipt is kept. The customer’s link shows the new plan at once.',
  },
  confirm: /*i18n*/ { id: 'Yes, {name} agreed' },
  confirmPlain: /*i18n*/ { id: 'Yes, the customer agreed' },
  recorded: /*i18n*/ { id: 'Your name and the time are recorded' },
  loading: /*i18n*/ { id: 'Working out the new plan' },
  failedTitle: /*i18n*/ { id: 'The new plan did not load' },
  failedMessage: /*i18n*/ { id: 'Nothing changed. Check the connection and try again.' },
  retry: /*i18n*/ { id: 'Try again' },
} as const;

type InForcePart = VersionInForcePreview['plan'][number];

/** When a part falls: the day a kept part was paid, a new part's stage and share of what is left. */
function inForcePartLine(
  t: T,
  formats: { readonly due: (stage: string) => string; readonly day: (date: string) => string },
  part: InForcePart,
): TranslatedText | null {
  if (part.state !== 'new') {
    return part.paidOn === null ? null : t(IN_FORCE.paidOn, { date: formats.day(part.paidOn) });
  }
  const share =
    part.shareOfRest === null ? null : shareTextOf(percentToBasisPoints(part.shareOfRest));
  if (part.dueOnStage === null) return share === null ? null : t(IN_FORCE.share, { share });
  const stage = formats.due(part.dueOnStage);
  return share === null ? t(IN_FORCE.dueRest, { stage }) : t(IN_FORCE.dueShare, { stage, share });
}

/** `PutInForceSheet`'s words (`M08-50`, `M11-14`). */
export function putInForceWords(
  t: T,
  formats: Pick<ProposalVersionsFormats, 'money'> & {
    /** A stage's name as the customer's document says it — "Before dispatch". */
    readonly due: (stage: string) => string;
    /** A calendar day as the market prints it. */
    readonly day: (date: string) => string;
  },
  facts: {
    readonly version: number;
    readonly customerName: string | null;
    readonly segment: DealSegment | null;
  },
) {
  return {
    title: t(IN_FORCE.title, { version: facts.version }),
    close: t(IN_FORCE.close),
    /** One column: its amounts share one form, so a paisa in one keeps it in all (never rounded). */
    summary: (preview: VersionInForcePreview) => {
      const rows = [
        { label: t(IN_FORCE.newTotal), amount: preview.newTotal },
        { label: t(IN_FORCE.paid), amount: preview.paid },
        { label: t(IN_FORCE.remaining), amount: preview.remaining },
        ...(preview.surplus === null
          ? []
          : [{ label: t(IN_FORCE.surplus), amount: preview.surplus }]),
      ];
      const column = rows.map((row) => row.amount);
      return rows.map((row) => ({
        label: row.label,
        value: formats.money(row.amount, column),
        mono: true,
      }));
    },
    planTitle: t(IN_FORCE.planTitle),
    part: (part: VersionInForcePreview['plan'][number], plan: VersionInForcePreview['plan']) => ({
      name: shownAsSent(part.label),
      line: inForcePartLine(t, formats, part),
      state:
        part.state === 'paid'
          ? t(IN_FORCE.statePaid)
          : part.state === 'part_paid'
            ? t(IN_FORCE.statePartPaid)
            : null,
      amount: formats.money(
        part.amount,
        plan.map((each) => each.amount),
      ),
    }),
    hint: t(IN_FORCE.hint),
    confirm:
      facts.customerName === null
        ? t(IN_FORCE.confirmPlain)
        : t(IN_FORCE.confirm, {
            name: customerShortNameOf(facts.customerName, facts.segment),
          }),
    recorded: t(IN_FORCE.recorded),
    loading: t(IN_FORCE.loading),
    failedTitle: t(IN_FORCE.failedTitle),
    failedMessage: t(IN_FORCE.failedMessage),
    retry: t(IN_FORCE.retry),
  } satisfies Record<string, unknown> & { title: TranslatedText };
}
