import type { UsageEventMeter } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { tileSurface } from '../../primitives/Ground/Ground.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable/Pressable.types';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { figure, plain } from '../BillingHome/BillingHome.values';
import { BillingStatusChip } from '../BillingHome/BillingNeeds.native';
import { BillingValueText } from '../BillingHome/BillingValue.native';
import { Block } from '../Block/Block.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { IconButton } from '../IconButton/IconButton.native';
import { ListRow } from '../ListRow/ListRow.native';
import { Provenance } from '../Provenance/Provenance.native';
import { UsageMeter } from '../UsageMeter/UsageMeter.native';
import type {
  UsageFactView,
  UsagePageProps,
  UsagePageView,
  UsageRegionView,
  UsageRowView,
} from './UsagePage.types';

/** Where each ledger chevron sits, so a closed sheet hands the screen reader back to it. */
export type UsageOpeners = Record<UsageEventMeter, RefObject<View | null>>;

interface RegionProps {
  readonly region: UsageRegionView;
  /** The total row this card ends in; only `Included each month` carries one. */
  readonly extra: UsagePageView['extra'];
  readonly words: UsagePageProps['words'];
  readonly plans: UsagePageView['plans'];
  readonly openers: UsageOpeners;
  readonly onLedger: (meter: UsageEventMeter) => void;
  readonly onPlans: () => void;
}

/**
 * A card at 375 (decision 1): its rows, each a meter, its facts and — under a signal meter — the
 * way to a bigger plan, with the ledger's ONE named chevron on the row's right (decisions 6, 13);
 * the card's foot holds the two quiet source lines once the figures are in (decision 5).
 */
export function UsageRegion({
  region,
  extra,
  words,
  plans,
  openers,
  onLedger,
  onPlans,
}: RegionProps) {
  return (
    <Block
      density="expressive"
      title={region.title}
      {...(region.sources === null
        ? {}
        : {
            footer: (
              <View style={styles.sources}>
                {region.sources.map((source) => (
                  <Provenance key={source} source={source} size={12} />
                ))}
              </View>
            ),
          })}
    >
      <View style={styles.rows}>
        {region.rows.map((row) => (
          <UsageRow
            key={row.key}
            row={row}
            words={words}
            plans={plans}
            openers={openers}
            onLedger={onLedger}
            onPlans={onPlans}
          />
        ))}
        {/* ONE total row ends the card, its one line saying when it bills (decision 4). */}
        {extra === null ? null : (
          <FactRows label={words.extraCharges} density="expressive" form="pair">
            <FactRow
              label={words.extraCharges}
              value={<BillingValueText value={figure(extra.total)} />}
            />
            <FactRow
              label={words.billsOn}
              value={<BillingValueText value={plain(extra.billsOn)} />}
            />
          </FactRows>
        )}
      </View>
    </Block>
  );
}

/** The board's `1fr 44px` grid: the row's parts on the left, its chevron alone on the right. */
function UsageRow({
  row,
  words,
  plans,
  openers,
  onLedger,
  onPlans,
}: Omit<RegionProps, 'region' | 'extra'> & { readonly row: UsageRowView }) {
  return (
    <View style={styles.row}>
      <View style={styles.parts}>
        {row.meter === null ? null : (
          <UsageMeter
            label={row.label}
            words={words.usageMeter}
            value={row.meter.value}
            limit={row.meter.limit}
            state={row.meter.state}
            statusLine={row.meter.statusLine}
            defaultNotes={false}
            density="expressive"
            {...(row.meter.unit === null ? {} : { unit: row.meter.unit })}
            {...(row.meter.period === null ? {} : { period: row.meter.period })}
            {...(row.meter.graceDaysLeft === null
              ? {}
              : { graceDaysLeft: row.meter.graceDaysLeft })}
            {...(row.meter.note === null ? {} : { note: row.meter.note })}
            {...(row.meter.noLimitNote === null ? {} : { noLimitNote: row.meter.noLimitNote })}
          />
        )}
        {row.facts.length === 0 ? null : (
          <FactRows label={row.label} density="expressive" form="pair">
            {row.facts.map((fact) => (
              <FactRow key={fact.key} label={fact.label} value={<FactValue fact={fact} />} />
            ))}
          </FactRows>
        )}
        {row.plans && plans !== null ? <UsagePlansRow plans={plans} onPlans={onPlans} /> : null}
      </View>
      <LedgerCell row={row} words={words} openers={openers} onLedger={onLedger} />
    </View>
  );
}

/**
 * The row's 44 column: its ONE named chevron, or empty — every row keeps the column, so every
 * figure ends on the card's one edge (the board's 1fr / 44px grid).
 */
function LedgerCell({
  row,
  words,
  openers,
  onLedger,
}: Pick<RegionProps, 'words' | 'openers' | 'onLedger'> & { readonly row: UsageRowView }) {
  const ledger = row.ledger;
  return (
    <View ref={ledger === null ? undefined : openers[ledger]} style={styles.chevron}>
      {ledger === null ? null : (
        <IconButton
          label={words.eventsOf(row.label)}
          variant="ghost"
          onClick={() => onLedger(ledger)}
        >
          <ShellGlyph name="chevron-right" size="md" tone="primary" />
        </IconButton>
      )}
    </View>
  );
}

/** A fact's figure on the card's right edge, mono where it is a figure, or its chip. */
function FactValue({ fact }: { fact: UsageFactView }) {
  if (fact.chip !== null) return <BillingStatusChip chip={fact.chip} />;
  if (fact.value === null) return null;
  return <BillingValueText value={fact.value} />;
}

/** `Bigger plans` / `Pick a plan` (decisions 8, 11, 12): a tile with its layers and its chevron. */
export function UsagePlansRow({
  plans,
  onPlans,
}: {
  plans: NonNullable<UsagePageView['plans']>;
  onPlans: () => void;
}) {
  return (
    <ListRow
      icon={<ShellGlyph name="layers" size="md" tone="secondary" />}
      iconColor={theme.colors['text-secondary']}
      title={plans.title}
      {...(plans.subtitle === null ? {} : { subtitle: plans.subtitle })}
      trailing={<ShellGlyph name="chevron-right" size="md" tone="secondary" />}
      density="expressive"
      style={styles.plans}
      onClick={onPlans}
    />
  );
}

const styles = StyleSheet.create({
  rows: { gap: theme.spacing['sp-6'] },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  parts: { flex: 1, minWidth: 0, gap: theme.spacing['sp-3'] },
  /** The chevron's 44 column, lifted onto the meter's label line as the board sets it. */
  chevron: {
    width: MIN_TOUCH_TARGET,
    flexShrink: 0,
    alignItems: 'center',
    marginTop: -theme.spacing['sp-3'],
    marginRight: -theme.spacing['sp-2'],
  },
  sources: { gap: theme.spacing['sp-0-5'] },
  plans: { ...tileSurface, borderRadius: theme.radius['r-tile'] },
});
