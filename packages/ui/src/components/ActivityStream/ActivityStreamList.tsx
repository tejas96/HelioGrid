import { Fragment } from 'react';
import { Button } from '../Button/Button';
import { streamWindowOf } from './ActivityStream.logic';
import type { ActivityStreamListProps } from './ActivityStream.types';
import { StreamEntry } from './ActivityStreamEntry';

/**
 * The window, the day grouping and the count line. Nothing is virtualised: a windowed list keeps
 * the DOM small without lying about how many entries exist, and the count always states the whole.
 */
export function ActivityStreamList(props: ActivityStreamListProps) {
  const { reveal, format, kinds, step, loadingMore, words, density, onLoadMore, toolbar } = props;
  const view = streamWindowOf(props);

  return (
    <>
      {view.showsToolbar ? (
        <div className="hg-stream-toolbar">
          {/* The count always states the whole, so a window never reads as the total. */}
          <span className="hg-stream-count">{view.countLine}</span>
          {toolbar}
        </div>
      ) : null}

      <ol className="hg-stream-list">
        {view.groups.map((group) => (
          <Fragment key={group.key}>
            {group.heading === null ? null : <li className="hg-stream-day">{group.heading}</li>}
            {group.items.map((entry, index) => (
              <StreamEntry
                key={entry.id ?? `${group.key}-${index}`}
                entry={entry}
                kinds={kinds}
                words={words}
                density={density}
                format={format}
              />
            ))}
          </Fragment>
        ))}
      </ol>

      {view.showsMore ? (
        <div className="hg-stream-more">
          <Button
            variant="secondary"
            size="md"
            disabled={loadingMore}
            onClick={() => (view.revealsLocally ? reveal(step) : onLoadMore?.())}
          >
            {view.moreLabel}
          </Button>
        </div>
      ) : null}
    </>
  );
}
