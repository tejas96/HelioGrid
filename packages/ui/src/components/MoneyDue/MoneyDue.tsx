import type { MoneyDue as Due, MoneyDueRow } from '@heliogrid/contracts';
import type { MoneyDueGroupView } from '@heliogrid/domain';
import { StatusMark } from '../../primitives/StatusMark/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { CardRow, CardRows } from '../CardRows';
import { EmptyState, FailedRead } from '../EmptyState';
import { HeroPanel } from '../HeroPanel';
import { LoadingBars } from '../LoadingBars';
import { useFormat } from '../MarketProvider';
import { dueRowOf, tileGroupsOf } from './MoneyDue.logic';
import type { MoneyDueProps } from './MoneyDue.types';
import './MoneyDue.css';

type DueProps = MoneyDueProps & { readonly due: Due };

/**
 * Money due on the web (`SCR-M11-01`): the hero with the total to collect, the late and due-today
 * tiles and what came in this month; then the groups, each its first few rows until *Show all*.
 */
export function MoneyDue(props: MoneyDueProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['panel', 'row', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return (
      <div className="hg-money-due">
        <FailedRead
          title={words.failedTitle}
          message={words.failedMessage}
          retryLabel={words.retry}
          onRetry={read.retry}
          focusAfter={props.focusAfter}
        />
      </div>
    );
  }
  const due = read.value;
  return (
    <div className="hg-money-due">
      <DueHero {...props} due={due} />
      {due.rows.totalCount === 0 ? (
        <EmptyState
          icon={<ShellGlyph name="check-check" size="lg" tone="secondary" />}
          title={words.emptyTitle}
          description={words.emptyBody}
        />
      ) : (
        <section aria-label={words.moneyDue} className="hg-money-due-groups">
          {props.groups.map((group) => (
            <DueGroup key={group.group} {...props} due={due} group={group} />
          ))}
        </section>
      )}
    </div>
  );
}

/** The total to collect, the late and due-today tiles, and what came in this month. */
function DueHero({ due, words }: DueProps) {
  const format = useFormat();
  return (
    <HeroPanel label={words.toCollect}>
      <div className="hg-money-due-figure-row">
        <span className="hg-money-due-figure">{format.money(due.toCollect)}</span>
      </div>
      <div className="hg-money-due-tiles">
        {tileGroupsOf(due).map((group) => (
          <div key={group} className={`hg-money-due-tile hg-money-due-tile-${group}`}>
            <span className="hg-money-due-tile-label">
              {words.tile(words.group(group), due.groups[group].count)}
            </span>
            <span className="hg-money-due-amount">{format.money(due.groups[group].amount)}</span>
          </div>
        ))}
      </div>
      <span className="hg-money-due-on-panel">
        {words.collectedThisMonth(format.money(due.collectedThisMonth))}
      </span>
    </HeroPanel>
  );
}

/** One group: its name and count, its rows, and *Show all* while more wait behind. */
function DueGroup(props: DueProps & { readonly group: MoneyDueGroupView<MoneyDueRow> }) {
  const { group, words } = props;
  return (
    <div className="hg-money-due-group">
      <div className="hg-money-due-head">
        <span className="hg-money-due-head-label">{words.group(group.group)}</span>
        <span className="hg-money-due-amount">{group.count}</span>
      </div>
      <CardRows form="joined">
        {group.rows.map((row, index) => (
          <DueRow key={row.partId} {...props} row={row} first={index === 0} />
        ))}
      </CardRows>
      {group.hidden > 0 ? (
        <Button variant="ghost" size="md" onClick={() => props.onShowAll(group.group)}>
          {words.showAll(group.count)}
        </Button>
      ) : null}
    </div>
  );
}

function DueRow(props: DueProps & { readonly row: MoneyDueRow; readonly first: boolean }) {
  const format = useFormat();
  const shown = dueRowOf(props.row, props.due, props);
  const { remind } = shown;
  return (
    <CardRow
      first={props.first}
      open={shown.open}
      aside={
        remind === null ? undefined : (
          <Button
            variant="secondary"
            size="sm"
            spokenName={remind.spokenName}
            onClick={remind.onClick}
          >
            {remind.label}
          </Button>
        )
      }
    >
      <div className="hg-money-due-row">
        <Avatar name={shown.name} size={36} />
        <div className="hg-money-due-row-text">
          <span className="hg-money-due-row-name">{shown.name}</span>
          <span className="hg-money-due-row-line">{shown.line}</span>
        </div>
        <div className="hg-money-due-row-end">
          <span className="hg-money-due-amount">{format.money(props.row.outstanding)}</span>
          <StatusMark tone={shown.mark.tone} label={shown.mark.label} />
        </div>
      </div>
    </CardRow>
  );
}
