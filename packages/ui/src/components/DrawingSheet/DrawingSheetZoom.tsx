import { Icon } from '../../primitives/Icon';
import { Pressable } from '../../primitives/Pressable';
import type { DrawingSheetZoom } from './DrawingSheet.types';

const DEFAULT_LEVELS = [0.5, 0.75, 1, 1.5, 2];

function ZoomGlyph({ plus }: { plus: boolean }) {
  return (
    <Icon size="sm">
      {/* Decorative: the Pressable around it carries the accessible name. */}
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      >
        <path d="M5 12h14" />
        {plus && <path d="M12 5v14" />}
      </svg>
    </Icon>
  );
}

/**
 * MS8-02: zoom either works or is not advertised — this renders only when `onChange` exists, and
 * it is `screen-only`, because a zoom control has no meaning once the sheet is paper.
 */
export function ZoomControls({ zoom }: { zoom: DrawingSheetZoom }) {
  const levels = zoom.levels ?? DEFAULT_LEVELS;
  const i = Math.max(0, levels.indexOf(zoom.value ?? 1));
  const go = (d: number) => {
    const next = levels[Math.min(levels.length - 1, Math.max(0, i + d))];
    if (next !== undefined) zoom.onChange(next);
  };
  return (
    <div data-print="screen-only" className="hg-drawing-sheet-zoom">
      <Pressable
        className="hg-drawing-sheet-zoom-button"
        accessibilityLabel="Zoom out"
        disabled={i <= 0}
        onPress={() => go(-1)}
      >
        <ZoomGlyph plus={false} />
      </Pressable>
      <span className="hg-drawing-sheet-zoom-value">{Math.round((zoom.value ?? 1) * 100)}%</span>
      <Pressable
        className="hg-drawing-sheet-zoom-button"
        accessibilityLabel="Zoom in"
        disabled={i >= levels.length - 1}
        onPress={() => go(1)}
      >
        <ZoomGlyph plus />
      </Pressable>
    </div>
  );
}
