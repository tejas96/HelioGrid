'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Button, ShellGlyph, useFormat } from '@heliogrid/ui';

/**
 * The canvas's one-line notes over the scene: someone saved first, the lead is closed, the picture
 * is newer than the roof's, or the next step (roof objects) is coming.
 */
export function StudioCanvasNotes({
  studio,
  words,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
}) {
  const format = useFormat();
  const { saving, moves } = studio;
  return (
    <>
      {saving.kind === 'saved-first' ? (
        <div className="hg-studio-glass hg-studio-note" role="alert">
          <ShellGlyph name="alert-circle" size="sm" />
          <span>
            {words.savedFirst(saving.savedBy?.name ?? null, format.clockAt(saving.savedAt))}
          </span>
          <Button variant="secondary" size="sm" onClick={moves.openTheirs}>
            {words.openTheirs}
          </Button>
        </div>
      ) : null}
      {saving.kind === 'closed' ? (
        <div className="hg-studio-glass hg-studio-note" role="status">
          <ShellGlyph name="lock" size="sm" />
          <span>{words.closed}</span>
        </div>
      ) : null}
      {studio.pictureUpdated ? (
        <div className="hg-studio-glass hg-studio-note" role="status">
          <ShellGlyph name="image" size="sm" />
          <span>{words.pictureUpdated}</span>
          <Button variant="secondary" size="sm" onClick={moves.pictureChecked}>
            {words.pictureChecked}
          </Button>
        </div>
      ) : null}
      {studio.objectsNote ? (
        <div className="hg-studio-glass hg-studio-note" role="status">
          <ShellGlyph name="layers" size="sm" />
          <span>{words.objectsComing}</span>
        </div>
      ) : null}
    </>
  );
}
