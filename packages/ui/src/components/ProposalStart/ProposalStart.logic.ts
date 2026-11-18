import { PROPOSAL_START_MODES } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';
import type { ProposalStartSheetProps, StartMode } from './ProposalStart.types';

const MODE_GLYPH: Readonly<Record<StartMode, ShellGlyphName>> = {
  quick: 'bolt',
  full: 'lines',
  design: 'package',
};

/**
 * How to build it — Quick, Full, or With 3D design for who may design: the choice both halves
 * draw, each option with its glyph.
 */
export function startModeChoice(props: ProposalStartSheetProps) {
  const { words } = props;
  const modes = PROPOSAL_START_MODES.filter((mode) => mode !== 'design' || props.canDesign);
  return {
    group: {
      ariaLabel: words.how,
      value: props.mode,
      disabled: props.starting,
      onChange: (value: string) => {
        const mode = modes.find((candidate) => candidate === value);
        if (mode !== undefined) props.onMode(mode);
      },
    },
    options: modes.map((mode) => ({
      value: mode,
      title: words.modes[mode].title,
      description: words.modes[mode].line,
      glyph: MODE_GLYPH[mode],
      /** Where the model will show: the design's cover, its placeholder until the studio draws one. */
      preview: mode === 'design' ? words.designPreview : null,
    })),
  };
}

/** The start sheet's state as `packages/data`'s `useProposalStartSheet` holds it, by shape. */
export interface StartSheetState {
  readonly open: boolean;
  readonly mode: StartMode;
  setMode(mode: StartMode): void;
  readonly canDesign: boolean;
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
    canDesign: sheet.canDesign,
    onCopy: sheet.copy,
    onStart: sheet.go,
    starting: sheet.starting,
    ...said,
  };
}
