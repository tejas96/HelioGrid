import type { UsageEventMeter } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable/Pressable.types';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { figure, plain } from '../BillingHome/BillingHome.values';
import { BillingStatusChip } from '../BillingHome/BillingNeeds.native';
import { BillingValueText } from '../BillingStrip/BillingValue.native';
import { Block } from '../Block/Block.native';
import { Button } from '../Button/Button.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { IconButton } from '../IconButton/IconButton.native';
import { ListRow } from '../ListRow/ListRow.native';
import { Provenance } from '../Provenance/Provenance.native';
import { UsageMeter } from '../UsageMeter/UsageMeter.native';
import { UsageMeterHead } from '../UsageMeter/UsageMeterHead.native';
import { figureText, USAGE_ROW_GLYPH } from './UsagePage.glyphs';
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
 * A region as A's tiles (decision 1): one small glass tile per row — its meter or its one figure,
 * its facts, the way to a bigger plan under a signal meter, and the ledger's ONE named chevron in
 * its corner (decisions 6, 13) — two to a row; the extra charges' total closes it across the row
 * (decision 4), and its foot holds the two quiet source lines once the figures are in (decision 5).
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
      style={styles.flushRegion}
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
      <View style={styles.tiles}>
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
        {extra === null ? null : (
          <View style={[styles.tile, styles.wholeRow]}>
            <GroundProvider ground="tile">
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
            </GroundProvider>
          </View>
        )}
      </View>
    </Block>
  );
}

/** One row's tile: its meter, or its one figure where it has none, then its other facts. */
function UsageRow({
  row,
  words,
  plans,
  openers,
  onLedger,
  onPlans,
}: Omit<RegionProps, 'region' | 'extra'> & { readonly row: UsageRowView }) {
  /* A row with no meter shows its first fact as the tile's figure; the rest follow as rows. */
  const rest = row.meter === null ? row.facts.slice(1) : row.facts;
  return (
    <View style={styles.tile}>
      <GroundProvider ground="tile">
        <View style={[styles.parts, row.ledger === null ? undefined : styles.clearOpener]}>
          <RowLead row={row} words={words} />
          {rest.length === 0 ? null : (
            <FactRows label={row.label} density="expressive" form="pair">
              {rest.map((fact) => (
                <FactRow key={fact.key} label={fact.label} value={<FactValue fact={fact} />} />
              ))}
            </FactRows>
          )}
          {row.plans && plans !== null ? (
            <View style={styles.start}>
              <Button
                variant="secondary"
                size="sm"
                icon={<ShellGlyph name="layers" size="sm" />}
                onClick={onPlans}
              >
                {plans.title}
              </Button>
            </View>
          ) : null}
        </View>
        <LedgerCell row={row} words={words} openers={openers} onLedger={onLedger} />
      </GroundProvider>
    </View>
  );
}

/** The tile's lead: its meter, or — a row with none, `Biggest design` — its first fact as a figure. */
function RowLead({ row, words }: { row: UsageRowView; words: RegionProps['words'] }) {
  const { meter } = row;
  const glyph = USAGE_ROW_GLYPH[row.key];
  if (meter === null) {
    const lead = row.facts[0];
    if (lead === undefined || lead.value === null) return null;
    return (
      <UsageMeterHead
        label={row.label}
        form="tile"
        glyph={glyph}
        figure={figureText(lead.value)}
        after={null}
      />
    );
  }
  return (
    <UsageMeter
      label={row.label}
      words={words.usageMeter}
      value={meter.value}
      limit={meter.limit}
      state={meter.state}
      statusLine={meter.statusLine}
      defaultNotes={false}
      density="expressive"
      form="tile"
      glyph={glyph}
      {...(meter.unit === null ? {} : { unit: meter.unit })}
      {...(meter.period === null ? {} : { period: meter.period })}
      {...(meter.graceDaysLeft === null ? {} : { graceDaysLeft: meter.graceDaysLeft })}
      {...(meter.note === null ? {} : { note: meter.note })}
      {...(meter.noLimitNote === null ? {} : { noLimitNote: meter.noLimitNote })}
    />
  );
}

/** The tile's ONE named chevron in its corner, where the row has events to open. */
function LedgerCell({
  row,
  words,
  openers,
  onLedger,
}: Pick<RegionProps, 'words' | 'openers' | 'onLedger'> & { readonly row: UsageRowView }) {
  const ledger = row.ledger;
  if (ledger === null) return null;
  return (
    <View ref={openers[ledger]} style={styles.chevron}>
      <IconButton
        label={words.eventsOf(row.label)}
        variant="ghost"
        onClick={() => onLedger(ledger)}
      >
        <ShellGlyph name="chevron-right" size="md" tone="primary" />
      </IconButton>
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
      iconColor={colors['text-secondary']}
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
  /* A region under the hero stands on the page's own edges, as the web's does. */
  flushRegion: { paddingHorizontal: 0, paddingBottom: 0, paddingTop: theme.spacing['sp-2'] },
  /* Two tiles to a row on a phone (a 144pt floor each), as the web's grid sets them. */
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.layout['tile-gap'] },
  tile: {
    ...tileSurface,
    flexGrow: 1,
    flexBasis: theme.spacing['sp-24'] + theme.spacing['sp-12'],
    padding: theme.layout['tile-pad'],
    borderRadius: theme.radius['r-tile'],
  },
  wholeRow: { flexBasis: '100%' },
  parts: { gap: theme.spacing['sp-3'] },
  /* The label keeps clear of the corner's 44pt chevron. */
  clearOpener: { paddingRight: theme.spacing['sp-8'] },
  chevron: {
    position: 'absolute',
    top: theme.spacing['sp-1'],
    right: theme.spacing['sp-1'],
    width: MIN_TOUCH_TARGET,
    alignItems: 'center',
  },
  start: { flexDirection: 'row' },
  sources: { gap: theme.spacing['sp-0-5'] },
  plans: { ...tileSurface, borderRadius: theme.radius['r-tile'] },
});
