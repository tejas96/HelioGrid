import type { TranslatedText, UsageEventMeter } from '@heliogrid/contracts';
import { ShellGlyph } from '../AppShell';
import type { BillingValue } from '../BillingHome/BillingHome.types';
import { BillingChipMark } from '../BillingHome/BillingNeeds';
import { BillingValueText } from '../BillingStrip/BillingValue';
import { Block } from '../Block';
import { Button } from '../Button';
import { FactRow, FactRows } from '../FactRow';
import { IconButton } from '../IconButton';
import { ListRow } from '../ListRow';
import { Provenance } from '../Provenance';
import { UsageMeter } from '../UsageMeter';
import { UsageMeterHead } from '../UsageMeter/UsageMeterHead';
import { figureText, USAGE_ROW_GLYPH } from './UsagePage.glyphs';
import type {
  UsageFactView,
  UsageNeedRow,
  UsagePageView,
  UsagePageWords,
  UsageRegionView,
  UsageRowView,
} from './UsagePage.types';

/** A figure on its row's right edge, mono where the view marked it (`F7-09`). */
export function UsageFigure({ value }: { value: BillingValue }) {
  return (
    <span className="hg-usage-figure">
      <BillingValueText value={value} />
    </span>
  );
}

/** A plain figure — a date, a count — on its row's right edge. */
export function UsagePlainFigure({ text }: { text: string }) {
  return <span className="hg-usage-figure">{text}</span>;
}

/** The two quiet source lines at a card's foot (decision 5); none while the figures wait. */
export function UsageSources({ sources }: { sources: readonly TranslatedText[] | null }) {
  if (sources === null) return null;
  return (
    <span className="hg-usage-sources">
      {sources.map((source) => (
        <Provenance key={source} source={source} size={12} />
      ))}
    </span>
  );
}

/** `Needs you` (decision 3): a row per meter — its name, its own chip, used of included, ONE line. */
export function UsageNeeds({
  title,
  rows,
}: {
  title: TranslatedText;
  rows: readonly UsageNeedRow[];
}) {
  return (
    <Block title={title} density="expressive">
      <div className="hg-usage-stack" data-gap="5">
        {rows.map((row) => (
          <ListRow
            key={row.key}
            className="hg-usage-need-row"
            density="expressive"
            title={row.title}
            marks={<BillingChipMark chip={row.chip} />}
            trailing={row.figure === null ? undefined : <UsagePlainFigure text={row.figure} />}
            subtitle={row.line === null ? undefined : <BillingValueText value={row.line} />}
            subtitleWrap
            subtitleTone={row.tone}
          />
        ))}
      </div>
    </Block>
  );
}

/** `Bigger plans` / `Pick a plan` — the one way to a bigger plan (decision 8). */
export function UsagePlansRow({
  plans,
  onPlans,
}: {
  plans: NonNullable<UsagePageView['plans']>;
  onPlans: () => void;
}) {
  return (
    <ListRow
      className="hg-usage-tile"
      density="expressive"
      icon={<ShellGlyph name="layers" size="md" tone="secondary" />}
      title={plans.title}
      subtitle={plans.subtitle ?? undefined}
      trailing={<ShellGlyph name="chevron-right" size="md" />}
      onClick={onPlans}
    />
  );
}

/** A card's facts in the one row form: label left, figure on the meter's right edge. */
function UsageFacts({ label, facts }: { label: TranslatedText; facts: readonly UsageFactView[] }) {
  return (
    <FactRows className="hg-usage-facts" label={label} density="expressive" form="pair">
      {facts.map((fact) => (
        <FactRow
          key={fact.key}
          label={fact.label}
          value={
            fact.value !== null ? (
              <UsageFigure value={fact.value} />
            ) : fact.chip !== null ? (
              <BillingChipMark chip={fact.chip} />
            ) : undefined
          }
        />
      ))}
    </FactRows>
  );
}

interface RowActs {
  readonly onLedger: (meter: UsageEventMeter) => void;
  readonly onPlans: () => void;
}

