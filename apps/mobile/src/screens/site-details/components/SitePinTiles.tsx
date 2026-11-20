import {
  readSiteMapMessage,
  SITE_MAP_BRIDGE_VERSION,
  type SiteMapShow,
  siteMapSaidSchema,
} from '@heliogrid/contracts';
import type { SiteDetailsScreen } from '@heliogrid/data/react';
import type { Coordinate } from '@heliogrid/domain';
import { type ReactNode, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { SITE_MAP_URL, WEB_URL } from '../../../env';

/**
 * The library types its props as `WebViewProps & P` with `P` defaulting to `undefined`, which
 * leaves no props at all; `object` adds nothing and keeps them.
 */
type MapView = WebView<object>;

const styles = StyleSheet.create({
  // The frame that holds the map draws the pin and the states over it; the page fills that frame,
  // and the frame's own ground shows through it until the map's tiles arrive.
  tiles: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'transparent',
  },
});

/** Two points are one where they agree to the six decimals a pin is stored at. */
const SAME_WITHIN = 0.0000005;
const same = (left: Coordinate, right: Coordinate): boolean =>
  Math.abs(left.latitude - right.latitude) < SAME_WITHIN &&
  Math.abs(left.longitude - right.longitude) < SAME_WITHIN;

/** The page itself, or a path under it — never a longer host that only starts with its name. */
const ownPage = (url: string): boolean => url === WEB_URL || url.startsWith(`${WEB_URL}/`);

/**
 * The live map under the pin on the phone: the web's own site map page, shown in a web view, so
 * web, iOS and Android draw one map (`site-map-bridge.ts`). The page says `ready` and is sent the
 * pin; where the person leaves the map is reported back as the pin; a pin set from outside — a
 * found place, *Put it back* — is sent again, and the page's own report is never echoed back, or
 * a late echo would pull the map from under a finger still dragging. The view loads this one page:
 * a link the map carries (its terms) is opened by the library in the phone's browser.
 */
function Tiles({
  pin,
  onMove,
  onFailed,
  onNoMap,
  shown,
  whole,
}: {
  pin: Coordinate;
  /** The big map: one finger moves it. In the form's small map one finger scrolls the page. */
  whole: boolean;
  /** Counts the times the map is told the pin again though the pin did not change (a refused move). */
  shown: number;
  onMove: (point: Coordinate) => void;
  onFailed: () => void;
  onNoMap: () => void;
}) {
  const view = useRef<MapView>(null);
  const listening = useRef(false);
  const latest = useRef(pin);
  latest.current = pin;
  /** Where the page's map rests: where it last said so, or where it was last sent. */
  const rested = useRef<Coordinate | null>(null);
  const told = useRef(shown);
  const show = useRef((point: Coordinate) => {
    const message: SiteMapShow = { v: SITE_MAP_BRIDGE_VERSION, kind: 'show', point };
    // The page does not report a move it was told to make: where it is sent is where it rests.
    rested.current = point;
    view.current?.postMessage(JSON.stringify(message));
  }).current;

  const { latitude, longitude } = pin;
  useEffect(() => {
    const point = { latitude, longitude };
    const again = told.current !== shown;
    told.current = shown;
    const apart = rested.current === null || !same(rested.current, point);
    if (listening.current && (again || apart)) show(point);
  }, [latitude, longitude, shown, show]);

  return (
    <WebView<object>
      ref={view}
      source={{ uri: whole ? `${SITE_MAP_URL}?whole=1` : SITE_MAP_URL }}
      style={styles.tiles}
      originWhitelist={[WEB_URL]}
      // iOS asks for each frame's load: only the view's own address is held to this page.
      onShouldStartLoadWithRequest={(request) =>
        request.isTopFrame === false || ownPage(request.url)
      }
      onMessage={(event) => {
        const said = readSiteMapMessage(siteMapSaidSchema, event.nativeEvent.data);
        if (said === null) return;
        if (said.kind === 'ready') {
          listening.current = true;
          show(latest.current);
        } else if (said.kind === 'moved') {
          rested.current = said.point;
          onMove(said.point);
        } else if (said.kind === 'unavailable') onNoMap();
        else onFailed();
      }}
      onError={onFailed}
      onHttpError={onFailed}
      onContentProcessDidTerminate={onFailed}
      onRenderProcessGone={onFailed}
      bounces={false}
      scrollEnabled={false}
      overScrollMode="never"
      nestedScrollEnabled
      setSupportMultipleWindows={false}
    />
  );
}

/**
 * The map slot's tiles on the phone: the live map while the screen's hook says one is drawn.
 * After a load that failed, or where the page has no map, there are none and the frame shows what
 * the hook's `map.read` says.
 */
export function sitePinTilesOf(
  pin: Coordinate | null,
  onMove: (point: Coordinate) => void,
  map: SiteDetailsScreen['map'],
): ReactNode | null {
  if (pin === null || !map.live) return null;
  return (
    <Tiles
      key={map.attempt}
      pin={pin}
      onMove={onMove}
      onFailed={map.loadFailed}
      onNoMap={map.noMap}
      shown={map.shown}
      whole={map.big}
    />
  );
}
