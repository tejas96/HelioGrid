import { type BasisPoints, basisPoints } from '../money/basis-points';
import type { ProjectChainStage } from '../projects/stages';

/** The most tranches one template holds (`SCR-M01-20`): the editor stops adding and the wire refuses a 13th. */
export const TRANCHE_LINE_LIMIT = 12;

export interface TrancheLineDefault {
  readonly label: string;
  readonly share: BasisPoints;
  readonly dueOnStage: ProjectChainStage;
}

export interface TrancheTemplateDefault {
  readonly name: string;
  readonly lines: readonly TrancheLineDefault[];
}

/** The tranches the standard splits are made of; their words are catalog copy (`packages/i18n`). */
export const STANDARD_TRANCHES = [
  'on_signing',
  'before_dispatch',
  'on_installation',
  'on_commissioning',
] as const;
export type StandardTranche = (typeof STANDARD_TRANCHES)[number];

/** What the standard splits say, in one reader's words. `name` takes the split, as `10/60/20/10`. */
export interface StandardTrancheWords {
  readonly name: (split: string) => string;
  readonly tranche: Readonly<Record<StandardTranche, string>>;
}

interface StandardLine {
  readonly tranche: StandardTranche;
  readonly share: BasisPoints;
  readonly dueOnStage: ProjectChainStage;
}

/**
 * The two standard splits every tenant starts with (`M01-54` — the source's 10/60/20/10 and
 * 30/60/10), seeded at creation as the tenant's own rows in the creator's words: given, not locked
 * (`SCR-M01-20`). The first is the default.
 */
const STANDARD_SPLITS: readonly [readonly StandardLine[], readonly StandardLine[]] = [
  [
    { tranche: 'on_signing', share: basisPoints(1000), dueOnStage: 'won' },
    { tranche: 'before_dispatch', share: basisPoints(6000), dueOnStage: 'material_ordered' },
    { tranche: 'on_installation', share: basisPoints(2000), dueOnStage: 'installation' },
    { tranche: 'on_commissioning', share: basisPoints(1000), dueOnStage: 'commissioned' },
  ],
  [
    { tranche: 'on_signing', share: basisPoints(3000), dueOnStage: 'won' },
    { tranche: 'before_dispatch', share: basisPoints(6000), dueOnStage: 'material_ordered' },
    { tranche: 'on_commissioning', share: basisPoints(1000), dueOnStage: 'commissioned' },
  ],
];

/** A split as its name writes it — each share in whole percent, `10/60/20/10`. */
function splitOf(lines: readonly StandardLine[]): string {
  return lines.map((line) => line.share / 100).join('/');
}

/** The two standard splits in one reader's words; the first is the default. */
export function standardTrancheTemplates(
  words: StandardTrancheWords,
): readonly [TrancheTemplateDefault, TrancheTemplateDefault] {
  const inWords = (lines: readonly StandardLine[]): TrancheTemplateDefault => ({
    name: words.name(splitOf(lines)),
    lines: lines.map((line) => ({
      label: words.tranche[line.tranche],
      share: line.share,
      dueOnStage: line.dueOnStage,
    })),
  });
  return [inWords(STANDARD_SPLITS[0]), inWords(STANDARD_SPLITS[1])];
}
