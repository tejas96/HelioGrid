import type { InboxCard, InboxLead } from '@heliogrid/domain';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { AssignPicker } from '../AssignPicker';
import { Button } from '../Button';
import { CardRows } from '../CardRows';
import { FailedRead } from '../EmptyState';
import { InboxTeaching } from '../InboxTeaching';
import { LeadDeckCard } from '../LeadDeckCard';
import { LeadSelectionBar, LeadTile } from '../LeadTile';
import { LoadingBars } from '../LoadingBars';
import { ProvenanceTier } from '../Provenance';
import { TeamDock } from '../TeamDock';
import { deckPropsOf, dockPropsOf, pickerPropsOf, tilePropsOf } from './LeadInbox.logic';
import type { LeadInboxProps } from './LeadInbox.types';
import { useTeachingFocus } from './use-teaching-focus';

/**
 * The Lead Inbox's body on the web (`SCR-M02-02`): the queue's wait, failure or teaching state, else
 * the deck with the team docked in it, the queue under it — tiles on the stage, a card of rows
 * below its room — and the one assign picker.
 */
export function LeadInbox(props: LeadInboxProps) {
  const { screen, words, onAdd, onWay } = props;
  const { read } = screen;
  const teaching = useTeachingFocus(read.kind);
  if (read.kind === 'loading') {
    return <LoadingBars bars={['panel', 'row', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return (
      <FailedRead
        title={words.failedTitle}
        message={words.failedMessage}
        retryLabel={words.retry}
        onRetry={read.retry}
        focusAfter={props.focusAfter}
      />
    );
  }
  if (read.kind === 'empty') {
    return (
      <InboxTeaching
        headingRef={teaching}
        onAdd={onAdd}
        onWay={onWay}
        ways={screen.ways}
        words={words.teaching}
      />
    );
  }
  const deck = screen.view.deck;
  return (
    <>
      {deck === null ? null : (
        <LeadDeckCard
          {...deckPropsOf(props, deck)}
          team={screen.canAssign ? <Team {...props} card={deck} /> : undefined}
        />
      )}
      <UpNext {...props} />
      <AssignPicker {...pickerPropsOf(props)} />
    </>
  );
}

/** The team once read — its wait, its retry or its empty word until then. */
function Team(props: LeadInboxProps & { card: InboxCard<InboxLead> }) {
  const { screen, words, card } = props;
  const team = screen.team.read;
  const picker = words.picker({ name: card.lead.name });
  if (team.kind === 'loading') return <LoadingBars bars={['row']} label={picker.loading} />;
  if (team.kind === 'failed') {
    return (
      <Button variant="secondary" size="sm" onClick={team.retry}>
        {picker.retry}
      </Button>
    );
  }
  if (team.kind === 'empty') return <p className="hg-lead-inbox-note">{picker.emptyTitle}</p>;
  return <TeamDock {...dockPropsOf(props, card)} />;
}

/** What waits under the deck, with the bar a selection raises and *Show more*. */
function UpNext(props: LeadInboxProps) {
  const { screen, words, layout } = props;
  const { view } = screen;
  if (view.upNext.length === 0) return null;
  const tiles = view.upNext.map((card, index) => (
    <LeadTile key={card.lead.id} {...tilePropsOf(props, card, index)} />
  ));
  return (
    <section className="hg-lead-inbox-next" aria-label={words.upNext}>
      <div className="hg-lead-inbox-next-head">
        <h2 className="hg-lead-inbox-over">{words.upNext}</h2>
        <span className="hg-lead-inbox-grow" />
        <span className="hg-lead-inbox-column">
          {words.billColumn}
          <ProvenanceTier tier="assumed" />
        </span>
        {layout === 'deck' && screen.canAssign ? (
          <Button
            variant="ghost"
            size="sm"
            icon={<ShellGlyph name="check-check" size="sm" tone="accent" />}
            onClick={() => screen.setSelecting(!screen.selecting)}
          >
            {screen.selecting ? words.doneSelecting : words.select}
          </Button>
        ) : null}
      </div>
      {view.selection.length > 0 ? (
        <LeadSelectionBar
          count={view.selection.length}
          onAssign={screen.openSelectionPicker}
          onClear={screen.clearSelection}
          words={words.selection}
        />
      ) : null}
      {layout === 'stage' ? (
        <div className="hg-lead-inbox-grid">{tiles}</div>
      ) : (
        <CardRows>{tiles}</CardRows>
      )}
      {view.unread > 0 ? (
        <Button
          variant="secondary"
          size="md"
          loading={screen.loadingMore}
          icon={<ShellGlyph name="chevron" size="sm" tone="primary" />}
          onClick={screen.showMore}
        >
          {words.showMore(view.unread)}
        </Button>
      ) : null}
    </section>
  );
}
