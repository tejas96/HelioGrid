import {
  readSiteMapMessage,
  WEB_VIEW_BRIDGE_VERSION,
  type WebViewLend,
  webViewAskSchema,
} from '@heliogrid/contracts';
import { useLendToken } from '@heliogrid/data/react';
import { tapHaptic } from '@heliogrid/ui';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { WEB_URL } from '../../../env';

/**
 * The library types its props as `WebViewProps & P` with `P` defaulting to `undefined`, which
 * leaves no props at all; `object` adds nothing and keeps them (`apps/mobile/CLAUDE.md` Traps).
 */
type StudioView = WebView<object>;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
});

/** The page itself, or a path under it — never a longer host that only starts with its name. */
const ownPage = (url: string): boolean => url === WEB_URL || url.startsWith(`${WEB_URL}/`);

/**
 * The studio on the phone (`T-M05-002a`): the web's own studio page in a web view, so the web, iOS
 * and Android show one studio. The page is signed in as this phone's person: when it asks, the
 * phone lends it its short-lived API token in a message — never its session, and never in the
 * page's address. The view loads the web app's pages alone; the page's way back hands the person
 * back to the phone.
 */
export function StudioWebView({
  designId,
  savedAt,
  onLeave,
  onSite,
}: {
  designId: string;
  /** When Site details last saved a change; a new one opens the page again. */
  savedAt: number | undefined;
  onLeave: () => void;
  /** The page asked to change the site details: the phone opens its own Site details. */
  onSite: () => void;
}) {
  const view = useRef<StudioView>(null);
  const lendToken = useLendToken();
  // Back from a save in Site details: the page opens again on the site as it now stands. A way
  // back with nothing saved leaves the page as it was, its picture with it.
  const loadedFor = useRef(savedAt);
  useEffect(() => {
    if (loadedFor.current === savedAt) return;
    loadedFor.current = savedAt;
    view.current?.reload();
  }, [savedAt]);
  return (
    <WebView<object>
      ref={view}
      source={{ uri: `${WEB_URL}/designs/${designId}` }}
      style={styles.page}
      originWhitelist={[WEB_URL]}
      // iOS asks for each frame's load: only the web app's own pages load in the view.
      onShouldStartLoadWithRequest={(request) =>
        request.isTopFrame === false || ownPage(request.url)
      }
      onMessage={(event) => {
        const asked = readSiteMapMessage(webViewAskSchema, event.nativeEvent.data);
        if (asked === null) return;
        if (asked.kind === 'leave') {
          onLeave();
          return;
        }
        if (asked.kind === 'site') {
          onSite();
          return;
        }
        if (asked.kind === 'haptic') {
          tapHaptic(asked.strength);
          return;
        }
        void lendToken().then((token) => {
          const lend: WebViewLend = { v: WEB_VIEW_BRIDGE_VERSION, kind: 'token', token };
          view.current?.postMessage(JSON.stringify(lend));
        });
      }}
      bounces={false}
      // iOS lays its own up / down / done bar over the page's sheet above the keyboard: the studio's
      // sheets have their own Done, so the bar only hides it.
      hideKeyboardAccessoryView
      overScrollMode="never"
      setSupportMultipleWindows={false}
      allowsBackForwardNavigationGestures={false}
    />
  );
}
