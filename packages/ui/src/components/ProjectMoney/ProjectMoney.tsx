import type { ProjectPayments } from '@heliogrid/contracts';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Card } from '../Card';
import { EmptyState, FailedRead } from '../EmptyState';
import { LoadingBars } from '../LoadingBars';
import { useFormat } from '../MarketProvider';
import { Menu } from '../Menu';
import { projectFailedOf, projectLoadingOf } from '../ProjectDetail/ProjectDetail.states';
import { CardHead } from '../ProjectDetail/ProjectDetailParts';
import { Timeline } from '../Timeline';
import { MoneyEntries } from './MoneyEntries';
import { MoneyHero } from './MoneyHero';
import { partRowsOf } from './ProjectMoney.logic';
import type { ProjectMoneyProps } from './ProjectMoney.types';
import './ProjectMoney.css';

/**
 * A project's payments on the web (`SCR-M11-02`, design A): the hero, the parts as a timeline, the
 * money received.
 */
export function ProjectMoney(props: ProjectMoneyProps) {
  const { read, words } = props;
  return (
    <div className="hg-money">
      {read.kind === 'loading' ? (
        <LoadingBars {...projectLoadingOf(words)} />
      ) : read.kind === 'failed' ? (
        <FailedRead {...projectFailedOf(words, read.retry, props.focusAfter)} />
      ) : read.value.parts.length === 0 ? (
        <EmptyState
          icon={<ShellGlyph name="rupee" size="lg" tone="secondary" />}
          title={words.noScheduleTitle}
          description={words.noScheduleBody}
        />
      ) : (
        <>
          <MoneyHero {...props} payments={read.value} />
          <MoneyParts {...props} payments={read.value} />
          <MoneyEntries {...props} payments={read.value} />
        </>
      )}
    </div>
  );
}

/** Every part, its share, amount and state, in order — the schedule the terms made (`M11-52`). */
function MoneyParts(props: ProjectMoneyProps & { readonly payments: ProjectPayments }) {
  const { words } = props;
  const format = useFormat();
  const items = partRowsOf(props, format).map(({ item, more }) =>
    more === null
      ? item
      : {
          ...item,
          content: (
            <div className="hg-money-part-more">
              <span className="hg-money-part-notes">
                {more.notes.map((note) => (
                  <span key={note} className="hg-money-entry-line">
                    {note}
                  </span>
                ))}
              </span>
              {more.acts.length === 0 ? null : (
                <Menu label={more.label} items={more.acts} align="end" />
              )}
            </div>
          ),
        },
  );
  return (
    <section aria-label={words.parts}>
      <Card density="functional" className="hg-money-card">
        <CardHead title={words.parts} aside={words.fromTerms} />
        <Timeline variant="page" density="functional" items={items} />
      </Card>
    </section>
  );
}
