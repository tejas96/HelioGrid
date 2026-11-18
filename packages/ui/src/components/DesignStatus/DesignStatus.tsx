import { ShellGlyph } from '../AppShell/ShellGlyph';
import { StatusChip } from '../StatusChip';
import { designStatusGlyph } from './DesignStatus.logic';
import type { DesignStatusProps } from './DesignStatus.types';

/** A design's status as a status chip: mark, word and tint (`F7-12`). */
export function DesignStatus({ status, label, density }: DesignStatusProps) {
  const glyph = designStatusGlyph(status);
  return (
    <StatusChip
      status={status}
      label={label}
      tone="neutral"
      density={density}
      {...(glyph === null ? {} : { glyph: <ShellGlyph name={glyph} size="sm" tone="secondary" /> })}
    />
  );
}
