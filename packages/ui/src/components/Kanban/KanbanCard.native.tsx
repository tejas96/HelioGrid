import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project —
   and a web half's DOM types then fail to compile under the native lib. Metro resolves both
   spellings to the same module, so this is the same import, correctly typed. */
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Card } from '../Card/Card.native';
import { renderPending } from '../PendingAction/PendingAction.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import { kanbanProvenance, moveTargets } from './Kanban.logic';
import type { KanbanCardItem, KanbanColumn, KanbanProps } from './Kanban.types';

interface MoveControlsProps {
  columns: KanbanColumn[];
  column: KanbanColumn;
  item: KanbanCardItem;
  onMove: NonNullable<KanbanProps['onMove']>;
}

/**
 * HTML5 drag has no React Native equivalent AT ALL — and it never fired on touch on the web half
 * either, which is why these two 44×44 buttons exist. On this platform they are the whole of the
 * move affordance, and on the phone form they were already the only route: the destination column
 * is not on screen.
 */
function MoveControls({ columns, column, item, onMove }: MoveControlsProps) {
  const { prev, next } = moveTargets(columns, column);
  const button = (target: KanbanColumn | undefined, label: string, d: string) => (
    <Pressable
      disabled={!target}
      accessibilityLabel={target ? `${label} — move to ${target.label}` : label}
      onPress={() => {
        if (target) onMove(item.id, target.key, column.key);
      }}
      style={styles.moveButton}
    >
      <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
        <Path
          d={d}
          stroke={target ? theme.colors['text-tertiary'] : theme.colors['text-disabled']}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
  return (
    <View style={styles.move}>
      {button(prev, 'Move back a stage', 'm15 18-6-6 6-6')}
      {button(next, 'Move on a stage', 'm9 18 6-6-6-6')}
    </View>
  );
}

interface KanbanCardBodyProps {
  item: KanbanCardItem;
  column: KanbanColumn;
  onCardClick?: KanbanProps['onCardClick'];
}

/**
 * The card the board draws when the caller supplies no `renderCard`: title, the meta/value/owner
 * line, and the figure's tier on its own line under the figure it qualifies.
 */
function KanbanCardBody({ item, column, onCardClick }: KanbanCardBodyProps) {
  const prov = renderProvenance(kanbanProvenance(item), { size: 12 });
  return (
    <Card
      density="functional"
      interactive={Boolean(onCardClick)}
      onClick={onCardClick ? () => onCardClick(item, column) : undefined}
      style={styles.card}
    >
      <Text variant="body-sm" style={styles.cardTitle}>
        {item.title}
      </Text>
      <View style={styles.cardLine}>
        <Text variant="caption" color="secondary">
          {item.meta}
        </Text>
        {item.value ? (
          <Text variant="mono" style={styles.cardValue}>
            {item.value}
          </Text>
        ) : null}
        {item.owner ? <Avatar name={item.owner} size={24} /> : null}
      </View>
      {prov ? <View style={styles.cardProvenance}>{prov}</View> : null}
    </Card>
  );
}

export interface KanbanCardProps {
  item: KanbanCardItem;
  column: KanbanColumn;
  columns: KanbanColumn[];
  onCardClick?: KanbanProps['onCardClick'];
  onMove?: KanbanProps['onMove'];
  renderCard?: KanbanProps['renderCard'];
  cardPending?: KanbanProps['cardPending'];
}

/**
 * One card: the caller's own body or the board's, whether its move is in flight, and the move
 * buttons under it. The move waits VISIBLY — the card is not dimmed, disabled or covered.
 */
export function KanbanCard({
  item,
  column,
  columns,
  onCardClick,
  onMove,
  renderCard,
  cardPending,
}: KanbanCardProps) {
  const pending = cardPending ? cardPending(item, column) : null;
  /* `SCR-M08-01`'s move-waiting-server is carried by the visible PendingAction line AND by the
     card's own state, never by the line alone — RN's partner for the web half's `aria-busy` is
     `accessibilityState.busy` on the same node. `returned` is not busy: the move came back undone
     and the line is now a reason, not a wait. Set only while busy, as `aria-busy` is. */
  const busy = pending !== null && pending.state !== 'returned';
  /* AND THE STATE NEEDS A NODE TO SIT ON. A bare `View` is not an accessibility element, so this
     state was announced nowhere and the line WAS carrying it alone — the trap `DataTable`'s
     `SelectionBar` documents. `role` makes the wrapper one without `accessible`, which would fold
     the card body and the two 44dp move buttons into a single element; `group` is the plain
     container the web half's `<div class="hg-kanban-card">` already is. */
  const card: ReactNode = renderCard ? (
    renderCard(item, column)
  ) : (
    <KanbanCardBody item={item} column={column} onCardClick={onCardClick} />
  );
  return (
    <View role="group" accessibilityState={busy ? { busy: true } : undefined}>
      {card}
      {pending ? <View style={styles.cardPending}>{renderPending(pending)}</View> : null}
      {onMove ? (
        <MoveControls columns={columns} column={column} item={item} onMove={onMove} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing['sp-3'] },
  cardTitle: { fontWeight: '700', letterSpacing: -0.13, marginBottom: 6 },
  cardLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  cardValue: { fontWeight: '700', fontSize: theme.type.roles.caption.fontSize },
  cardProvenance: { marginTop: 6 },
  cardPending: { marginTop: 6, marginHorizontal: theme.spacing['sp-1'] },
  move: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing['sp-0-5'],
    marginTop: -6,
    marginHorizontal: theme.spacing['sp-0-5'],
  },
  moveButton: { width: 44, height: 44, borderRadius: theme.radius['r-pill'] },
});
