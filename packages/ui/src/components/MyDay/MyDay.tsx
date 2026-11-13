import type { CSSProperties } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { EmptyState, FailedRead } from '../EmptyState';
import { LoadingBars } from '../LoadingBars';
import { bandsShown, isClear } from './MyDay.logic';
import type { MyDayProps } from './MyDay.types';
import { MyDayBand } from './MyDayBand';
import { NextUp } from './NextUp';
import './MyDay.css';

type CssVars = CSSProperties & Record<`--${string}`, string>;

/**
 * My Day on the web (`SCR-M07-01`, sample B): the next task as the hero, then overdue, today and
 * this week. In a wide room the hero and overdue sit on the left and today and this week on the
 * right; in a narrow one, one column in that order.
 */
export function MyDay(props: MyDayProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['panel', 'row', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return (
      <div className="hg-my-day">
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
  const day = read.value;
  if (isClear(props)) {
    return (
      <div className="hg-my-day">
        <EmptyState scene="settle" title={words.emptyTitle} description={words.emptyBody} />
      </div>
    );
  }
  const { overdue, later } = bandsShown(props.bands);
  let order = 0;
  const rise = (): CssVars => ({ '--i': String(order++) });
  return (
    <div className="hg-my-day">
      <div className="hg-my-day-columns">
        <div className="hg-my-day-column">
          {props.next === null && props.asking === null ? null : (
            <div className="hg-my-day-rise" style={rise()}>
              <NextUp {...props} day={day} />
            </div>
          )}
          {props.failed ? (
            <p className="hg-my-day-failed" role="alert">
              <ShellGlyph name="alert-circle" size="sm" tone="danger" />
              {words.actFailed}
            </p>
          ) : null}
          {overdue.map((band) => (
            <div key={band.band} className="hg-my-day-rise" style={rise()}>
              <MyDayBand {...props} day={day} band={band} />
            </div>
          ))}
        </div>
        {later.length === 0 ? null : (
          <div className="hg-my-day-column">
            {later.map((band) => (
              <div key={band.band} className="hg-my-day-rise" style={rise()}>
                <MyDayBand {...props} day={day} band={band} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