/** The tile's lead: its meter, or — a row with none, `Biggest design` — its first fact as a figure. */
function RowLead({ row, words }: { row: UsageRowView; words: UsagePageWords }) {
  const { meter } = row;
  const glyph = USAGE_ROW_GLYPH[row.key];
  if (meter === null) {
    const lead = row.facts[0];
    if (lead === undefined || lead.value === null) return null;
    return (
      <div className="hg-usage-meter" data-form="tile">
        <UsageMeterHead label={row.label} form="tile" glyph={glyph}>
          <strong>{figureText(lead.value)}</strong>
        </UsageMeterHead>
      </div>
    );
  }
  return (
    <UsageMeter
      density="expressive"
      form="tile"
      glyph={glyph}
      label={row.label}
      words={words.usageMeter}
      value={meter.value}
      limit={meter.limit}
      unit={meter.unit ?? undefined}
      period={meter.period ?? undefined}
      state={meter.state}
      graceDaysLeft={meter.graceDaysLeft ?? undefined}
      note={meter.note ?? undefined}
      noLimitNote={meter.noLimitNote ?? undefined}
      statusLine={meter.statusLine}
      defaultNotes={false}
    />
  );
}

/**
 * One row as a small glass tile: its meter (or its one figure), its other facts, the way to a bigger
 * plan at its cap, and its ledger opener in the tile's corner.
 */
function UsageRow({
  row,
  words,
  plans,
  acts,
}: {
  row: UsageRowView;
  words: UsagePageWords;
  plans: UsagePageView['plans'];
  acts: RowActs;
}) {
  const { ledger } = row;
  /* A row with no meter shows its first fact as the tile's figure; the rest follow as rows. */
  const rest = row.meter === null ? row.facts.slice(1) : row.facts;
  return (
    <div className="hg-usage-tile-row" data-ledger={ledger !== null}>
      <RowLead row={row} words={words} />
      {rest.length === 0 ? null : <UsageFacts label={row.label} facts={rest} />}
      {row.plans && plans !== null ? (
        <span className="hg-usage-tile-act">
          <Button
            variant="secondary"
            size="sm"
            icon={<ShellGlyph name="layers" size="sm" />}
            onClick={acts.onPlans}
          >
            {plans.title}
          </Button>
        </span>
      ) : null}
      {ledger === null ? null : (
        <IconButton
          className="hg-usage-ledger"
          label={words.eventsOf(row.label)}
          variant="ghost"
          size={44}
          onClick={() => acts.onLedger(ledger)}
        >
          <ShellGlyph name="chevron-right" size="md" />
        </IconButton>
      )}
    </div>
  );
}

/**
 * A region — `Limits` or `Included each month` — as A's tiles: one small glass tile per row, two to
 * a row on a phone and as many as fit at width, the extra charges' total closing `Included each
 * month` across the row (decision 4), and the two source lines at its foot.
 */
export function UsageRegion({
  region,
  extra,
  words,
  plans,
  acts,
}: {
  region: UsageRegionView;
  /** The total tile this region ends in; only `Included each month` carries one, at 375. */
  extra: UsagePageView['extra'];
  words: UsagePageWords;
  plans: UsagePageView['plans'];
  acts: RowActs;
}) {
  return (
    <Block
      title={region.title}
      density="expressive"
      footer={region.sources === null ? undefined : <UsageSources sources={region.sources} />}
    >
      <div className="hg-usage-tiles">
        {region.rows.map((row) => (
          <UsageRow key={row.key} row={row} words={words} plans={plans} acts={acts} />
        ))}
        {extra === null ? null : (
          <div className="hg-usage-tile-row" data-span="row">
            <FactRows
              className="hg-usage-facts"
              label={words.extraCharges}
              density="expressive"
              form="pair"
            >
              <FactRow label={words.extraCharges} value={<UsagePlainFigure text={extra.total} />} />
              <FactRow label={words.billsOn} value={<UsagePlainFigure text={extra.billsOn} />} />
            </FactRows>
          </div>
        )}
      </div>
    </Block>
  );
}
