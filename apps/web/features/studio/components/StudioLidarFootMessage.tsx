'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Button, IconButton, ShellGlyph, useFormat } from '@heliogrid/ui';

/** One message with one action at the foot, as the studio's bar draws it. */
function FootBar({
  line,
  act,
  onHide,
  hideLabel,
}: {
  line: TranslatedText;
  act: { readonly label: TranslatedText; readonly on: () => void } | null;
  onHide: (() => void) | null;
  hideLabel: TranslatedText;
}) {
  return (
    <div className="hg-studio-glass hg-studio-bar hg-lidar-bar" data-kind="line" data-tone="info">
      <span className="hg-studio-bar-sign" aria-hidden="true">
        <ShellGlyph name="info" size="md" tone="current" />
      </span>
      <span className="hg-studio-bar-words">
        <span className="hg-studio-bar-line" role="status">
          {line}
        </span>
      </span>
      <span className="hg-studio-bar-acts">
        {act === null ? null : (
          <Button variant="primary" size="sm" onClick={act.on}>
            {act.label}
          </Button>
        )}
        {onHide === null ? null : (
          <IconButton label={hideLabel} variant="ghost" onClick={onHide}>
            <ShellGlyph name="close" size="sm" />
          </IconButton>
        )}
      </span>
    </div>
  );
}

/**
 * LiDAR's one message with one action (board frames 5, 12, 20): Moved · Undo after a move, over
 * Move's sheet; Some roofs sit off · Fix, at the foot, until its ×.
 */
export function LidarFootMessage({
  studio,
  words,
  phone,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  phone: boolean;
}) {
  const format = useFormat();
  const { foot, moves } = studio.lidar;
  if (foot === null) return null;
  const distance = foot.kind === 'moved' ? format.roofHeight(foot.metres, studio.units) : '';
  return (
    <FootBar
      line={words.lidarFoot(foot, phone, distance)}
      act={
        foot.kind === 'moved'
          ? { label: words.undo, on: moves.undoMove }
          : { label: words.lidarFix, on: moves.fix }
      }
      onHide={foot.kind === 'off_spot' ? moves.shutFoot : null}
      hideLabel={words.lidarHide}
    />
  );
}
