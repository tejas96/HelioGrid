import {
  readSiteMapMessage,
  WEB_VIEW_BRIDGE_VERSION,
  type WebViewBack,
  type WebViewInsets,
  type WebViewLend,
  webViewAskSchema,
} from '@heliogrid/contracts';
import { useLendToken } from '@heliogrid/data/react';
import { siteDetailsPageWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { LeadDetailStates, tapHaptic } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { WEB_URL } from '../../../env';
import { useHardwareBack } from '../../shared/use-hardware-back';

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
  onUnderBars,
}: {
  designId: string;
  /** When Site details last saved a change; a new one opens the page again. */
  savedAt: number | undefined;
  onLeave: () => void;
  /** The page asked to change the site details: the phone opens its own Site details. */
  onSite: () => void;
  /**
   * Whether the page keeps clear of the phone's bars itself (it asked `insets-needed`): only then
   * may it run under them. A page that failed to load does not: its state stays inside them.
   */
  onUnderBars: (under: boolean) => void;
}) {
  const view = useRef<StudioView>(null);
  const lendToken = useLendToken();
  const states = siteDetailsPageWords(useTranslate()).states;
  const frame = useRef<View>(null);
  // The page did not load, or its process was lost: the screen says so and offers to try again.
  // biome-ignore lint/plugin/screen-assembly: the native web view's own load state; the web has no web view to fail
  const [failed, setFailed] = useState(false);
  // The page said it takes the system back (`back-here`); a load starts it over.
  const takesBack = useRef(false);
  // The page runs under the phone's bars and asked how far they reach (`insets-needed`); a load
  // starts it over. Each change of the bars is sent again.
  const { top, right, bottom, left } = useSafeAreaInsets();
  const wantsInsets = useRef(false);
  const sendInsets = () => {
    const insets: WebViewInsets = {
      v: WEB_VIEW_BRIDGE_VERSION,
      kind: 'insets',
      top,
      right,
      bottom,
      left,
    };
    view.current?.postMessage(JSON.stringify(insets));
  };
  const latestSend = useRef(sendInsets);
  latestSend.current = sendInsets;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a change of any bar is a new message
  useEffect(() => {
    if (wantsInsets.current) latestSend.current();
  }, [top, right, bottom, left]);
  const navigation = useNavigation();
  // Android's back: to the page when it takes it, else out; never while Site details is over it.
  useHardwareBack(() => {
    if (!navigation.isFocused()) return false;
    if (takesBack.current && view.current !== null) {
      const back: WebViewBack = { v: WEB_VIEW_BRIDGE_VERSION, kind: 'back' };
      view.current.postMessage(JSON.stringify(back));
    } else onLeave();
    return true;
  });
  // Back from a save in Site details: the page opens again on the site as it now stands. A way
  // back with nothing saved leaves the page as it was, its picture with it.
  const loadedFor = useRef(savedAt);
  useEffect(() => {
    if (loadedFor.current === savedAt) return;
    loadedFor.current = savedAt;
    view.current?.reload();
  }, [savedAt]);
  // A page that failed to load keeps clear of nothing: its state stands inside the phone's bars.
  useEffect(() => {
    if (failed) onUnderBars(false);
  }, [failed, onUnderBars]);
  if (failed) {
    return (
      <View ref={frame} style={styles.page}>
        <LeadDetailStates
          read={{ kind: 'failed', retry: () => setFailed(false) }}
          words={states}
          onBackToList={onLeave}
          focusAfter={frame}
        />
      </View>
    );
  }
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
        if (asked.kind === 'insets-needed') {
          wantsInsets.current = true;
          sendInsets();
          onUnderBars(true);
          return;
        }
        if (asked.kind === 'back-here' || asked.kind === 'back-gone') {
          takesBack.current = asked.kind === 'back-here';
          return;
        }
        void lendToken().then((token) => {
          const lend: WebViewLend = { v: WEB_VIEW_BRIDGE_VERSION, kind: 'token', token };
          view.current?.postMessage(JSON.stringify(lend));
        });
      }}
      onLoadStart={() => {
        takesBack.current = false;
        // The new page asks for the bars again; the studio stays under them meanwhile, so a reload
        // (back from a saved Site details) never jumps.
        wantsInsets.current = false;
      }}
      onError={() => setFailed(true)}
      onHttpError={(event) => {
        if (ownPage(event.nativeEvent.url)) setFailed(true);
      }}
      onContentProcessDidTerminate={() => setFailed(true)}
      onRenderProcessGone={() => setFailed(true)}
      bounces={false}
      // The page lays itself out under the phone's bars and keeps clear of them by `insets`: iOS
      // adds no inset of its own.
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      // iOS lays its own up / down / done bar over the page's sheet above the keyboard: the studio's
      // sheets have their own Done, so the bar only hides it.
      hideKeyboardAccessoryView
      overScrollMode="never"
      setSupportMultipleWindows={false}
      allowsBackForwardNavigationGestures={false}
    />
  );
}
