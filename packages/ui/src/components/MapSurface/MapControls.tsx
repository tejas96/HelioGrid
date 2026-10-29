import type { TranslatedText } from '@heliogrid/contracts';
import { Icon } from '../../primitives/Icon';
import { Pressable } from '../../primitives/Pressable';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { zoomStepsOf } from './MapSurface.logic';
import type { MapControlsProps } from './MapSurface.types';

interface CtrlProps {
  label: TranslatedText;
  onPress: () => void;
  glyph: ShellGlyphName;
  disabled?: boolean;
}

function Ctrl({ label, onPress, glyph, disabled = false }: CtrlProps) {
  return (
    <Pressable
      className="hg-map-surface-ctrl"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
    >
      <Icon size="md">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ShellGlyphMarks name={glyph} />
        </svg>
      </Icon>
    </Pressable>
  );
}

/**
 * The 44px controls. The level is legible on the surface — "Zoom 20" is a fact a surveyor
 * checks, not chrome — and re-centre hands the current level back rather than changing it.
 */
export function MapControls({
  zoom,
  minZoom,
  maxZoom,
  showZoomLevel,
  onStepZoom,
  onRecenter,
  words,
}: MapControlsProps) {
  return (
    <div className="hg-map-surface-controls">
      <div className="hg-map-surface-ctrl-group">
        {zoomStepsOf(zoom, minZoom, maxZoom, words).map((step) => (
          <Ctrl
            key={step.glyph}
            label={step.label}
            onPress={() => onStepZoom(step.delta)}
            disabled={step.disabled}
            glyph={step.glyph}
          />
        ))}
      </div>
      {showZoomLevel && zoom !== undefined ? (
        <span className="hg-map-surface-zoom-level">{words.zoomLevel(zoom)}</span>
      ) : null}
      {onRecenter === undefined ? null : (
        <div className="hg-map-surface-ctrl-group">
          <Ctrl label={words.recentre} onPress={() => onRecenter({ zoom })} glyph="recentre" />
        </div>
      )}
    </div>
  );
}
