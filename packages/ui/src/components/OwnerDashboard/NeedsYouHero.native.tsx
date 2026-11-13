import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Easing, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { HueTile } from '../HueTile/HueTile.native';
import { useFormat } from '../MarketProvider';
import type { DashboardPartProps } from './OwnerDashboard.logic';
import { type NeedItem, needItemsOf, nextNeedAt } from './OwnerDashboard.logic';
import { useAssignLanding } from './use-assign-landing';

/** The room at which every item stands in a row — the web's `@container (min-width: 720px)`. */
const ROW_ROOM = 720;

/**
 * What needs you now on the phone — the screen's one hero: one item at a time with *Next* to the
 * one after, or, on a tablet's wide room, every item in a row with its own act. Nothing waiting:
 * the hero says so, calmly.
 */
export function NeedsYouHero(props: DashboardPartProps) {
  const { view, words, needsYou, onNeed } = props;
  useAssignLanding(props.assigning, props.assignFailed, props.focusAfter);
  const sending = {
    assigning: props.assigning,
    failed: props.assignFailed ? words.assignFailed : null,
  };
  const format = useFormat();
  const items = needItemsOf(view.needsYou, needsYou, words, (amount) => format.money(amount));
  const [chosen, setChosen] = useState(0);
  const [room, setRoom] = useState(0);
  const at = chosen < items.length ? chosen : 0;
  const row = room >= ROW_ROOM;
  if (items.length === 0) {
    return (
      <HeroPanel label={words.needsYouNow}>
        <View style={styles.head}>
          <HueTile glyph="check-check" hue="success" size={48} stroke={1.75} />
          <View style={styles.words}>
            <Text variant="h3">{words.allClearTitle}</Text>
            <Text variant="body-sm" color="secondary">
              {words.allClearBody}
            </Text>
          </View>
        </View>
      </HeroPanel>
    );
  }
  const current = items[at];
  return (
    <View onLayout={(event: LayoutChangeEvent) => setRoom(event.nativeEvent.layout.width)}>
      <HeroPanel
        label={words.needsYouNow}
        labelAside={
          row || items.length < 2 ? undefined : (
            <View style={styles.nav}>
              <Text variant="caption" color="secondary" oneLine>
                {words.position(at + 1, items.length)}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                iconRight={<ShellGlyph name="chevron-right" size="sm" tone="primary" />}
                onClick={() => setChosen(nextNeedAt(at, items.length))}
              >
                {words.nextNeed}
              </Button>
            </View>
          )
        }
      >
        {row ? (
          <View style={styles.row}>
            {items.map((item, index) => (
              <View key={item.kind} style={styles.pane}>
                <NeedCard item={item} primary={index === 0} onOpen={onNeed} {...sending} />
              </View>
            ))}
          </View>
        ) : current === undefined ? null : (
          <Arriving key={current.kind}>
            <NeedCard item={current} primary onOpen={onNeed} {...sending} />
          </Arriving>
        )}
      </HeroPanel>
    </View>
  );
}

function NeedCard({
  item,
  primary,
  onOpen,
  assigning,
  failed,
}: {
  item: NeedItem;
  primary: boolean;
  onOpen: (open: NeedItem['open']) => void;
  assigning: boolean;
  failed: TranslatedText | null;
}) {
  const offers = item.open.kind === 'assign_waiting';
  return (
    <View style={styles.need}>
      <View style={styles.head}>
        <HueTile glyph={item.glyph} hue={item.hue} size={44} stroke={1.75} />
        <View style={styles.words}>
          <Text variant="h3">{item.title}</Text>
          <Text variant="body-sm" color="secondary">
            {item.line}
          </Text>
          {item.reason === undefined ? null : (
            <Text variant="body-sm" color="secondary">
              {item.reason}
            </Text>
          )}
        </View>
      </View>
      {offers && failed !== null ? (
        <Text variant="body-sm" color="danger" live>
          {failed}
        </Text>
      ) : null}
      <View style={styles.acts}>
        <View style={styles.act}>
          <Button
            variant={primary ? 'primary' : 'secondary'}
            size="md"
            fullWidth
            loading={offers && assigning}
            disabled={assigning}
            onClick={() => onOpen(item.open)}
          >
            {item.act}
          </Button>
        </View>
        {item.other === undefined ? null : (
          <View style={styles.act}>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              disabled={assigning}
              onClick={() => item.other && onOpen(item.other.open)}
            >
              {item.other.act}
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}

/** The item at hand slides in from the side as *Next* brings it — transform and opacity, once. */
function Arriving({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const enter = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    const run = Animated.timing(enter, {
      toValue: 1,
      duration: theme.motion.durations.standard,
      easing: Easing.bezier(...theme.motion.easings.enter),
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [enter, reduced]);
  const style = {
    opacity: enter,
    transform: [
      {
        translateX: enter.interpolate({
          inputRange: [0, 1],
          outputRange: [theme.spacing['sp-4'], 0],
        }),
      },
    ],
  };
  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  /* The one-tap act and *Pick someone* share the row as two pills, each as wide as its words; when
     the room is too narrow for both, the second moves under the first rather than clipping. */
  acts: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  act: { flexGrow: 1, flexShrink: 0 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    marginStart: 'auto',
  },
  need: { gap: theme.spacing['sp-4'] },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  row: { flexDirection: 'row', gap: theme.spacing['sp-3'] },
  pane: { flex: 1, minWidth: 0 },
});
