import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Rising } from '../../primitives/rising.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Badge } from '../Chip/Chip.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { IconButton } from '../IconButton/IconButton.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { CashCard } from './CashCard.native';
import { NeedsYouHero } from './NeedsYouHero.native';
import type { DashboardPartProps } from './OwnerDashboard.logic';
import type { OwnerDashboardProps } from './OwnerDashboard.types';
import { PipelineCard } from './PipelineCard.native';
import { WinLossCard } from './WinLossCard.native';
import { ForecastTile, WonCard } from './WonCard.native';

/** The room at which the cards stand side by side — the web's `@container (min-width: 720px)`. */
const SIDE_BY_SIDE = 720;

/**
 * The owner dashboard on the phone (`SCR-M13-01`, sample B · Focus): what needs you now as the
 * hero, then cash, won against the target beside the forecast's honest gap, the pipeline by stage
 * and why deals were lost. The screen's scroll view holds it.
 */
export function OwnerDashboard(props: OwnerDashboardProps) {
  const { read, words } = props;
  const [room, setRoom] = useState(0);
  if (read.kind === 'loading') {
    return <LoadingBars bars={['panel', 'panel', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return (
      <FailedRead
        title={words.failedTitle}
        message={words.failedMessage}
        retryLabel={words.retry}
        onRetry={read.retry}
        focusAfter={props.focusAfter}
      />
    );
  }
  const part: DashboardPartProps = { ...props, view: read.value };
  const wide = room >= SIDE_BY_SIDE;
  return (
    <View
      style={styles.page}
      onLayout={(event: LayoutChangeEvent) => setRoom(event.nativeEvent.layout.width)}
    >
      <View style={styles.top}>
        {read.value.scope === 'team' ? (
          <Badge tone="accent" density="functional">
            {words.teamScope}
          </Badge>
        ) : null}
        <View style={styles.export}>
          <IconButton label={words.export} onClick={props.onExport}>
            <ShellGlyph name="download" size="md" tone="primary" />
          </IconButton>
        </View>
      </View>
      <Rising order={0}>
        <NeedsYouHero {...part} />
      </Rising>
      <View style={wide ? styles.row : styles.column}>
        <View style={wide ? styles.wideCash : undefined}>
          <Rising order={1}>
            <CashCard {...part} />
          </Rising>
        </View>
        <View style={wide ? styles.sideWide : styles.side}>
          <View style={styles.sideCell}>
            <Rising order={2}>
              <WonCard {...part} />
            </Rising>
          </View>
          <View style={styles.sideCell}>
            <ForecastTile words={words} />
          </View>
        </View>
      </View>
      <View style={wide ? styles.row : styles.column}>
        <View style={wide ? styles.widePipeline : undefined}>
          <Rising order={3}>
            <PipelineCard {...part} />
          </Rising>
        </View>
        <View style={wide ? styles.wideWinLoss : undefined}>
          <Rising order={4}>
            <WinLossCard {...part} />
          </Rising>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-3'] },
  top: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  export: { marginStart: 'auto' },
  column: { gap: theme.spacing['sp-3'] },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-4'] },
  wideCash: { flex: 1.3, minWidth: 0 },
  side: { flexDirection: 'row', gap: theme.spacing['sp-3'] },
  sideWide: { flex: 1, minWidth: 0, gap: theme.spacing['sp-4'] },
  sideCell: { flex: 1, minWidth: 0 },
  widePipeline: { flex: 1.4, minWidth: 0 },
  wideWinLoss: { flex: 1, minWidth: 0 },
});
