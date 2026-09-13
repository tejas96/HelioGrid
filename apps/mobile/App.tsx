import { UI_SOURCE_LOCALE, type UiLanguage } from '@heliogrid/contracts';
import { createDataLayer } from '@heliogrid/data';
import { DataProvider, useSession } from '@heliogrid/data/react';
import { installFormsErrorMap } from '@heliogrid/forms';
import type { I18nRuntime } from '@heliogrid/i18n';
import { MarketProvider, PortalHost } from '@heliogrid/ui';
import { type ReactNode, useCallback, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { keychainStorage } from './src/auth/keychain-storage';
import { API_URL } from './src/env';
import { createFormsValidationMessage, createI18nRuntime, LanguageFollowsUser } from './src/i18n';
import { AppNavigation } from './src/navigation';
import { ReactQueryHost } from './src/react-query-host';

/**
 * App entry: composes providers and renders the navigator — nothing else.
 *
 * It must NEVER import a screen (dependency-cruiser `mobile-app-entry-thin`). The session
 * gate and every route live in `src/navigation/`; this file used to be a
 * 216-line hand-rolled router with a screen defined inline.
 *
 * `storage` is the ONLY platform-specific piece of the data path — everything above it
 * (transport, client, repositories, session) is the same code web runs.
 */
const dataLayer = createDataLayer({
  baseUrl: API_URL,
  storage: keychainStorage,
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
            <PortalHost>
              <StatusBar barStyle="dark-content" />
              <AppNavigation />
            </PortalHost>
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
