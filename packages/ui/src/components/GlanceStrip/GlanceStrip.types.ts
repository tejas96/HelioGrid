import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ShellGlyphName } from '../AppShell/AppShell.types';

/**
 * One small fact in a glance strip: a label, its figure and the words after it. The figure is a
 * count, days, a fraction — a fact the caller has already formatted. A money or energy figure
 * brings its provenance pill in `aside` (`F8-01`).
 */
export interface GlanceFact {
  /** Stable key among the strip's facts. */
  readonly key: string;
  readonly label: TranslatedText;
  /** The figure itself, drawn in the display face with tabular figures. */
  readonly value: string;
  /** Small words after the figure — *of 32*, *days left*. */
  readonly unit?: TranslatedText;
  /** A glyph beside the label, by name. */
  readonly icon?: ShellGlyphName;
  /** A provenance pill or a status beside the label. */
  readonly aside?: ReactNode;
  /** Makes the fact a target that goes where the fact is kept. */
  readonly onPress?: () => void;
  /** What a screen reader says for a pressable fact: the label, the figure and where it goes. */
  readonly spokenName?: TranslatedText;
}

/**
 * Two to four small facts in ONE glass capsule, split by hairlines — so a screen never spends a big
 * card on a single number. On a phone four facts sit two by two; on a wide screen in one row.
 */
export interface GlanceStripProps {
  readonly facts: readonly GlanceFact[];
  /** The strip's name for a screen reader — *This month at a glance*. */
  readonly name: TranslatedText;
}
