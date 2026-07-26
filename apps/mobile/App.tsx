import { theme } from '@heliogrid/tokens/theme';
import { I18nProvider, Trans } from '@lingui/react';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from './src/data/api-client';
import { i18n, type Locale, setupI18n } from './src/i18n';
import { GalleryScreen } from './src/screens/GalleryScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { Spinner } from './src/ui';

/**
 * App entry: session gate (api.auth.me via the keychain cookie jar) → LoginScreen when
 * unauthenticated, else the Track F scaffold Home card (placeholder post-login surface
 * until My Day lands with the CRM module).
 */
setupI18n('en');

type Session = 'checking' | 'unauthenticated' | { name: string };

function App() {
  const [locale, setLocale] = useState<Locale>('en');
  const [showGallery, setShowGallery] = useState(false);
  const [session, setSession] = useState<Session>('checking');
  const onLocale = useCallback((l: Locale) => {
    i18n.activate(l);
    setLocale(l);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await api.auth.me.query({});
      setSession(res.status === 200 ? { name: res.body.user.name } : 'unauthenticated');
    } catch {
      // Unreachable api (offline / dev server down): land on the login gate — it owns
      // the offline treatment.
      setSession('unauthenticated');
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  return (
    <I18nProvider i18n={i18n}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.canvas} />
        {session === 'checking' ? (
          <View style={styles.boot}>
            <Spinner />
          </View>
        ) : session === 'unauthenticated' ? (
          <LoginScreen onSignedIn={() => void refreshSession()} />
        ) : showGallery ? (
          <GalleryScreen onBack={() => setShowGallery(false)} />
        ) : (
          <Home
            locale={locale}
            onLocale={onLocale}
            onOpenGallery={() => setShowGallery(true)}
            userName={session.name}
          />
        )}
      </SafeAreaProvider>
    </I18nProvider>
  );
}

function Home({
  locale,
  onLocale,
  onOpenGallery,
  userName,
}: {
  locale: Locale;
  onLocale: (l: Locale) => void;
  onOpenGallery: () => void;
  userName: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.card}>
        <Text style={styles.overline}>HELIOGRID</Text>
        <Text style={styles.h2}>
          <Trans id="Foundations ready" />
        </Text>
        <Text style={styles.signedIn}>
          <Trans id="Signed in as {name}" values={{ name: userName }} />
        </Text>
        <Text style={styles.body}>
          <Trans id="Field-first CRM, surveys and design for solar EPCs." />
        </Text>
        <Pressable style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}>
          <Text style={styles.primaryLabel}>
            <Trans id="Open my day" />
          </Text>
        </Pressable>
        <View style={styles.langRow}>
          {(['en', 'hi', 'mr'] as const).map((l) => (
            <Pressable
              key={l}
              onPress={() => onLocale(l)}
              style={[styles.langChip, locale === l && styles.langChipActive]}
              accessibilityLabel={`Switch language to ${l}`}
            >
              <Text style={[styles.langLabel, locale === l && styles.langLabelActive]}>{l}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={onOpenGallery}
          accessibilityRole="button"
          accessibilityLabel="Open component gallery"
          style={({ pressed }) => [styles.galleryChip, pressed && styles.galleryChipPressed]}
        >
          <Text style={styles.galleryLabel}>Component gallery</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
    justifyContent: 'center',
    padding: theme.layout['screen-pad-mobile'],
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-card-expressive'],
    padding: theme.spacing['sp-6'],
    gap: theme.spacing['sp-3'],
    ...theme.elevation.e2,
  },
  overline: {
    fontSize: theme.typography.overline.fontSize,
    letterSpacing: theme.typography.overline.letterSpacing,
    fontWeight: '700',
    color: theme.colors['text-secondary'],
  },
  h2: {
    fontSize: theme.typography.h2.fontSize,
    lineHeight: theme.typography.h2.lineHeight,
    letterSpacing: theme.typography.h2.letterSpacing,
    fontWeight: '700',
    color: theme.colors['text-primary'],
  },
  body: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors['text-secondary'],
  },
  signedIn: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    fontWeight: '500',
    color: theme.colors['text-primary'],
  },
  boot: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    minHeight: 48,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['action-primary'],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing['sp-2'],
  },
  primaryPressed: {
    backgroundColor: theme.colors['action-primary-pressed'],
    transform: [{ scale: 0.97 }],
  },
  primaryLabel: {
    color: theme.colors.surface,
    fontSize: theme.typography.button.fontSize,
    letterSpacing: theme.typography.button.letterSpacing,
    fontWeight: '500',
  },
  langRow: {
    flexDirection: 'row',
    gap: theme.spacing['sp-2'],
    marginTop: theme.spacing['sp-2'],
  },
  langChip: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  langChipActive: { backgroundColor: theme.colors['action-primary'] },
  langLabel: { color: theme.colors['text-secondary'], fontWeight: '500' },
  langLabelActive: { color: theme.colors.surface },
  // Ghost chip (dev-only gallery entry): transparent at rest, neutral wash when pressed.
  galleryChip: {
    minHeight: 44,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  galleryChipPressed: { backgroundColor: theme.colors['neutral-bg'] },
  galleryLabel: { color: theme.colors['text-secondary'], fontWeight: '500' },
});

export default App;
