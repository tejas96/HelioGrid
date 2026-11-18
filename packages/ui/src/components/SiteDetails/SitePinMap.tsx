import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { focusAfterWithin } from '../../primitives/FocusAfter/focus-after-within';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { MapSurface } from '../MapSurface/MapSurface';
import { SiteBigMap } from './SiteBigMap';
import {
  pinNoteOf,
  pinRunsOf,
  SITE_MAP_HEIGHT,
  SITE_PIN_PLACEMENT,
  type SitePinMapProps,
  sitePinOf,
} from './SiteDetails.logic';

/** The map's height is the room's number; where it lands stays in SiteDetails.css. */
type MapVars = CSSProperties & Record<`--${string}`, string>;

/**
 * The map with its pin, as one wide field of the form. Until a pin stands it is a quiet box that
 * says so. The bigger map draws the same map on the whole screen: the app's map is one node, so it
 * is drawn there while the bigger map is open and here while it is not.
 */
export function SitePinMap(props: SitePinMapProps) {
  const { room, form, pin, map, words } = props;
  const frame = useRef<HTMLDivElement>(null);
  const height = SITE_MAP_HEIGHT[room];
  const vars: MapVars = { '--hg-site-map-h': `${height}px` };
  return (
    <div className="hg-site-field hg-site-wide">
      <Text variant="field-label" color="secondary">
        {words.pinLabel[form.mount]}
      </Text>
      {form.pin === null ? (
        <div className="hg-site-map-off" style={vars}>
          <ShellGlyph name="pin" size="md" />
          <Text variant="body-sm" color="secondary" align="center">
            {words.mapWaits}
          </Text>
        </div>
      ) : (
        <div ref={frame} className="hg-site-map">
          <MapSurface
            className="hg-site-map-surface"
            read={map.read}
            words={words.map}
            placement={SITE_PIN_PLACEMENT}
            pin={sitePinOf(form.mount, words)}
            controls={false}
            height={height}
          >
            {map.big ? null : map.tiles}
          </MapSurface>
          <IconButton
            className="hg-site-map-bigger"
            label={words.biggerMap}
            disabled={props.saving}
            onClick={map.onBig}
          >
            <ShellGlyph name="expand" size="md" tone="primary" />
          </IconButton>
        </div>
      )}
      {pin === null ? null : <PinLine {...props} pin={pin} />}
      {map.big && form.pin !== null ? (
        <SiteBigMap
          form={form}
          pin={pin}
          map={map}
          words={words}
          focusAfter={focusAfterWithin(frame, '.hg-site-map-bigger')}
        />
      ) : null}
    </div>
  );
}

/**
 * Under the map: where the pin stands — its figure in mono, where the reader's language puts it —
 * then how to move it, or that it was moved and the way back.
 */
function PinLine({ pin, pinMoved, map, saving, acts, words }: SitePinMapProps & { pin: string }) {
  const note = pinNoteOf(pinMoved, map.tiles !== null, words);
  return (
    <div className="hg-site-pin-line">
      <Text variant="field-helper" color="secondary">
        {pinRunsOf(words, pin).map((run) =>
          run.mono ? (
            <span key={run.text} className="hg-site-pin-figure">
              {run.text}
            </span>
          ) : (
            run.text
          ),
        )}
      </Text>
      {note === null ? null : (
        <Text variant="field-helper" color="secondary" className="hg-site-pin-word">
          {note}
        </Text>
      )}
      {pinMoved ? (
        <Button variant="ghost" size="sm" disabled={saving} onClick={acts.onPutBack}>
          {words.putBack}
        </Button>
      ) : null}
    </div>
  );
}
