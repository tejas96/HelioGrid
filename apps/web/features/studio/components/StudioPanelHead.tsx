'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { IconButton, ShellGlyph } from '@heliogrid/ui';
import type { ReactNode } from 'react';

/**
 * A studio panel's title row: its name, and its × in the top-right corner — the one way out of
 * every panel, always in the same place (the studio tools board, round 4). A panel may put one small
 * control at the end of its title, before the ×.
 */
export function StudioPanelHead({
  id,
  title,
  closeLabel,
  onClose,
  children,
}: {
  /** The title's id, which names the panel for a screen reader. */
  id: string;
  title: TranslatedText;
  closeLabel: TranslatedText;
  onClose: () => void;
  /** A small control at the end of the title, before the ×: Roofs' metres or feet. */
  children?: ReactNode;
}) {
  return (
    <div className="hg-studio-panel-head">
      {/* A panel that opens with nothing to land on hands the focus to its title. */}
      <span id={id} className="hg-studio-panel-title" tabIndex={-1}>
        {title}
      </span>
      {children}
      <IconButton label={closeLabel} variant="ghost" onClick={onClose}>
        <ShellGlyph name="close" size="sm" />
      </IconButton>
    </div>
  );
}
