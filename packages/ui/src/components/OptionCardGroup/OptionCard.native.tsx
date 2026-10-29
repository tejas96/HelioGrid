import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, tileSurface, useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { scriptFloorFor } from '../../primitives/Text/Text.logic';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { renderActionReason } from '../ActionReason/ActionReason.native';
import { CheckboxTick } from '../Checkbox/CheckboxTick.native';
import { currentWord, optionRole } from './OptionCardGroup.logic';
import type { OptionCardGroupMode, OptionCardItem } from './OptionCardGroup.types';

interface OptionCardProps {
  option: OptionCardItem;
  selected: boolean;
  mode: OptionCardGroupMode;
  off: boolean;
  density: 'expressive' | 'functional';
  onSelect: () => void;
  currentLabel: TranslatedText | undefined;
}

/**
 * The title's line box: the web half sets it at the face's own `normal` line (19 at 15 px), not the
 * body role's 23.3, so a one-line card is the board's 70 tall (`SCR-M01-13` m-default, D214). The
 * nearest token line is the small body's; a script that needs more takes its floor.
 */
const TITLE_LINE = theme.type.roles['body-sm'].lineHeight;

/** The functional card's padding, and the selection ring's width the picked card takes out of it. */
const FUNCTIONAL_PAD = 14;
const RING = 2;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    width: '100%',
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-md'],
  },
  cardFunctional: { padding: FUNCTIONAL_PAD, borderRadius: theme.radius['r-card-functional'] },
  /* RN has no box-shadow ring: the 2px accent selection ring is a border of the same weight, taken
     back out of the padding so a pick never grows the card and the list below never jumps. */
  cardSelected: {
    borderWidth: RING,
    borderColor: theme.colors.accent,
    padding: theme.spacing['sp-4'] - RING,
  },
  cardSelectedFunctional: { padding: FUNCTIONAL_PAD - RING },
  /* Not a tile: it lies on the page with no fill, and its reason line says why. A selected off
     option shows its selection by the dot alone, as on the web. */
  cardOff: { borderWidth: 0 },
  dot: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderRadius: theme.radius['r-pill'],
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors['text-disabled'],
  },
  dotSelected: { backgroundColor: theme.colors.accent, borderWidth: 0 },
  /* A multiple group's mark is the checkbox's square (`Checkbox.native.tsx`). */
  dotSquare: { borderRadius: theme.radius['rf-sm'] },
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

/** An available option is a tile, selected by the 2px accent border plus the filled dot; an off
    option is not a tile and lies on the page. */
function cardStyle(
  density: 'expressive' | 'functional',
  selected: boolean,
  off: boolean,
): StyleProp<ViewStyle> {
  return [
    off ? null : tileSurface,
    styles.card,
    density === 'functional' ? styles.cardFunctional : null,
    /* An off option has no ring (`cardOff`), so it keeps its whole padding even when picked. */
    selected && !off ? styles.cardSelected : null,
    selected && !off && density === 'functional' ? styles.cardSelectedFunctional : null,
    off ? styles.cardOff : null,
  ];
}

/** A selected dot keeps the accent whether or not the option is off — selection is a fact, not an
    affordance. An unselected dot takes the control fill; on an off option it is its ring over the
    ground, since a fill is what makes a dot read as pressable. Read inside the card's ground. */
function Dot({
  selected,
  mode,
  off,
}: {
  selected: boolean;
  mode: OptionCardGroupMode;
  off: boolean;
}) {
  const ground = useGround();
  const shape = mode === 'multiple' ? styles.dotSquare : null;
  if (selected && mode === 'multiple') {
    return (
      <View style={[styles.dot, styles.dotSelected, shape]}>
        <CheckboxTick ink={theme.colors['text-inverse']} />
      </View>
    );
  }
  if (selected) {
    return (
      <View style={[styles.dot, styles.dotSelected]}>
        {/* White on the accent — a mark on the accent, the same on every ground. */}
        {/* biome-ignore lint/plugin/raw-white: on-accent — a knob or a mark on the accent or the dark fill */}
        <View style={[styles.dotFill, { backgroundColor: theme.colors['text-inverse'] }]} />
      </View>
    );
  }
  return (
    <View
      style={[styles.dot, shape, { backgroundColor: off ? ground.ground : ground.controlFill }]}
    />
  );
}

/** An available option is a tile ground; an off option reads the ground that holds it. */
function OptionGround({ off, children }: { off: boolean; children: ReactNode }) {
  return off ? children : <GroundProvider ground="tile">{children}</GroundProvider>;
}

/** One card. The card IS the radio, so `content` is static by contract. */
export function OptionCard({
  option,
  selected,
  mode,
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
  const current = currentWord(option, currentLabel);
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
      accessibilityRole={optionRole(mode)}
      accessibilityState={{ checked, disabled: off }}
      style={cardStyle(density, selected, off)}
    >
      <OptionGround off={off}>
        <Dot selected={selected} mode={mode} off={off} />
        <View style={styles.body}>
          <View style={styles.head}>
            <View style={styles.titles}>
              <Text
                variant="body"
                color={ink}
                lang={option.lang}
                style={[
                  styles.title,
                  { lineHeight: Math.max(TITLE_LINE, scriptFloorFor('body', option.title)) },
                ]}
              >
                {option.title}
              </Text>
              {/* A word in its own neutral pill — never the accent, which selection owns. */}
              {current === undefined ? null : (
                <StatusMark tone="neutral" mark={false} label={current} />
              )}
              {option.marks}
            </View>
            {option.price !== undefined ? (
              <Text variant="body-sm" color={ink} style={styles.price}>
                {option.price}
              </Text>
            ) : null}
          </View>
          {option.description !== undefined ? (
            <Text variant="body-sm" color="secondary" lang={option.lang} style={styles.description}>
              {option.description}
            </Text>
          ) : null}
          {reason === null ? null : <View style={styles.reason}>{reason}</View>}
          {option.content !== undefined ? (
            <View style={styles.content}>{option.content}</View>
          ) : null}
          {option.meta !== undefined ? (
            <Text variant="overline" color="tertiary" style={styles.meta}>
              {option.meta}
            </Text>
          ) : null}
        </View>
        {option.icon !== undefined ? <View style={styles.icon}>{option.icon}</View> : null}
      </OptionGround>
    </Pressable>
  );
}
