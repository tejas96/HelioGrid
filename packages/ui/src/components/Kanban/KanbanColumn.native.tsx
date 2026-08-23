import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project —
   and a web half's DOM types then fail to compile under the native lib. Metro resolves both
   spellings to the same module, so this is the same import, correctly typed. */
import { Text } from '../../primitives/Text/Text.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import { columnCountLabel } from './Kanban.logic';
import type { KanbanColumn, KanbanProps } from './Kanban.types';
import { KanbanCard } from './KanbanCard.native';

export interface KanbanColumnBlockProps {
  column: KanbanColumn;
  columns: KanbanColumn[];
  width: number | '100%';
  onCardClick?: KanbanProps['onCardClick'];
  onMove?: KanbanProps['onMove'];
  renderCard?: KanbanProps['renderCard'];
  cardPending?: KanbanProps['cardPending'];
}

/** One sunken column: a StatusChip header, its count (or n/limit), and its floating cards. */
export function KanbanColumnBlock({
  column,
  columns,
  width,
  onCardClick,
  onMove,
  renderCard,
  cardPending,
}: KanbanColumnBlockProps) {
  const items = column.items ?? [];
  const overLimit = column.limit !== undefined && items.length > column.limit;
  return (
    <View style={[styles.column, { width }]}>
      <View style={styles.head}>
        {column.status ? (
          <StatusChip status={column.status} density="functional" label={column.label} />
        ) : (
          <Text variant="body-sm" style={styles.columnName}>
            {column.label}
          </Text>
        )}
        {/* text-tertiary measures 4.48 on canvas-sunken, under the floor, and the phone form makes
            this column the primary reading of that pair — so words here take text-secondary. */}
        <Text variant="caption" color={overLimit ? 'warning' : 'secondary'}>
          {columnCountLabel(items.length, column.limit)}
        </Text>
      </View>
      <View style={styles.body}>
        {items.length === 0 ? (
          <Text variant="caption" color="secondary" align="center" style={styles.empty}>
            {column.emptyLabel || 'Nothing here'}
          </Text>
        ) : (
          items.map((it) => (
            <KanbanCard
              key={it.id}
              item={it}
              column={column}
              columns={columns}
              onCardClick={onCardClick}
              onMove={onMove}
              renderCard={renderCard}
              cardPending={cardPending}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flexShrink: 0,
    backgroundColor: theme.colors['canvas-sunken'],
    borderRadius: theme.radius['r-card-functional'],
    padding: 10,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
    paddingTop: theme.spacing['sp-1'],
    paddingHorizontal: 6,
    paddingBottom: 10,
  },
  columnName: { fontWeight: '500' },
  body: { gap: theme.spacing['sp-2'], minHeight: 56 },
  empty: { paddingVertical: theme.spacing['sp-4'], paddingHorizontal: theme.spacing['sp-2'] },
});
