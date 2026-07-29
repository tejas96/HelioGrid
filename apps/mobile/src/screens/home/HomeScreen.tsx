import { theme } from '@heliogrid/tokens/theme';
import { Trans } from '@lingui/react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { i18n, type Locale } from '../../i18n';
import type { RootStackParamList } from '../../navigation/routes';
import { AppText, Button, Card, SegmentedControl } from '../../ui';

/**
 * Post-login placeholder surface until My Day lands with the CRM module. It used to be an
 * inline component inside App.tsx built from raw Pressable/Text — a `src/ui` violation;
 * moving it into a screen folder (ADR-0020) was also the fix, so every visual here now
 * comes from the component index.
 */
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'hi', label: 'हि' },
  { value: 'mr', label: 'मर' },
];

export function HomeScreen({ navigation }: Props) {
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
