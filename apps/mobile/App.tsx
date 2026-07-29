import { theme } from '@heliogrid/tokens/theme';
import { I18nProvider } from '@lingui/react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { i18n, setupI18n } from './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';

/**
 * App entry: composes providers and renders the navigator — nothing else.
 *
 * It must NEVER import a screen (dependency-cruiser `mobile-app-entry-thin`). The session
 * gate and every route live in `src/navigation/` (ADR-0020); this file used to be a
 * 216-line hand-rolled router with a screen defined inline.
 */
setupI18n('en');

export default function App() {
  return (
    <I18nProvider i18n={i18n}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.canvas} />
        <RootNavigator />
      </SafeAreaProvider>
    </I18nProvider>
  );
}
