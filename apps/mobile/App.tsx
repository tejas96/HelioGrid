import { UI_SOURCE_LOCALE, type UiLanguage } from '@heliogrid/contracts';
import { createDataLayer } from '@heliogrid/data';
import { DataProvider, useSession } from '@heliogrid/data/react';
import { installFormsErrorMap } from '@heliogrid/forms';
import type { I18nRuntime } from '@heliogrid/i18n';
import { MarketProvider, PortalHost } from '@heliogrid/ui';
import { type ReactNode, useCallback, useState } from 'react';
import { StatusBar } from 'react-native';
import { getVersion } from 'react-native-device-info';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { keychainStorage } from './src/auth/keychain-storage';
import { API_URL } from './src/env';
import { createFormsValidationMessage, createI18nRuntime, LanguageFollowsUser } from './src/i18n';
import { AppNavigation } from './src/navigation';
import { thisPlatform } from './src/push/messaging';
import { ReactQueryHost } from './src/react-query-host';

/**
 * App entry: composes providers and renders the navigator — nothing else.
 *
 * It must NEVER import a screen (dependency-cruiser `mobile-app-entry-thin`). The session
 * gate and every route live in `src/navigation/`; this file used to be a
 * 216-line hand-rolled router with a screen defined inline.
 *
 * `storage`, `appVersion` and `storePlatform` are the ONLY platform-specific pieces of the data path — everything above them
 * (transport, client, repositories, session) is the same code web runs.
 */
const dataLayer = createDataLayer({
  baseUrl: API_URL,
  storage: keychainStorage,
  // The store version — Android's versionName, iOS's MARKETING_VERSION — which a person compares
  // against the one a too-old refusal names (F4-36).
  appVersion: getVersion(),
  // The store this build updates from, whose link a too-old refusal's button opens — the same
  // platform push registers as, read once.
  storePlatform: thisPlatform,
});

export default function App() {
  /*
   * Per MOUNT, matching web — the i18n runtime is mutable state, and a module-scope
   * instance is the shape that made one shared active locale possible. On a device there is
   * only ever one mount, so this buys nothing here; it buys ONE provider contract across
   * both platforms, which is what Law 11 is about.
   */
  const [i18nRuntime] = useState(() => {
    const runtime = createI18nRuntime(UI_SOURCE_LOCALE);
    // zod's error map is a process global — bound to this mount's translator. See
    // packages/i18n/src/copy/validation.ts for why that boundary is safe on a client.
    installFormsErrorMap(createFormsValidationMessage(runtime.t));
    return runtime;
  });

  return (
    <DataProvider layer={dataLayer}>
      <ReactQueryHost />
      <SessionLanguage runtime={i18nRuntime}>
        {/* The launch market until a tenant's pack is read: the door runs before any tenant
            exists, and its phone field reads the dial code and the number's length from here. */}
        <MarketProvider>
          <SafeAreaProvider>
            {/* The ONE portal host, above navigation: every menu, sheet and modal escapes its
                screen through here; without it a Portal renders in place (Portal.native). */}
            <InsetPortalHost>
              {/* Transparent, with dark icons, on every Android version: the door's bloom runs under it
                  (`SCR-M01-01`), and each screen keeps clear of the top inset itself. */}
              <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
              <AppNavigation />
            </InsetPortalHost>
          </SafeAreaProvider>
        </MarketProvider>
      </SessionLanguage>
    </DataProvider>
  );
}

/**
 * The mount follows the signed-in person's language (`F3-02`) and persists a choice made here
 * (`F3-04`). The FOLLOW itself is `@heliogrid/i18n/react`'s and shared with the web; this holds
 * only the session read, because `packages/i18n` may not import `packages/data`. The phone has
 * no document, so it passes no `onDocumentLanguage` — that half is web's alone.
 */
/**
 * The portal host, told how tall the home-indicator band is: every sheet docked to the bottom edge
 * renders through it and lifts its last line above the band. `packages/ui` holds no safe-area
 * library, so the app — which does — supplies the fact.
 */
function InsetPortalHost({ children }: { children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return <PortalHost bottomInset={bottom}>{children}</PortalHost>;
}

function SessionLanguage({ runtime, children }: { runtime: I18nRuntime; children: ReactNode }) {
  const { user, setInterfaceLanguage } = useSession();
  const onChosen = useCallback(
    (next: UiLanguage) => void setInterfaceLanguage(next),
    [setInterfaceLanguage],
  );
  return (
    <LanguageFollowsUser
      runtime={runtime}
      follow={user?.interfaceLanguage ?? null}
      onChosen={onChosen}
    >
      {children}
    </LanguageFollowsUser>
  );
}
