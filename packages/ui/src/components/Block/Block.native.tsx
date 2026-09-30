import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useFormat } from '../MarketProvider';
import { renderProvenance } from '../Provenance';
import type { BlockProps } from './Block.types';
import { blockCount } from './Block.types';
import { BlockGrid } from './BlockGrid.native';
import { BlockHeader } from './BlockHeader.native';
import { BlockBody } from './BlockMessage.native';

interface NativeBlockProps extends BlockProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  block: { minWidth: 0 },
  expressive: {
    gap: theme.spacing['sp-4'],
    padding: theme.spacing['sp-6'],
  },
  functional: {
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-4'],
  },
  foot: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  footEnd: { minWidth: 0, flexShrink: 1 },
});

/**
 * The section — header, body, footer, and a `state`, a heading on the page (`F7-49`): no fill, no
 * shadow, and no ground of its own, so its controls read whatever holds it. The header stays put
 * through them all.
 */
export function Block({
  overline,
  title,
  meta,
  action,
  footer,
  provenance,
  state = 'ready',
  emptyMessage = 'Nothing here yet.',
  emptyTitle,
  emptyAction,
  errorTitle = "Couldn't load this",
  errorMessage = 'Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  retryLabel,
  unavailableTitle = 'Not available',
  unavailableMessage,
  badge,
  count,
  countMax,
  countLabel,
  density = 'expressive',
  children,
  style,
}: NativeBlockProps) {
  const market = useFormat();
  const prov = renderProvenance(provenance, { size: 12 });
  const shownCount = blockCount(count, countMax, (n) =>
    market.number(n, { maximumFractionDigits: 0 }),
  );

  return (
    /* The web half is `<section aria-label={title}>` — a landmark RN has no counterpart for. The
       title is not lost by dropping the label: `BlockHeader` renders it as an
       `accessibilityRole="header"` Text, which is the node a screen reader actually lands on, and
       it draws whenever `title` is defined. A role here would name the frame a second time, and
       `accessible` would swallow the header, the body and every action inside it. */
    <View
      style={[
        styles.block,
        density === 'functional' ? styles.functional : styles.expressive,
        style,
      ]}
    >
      <BlockHeader
        overline={overline}
        title={title}
        meta={meta}
        action={action}
        badge={badge}
        countLabel={countLabel}
        density={density}
        shownCount={shownCount}
      />

      <BlockBody
        title={title}
        state={state}
        emptyMessage={emptyMessage}
        emptyTitle={emptyTitle}
        emptyAction={emptyAction}
        errorTitle={errorTitle}
        errorMessage={errorMessage}
        onRetry={onRetry}
        retryLabel={retryLabel}
        unavailableTitle={unavailableTitle}
        unavailableMessage={unavailableMessage}
      >
        {children}
      </BlockBody>

      {prov !== null || footer !== undefined ? (
        <View style={styles.foot}>
          {prov}
          {footer !== undefined ? <View style={styles.footEnd}>{footer}</View> : null}
        </View>
      ) : null}
    </View>
  );
}

/* `Block.Grid` — the seam reachable from the component the docs name it on. */
Block.Grid = BlockGrid;
