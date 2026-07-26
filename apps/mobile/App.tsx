import { theme } from '@heliogrid/tokens/theme';
import { I18nProvider, Trans } from '@lingui/react';
import { useCallback, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { i18n, type Locale, setupI18n } from './src/i18n';
import { GalleryScreen } from './src/screens/GalleryScreen';

/**
 * Track F scaffold screen — proves the chain: tokens theme → RN, Lingui catalogs via the
 * metro transformer (per-user language switch, D25), safe-area, ≥44pt targets.
 * Real screens (My Day, leads, surveys) land with their module slices from Day 3.
 */
setupI18n('en');

function App() {
  const [locale, setLocale] = useState<Locale>('en');
  const [showGallery, setShowGallery] = useState(false);
  const onLocale = useCallback((l: Locale) => {
    i18n.activate(l);
    setLocale(l);
  }, []);

  return (
    <I18nProvider i18n={i18n}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.canvas} />
        {showGallery ? (
          <GalleryScreen onBack={() => setShowGallery(false)} />
        ) : (
          <Home locale={locale} onLocale={onLocale} onOpenGallery={() => setShowGallery(true)} />
        )}
      </SafeAreaProvider>
    </I18nProvider>
  );
}

function Home({
  locale,
  onLocale,
  onOpenGallery,
}: {
  locale: Locale;
  onLocale: (l: Locale) => void;
  onOpenGallery: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.card}>
        <Text style={styles.overline}>HELIOGRID</Text>
        <Text style={styles.h2}>
          <Trans id="Foundations ready" />
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
