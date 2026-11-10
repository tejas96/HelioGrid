import { theme } from '@heliogrid/theme';
import { type ReactNode, type RefObject, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { Text } from '../../primitives/Text/Text.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { IconButton } from '../IconButton/IconButton.native';
import { LeadAge } from '../LeadAge/LeadAge.native';
import { LeadSourceMark } from '../LeadSourceMark/LeadSourceMark.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import { ProgressRing } from '../ProgressRing/ProgressRing.native';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import { ageShareOf, isPastDay, peeksOf } from './LeadDeckCard.logic';
import type {
  LeadDeckCardLayout,
  LeadDeckCardProps,
  LeadDeckCardWords,
  LeadDeckPlace,
  WaitingLead,
} from './LeadDeckCard.types';

const ENTER = Easing.bezier(...theme.motion.easings.enter);
const EXIT = Easing.bezier(...theme.motion.easings.exit);

/**
 * The deck on the phone (`SCR-M02-02`): the lead on the solar glass, the faces under it. A lead
 * that leaves flies off on the UI thread over the one rising into its place, and the screen
 * reader lands on the new lead's name; under reduced motion the new card is simply there.
 */
export function LeadDeckCard({
  lead,
  sourceLabel,
  layout,
  behind,
  place,
  onJunk,
  pending,
  waiting,
  team,
  departed,
  words,
}: LeadDeckCardProps) {
  const name = useRef<View>(null);
  const departedId = departed?.lead.id ?? null;
  useEffect(() => {
    if (departedId !== null) focusScreenReaderOn(() => name.current);
  }, [departedId]);
  const peeks = peeksOf(behind);
  return (
    <View
      style={[
        styles.deck,
        peeks > 0 ? { paddingBottom: theme.spacing['sp-3'] * peeks } : undefined,
      ]}
    >
      {peeks > 0 ? (
        <View
          pointerEvents="none"
          style={[styles.peek, styles.peekNear, { bottom: (peeks - 1) * theme.spacing['sp-3'] }]}
        />
      ) : null}
      {peeks > 1 ? <View pointerEvents="none" style={[styles.peek, styles.peekFar]} /> : null}
      <Rising key={lead.id}>
        <DeckFace
          lead={lead}
          sourceLabel={sourceLabel}
          layout={layout}
          words={words}
          nameRef={name}
          place={place}
          junk={onJunk === undefined ? null : onJunk}
          waiting={waiting}
          give={
            <View style={styles.give}>
              {pending === undefined ? (
                team === undefined ? null : (
                  <Text variant="overline" style={styles.muted}>
                    {words.give}
                  </Text>
                )
              ) : (
                <PendingAction {...pending} />
              )}
              {team}
            </View>
          }
        />
      </Rising>
      {departed === null ? null : (
        <Departing key={departed.lead.id}>
          <DeckFace
            lead={departed.lead}
            sourceLabel={departed.sourceLabel}
            layout={layout}
            words={words}
            junk={null}
            waiting
          />
        </Departing>
      )}
    </View>
  );
}

/** The card rises into the deck's place once, on the native driver. */
function Rising({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const rise = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    const run = Animated.timing(rise, {
      toValue: 1,
      duration: theme.motion.durations.emphasised,
      easing: ENTER,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [reduced, rise]);
  const look = {
    opacity: rise.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
    transform: [
      {
        translateY: rise.interpolate({
          inputRange: [0, 1],
          outputRange: [theme.spacing['sp-3'], 0],
        }),
      },
      { scale: rise.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
    ],
  };
  return <Animated.View style={[styles.card, look]}>{children}</Animated.View>;
}

/** The lead that left flies off, then rests unseen; under reduced motion it is not drawn. */
function Departing({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const fly = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const run = Animated.timing(fly, {
      toValue: 1,
      duration: theme.motion.durations.emphasised,
      easing: EXIT,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [fly, reduced]);
  if (reduced) return null;
  const look = {
    opacity: fly.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [
      {
        translateY: fly.interpolate({
          inputRange: [0, 1],
          outputRange: [0, theme.spacing['sp-10']],
        }),
      },
      { scale: fly.interpolate({ inputRange: [0, 1], outputRange: [1, 0.84] }) },
    ],
  };
  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.departed, look]}
    >
      {children}
    </Animated.View>
  );
}

interface DeckFaceProps {
  lead: WaitingLead;
  sourceLabel: LeadDeckCardProps['sourceLabel'];
  layout: LeadDeckCardLayout;
  words: LeadDeckCardWords;
  nameRef?: RefObject<View | null>;
  place?: LeadDeckPlace;
  junk: (() => void) | null;
  waiting: boolean;
  give?: ReactNode;
}

function DeckFace({
  lead,
  sourceLabel,
  layout,
  words,
  nameRef,
  place,
  junk,
  waiting,
  give,
}: DeckFaceProps) {
  const stage = layout === 'stage';
  return (
    <HeroPanel name={words.region(lead.name)}>
      <View style={styles.top}>
        {stage && place !== undefined ? (
          <View style={styles.place}>
            <Text variant="mono" style={styles.muted}>
              {words.place(place.index + 1, place.total)}
            </Text>
            <IconButton label={words.previous} variant="ghost" size={36} onClick={place.onPrevious}>
              <ShellGlyph name="chevron-left" size="sm" tone="primary" />
            </IconButton>
            <IconButton label={words.next} variant="ghost" size={36} onClick={place.onNext}>
              <ShellGlyph name="chevron-right" size="sm" tone="primary" />
            </IconButton>
          </View>
        ) : null}
        <View style={styles.source}>
          <LeadSourceMark source={lead.source} label={sourceLabel} />
        </View>
        {stage ? null : <LeadAge elapsedMs={lead.elapsedMs} words={words.age} />}
        <View style={styles.grow} />
        {junk === null ? null : (
          <IconButton label={words.junkThis} disabled={waiting} onClick={junk}>
            <ShellGlyph name="blocked" size="md" tone="primary" />
          </IconButton>
        )}
      </View>
      <View style={styles.who}>
        <View ref={nameRef} accessible accessibilityRole="header">
          {lead.name === null ? (
            <NamedGap gap={words.noName} scale="headline" />
          ) : (
            <Text variant="h1" style={styles.ink}>
              {lead.name}
            </Text>
          )}
        </View>
        <View style={styles.city}>
          <ShellGlyph name="pin" size="sm" tone="secondary" />
          {lead.city === null ? (
            <NamedGap gap={words.noCity} scale="field" />
          ) : (
            <Text variant="body-sm" style={styles.muted}>
              {lead.city}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.bill}>
        <Text variant="overline" style={styles.muted}>
          {words.bill}
        </Text>
        {lead.bill === null ? (
          <NamedGap gap={words.noBill} scale="headline" />
        ) : (
          <View style={styles.money}>
            <Text variant="figure" style={[styles.ink, styles.tabular]}>
              {lead.bill.money}
            </Text>
            <ProvenanceTier tier={lead.bill.tier} />
          </View>
        )}
      </View>
      {stage ? <AgeRing elapsedMs={lead.elapsedMs} words={words} /> : null}
      {give}
    </HeroPanel>
  );
}

/** How long the lead has waited against the 24 hours before its owner is told (`M02-50`). */
function AgeRing({ elapsedMs, words }: { elapsedMs: number; words: LeadDeckCardWords }) {
  return (
    <View style={styles.age}>
      <ProgressRing
        share={ageShareOf(elapsedMs)}
        value={words.age.age(elapsedMs)}
        caption={words.waiting}
        spokenName={words.age.spoken(elapsedMs)}
        onPanel
      />
      {isPastDay(elapsedMs) ? (
        <StatusMark tone="warning" label={words.pastDay} />
      ) : (
        <Text variant="caption" style={styles.muted}>
          {words.alertAt}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  deck: { position: 'relative' },
  card: { zIndex: 2 },
  departed: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 },
  peek: {
    position: 'absolute',
    zIndex: 0,
    height: theme.spacing['sp-12'],
    borderBottomLeftRadius: theme.radius['r-card-expressive'],
    borderBottomRightRadius: theme.radius['r-card-expressive'],
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors['line-soft'],
    backgroundColor: colors.panel,
  },
  peekNear: { left: theme.spacing['sp-3'], right: theme.spacing['sp-3'] },
  peekFar: { left: theme.spacing['sp-6'], right: theme.spacing['sp-6'], bottom: 0, opacity: 0.6 },
  top: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: theme.layout['touch-min'],
  },
  source: {
    paddingHorizontal: theme.spacing['sp-3'],
    minHeight: theme.spacing['sp-8'],
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
  },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingStart: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
  },
  grow: { flexGrow: 1 },
  who: { gap: theme.spacing['sp-1'] },
  city: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  bill: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  money: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  age: { alignItems: 'center', gap: theme.spacing['sp-2'] },
  give: {
    gap: theme.spacing['sp-2'],
    paddingTop: theme.spacing['sp-3'],
    borderTopWidth: 1,
    borderTopColor: colors['panel-line'],
  },
  ink: { color: colors['on-panel'] },
  muted: { color: colors['on-panel-muted'] },
  tabular: { fontVariant: ['tabular-nums'] },
});
