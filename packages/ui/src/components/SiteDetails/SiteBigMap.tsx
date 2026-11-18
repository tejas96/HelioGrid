import { useRef } from 'react';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { MapSurface } from '../MapSurface/MapSurface';
import { useOverlayDismiss } from '../Sheet/use-overlay-dismiss';
import { SITE_PIN_PLACEMENT, type SiteBigMapProps, sitePinOf } from './SiteDetails.logic';
import './SiteBigMap.css';

/**
 * The bigger map: the same map and pin on the whole screen, for a sure pick. A layer of the
 * overlay family — Esc closes it, Tab stays inside it, the page behind does not scroll — with the
 * way back at its top, and the pin's figure beside *Use this point* at its foot. Either way out
 * returns to the form, and the focus to the button that opened it.
 */
export function SiteBigMap({ form, pin, map, words, focusAfter }: SiteBigMapProps) {
  const layer = useRef<HTMLDivElement>(null);
  const leaving = useFocusAfter(focusAfter);
  const close = leaving(map.onSmall);
  useOverlayDismiss({
    open: true,
    panelRef: layer,
    dismissible: true,
    onClose: close,
    modal: true,
    inset: false,
  });
  return (
    <div
      ref={layer}
      role="dialog"
      aria-modal="true"
      aria-label={words.biggerMap}
      tabIndex={-1}
      className="hg-site-bigmap"
    >
      <MapSurface
        className="hg-site-bigmap-surface"
        read={map.read}
        words={words.map}
        placement={SITE_PIN_PLACEMENT}
        pin={sitePinOf(form.mount, words)}
        controls={false}
        /* No height of its own: SiteBigMap.css makes it the screen's. */
        height={0}
        radius={0}
        overlay={
          <div className="hg-site-bigmap-bar">
            {pin === null ? null : (
              <span className="hg-site-bigmap-figure">
                <Text variant="mono" color="primary">
                  {pin}
                </Text>
              </span>
            )}
            <Button
              variant="primary"
              size="md"
              iconRight={<ShellGlyph name="check" size="md" tone="inverse" />}
              onClick={close}
            >
              {words.usePoint}
            </Button>
          </div>
        }
      >
        {map.tiles}
      </MapSurface>
      <div className="hg-site-bigmap-top">
        <IconButton label={words.closeMap} onClick={close}>
          <ShellGlyph name="chevron-left" size="md" tone="primary" />
        </IconButton>
        <div className="hg-site-bigmap-tip">
          <Text variant="caption" color="primary">
            {words.pinHint}
          </Text>
        </div>
      </div>
    </div>
  );
}
