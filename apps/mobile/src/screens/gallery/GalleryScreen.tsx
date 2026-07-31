import { theme } from '@heliogrid/tokens/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/routes';
import { AppText, IconButton } from '../../ui';
import {
  AuthSections,
  BackGlyph,
  DataSections,
  DevanagariSection,
  FeedbackNavSections,
  FormsSections,
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
 * Props are the ROUTE's props — no `onBack` callback (ADR-0020). Going back is
 * `navigation.goBack()`, which also gives the native swipe gesture for free.
 */
type GalleryScreenProps = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

export function GalleryScreen({ navigation }: GalleryScreenProps) {
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
        <DevanagariSection />
      </ScrollView>
    </View>
  );
}
