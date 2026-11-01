import { Button } from '../Button';
import { EditorSurface } from '../EditorSurface';
import { Timeline } from '../Timeline';
import type { BillingTimelineProps } from './BillingHome.parts.types';

/** The history panels' width at 1536 (`F7-21`); the design system has no panel token yet. */
const TIMELINE_PANEL_WIDTH = 440;

/**
 * `Payment reminders` and `Plan history` (decision 13, frames 21–22, d2, d5): append-only compact
 * timelines — a sheet at 375, a non-modal side panel at width, so the page stays readable behind.
 */
export function BillingTimeline({
  open,
  onClose,
  words,
  read,
  items,
  more,
  onShowMore,
}: BillingTimelineProps) {
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={words.close}
      showClose
      modal={false}
      desktop="panel"
      width={TIMELINE_PANEL_WIDTH}
      size="full"
      density="expressive"
      title={words.title}
      errorTitle={words.failedTitle}
      retryLabel={words.tryAgain}
      read={read}
      loadingLabel={words.loading}
    >
      <div className="hg-billing-stack" data-gap="4">
        {items.length === 0 ? (
          <Timeline
            density="expressive"
            variant="compact"
            items={[]}
            read={{ kind: 'empty' }}
            loadingLabel={words.loading}
            emptyTitle={words.nothingYet}
          />
        ) : (
          <Timeline
            density="expressive"
            variant="compact"
            label={words.title}
            items={items.map((item) => ({
              id: item.id,
              label: item.label,
              meta: item.meta,
              description: item.description ?? undefined,
              status: item.status,
              content:
                item.figure === null ? undefined : (
                  <span className="hg-billing-mono">{item.figure}</span>
                ),
            }))}
          />
        )}
        {more ? (
          <div className="hg-billing-start">
            <Button variant="secondary" size="md" onClick={onShowMore}>
              {words.showMore}
            </Button>
          </div>
        ) : null}
      </div>
    </EditorSurface>
  );
}
