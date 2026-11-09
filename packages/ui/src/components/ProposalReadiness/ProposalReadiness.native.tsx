import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { ListRow } from '../ListRow/ListRow.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { ProgressRing } from '../ProgressRing/ProgressRing.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import type { ProposalReadinessProps, ReadinessStep } from './ProposalReadiness.types';

const { stepMs, maxItems, risePx } = theme.motion.stagger;

/** The first-proposal hero and its steps on the phone, the steps rising one after another. */
export function ProposalReadiness({
  words,
  done,
  total,
  steps,
  next,
  loading,
}: ProposalReadinessProps) {
  return (
    <View style={styles.readiness}>
      <HeroPanel label={words.overline}>
        {loading ? (
          <LoadingBars bars={['panel']} label={words.loading} />
        ) : (
          <View style={styles.body}>
            <View style={styles.head}>
              <View style={styles.words}>
                <Text variant="h2">{words.title}</Text>
                <Text variant="body" color="secondary">
                  {words.line}
                </Text>
              </View>
              <ProgressRing
                share={total === 0 ? 0 : done / total}
                value={`${done}/${total}`}
                caption={words.done}
                spokenName={words.count}
              />
            </View>
            {next === null ? null : <NextStep step={next} words={words} />}
          </View>
        )}
      </HeroPanel>
      {loading ? null : (
        <View accessibilityRole="list" accessibilityLabel={words.stepsName} style={styles.steps}>
          {steps.map((step, index) => (
            <Rising key={step.key} order={index}>
              <View style={index === 0 ? null : styles.rule}>
                <ListRow
                  icon={<ShellGlyph name={step.icon} size="md" tone="accent" />}
                  title={step.label}
                  subtitle={step.detail}
                  subtitleWrap
                  trailing={<StepMark step={step} doneWord={words.done} />}
                  onClick={step.onOpen}
                />
              </View>
            </Rising>
          ))}
        </View>
      )}
    </View>
  );
}

function NextStep({
  step,
  words,
}: {
  step: ReadinessStep;
  words: ProposalReadinessProps['words'];
}) {
  return (
    <View style={styles.next}>
      <View style={styles.nextRow}>
        <View style={styles.nextIcon}>
          <ShellGlyph name={step.icon} size="md" tone="accent" />
        </View>
        <View style={styles.nextWords}>
          <Text variant="overline" color="secondary">
            {words.next}
          </Text>
          <Text variant="body" bold>
            {step.label}
          </Text>
          <Text variant="body-sm" color="secondary">
            {step.detail}
          </Text>
        </View>
      </View>
      <Button variant="primary" size="md" fullWidth onClick={step.onOpen}>
        {words.continueLabel}
      </Button>
    </View>
  );
}

function StepMark({ step, doneWord }: { step: ReadinessStep; doneWord: TranslatedText }) {
  if (step.done === true) return <StatusChip label={doneWord} tone="success" />;
  if (step.done === false) return <ShellGlyph name="chevron-right" size="sm" />;
  return null;
}

/** A row rising into place once, after the rows before it (transform and opacity, native driver). */
function Rising({ order, children }: { order: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const rise = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    const anim = Animated.timing(rise, {
      toValue: 1,
      duration: theme.motion.durations.emphasised,
      delay: Math.min(order, maxItems) * stepMs,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [rise, order, reduced]);
  const style = {
    opacity: rise,
    transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [risePx, 0] }) }],
  };
  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  readiness: { gap: theme.spacing['sp-4'] },
  body: { gap: theme.spacing['sp-5'], alignItems: 'flex-start' },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    gap: theme.spacing['sp-4'],
  },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-2'] },
  next: {
    alignSelf: 'stretch',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-tile'],
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors['accent-subtle'],
  },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  nextIcon: {
    width: theme.layout['touch-min'],
    height: theme.layout['touch-min'],
    borderRadius: theme.radius['r-md'],
    alignItems: 'center',
    justifyContent: 'center',
    // biome-ignore lint/plugin/raw-white: the glyph's chip is the card colour on the tinted band
    backgroundColor: colors.surface,
  },
  nextWords: { flex: 1, minWidth: 0 },
  steps: {
    padding: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-card-expressive'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
    // biome-ignore lint/plugin/raw-white: the steps sit on the card colour over the page (redesign direction A)
    backgroundColor: colors.surface,
    ...theme.elevation.e2,
  },
  rule: { borderTopWidth: 1, borderTopColor: colors.hairline },
});
