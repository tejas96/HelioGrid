import { Button } from '../Button';
import { EditorSurface } from '../EditorSurface';
import { ListRow } from '../ListRow';
import { Provenance } from '../Provenance';
import type { UsagePageProps } from './UsagePage.types';
import { UsagePlainFigure } from './UsageRegion';

/** The side panel's width at 1536: the board's, docked over the 300px standing column. */
const LEDGER_PANEL_WIDTH = 504;

/**
 * One meter's events (`M12-36`, decision 13): a full-height sheet at 375, `F7-21`'s side panel at
 * width that docks over the standing column, so the tables never reflow. It stays mounted while
 * closed so its own motion runs and its close hands the keyboard back to the opener.
 */
export function UsageLedger({
  ledger,
  words,
  layout,
  acts,
}: Pick<UsagePageProps, 'ledger' | 'words' | 'layout' | 'acts'>) {
  const view = ledger?.view ?? null;
  const rows = view !== null && view.read.kind === 'ready' ? view.read.value : [];
  return (
    <EditorSurface
      open={view !== null}
      onClose={acts.onCloseLedger}
      desktop="panel"
      side="right"
      width={LEDGER_PANEL_WIDTH}
      size="full"
      modal={layout !== 'columns'}
      density="expressive"
      showClose
      closeLabel={words.close}
      title={view?.title}
      subtitle={view?.subtitle}
      read={view?.read ?? { kind: 'loading' }}
      loadingLabel={words.eventsLoading}
      emptyTitle={view?.emptyTitle}
      emptyMessage={view?.emptyMessage}
      errorTitle={words.eventsFailed}
      retryLabel={words.tryAgain}
    >
      <div className="hg-usage-stack" data-gap="4">
        <div className="hg-usage-ledger-head">
          <span className="hg-usage-overline">{words.eventsThisCycle}</span>
          <Provenance source={words.actualUsage} size={12} />
        </div>
        <div className="hg-usage-stack" data-gap="tile">
          {rows.map((row) => (
            <ListRow
              key={row.key}
              className="hg-usage-tile"
              density="functional"
              title={row.title}
              subtitle={row.subtitle}
              trailing={row.figure === null ? undefined : <UsagePlainFigure text={row.figure} />}
            />
          ))}
        </div>
        {view?.more ? (
          <div className="hg-usage-start">
            <Button variant="ghost" size="md" onClick={acts.onMoreEvents}>
              {words.showMore}
            </Button>
          </div>
        ) : null}
      </div>
    </EditorSurface>
  );
}
