'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { MeasurementSystem, StudioView, ViewPlace } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, ShellGlyph } from '@heliogrid/ui';
import { type RefObject, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRadioPanel } from '../hooks/use-radio-panel';
import { StudioPanelHead } from './StudioPanelHead';

/** One choice in the panel: its words, its unit when it has one, and a tick when it is in force. */
function Choice({
  label,
  meta,
  on,
  onPress,
}: {
  label: TranslatedText;
  meta?: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="hg-studio-view-row"
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={onPress}
    >
      <span className="hg-studio-view-word">{label}</span>
      {meta === undefined ? null : <span className="hg-studio-view-meta">{meta}</span>}
      {on ? <ShellGlyph name="check" size="sm" /> : <span className="hg-studio-view-tick" />}
    </Pressable>
  );
}

/**
 * The View panel (the studio tools board, round 4): how the model is seen — the views that work now
 * (the others wait for a roof and are not listed), then metres or feet — under a title row with its
 * ×. Beside its button on a wide screen; on a phone at the foot (`foot`), where the thumb is, in
 * two columns, as Roofs opens.
 */
export function StudioViewPanel({
  open,
  view,
  views,
  units,
  words,
  opener,
  foot,
  onView,
  onUnits,
  onClose,
}: {
  open: boolean;
  view: StudioView;
  views: readonly ViewPlace[];
  units: MeasurementSystem;
  words: StudioCanvasWords;
  /** The View button, which takes the focus back on Esc. */
  opener: RefObject<HTMLElement | null>;
  /** On a phone, the canvas's foot, where the panel opens; `null` beside its button. */
  foot: HTMLElement | null;
  onView: (view: StudioView) => void;
  onUnits: (units: MeasurementSystem) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const title = useId();
  useRadioPanel(panel, open, onClose, opener, '.hg-studio-view-opener');
  if (!open) return null;
  const name: Record<StudioView, TranslatedText> = {
    top: words.topView,
    '3d': words.threeDView,
    north: words.fromNorth,
    east: words.fromEast,
    south: words.fromSouth,
    west: words.fromWest,
  };
  const pick = (act: () => void) => () => {
    act();
    onClose();
  };
  const body = (
    <div
      ref={panel}
      className="hg-studio-glass hg-studio-view-panel"
      data-at={foot === null ? 'beside' : 'foot'}
      role="dialog"
      aria-labelledby={title}
    >
      <StudioPanelHead
        id={title}
        title={words.view}
        closeLabel={words.closeView}
        onClose={onClose}
      />
      <div className="hg-studio-view-group" role="radiogroup" aria-labelledby={title}>
        {views
          .filter((place) => place.lock === null)
          .map((place) => (
            <Choice
              key={place.view}
              label={name[place.view]}
              on={view === place.view}
              onPress={pick(() => onView(place.view))}
            />
          ))}
      </div>
      <div className="hg-studio-view-group" role="radiogroup" aria-label={words.units}>
        <Choice
          label={words.metres}
          meta={words.unitMetres}
          on={units === 'metric'}
          onPress={pick(() => onUnits('metric'))}
        />
        <Choice
          label={words.feet}
          meta={words.unitFeet}
          on={units === 'imperial'}
          onPress={pick(() => onUnits('imperial'))}
        />
      </div>
    </div>
  );
  return foot === null ? body : createPortal(body, foot);
}
