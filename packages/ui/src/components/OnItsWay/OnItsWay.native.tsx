import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { LottieMoment } from '../LottieMoment/LottieMoment.native';
import type { OnItsWayProps } from './OnItsWay.types';

/**
 * A coming page (`OnItsWay.types.ts`) on the phone: the solar-glass hero with the sunrise over the
 * name and the promise, what it will hold as one glass tile split by hairlines (three short lines
 * are not a card each), then the line for meanwhile and the way home — the web's column, as the
 * phone draws it.
 */
export function OnItsWay({ title, badge, line, points, meanwhile, action }: OnItsWayProps) {
  return (
    <View style={styles.root}>
      <HeroPanel label={badge}>
        <View style={styles.hero}>
          <View style={styles.art}>
            <LottieMoment name="sunrise" size={96} />
          </View>
          <Text variant="display" style={styles.title}>
            {title}
          </Text>
          <Text variant="body-lg" color="secondary">
            {line}
          </Text>
        </View>
      </HeroPanel>
      <View style={[tileSurface, styles.points]}>
        <GroundProvider ground="tile">
          {points.map((point, index) => (
            <View key={point} style={[styles.point, index === 0 ? undefined : styles.pointAfter]}>
              <View style={styles.bead}>
                <ShellGlyph name="arrow-up-right" size="md" tone="accent" />
              </View>
              <Text variant="body" style={styles.pointText}>
                {point}
              </Text>
            </View>
          ))}
        </GroundProvider>
      </View>
      <View style={styles.foot}>
        <Text variant="body-sm" color="secondary" align="center">
          {meanwhile}
        </Text>
        {action === undefined ? null : action}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: theme.spacing['sp-5'] },
  hero: { gap: theme.spacing['sp-3'] },
  /* The sunrise rests in the hero's top corner beside the name; the promise runs the full width. */
  art: { position: 'absolute', top: -theme.spacing['sp-6'], end: 0 },
  title: { paddingEnd: theme.spacing['sp-24'] },
  points: { borderRadius: theme.radius['r-tile'] },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: theme.layout['touch-min'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  pointAfter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors['line-soft'],
  },
  pointText: { flex: 1 },
  bead: {
    width: theme.spacing['sp-10'],
    height: theme.spacing['sp-10'],
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors['accent-subtle'],
  },
  foot: {
    alignItems: 'center',
    gap: theme.spacing['sp-4'],
    paddingTop: theme.spacing['sp-2'],
    paddingBottom: theme.spacing['sp-6'],
  },
});
