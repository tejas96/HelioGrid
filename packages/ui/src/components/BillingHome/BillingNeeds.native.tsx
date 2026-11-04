import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { TextColor } from '../../primitives/Text/Text.types';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { BillingValueText, workingParts } from '../BillingStrip/BillingValue.native';
import { Block } from '../Block/Block.native';
import { Button } from '../Button/Button.native';
import { Derivation } from '../Derivation/Derivation.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { ListRow } from '../ListRow/ListRow.native';
import { ScopeNote } from '../ScopeNote/ScopeNote.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import type {
  BillingBodyActing,
  BillingChip,
  BillingHomeProps,
  BillingNeedRow,
  BillingNeedsView,
} from './BillingHome.types';

/** A state's word as a chip: the word and its tone's mark (`F7-12`). */
export function BillingStatusChip({ chip }: { chip: BillingChip }) {
  return <StatusChip label={chip.word} tone={chip.tone} density="expressive" />;
}

/** The line under a row takes its chip's ink; a row with no chip has no line. */
const LINE_INK: Partial<Record<BillingChip['tone'], TextColor>> = {
  danger: 'danger',
  info: 'info',
};

/** SCR-M12-04's row: the name, its chip as marks, the figure in mono on the right edge, its line. */
function NeedRow({ row }: { row: BillingNeedRow }) {
  const ink = row.chip === null ? 'warning' : (LINE_INK[row.chip.tone] ?? 'warning');
  return (
    <ListRow
      title={row.title}
      density="expressive"
      style={styles.needRow}
      {...(row.chip === null ? {} : { marks: <BillingStatusChip chip={row.chip} /> })}
      {...(row.figure === null
        ? {}
        : { trailing: <BillingValueText value={row.figure} variant="body" /> })}
      {...(row.line === null
        ? {}
        : {
            subtitle: (
              <Text variant="body-sm" color={ink} style={styles.needLine}>
                {row.line}
              </Text>
            ),
          })}
    />
  );
}

/**
 * The first region (decision 1): its rows, the data kept on a dead state, the amount's working,
 * then its ONE act with the line under it — or, for a person who is not the Owner, whose act it is.
 */
export function BillingNeeds({
  needs,
  words,
  pending,
  needFailure,
  onAct,
}: {
  needs: BillingNeedsView;
  words: BillingHomeProps['words'];
  pending: BillingBodyActing;
  needFailure: TranslatedText | null;
  onAct: () => void;
}) {
  return (
    <Block
      density="expressive"
      title={needs.title}
      {...(needs.badge === null ? {} : { badge: <BillingStatusChip chip={needs.badge} /> })}
    >
      <View style={styles.needs}>
        {needs.rows.map((row) => (
          <NeedRow key={row.key} row={row} />
        ))}
        {needs.dataKept === null ? null : (
          <FactRows label={needs.dataKept.label} density="expressive" form="lead">
            <FactRow
              mark={<ShellGlyph name="shield" size="sm" tone="success" />}
              label={needs.dataKept.label}
              value={needs.dataKept.value}
            />
          </FactRows>
        )}
        {needs.working === null ? null : (
          <Derivation
            summary={words.howWorkedOut}
            label={needs.working.label}
            parts={workingParts(needs.working.parts)}
            kindWords={words.derivationKinds}
          />
        )}
        {needs.act === null ? null : (
          <View style={styles.act}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={pending === 'need'}
              disabled={pending !== null && pending !== 'need'}
              onClick={onAct}
            >
              {needs.act.label}
            </Button>
            {needs.act.line === null ? null : (
              <Text variant="caption" color="secondary" align="center">
                {needs.act.line}
              </Text>
            )}
            {needFailure === null ? null : (
              <Text variant="caption" color="danger" align="center" live>
                {needFailure}
              </Text>
            )}
          </View>
        )}
        {needs.scope === null ? null : (
          <ScopeNote title={needs.scope.title} variant="line" size={13} />
        )}
      </View>
    </Block>
  );
}

const styles = StyleSheet.create({
  needs: { gap: theme.spacing['sp-4'] },
  /** The row sits on the region's own edges, so its figure ends on the region's right edge. */
  needRow: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 0,
    alignItems: 'flex-start',
  },
  needLine: { fontWeight: '500' },
  act: {
    gap: theme.spacing['sp-2'],
    backgroundColor: theme.colors['surface-form'],
    borderRadius: theme.radius['r-lg'],
    padding: theme.spacing['sp-3'],
  },
});
