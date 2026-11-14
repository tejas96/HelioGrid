import type { TranslatedText } from '@heliogrid/contracts';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { CategoryHue } from '../Avatar/Avatar.types';
import type { HueTileTone } from '../HueTile/HueTile.types';
import type { InputProps } from '../Input/Input.types';
import type { NumberFieldProps } from '../NumberField/NumberField.types';
import type { SegmentedControlProps } from '../SegmentedControl/SegmentedControl.types';
import type { SwitchProps } from '../Switch/Switch.types';
import type { FieldSave, StepNotice } from './ProposalSteps.shared.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';

/** A worded act set in a step's own flow — *Add a step*, *Reset*. */
export interface LinkActProps {
  readonly glyph: ShellGlyphName;
  readonly label: TranslatedText;
  readonly onPress: () => void;
  readonly quiet?: boolean;
}

/** A small round act at a row's end: move up, a little less, remove. */
export interface MiniActProps {
  readonly key: string;
  readonly glyph: ShellGlyphName;
  readonly label: TranslatedText;
  readonly disabled?: boolean;
  readonly onPress: () => void;
  /**
   * The press may take this act away — a remove — or turn it off at the list's end — a move to the
   * top, a share down to nothing. Focus then lands on the step's `focusAfter`, never on the page.
   */
  readonly leaves?: boolean;
}

/** One chip of a named set: a common size, a company plan, *New plan*. */
export interface ChipControl {
  readonly key: string;
  /** biome-ignore lint/plugin/copy-prop-type: a translated word, or a fact — a plan's own name */
  readonly label: string;
  readonly active?: boolean;
  readonly glyph?: ShellGlyphName;
  readonly onPress: () => void;
}

/** One thing at a row's end: a small act, or the row's own typed share. */
export type RowItem =
  | ({ readonly kind: 'act' } & MiniActProps)
  | { readonly kind: 'share'; readonly key: string; readonly field: NumberFieldProps };

/** One row of a step's list — a phase, a payment part: its words, then what can be done to it. */
export interface RowControl {
  readonly key: string;
  /** Its place in the list, where the order is the point. */
  readonly place?: number;
  /** biome-ignore lint/plugin/copy-prop-type: a fact — the company's own name for the phase or part */
  readonly title: string;
  readonly line: TranslatedText;
  /** Pressing the words opens the row's own sheet. */
  readonly open?: { readonly label: TranslatedText; readonly onPress: () => void };
  readonly items: readonly RowItem[];
}

/** One row that opens in place: its head, and either a switch in the head or controls inside. */
export interface FoldControl {
  readonly key: string;
  readonly glyph: ShellGlyphName;
  readonly hue: CategoryHue | HueTileTone;
  readonly title: TranslatedText;
  readonly value: TranslatedText;
  /** A switch in the head itself. Then the row does not fold. */
  readonly aside?: SwitchProps;
  readonly controls: readonly StepControl[];
}

/**
 * One control of a step, as data: what both halves draw, decided once. `StepControls` draws a list
 * of them in order; a control that holds others (`group`, `pair`, `grid`, `folds`) lays them out.
 */
export type StepControl =
  | { readonly kind: 'number'; readonly key: string; readonly field: NumberFieldProps }
  | { readonly kind: 'save'; readonly key: string; readonly save: FieldSave | undefined }
  | { readonly kind: 'segmented'; readonly key: string; readonly props: SegmentedControlProps }
  | { readonly kind: 'switch'; readonly key: string; readonly props: SwitchProps }
  | { readonly kind: 'input'; readonly key: string; readonly props: InputProps }
  | { readonly kind: 'helper'; readonly key: string; readonly text: TranslatedText }
  | { readonly kind: 'hint'; readonly key: string; readonly text: TranslatedText }
  | { readonly kind: 'rows'; readonly key: string; readonly rows: readonly RowControl[] }
  | {
      readonly kind: 'note';
      readonly key: string;
      readonly notice: StepNotice;
      readonly tone: 'danger' | 'warning' | 'info';
      readonly glyph: ShellGlyphName;
    }
  | {
      readonly kind: 'chips';
      readonly key: string;
      readonly name: TranslatedText;
      readonly chips: readonly ChipControl[];
      readonly note?: TranslatedText;
    }
  | { readonly kind: 'acts'; readonly key: string; readonly acts: readonly LinkActProps[] }
  | {
      /** One field with what belongs to it: its label and tag above, its chips and save line under. */
      readonly kind: 'group';
      readonly key: string;
      readonly top?: { readonly label: TranslatedText; readonly tag: TranslatedText };
      readonly items: readonly StepControl[];
    }
  | { readonly kind: 'pair'; readonly key: string; readonly items: readonly StepControl[] }
  | { readonly kind: 'grid'; readonly key: string; readonly items: readonly StepControl[] }
  | { readonly kind: 'folds'; readonly key: string; readonly rows: readonly FoldControl[] };

/** One kind of control, as the part that draws it takes it. */
export type HeldControl<Kind extends StepControl['kind']> = Extract<StepControl, { kind: Kind }>;

/** What `StepControls` takes: the list, and the words every step shares. */
export interface StepControlsProps {
  controls: readonly StepControl[];
  shared: ProposalStepWords;
  /** Where focus lands once a row's act took itself away or turned itself off: the step's title. */
  focusAfter: FocusAfter;
  /** Set the controls in the step's one column. */
  column?: boolean;
}

/** What a person picks from a closed set: the member the control's string names, or nothing. */
export const memberOf = <Member extends string>(set: readonly Member[], value: string) =>
  set.find((member) => member === value);

/** A number field with what its last commit came to under it. */
export const savedNumber = (
  key: string,
  field: NumberFieldProps,
  save: FieldSave | undefined,
): StepControl => ({
  kind: 'group',
  key,
  items: [
    { kind: 'number', key: 'field', field },
    { kind: 'save', key: 'save', save },
  ],
});

/** The controls that are there: a step leaves out what its view does not carry. */
export const present = (controls: readonly (StepControl | null)[]): StepControl[] =>
  controls.filter((control) => control !== null);

/** What pressing a faulted save line does: sends the kept value again, or reads the draft again. */
export const saveActOf = (save: FieldSave): (() => void) | undefined =>
  save.kind === 'unsaved' ? save.onRetry : save.kind === 'conflict' ? save.onReload : undefined;

/** A faulted save in words: not saved, changed elsewhere, or the server's own reason for refusing. */
export const saveFaultOf = (save: FieldSave, words: ProposalStepWords): TranslatedText => {
  if (save.kind === 'conflict') return words.conflict;
  return save.kind === 'refused' && save.reason !== undefined ? save.reason : words.notSaved;
};
