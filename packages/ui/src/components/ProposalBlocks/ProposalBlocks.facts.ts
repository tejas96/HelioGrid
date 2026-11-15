import type { TranslatedText } from '@heliogrid/contracts';
import {
  type BankDetails,
  type ComponentCategory,
  type ComponentLine,
  type ProposalCover,
  type ProposalPhase,
  type ProvenanceTier,
  STATED_FIGURE_TIER,
} from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type {
  ProposalPartsWords,
  ProposalTimelineWords,
  ProposalTrackRecordWords,
} from './ProposalBlocks.parts.types';
import type { BlockFigure } from './ProposalBlocks.views';

/**
 * What the blocks of the company's own facts draw — the parts, the timeline, the track record and
 * the bank account — read out of the field set as the server holds it. Both platform halves read
 * the same view.
 */

/** The glyph each category draws on its tile. */
const CATEGORY_GLYPH: Readonly<Record<ComponentCategory, ShellGlyphName>> = {
  panel: 'solar-panel',
  inverter: 'inverter',
  cable: 'link',
  electrical: 'bolt',
  structure: 'layers',
  battery: 'battery',
};

export interface PartKindView {
  readonly category: ComponentCategory;
  readonly glyph: ShellGlyphName;
  readonly name: TranslatedText;
  /** How many, in words, for a category that carries a count. */
  readonly count: TranslatedText | null;
  /** The brands listed, read as alternatives; empty while nothing is picked. */
  readonly brands: readonly string[];
  /** What prints for the first brand, and its one line for the customer. */
  readonly detail: string | null;
  // biome-ignore lint/plugin/copy-prop-type: a line's one sentence for the customer, as the company typed it
  readonly description: string | null;
  /** The certification scheme the first brand holds, as the market names it. */
  readonly flag: string | null;
}

/** One kind per category the proposal must fill, in the order the step and the document draw them. */
export function partKindViews(
  categories: readonly ComponentCategory[],
  components: readonly ComponentLine[],
  words: ProposalPartsWords,
): readonly PartKindView[] {
  return categories.map((category) => {
    const lines = components.filter((line) => line.category === category);
    const first = lines[0];
    const scheme = first?.certifications[0]?.scheme;
    return {
      category,
      glyph: CATEGORY_GLYPH[category],
      name: words.kind(category),
      count:
        first === undefined || first.count === null ? null : words.count(category, first.count),
      brands: lines.map((line) => line.brand),
      detail: first === undefined ? null : words.detail(first),
      description: first?.description ?? null,
      flag: scheme === undefined ? null : words.scheme(scheme),
    };
  });
}

export interface PhaseView {
  // biome-ignore lint/plugin/copy-prop-type: a step's name, as the company wrote it
  readonly title: string;
  // biome-ignore lint/plugin/copy-prop-type: a step's sentence, as the company wrote it
  readonly note: string;
  /** Absent where the step states no days: none is printed. */
  readonly duration: TranslatedText | null;
}

export function phaseViews(
  phases: readonly ProposalPhase[],
  words: ProposalTimelineWords,
): readonly PhaseView[] {
  return phases.map((phase) => ({
    title: phase.name,
    note: phase.description,
    duration: phase.durationDays === null ? null : words.days(phase.durationDays),
  }));
}

export interface RecordCell {
  readonly figure: BlockFigure;
  readonly name: TranslatedText;
  /** A power figure carried onto the proposal states its tier (`F8-01`); a count carries none. */
  readonly tier?: ProvenanceTier;
}

/** The track record's counts, each over its words; a count the company has not given is left out. */
export function recordCells(
  record: ProposalCover,
  words: ProposalTrackRecordWords,
  format: MarketFormat,
): readonly RecordCell[] {
  const cells: readonly (readonly [number | null, TranslatedText, ProvenanceTier?])[] = [
    [record.totalCapacityInstalledKw, words.installedKw, STATED_FIGURE_TIER],
    [record.happyCustomers, words.customers],
    [record.citiesServed, words.cities],
  ];
  return cells.flatMap(([count, name, tier]) =>
    count === null
      ? []
      : [
          {
            figure: { value: count, text: format.number(count, { maximumFractionDigits: 0 }) },
            name,
            ...(tier === undefined ? {} : { tier }),
          },
        ],
  );
}

/** The routing identifier with the market's own name for it — `IFSC HDFC0001234`. */
export function bankRouting(bank: BankDetails, format: MarketFormat): string {
  return `${format.pack.bankRoutingLabel} ${bank.bankRoutingIdentifier}`;
}

/** How many of an account number's last digits the builder shows; the rest are dots. */
const ACCOUNT_DIGITS_SHOWN = 4;

/**
 * The account number as this surface shows it (`M06-17`): the customer's document prints it whole
 * — they pay into it — while the person building sees its last digits alone, on a phone others may
 * look at. Presentation only: the number itself is never changed.
 */
export function accountShown(accountNumber: string, mode: 'app' | 'paper' | 'link'): string {
  if (mode !== 'app' || accountNumber.length <= ACCOUNT_DIGITS_SHOWN) return accountNumber;
  return `••••${accountNumber.slice(-ACCOUNT_DIGITS_SHOWN)}`;
}

/**
 * The terms as they print (`M06-17`): a company with no logo prints no logo slot — a block whose
 * fact is absent is left out, never drawn as a placeholder.
 */
export function termsShown<T extends { readonly blocks: readonly { readonly type: string }[] }>(
  terms: T,
  logoSrc: string | undefined,
): T {
  if (logoSrc !== undefined) return terms;
  return { ...terms, blocks: terms.blocks.filter((block) => block.type !== 'logo') };
}
