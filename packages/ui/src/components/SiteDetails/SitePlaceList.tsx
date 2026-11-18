import { useEffect, useRef } from 'react';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { SitePlaceListProps } from './SiteDetails.logic';

/**
 * The places a typed address matched, on the web: a list floating under the field, each place a
 * row to press — or one quiet line while the search is out, found nothing or cannot be asked. A
 * press on it never takes the focus from the field, so the list stays open through the press.
 */
export function SitePlaceList({ list, label, disabled, onPick }: SitePlaceListProps) {
  const holder = useRef<HTMLDivElement>(null);
  const rows = list.kind === 'line' ? 0 : list.places.length;
  // The form's bar stands over the page's foot: a list that opens behind it is brought into the
  // clear, so its last place can be read and pressed without a scroll of the person's own.
  useEffect(() => {
    const places = holder.current;
    const bar = places?.closest('.hg-site')?.querySelector('.hg-site-bar');
    if (places === null || bar === null || bar === undefined || rows === 0) return;
    if (places.getBoundingClientRect().bottom > bar.getBoundingClientRect().top) {
      places.scrollIntoView({ block: 'center' });
    }
  }, [rows]);
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: keeps the focus in the address field while a row is pressed; the rows are the controls
    <div ref={holder} className="hg-site-places" onMouseDown={(event) => event.preventDefault()}>
      {list.kind === 'line' ? (
        <div role="status" className="hg-site-places-line">
          <Text variant="caption" color="secondary">
            {list.text}
          </Text>
        </div>
      ) : (
        <div role="listbox" aria-label={label} className="hg-site-places-list">
          {list.places.map((place) => (
            // biome-ignore lint/a11y/useFocusableInteractive: the option names the row's place in the list; the tab stop and the press are the row's own button inside it
            <div key={place.placeId} role="option" aria-selected="false">
              <Pressable
                className="hg-site-place"
                disabled={disabled}
                onPress={() => onPick(place.placeId)}
              >
                <span className="hg-site-place-mark">
                  <ShellGlyph name="pin" size="sm" />
                </span>
                <span className="hg-site-place-words">
                  <span className="hg-site-place-title">{place.title}</span>
                  <span className="hg-site-place-line">{place.line}</span>
                </span>
              </Pressable>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
