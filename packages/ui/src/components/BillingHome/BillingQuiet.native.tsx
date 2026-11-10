import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { EmptyScene } from '../EmptyScene/EmptyScene.native';
import type { QuietArt as QuietArtName } from './BillingHome.parts.types';

/**
 * A region with nothing in it yet, said calmly in one tile: a small calm drawing, or the card glyph in its tinted square, what is not
 * there, and when it comes — no payment method before a plan, no invoice before a charge.
 */
export function BillingQuiet({
  art,
  title,
  message,
}: {
  art: QuietArtName;
  title: TranslatedText;
  message: TranslatedText | null;
}) {
  return (
    <View style={styles.tile}>
      <GroundProvider ground="tile">
        <QuietArt art={art} />
        <View style={styles.words}>
          <Text variant="body" bold={message !== null}>
            {title}
          </Text>
          {message === null ? null : (
            <Text variant="body-sm" color="secondary">
              {message}
            </Text>
          )}
        </View>
      </GroundProvider>
    </View>
  );
}

function QuietArt({ art }: { art: QuietArtName }) {
  if (art !== 'card') return <EmptyScene name="settle" size="compact" />;
  return (
    <View
      style={styles.art}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <ShellGlyph name="credit-card" size="lg" tone="accent" />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    ...tileSurface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-4'],
    paddingVertical: theme.spacing['sp-4'],
    paddingHorizontal: theme.layout['tile-pad'],
    borderRadius: theme.radius['r-tile'],
  },
  /* The art in its own soft square, tinted with the accent, as a list's icon tile is. */
  art: {
    width: theme.spacing['sp-12'],
    height: theme.spacing['sp-12'],
    borderRadius: theme.radius['r-md'],
    backgroundColor: colors['accent-subtle'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: { flex: 1, gap: theme.spacing['sp-0-5'] },
});
