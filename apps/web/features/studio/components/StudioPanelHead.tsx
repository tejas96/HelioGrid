'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { IconButton, ShellGlyph } from '@heliogrid/ui';

/**
 * A studio panel's title row: its name, and its × in the top-right corner — the one way out of
 * every panel, always in the same place (the studio tools board, round 4).
 */
export function StudioPanelHead({
  id,
  title,
  closeLabel,
  onClose,
}: {
  /** The title's id, which names the panel for a screen reader. */
  id: string;
  title: TranslatedText;
  closeLabel: TranslatedText;
  onClose: () => void;
}) {
  return (
    <div className="hg-studio-panel-head">
      {/* A panel that opens with nothing to land on hands the focus to its title. */}
      <span id={id} className="hg-studio-panel-title" tabIndex={-1}>
        {title}
      </span>
      <IconButton label={closeLabel} variant="ghost" onClick={onClose}>
        <ShellGlyph name="close" size="sm" />
      </IconButton>
    </div>
  );
}
