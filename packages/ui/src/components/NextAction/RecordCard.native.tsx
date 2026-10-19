import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file — see NextAction.native.tsx. */
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { isPendingInFlight } from '../ListRow/ListRow.pending';
import { renderPending } from '../PendingAction/PendingAction.native';
import { TileActions } from '../TileActions/TileActions.native';
import type { RecordCardProps } from './NextAction.types';
import { RecordFace, RecordSlots } from './RecordCardSlots.native';

interface NativeRecordCardProps extends RecordCardProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The name, alone as it always was; with a `badge` beside it on one wrapping line, or a `line`
 * under it, the two sit in a name block. Nothing is drawn around a slot that is absent.
 */
function nameBlock(name: string, badge: ReactNode, line: ReactNode): ReactNode {
  const named = (
    <Text variant="body" style={styles.name}>
      {name}
    </Text>
  );
  if (!badge && !line) return named;
  return (
    <View style={styles.who}>
      {badge ? (
        <View style={styles.title}>
          {named}
          {badge}
        </View>
      ) : (
        named
      )}
      {line ? (
        <Text variant="body-sm" color="secondary">
          {line}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * The phone form of a table row: a face, name + chip, mono meta, next action.
 *
 * Platform mapping: the web half's absolutely-positioned sibling button exists because an HTML
 * control may not nest inside a `role="button"`. React Native has no such rule — a nested
 * Pressable in `action` swallows its own touch — so the card IS the Pressable here, and a control
 * in a slot still fires only itself; a tap on `detail` reaches the card. The web half's
 * hover/focus ring has no touch equivalent; the Pressable primitive's pressed state is the
 * feedback.
 *
 * `inline` indents every slot beside the face; `stacked` makes the face and the name a head row
 * and gives every slot the full width under it, spaced by the card's gap (`SCR-M01-12`).
 */
export function RecordCard({
  name,
  initials,
  avatarTone = theme.colors.accent,
  avatar,
  badge,
  line,
  chip,
  marks,
  meta = [],
  detail,
  action,
  onClick,
  ariaLabel,
  provenance,
  pending,
  muted = false,
  density = 'expressive',
  layout = 'inline',
  actions,
  style,
}: NativeRecordCardProps) {
  const pend = renderPending(pending);
  const stacked = layout === 'stacked';
  const face = <RecordFace avatar={avatar} initials={initials} name={name} tone={avatarTone} />;
  const head = (
    <View style={styles.head}>
      {nameBlock(name, badge, line)}
      {chip}
    </View>
  );
  const slots = (
    <RecordSlots
      marks={marks}
      meta={meta}
      provenance={provenance}
      detail={detail}
      pending={pend}
      action={action}
      stacked={stacked}
    />
  );

  /* The card is a tile, so a control inside it turns white. */
  const body: ReactNode = (
    <GroundProvider ground="tile">
      {stacked ? (
        <>
          <View style={styles.lead}>
            {face}
            <View style={styles.leadHead}>{head}</View>
          </View>
          {slots}
        </>
      ) : (
        <>
          {face}
          <View style={styles.body}>
            {head}
            {slots}
          </View>
        </>
      )}
      {actions ? (
        <View style={stacked ? null : styles.actionsInline}>
          <TileActions>{actions}</TileActions>
        </View>
      ) : null}
    </GroundProvider>
  );

  const frame = [
    tileSurface,
    styles.card,
    stacked ? styles.stacked : null,
    density === 'functional' ? styles.functional : styles.expressive,
    muted ? styles.muted : null,
    style,
  ];
  if (!onClick) return <View style={frame}>{body}</View>;
  return (
    /* AN ACT IN FLIGHT IS SAID, NOT ONLY DRAWN (F7-12). The web half puts `aria-busy` on the card;
       here the card IS the target, so `busy` rides the primitive's `accessibilityState` and is
       announced beside the record's name. A card with no `onClick` has no element of its own to
       carry it — a `View` with neither `accessible` nor a role is not an accessibility element, so
       the state would be present in the source and announced nowhere — and there the `PendingAction`
       line is the whole answer: it is a live region and it names the act in words. */
    <Pressable
      onPress={onClick}
      accessibilityLabel={ariaLabel || name}
      accessibilityState={{ busy: isPendingInFlight(pending) }}
      style={frame}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /* The tile's look is `tileSurface` (`F7-49`), spread first in the frame. Inline, the body's
     basis is 0, so only the full-width `actions` foot ever wraps to a row of its own. */
  card: {
    position: 'relative',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    minHeight: 44,
  },
  stacked: { flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch' },
  expressive: {
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-expressive'],
  },
  functional: {
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-card-functional'],
  },
  /* `muted` is PARKED, and it is never the pending treatment. */
  muted: { opacity: 0.6 },
  body: { flex: 1, minWidth: 0 },
  lead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minWidth: 0,
  },
  leadHead: { flex: 1, minWidth: 0 },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  name: { fontWeight: '700', letterSpacing: -0.15 },
  /* The name block: the name and its badge on one wrapping line, the line 2 under it. */
  who: { flexShrink: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  title: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  /* The tile's foot, full width under everything. */
  actionsInline: { flexBasis: '100%', minWidth: 0 },
});
