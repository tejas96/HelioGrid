import { FIGURE_SLOT } from '@heliogrid/domain';
import type { Translator } from '../runtime';

type T = Translator['t'];

const READY = {
  status: /*i18n*/ { id: 'Generated' },
  title: /*i18n*/ { id: '{name}’s proposal is ready' },
  line: /*i18n*/ {
    id: '{number} · version {version} · {amount} · {pages, plural, one {# page} other {# pages}}',
  },
  share: /*i18n*/ { id: 'See it and share' },
  download: /*i18n*/ { id: 'Download PDF' },
  back: /*i18n*/ { id: 'Back to {name}’s lead' },
  moment: /*i18n*/ { id: 'Proposal generated' },
} as const;

type ReadyFacts = { name: string; number: string; version: number; amount: string; pages: number };

/** The number and the amount, in the order the reader's words place them in the ready line. */
function readyFiguresOf(t: T, facts: ReadyFacts): readonly string[] {
  const at = (slot: 'number' | 'amount') =>
    t(READY.line, { ...facts, number: '', amount: '', [slot]: FIGURE_SLOT }).indexOf(FIGURE_SLOT);
  return at('number') <= at('amount') ? [facts.number, facts.amount] : [facts.amount, facts.number];
}

/** The screen after Generate; every figure is the server's own text. */
export function proposalReadyWords(t: T, facts: ReadyFacts) {
  return {
    status: t(READY.status),
    title: t(READY.title, { name: facts.name }),
    /**
     * The number and the amount stand as `FIGURE_SLOT`s: the screen sets `lineFigures`, in order,
     * in the mono face where the words put them (an identifier and money, §9 and §10).
     */
    line: t(READY.line, { ...facts, number: FIGURE_SLOT, amount: FIGURE_SLOT }),
    lineFigures: readyFiguresOf(t, facts),
    share: t(READY.share),
    download: t(READY.download),
    back: t(READY.back, { name: facts.name }),
    moment: t(READY.moment),
  };
}
