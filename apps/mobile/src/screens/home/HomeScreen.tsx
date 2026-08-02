import { theme } from '@heliogrid/tokens/theme';
import { Trans } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { i18n, LOCALES, type Locale } from '../../i18n';
import { AppText, Button, Card, SegmentedControl } from '../../ui';

/**
 * Post-login placeholder surface until My Day lands with the CRM module. It used to be an
 * inline component inside App.tsx built from raw Pressable/Text — a `src/ui` violation;
 * moving it into a screen folder was also the fix, so every visual here now
 * comes from the component index.
 */

/** Keyed by the contract enum: a new UI language is a compile error here until it renders. */
const LOCALE_LABEL: Record<Locale, string> = { en: 'EN', hi: 'हि', mr: 'मर' };
const LOCALE_OPTIONS = LOCALES.map((value) => ({ value, label: LOCALE_LABEL[value] }));

export function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [locale, setLocale] = useState<Locale>('en');

  const changeLocale = (next: string) => {
    i18n.activate(next as Locale);
    setLocale(next as Locale);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Card>
        <AppText role="overline" weight="700" color={theme.colors['text-secondary']}>
          HELIOGRID
        </AppText>
        <AppText role="h2" weight="700">
          <Trans id="Foundations ready" />
        </AppText>
        <AppText role="body">
          <Trans id="Field-first CRM, surveys and design for solar EPCs." />
        </AppText>

        <View style={styles.actions}>
          <Button variant="primary" fullWidth onClick={() => undefined}>
            <Trans id="Open my day" />
          </Button>
          <SegmentedControl options={LOCALE_OPTIONS} value={locale} onChange={changeLocale} />
          {/* Typed route name — a rename is a compile error, never a runtime miss. */}
          <Button variant="ghost" fullWidth onClick={() => navigation.navigate('Gallery')}>
            Component gallery
          </Button>
        </View>
      </Card>
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
  actions: {
    gap: theme.spacing['sp-3'],
    marginTop: theme.spacing['sp-2'],
  },
});
