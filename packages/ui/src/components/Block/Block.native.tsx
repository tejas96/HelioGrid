import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useFormat } from '../MarketProvider';
import type { ProvenanceProps } from '../Provenance';
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
  block: { backgroundColor: theme.colors.surface, minWidth: 0, ...theme.elevation.e2 },
  expressive: {
    gap: theme.spacing['sp-4'],
    padding: theme.spacing['sp-6'],
    borderRadius: theme.radius['r-card-expressive'],
  },
  functional: {
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-functional'],
  },
  flat: { backgroundColor: 'transparent', borderRadius: 0, shadowOpacity: 0, elevation: 0 },
  foot: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  footEnd: { minWidth: 0, flexShrink: 1 },
});

/** The section frame — header, body, footer, and a `state`. The header stays put through them all. */
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
  unavailableTitle = 'Not available',
  unavailableMessage,
  badge,
  count,
  countMax,
  countLabel,
  density = 'expressive',
  flat = false,
  children,
  style,
}: NativeBlockProps) {
  const market = useFormat();
  const prov = renderProvenance(provenance as ProvenanceProps | ReactNode, { size: 12 });
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
        flat ? styles.flat : null,
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
