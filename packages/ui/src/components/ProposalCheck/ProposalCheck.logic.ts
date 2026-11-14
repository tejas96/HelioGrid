import type { TranslatedText } from '@heliogrid/contracts';
import type { ButtonProps } from '../Button/Button.types';
import type {
  CheckChangeNote,
  CheckFinding,
  CheckSummary,
  ProposalCheckState,
  ProposalCheckWords,
} from './ProposalCheck.types';

/** The sheet's one act: what it says, whether it leads on to a step, and the button it is. */
export interface CheckAct {
  readonly label: TranslatedText;
  /** The act leads on to a step — it carries the arrow. */
  readonly forward: boolean;
  readonly button: Pick<ButtonProps, 'variant' | 'size' | 'fullWidth' | 'loading' | 'onClick'>;
}

const button = (onClick: () => void, loud = true, loading = false): CheckAct['button'] => ({
  variant: loud ? 'primary' : 'secondary',
  size: 'lg',
  fullWidth: true,
  loading,
  onClick,
});

/**
 * What the foot of the check offers: nothing while it checks; at the plan limit the plans, or
 * Close for who cannot change the plan; with a block, the first thing to fix; else Generate.
 */
export function checkActOf(
  state: ProposalCheckState,
  words: ProposalCheckWords,
  onClose: () => void,
): CheckAct | null {
  if (state.kind === 'checking') return null;
  if (state.kind === 'limit') {
    const plans = state.onPlans;
    return plans === undefined
      ? { label: words.limit.close, forward: false, button: button(onClose, false) }
      : { label: words.limit.seePlans, forward: false, button: button(plans) };
  }
  if (state.kind === 'blocked') {
    return {
      label: words.goToFirst,
      forward: true,
      button: button(state.blocks[0]?.onFix ?? onClose),
    };
  }
  return {
    label: state.warnings.length === 0 ? words.generate : words.generateAnyway,
    forward: false,
    button: button(state.onGenerate, true, state.generating),
  };
}

/** The findings of one weight, in the order the check lists them. */
export interface CheckGroup {
  readonly tone: 'danger' | 'warning';
  readonly findings: readonly CheckFinding[];
  /** Where this group starts in the sheet's one stagger. */
  readonly from: number;
  /** The line over the group — only what does not stop Generate is headed. */
  readonly over?: TranslatedText;
}

/** What the check found, in the order it is read: the summary, what stops, what to look at. */
export interface CheckFound {
  readonly summary: CheckSummary | null;
  /** What changed and why, where this version must say so. */
  readonly changeNote: CheckChangeNote | null;
  /** What stops Generate first, then what to look at; a weight with nothing in it is left out. */
  readonly groups: readonly CheckGroup[];
  /** Quick mode's line, said only when nothing stops Generate. */
  readonly hint: TranslatedText | undefined;
}

/** `null` while the check is out and at the plan limit, where nothing was found to list. */
export function checkFoundOf(
  state: ProposalCheckState,
  words: ProposalCheckWords,
): CheckFound | null {
  if (state.kind === 'checking' || state.kind === 'limit') return null;
  const clear = state.kind === 'clear';
  const blocks = clear ? [] : state.blocks;
  const groups: CheckGroup[] = [
    { tone: 'danger', findings: blocks, from: 0 },
    {
      tone: 'warning',
      findings: state.warnings,
      from: blocks.length,
      over: words.warningsOver,
    },
  ];
  return {
    summary: clear ? state.summary : null,
    changeNote: clear ? (state.changeNote ?? null) : null,
    groups: groups.filter((group) => group.findings.length > 0),
    hint: clear ? words.quickLine : undefined,
  };
}

/** The check in words, as `packages/i18n` builds it over the view model — by shape. */
export interface CheckSaid {
  readonly standing: 'limit' | 'checking' | 'blocked' | 'clear';
  readonly blocks: readonly CheckRowSaid[];
  readonly warnings: readonly CheckRowSaid[];
  readonly failure: TranslatedText | null;
  readonly summary: Pick<CheckSummary, 'line' | 'amount' | 'facts'>;
  readonly changeNote: Pick<CheckChangeNote, 'label' | 'hint' | 'maxLength' | 'error'>;
}
interface CheckRowSaid extends Omit<CheckFinding, 'onFix'> {
  /** The step that fixes it, by the view model's own key. */
  readonly step: string;
}

/** What the app binds to those words: the presses, the cover and what the person typed. */
export interface CheckBinds<Step extends string> {
  readonly fix: (step: Step) => void;
  readonly cover: CheckSummary['cover'];
  /** A fact: the customer's name */
  readonly name: string;
  readonly generating: boolean;
  readonly onGenerate: () => void;
  /** Absent for a viewer who cannot change the plan. */
  readonly onPlans?: () => void;
  /** The note as typed, from version 2 on; `null` for a first version. */
  readonly changeNote: { readonly text: string; type(text: string): void } | null;
}

/** The check sheet's state from its words and its binds — once, for the web and the phone. */
export function proposalCheckStateOf<Step extends string>(
  said: CheckSaid & {
    readonly blocks: readonly (CheckRowSaid & { step: Step })[];
    readonly warnings: readonly (CheckRowSaid & { step: Step })[];
  },
  binds: CheckBinds<Step>,
): ProposalCheckState {
  const row = ({ step, ...words }: CheckRowSaid & { step: Step }): CheckFinding => ({
    ...words,
    onFix: () => binds.fix(step),
  });
  const warnings = said.warnings.map(row);
  if (said.standing === 'limit') {
    return { kind: 'limit', ...(binds.onPlans === undefined ? {} : { onPlans: binds.onPlans }) };
  }
  if (said.standing === 'checking') return { kind: 'checking' };
  if (said.standing === 'blocked')
    return { kind: 'blocked', blocks: said.blocks.map(row), warnings };
  const note = binds.changeNote;
  return {
    kind: 'clear',
    warnings,
    summary: { cover: binds.cover, name: binds.name, ...said.summary },
    ...(note === null
      ? {}
      : { changeNote: { ...said.changeNote, value: note.text, onChange: note.type } }),
    generating: binds.generating,
    ...(said.failure === null ? {} : { failure: said.failure }),
    onGenerate: binds.onGenerate,
  };
}
