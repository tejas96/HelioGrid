import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { ProposalStartSheetProps, StartMode } from './ProposalStart.types';

const MODES: readonly StartMode[] = ['quick', 'full'];
const MODE_GLYPH: Readonly<Record<StartMode, ShellGlyphName>> = { quick: 'bolt', full: 'lines' };

/** How to build it — Quick or Full: the choice both halves draw, each option with its glyph. */
export function startModeChoice(props: ProposalStartSheetProps) {
  const { words } = props;
  return {
    group: {
      ariaLabel: words.how,
      value: props.mode,
      disabled: props.starting,
      onChange: (value: string) => {
        const mode = MODES.find((candidate) => candidate === value);
        if (mode !== undefined) props.onMode(mode);
      },
    },
    options: MODES.map((mode) => ({
      value: mode,
      title: words.modes[mode].title,
      description: words.modes[mode].line,
      glyph: MODE_GLYPH[mode],
    })),
  };
}

/** The start sheet's state as `packages/data`'s `useProposalStartSheet` holds it, by shape. */
export interface StartSheetState {
  readonly open: boolean;
  readonly mode: StartMode;
  setMode(mode: StartMode): void;
  copy(proposalId: string): void;
  go(): void;
  close(): void;
  readonly starting: boolean;
}

/** The sheet's props from its state and its words — one mount for every way in (`T-M06-001`). */
export function proposalStartSheetPropsOf(
  sheet: StartSheetState,
  said: Pick<ProposalStartSheetProps, 'words' | 'sources' | 'failure'>,
): ProposalStartSheetProps {
  return {
    open: sheet.open,
    onClose: sheet.close,
    mode: sheet.mode,
    onMode: sheet.setMode,
    onCopy: sheet.copy,
    onStart: sheet.go,
    starting: sheet.starting,
    ...said,
  };
}
