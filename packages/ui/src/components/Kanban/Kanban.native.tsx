import { theme } from '@heliogrid/theme';
import { useRef, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useStackedForm } from '../DataTable/use-stacked-form';
import { retryOf } from '../UnavailableNote/UnavailableNote.read';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project —
   and a web half's DOM types then fail to compile under the native lib. Metro resolves both
   spellings to the same module, so this is the same import, correctly typed. */
import { boardStateOf, KANBAN_DEFAULTS } from './Kanban.logic';
import type { KanbanProps } from './Kanban.types';
import { KanbanColumnBlock } from './KanbanColumn.native';
import { KanbanStageStrip } from './KanbanStageStrip.native';
import { BoardStateView } from './KanbanStates.native';
import { useStagePick } from './use-stage-pick';

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
  read,
  words,
  emptyTitle,
  emptyDescription,
  errorTitle,
  errorMessage,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
  columnWidth = KANBAN_DEFAULTS.columnWidth,
  stackBelow = KANBAN_DEFAULTS.stackBelow,
  stackedColumn,
  onStackedColumnChange,
  stageFilterLabel = words.stage,
  onFormChange,
  style,
}: NativeKanbanProps) {
  const onRetry = retryOf(read);
  const [own, setOwn] = useState<number | null>(null);
  const onLayout = (e: LayoutChangeEvent) => setOwn(e.nativeEvent.layout.width);
  /* The board's own frame outlives every state, so focus lands on it once a retry has left. */
  const frame = useRef<View>(null);
  const stacked = useStackedForm(own, stackBelow, onFormChange);
  const { active, setPick } = useStagePick(columns, stackedColumn, onStackedColumnChange);

  const columnProps = { columns, onCardClick, onMove, renderCard, cardPending, words };

  const resolved = boardStateOf(read, columns);
  if (resolved !== 'ready') {
    return (
      <View
        ref={frame}
        onLayout={onLayout}
        style={resolved === 'loading' ? [styles.loading, style] : style}
      >
        <BoardStateView
          state={resolved}
          stacked={stacked}
          loadingLabel={words.loading}
          columnWidth={columnWidth}
          errorTitle={errorTitle}
          errorMessage={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          focusAfter={frame}
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
    return (
      <View ref={frame} onLayout={onLayout} style={[styles.stacked, style]}>
        <KanbanStageStrip
          columns={columns}
          value={active?.key}
          label={stageFilterLabel}
          onChange={setPick}
          words={words}
        />
        {active ? <KanbanColumnBlock {...columnProps} column={active} width="100%" /> : null}
      </View>
    );
  }

  return (
    <View ref={frame} onLayout={onLayout} style={style}>
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
