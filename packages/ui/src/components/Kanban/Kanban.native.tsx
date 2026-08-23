import { theme } from '@heliogrid/theme';
import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project —
   and a web half's DOM types then fail to compile under the native lib. Metro resolves both
   spellings to the same module, so this is the same import, correctly typed. */
import { activeColumnKey, kanbanTotal, resolveBoardState } from './Kanban.logic';
import type { KanbanProps } from './Kanban.types';
import { KanbanColumnBlock } from './KanbanColumn.native';
import { KanbanStageStrip } from './KanbanStageStrip.native';
import { BoardStateView } from './KanbanStates.native';

interface NativeKanbanProps extends KanbanProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Pipeline board — sunken columns, floating functional cards, StatusChip headers.
 *
 * **Two forms, and the component owns the switch on its own width.** The web half measures with a
 * private `ResizeObserver`; RN's partner is `onLayout` on the same element, and the answer is
 * published through the same `onFormChange` callback. Below `stackBelow` the board is ONE COLUMN
 * WITH A STAGE FILTER (`M08-10` P0), not nine columns stacked.
 *
 * HTML5 drag has no native equivalent — and never fired on touch anyway — so the always-visible
 * 44dp move buttons on each card are the whole of the move affordance here.
 */
export function Kanban({
  columns = [],
  onCardClick,
  onMove,
  renderCard,
  cardPending,
  state = 'ready',
  emptyTitle = 'No jobs in this pipeline',
  emptyDescription,
  errorTitle = "Couldn't load the board",
  errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  unavailableTitle = 'No pipeline here',
  unavailableMessage,
  columnWidth = 260,
  stackBelow = 720,
  stackedColumn,
  onStackedColumnChange,
  stageFilterLabel = 'Stage',
  onFormChange,
  style,
}: NativeKanbanProps) {
  const [own, setOwn] = useState<number | null>(null);
  const [pickInner, setPickInner] = useState<string | null>(null);
  const onLayout = (e: LayoutChangeEvent) => setOwn(e.nativeEvent.layout.width);

  const stacked = own !== null && own < stackBelow;

  /* The breakpoint is the component's, so the answer is the component's to publish. The callback
     rides in a ref so a caller's inline arrow cannot turn "when the answer changed" into "every
     render". */
  const formCb = useRef(onFormChange);
  useEffect(() => {
    formCb.current = onFormChange;
  }, [onFormChange]);
  useEffect(() => {
    if (own !== null) formCb.current?.({ stacked, width: own });
  }, [stacked, own]);

  const picked = stackedColumn !== undefined ? stackedColumn : pickInner;
  const activeKey = activeColumnKey(columns, picked);
  const setPick = (k: string) => {
    if (stackedColumn === undefined) setPickInner(k);
    onStackedColumnChange?.(k);
  };

  const columnProps = { columns, onCardClick, onMove, renderCard, cardPending };

  const resolved = resolveBoardState(state, kanbanTotal(columns));
  if (resolved !== 'ready') {
    return (
      <View onLayout={onLayout} style={resolved === 'loading' ? [styles.loading, style] : style}>
        <BoardStateView
          state={resolved}
          stacked={stacked}
          columnWidth={columnWidth}
          errorTitle={errorTitle}
          errorMessage={errorMessage}
          onRetry={onRetry}
          unavailableTitle={unavailableTitle}
          unavailableMessage={unavailableMessage}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </View>
    );
  }

  /* THE PHONE FORM: one column, chosen by a stage strip that carries each stage's count. */
  if (stacked) {
    const active = columns.find((c) => c.key === activeKey) ?? columns[0];
    return (
      <View onLayout={onLayout} style={[styles.stacked, style]}>
        <KanbanStageStrip
          columns={columns}
          value={active?.key}
          label={stageFilterLabel}
          onChange={setPick}
        />
        {active ? <KanbanColumnBlock {...columnProps} column={active} width="100%" /> : null}
      </View>
    );
  }

  return (
    <View onLayout={onLayout} style={style}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.board}>
          {columns.map((c) => (
            <KanbanColumnBlock {...columnProps} key={c.key} column={c} width={columnWidth} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  board: { flexDirection: 'row', gap: theme.spacing['sp-3'], paddingBottom: theme.spacing['sp-2'] },
  loading: { flexDirection: 'row', gap: theme.spacing['sp-3'] },
  stacked: { flexDirection: 'column', gap: 10 },
});
