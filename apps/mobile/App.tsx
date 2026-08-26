import { UI_SOURCE_LOCALE } from '@heliogrid/contracts';
import { createDataLayer } from '@heliogrid/data';
import { DataProvider } from '@heliogrid/data/react';
import { installFormsErrorMap } from '@heliogrid/forms';
import { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { keychainStorage } from './src/auth/keychain-storage';
import { API_URL } from './src/env';
import { createFormsValidationMessage, createI18nRuntime, HelioI18nProvider } from './src/i18n';
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
      <HelioI18nProvider runtime={i18nRuntime}>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" />
          <AppNavigation />
        </SafeAreaProvider>
      </HelioI18nProvider>
    </DataProvider>
  );
}
