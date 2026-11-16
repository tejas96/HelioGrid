import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { BrandBloom } from '../BrandBloom/BrandBloom.native';
import { labelRunsOf } from '../Button/Button.logic';
import { Button } from '../Button/Button.native';
import { Badge } from '../Chip/Chip.native';
import { LottieMoment } from '../LottieMoment/LottieMoment.native';
import type { ProposalReadyProps } from './ProposalReady.types';

/** The cover's landing: up from below, turning into its tilt — once, on the UI thread. */
function useLanding() {
  const reduced = useReducedMotion();
  const land = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      land.setValue(1);
      return;
    }
    const anim = Animated.timing(land, {
      toValue: 1,
      duration: theme.motion.durations.scene,
      easing: Easing.bezier(...theme.motion.easings.enter),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [land, reduced]);
  return {
    opacity: land,
    transform: [
      { translateY: land.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
      { rotate: land.interpolate({ inputRange: [0, 1], outputRange: ['2deg', '-4deg'] }) },
    ],
  };
}

/** The moment a proposal exists: its cover, its number, and the way on. */
export function ProposalReady(props: ProposalReadyProps) {
  const { words, safe } = props;
  const landing = useLanding();
  return (
    <ScrollView
      style={styles.room}
      contentContainerStyle={[
        styles.screen,
        {
          paddingTop: (safe?.top ?? 0) + theme.spacing['sp-8'],
          paddingBottom: (safe?.bottom ?? 0) + theme.spacing['sp-8'],
        },
      ]}
    >
      <View>
        <BrandBloom placement="centre" />
        <Animated.View style={landing}>{props.cover}</Animated.View>
        <View style={styles.mark}>
          <LottieMoment name="published" size={96} label={words.moment} />
        </View>
      </View>
      <View style={styles.words}>
        <Badge tone="success" glyph="check" style={styles.badge}>
          {words.status}
        </Badge>
        <Text variant="display" align="center" style={styles.title}>
          {words.title}
        </Text>
        <Text variant="body" color="secondary" align="center">
          {labelRunsOf(words.line, words.lineFigures).map((run) =>
            run.mono ? (
              <Text key={run.text} variant="mono" color="primary">
                {run.text}
              </Text>
            ) : (
              run.text
            ),
          )}
        </Text>
        <View style={styles.acts}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            iconRight={<ShellGlyph name="arrow-right" size="sm" tone="inverse" />}
            onClick={props.onShare}
          >
            {words.share}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            loading={props.downloading === true}
            icon={<ShellGlyph name="download" size="sm" />}
            onClick={props.onDownload}
          >
            {words.download}
          </Button>
        </View>
        <Pressable style={styles.back} onPress={props.onBack}>
          <Text variant="body-sm" color="secondary" bold>
            {words.back}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  room: { flex: 1 },
  /* Centred where the phone has the room; on a short phone the cover and both acts scroll, none cut off. */
  screen: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-6'],
    paddingHorizontal: theme.spacing['sp-6'],
  },
  mark: { position: 'absolute', right: -theme.spacing['sp-8'], top: -theme.spacing['sp-6'] },
  words: { alignSelf: 'stretch', alignItems: 'center', gap: theme.spacing['sp-3'] },
  badge: { alignSelf: 'center' },
  // The web's `.hg-prdy-title` size on the phone.
  title: { fontSize: theme.type.roles.h1.fontSize, lineHeight: theme.type.roles.h1.lineHeight },
  acts: { alignSelf: 'stretch', gap: theme.spacing['sp-2'], marginTop: theme.spacing['sp-4'] },
  back: { minHeight: 44, justifyContent: 'center', paddingHorizontal: theme.spacing['sp-3'] },
});
