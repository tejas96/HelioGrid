import { createDataLayer } from '@heliogrid/data';
import { DataProvider } from '@heliogrid/data/react';
import { installFormsErrorMap } from '@heliogrid/forms';
import { theme } from '@heliogrid/tokens/theme';
import { I18nProvider } from '@lingui/react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { keychainStorage } from './src/auth/keychain-storage';
import { API_URL } from './src/env';
import { formsValidationMessage, i18n, setupI18n } from './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';

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
setupI18n('en');
installFormsErrorMap(formsValidationMessage);

const dataLayer = createDataLayer({ baseUrl: API_URL, storage: keychainStorage });

export default function App() {
  return (
    <DataProvider layer={dataLayer}>
      <I18nProvider i18n={i18n}>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor={theme.colors.canvas} />
          <RootNavigator />
        </SafeAreaProvider>
      </I18nProvider>
    </DataProvider>
  );
}
