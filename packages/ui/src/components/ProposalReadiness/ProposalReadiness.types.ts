import type { TranslatedText } from '@heliogrid/contracts';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';

/** One setup step: its name, what it fills in, whether it is done, and where it is done. */
export interface ReadinessStep {
  readonly key: string;
  readonly label: TranslatedText;
  readonly detail: TranslatedText;
  /** `null` while its fact is out or failed: drawn quiet, never as done and never as owed. */
  readonly done: boolean | null;
  readonly icon: ShellGlyphName;
  readonly onOpen: () => void;
}

/** Every word the hero and its steps draw; `@heliogrid/i18n`'s `readinessWords` writes them. */
export interface ProposalReadinessWords {
  readonly overline: TranslatedText;
  readonly title: TranslatedText;
  readonly line: TranslatedText;
  /** "2 of 6 done" — the ring's spoken name. */
  readonly count: TranslatedText;
  readonly next: TranslatedText;
  readonly continueLabel: TranslatedText;
  readonly stepsName: TranslatedText;
  readonly done: TranslatedText;
  readonly loading: TranslatedText;
}

/**
 * Home's one hero (redesign direction A): how far the company is from its first proposal — the
 * steps done in a ring, the next step as its one action — then every step as a row that opens its
 * page. The facts are the company's own (`setupReadiness`); this draws them.
 */
export interface ProposalReadinessProps {
  readonly words: ProposalReadinessWords;
  readonly done: number;
  readonly total: number;
  readonly steps: readonly ReadinessStep[];
  /** The first step not done, offered as the hero's action; none once every step is done. */
  readonly next: ReadinessStep | null;
  /** The facts are still out: the hero holds its place with a quiet wait. */
  readonly loading: boolean;
}
