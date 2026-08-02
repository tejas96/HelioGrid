import { theme } from '@heliogrid/tokens/theme';
import { useNavigation } from '@react-navigation/native';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, IconButton } from '../../ui';
import {
  AuthSections,
  BackGlyph,
  DataSections,
  DevanagariSection,
  FeedbackNavSections,
  FormsSections,
  PatternsSections,
  RowsSections,
} from './components';
import { styles } from './styles';

/**
 * Dev-only component gallery — every '../ui' export in every variant/state, mirroring the
 * web gallery coverage. Reached from the Home card's ghost chip; not part of product nav.
 * Hindi samples prove Devanagari rendering through AppText run-splitting on-device.
 * Section content lives in ./components, one file per category (~450-line file limit).
 */

/**
 * No `onBack` callback prop. Going back is `navigation.goBack()`, which also gives the native
 * swipe gesture for free. Under the static config a screen receives only `route`, so
 * navigation comes from the hook.
 */
export function GalleryScreen() {
  const navigation = useNavigation();
  const onBack = () => navigation.goBack();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing['sp-2'] }]}>
        <IconButton label="Back to home" variant="ghost" onClick={onBack}>
          <BackGlyph />
        </IconButton>
        <AppText role="h3" weight="700">
          Component gallery
        </AppText>
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing['sp-12'] },
        ]}
      >
        <FormsSections />
        <DataSections />
        <RowsSections />
        <FeedbackNavSections />
        <AuthSections />
        <PatternsSections />
        <DevanagariSection />
      </ScrollView>
    </View>
  );
}
