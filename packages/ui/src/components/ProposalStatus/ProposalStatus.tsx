import { ShellGlyph } from '../AppShell/ShellGlyph';
import { StatusChip } from '../StatusChip';
import { GLYPH_TONE_OF, proposalStandingGlyph, proposalStandingTone } from './ProposalStatus.logic';
import type { ProposalStatusProps } from './ProposalStatus.types';

/** A proposal's standing as a status chip: mark, word and tint (`F7-12`). */
export function ProposalStatus({ standing, label, density }: ProposalStatusProps) {
  const tone = proposalStandingTone(standing);
  const glyph = proposalStandingGlyph(standing);
  return (
    <StatusChip
      status={standing}
      label={label}
      tone={tone}
      density={density}
      {...(glyph === null
        ? {}
        : { glyph: <ShellGlyph name={glyph} size="sm" tone={GLYPH_TONE_OF[tone]} /> })}
    />
  );
}
