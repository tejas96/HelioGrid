import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { renderActionReason } from '../ActionReason/ActionReason.native';
import type { OptionCardItem } from './OptionCardGroup.types';

interface OptionCardProps {
  option: OptionCardItem;
  selected: boolean;
  off: boolean;
  density: 'expressive' | 'functional';
  onSelect: () => void;
  currentLabel: string;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    width: '100%',
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  cardFunctional: { padding: 14, borderRadius: theme.radius['r-card-functional'] },
  /* RN has no box-shadow ring: the 2px accent selection ring is a border of the same weight. */
  cardSelected: {
    backgroundColor: theme.colors['accent-subtle'],
    borderWidth: 2,
    borderColor: theme.colors.accent,
    shadowOpacity: 0,
    elevation: 0,
  },
  /* Sunken AND flat — it went sunken and kept e2, so an unavailable option still read as the
     brightest, most pressable thing in the list (Q77). */
  cardOff: { backgroundColor: theme.colors['canvas-sunken'], shadowOpacity: 0, elevation: 0 },
  dot: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderRadius: theme.radius['r-pill'],
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors['text-disabled'],
  } /* The white fill measured 1.14:1 on an off card — weaker than its own ring at 1.44:1, so it
     was never what you read, and it made the dot the brightest thing on a dead card (Q77). */,
  dotOff: { backgroundColor: theme.colors['canvas-sunken'] },

  dotSelected: { backgroundColor: theme.colors.accent, borderWidth: 0 },
  dotFill: { width: 7, height: 7, borderRadius: theme.radius['r-pill'] },
  body: { flex: 1, minWidth: 0 },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  titles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minWidth: 0,
  },
  title: { fontWeight: '700', letterSpacing: -0.15 },
  price: { fontFamily: theme.type.families.mono, fontWeight: '700', fontSize: 14 },
  description: { marginTop: 3 },
  reason: { marginTop: 5 },
  content: { marginTop: 10 },
  meta: { marginTop: 6 },
  icon: { flexShrink: 0 },
});

/** Selection is the 2px accent border plus the filled dot; off is the sunken fill. */
function cardStyle(
  density: 'expressive' | 'functional',
  selected: boolean,
  off: boolean,
): StyleProp<ViewStyle> {
  return [
    styles.card,
    density === 'functional' ? styles.cardFunctional : null,
    selected ? styles.cardSelected : null,
    off ? styles.cardOff : null,
  ];
}

/** The dot's fill. A selected dot keeps the accent whether or not the card is off — selection is a
    fact, not an affordance. An unselected dot on an off card sinks into it. */
function dotStyle(selected: boolean, off: boolean): StyleProp<ViewStyle> {
  if (selected) return [styles.dot, styles.dotSelected];
  return off ? [styles.dot, styles.dotOff] : styles.dot;
}

/** One card. The card IS the radio, so `content` is static by contract. */
export function OptionCard({
  option,
  selected,
  off,
  density,
  onSelect,
  currentLabel,
}: OptionCardProps) {
  const reason = off ? renderActionReason(option.disabledReason) : null;
  /* Off WITH a stated reason is aria-disabled on the web, never natively disabled — and the same
     split exists here now that the primitive separates the two: `disabled` makes the card inert,
     `accessibilityState.disabled` only makes it SAY so, which is what keeps the sentence below
     reachable. Off with nothing to hear keeps the inert form. The web half asks the question the
     same way: there is a reason exactly when one rendered. */
  const inert = off && reason === null;
  const ink = off ? 'disabled' : 'primary';
  /* ARIA gives a radio `aria-checked`, never `aria-selected`, and RN's partner is
     `accessibilityState.checked` — so this card declares `checked` and no `selected`, exactly as
     the web half does. Bound through its own name because the parity gate reads the state literal
     as TEXT: written `checked: selected`, the VALUE's identifier reads as a declared `selected`
     state the web half has (correctly) no partner for. */
  const checked = selected;
  return (
    <Pressable
      onPress={off ? undefined : onSelect}
      disabled={inert}
      /* WHICH PLAN THE CUSTOMER CHOSE, SAID RATHER THAN RINGED. The web half is `role="radio"`
         plus `aria-checked`; the accent ring and the filled dot are the sighted channel and this
         is the spoken one (F7-12).
         NO `accessibilityLabel`: the web `<button>` carries no `aria-label`, so it announces the
         title, the current pill, the price, the description and the reason. An explicit label
         here would REPLACE all of that with the title — which is how the sentence below came to
         be announced to nobody. The children are text, so the card is never left unnamed. */
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled: off }}
      style={cardStyle(density, selected, off)}
    >
      <View style={dotStyle(selected, off)}>
        {selected ? (
          <View style={[styles.dotFill, { backgroundColor: theme.colors['text-inverse'] }]} />
        ) : null}
      </View>
      <View style={styles.body}>
        <View style={styles.head}>
          <View style={styles.titles}>
            <Text variant="body" color={ink} style={styles.title}>
              {option.title}
            </Text>
            {/* A word in its own neutral pill — never the accent, which selection owns. */}
            {option.current === true ? (
              <StatusMark tone="neutral" mark={false} label={option.currentLabel ?? currentLabel} />
            ) : null}
            {option.marks}
          </View>
          {option.price !== undefined ? (
            <Text variant="body-sm" color={ink} style={styles.price}>
              {option.price}
            </Text>
          ) : null}
        </View>
        {option.description !== undefined ? (
          <Text variant="body-sm" color="secondary" style={styles.description}>
            {option.description}
          </Text>
        ) : null}
        {reason === null ? null : <View style={styles.reason}>{reason}</View>}
        {option.content !== undefined ? <View style={styles.content}>{option.content}</View> : null}
        {option.meta !== undefined ? (
          <Text variant="overline" color="tertiary" style={styles.meta}>
            {option.meta}
          </Text>
        ) : null}
      </View>
      {option.icon !== undefined ? <View style={styles.icon}>{option.icon}</View> : null}
    </Pressable>
  );
}
