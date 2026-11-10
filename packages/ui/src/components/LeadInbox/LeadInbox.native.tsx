import type { InboxCard, InboxLead } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { AssignPicker } from '../AssignPicker/AssignPicker.native';
import { Button } from '../Button/Button.native';
import { CardRows } from '../CardRows/CardRows.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { InboxTeaching } from '../InboxTeaching/InboxTeaching.native';
import { LeadDeckCard } from '../LeadDeckCard/LeadDeckCard.native';
import { LeadSelectionBar } from '../LeadTile/LeadSelectionBar.native';
import { LeadTile } from '../LeadTile/LeadTile.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import { TeamDock } from '../TeamDock/TeamDock.native';
import { deckPropsOf, dockPropsOf, pickerPropsOf, tilePropsOf } from './LeadInbox.logic';
import type { LeadInboxProps } from './LeadInbox.types';
import { useTeachingFocus } from './use-teaching-focus';

/**
 * The Lead Inbox's body on the phone (`SCR-M02-02`): the queue's wait, failure or teaching state,
 * else the deck with the team's faces in it, Up next as one card of rows under it, and the picker
 * as a sheet.
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
    <View style={styles.body}>
      {deck === null ? null : (
        <LeadDeckCard
          {...deckPropsOf(props, deck)}
          team={screen.canAssign ? <Team {...props} card={deck} /> : undefined}
        />
      )}
      <UpNext {...props} />
      <AssignPicker {...pickerPropsOf(props)} />
    </View>
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
  if (team.kind === 'empty') {
    return (
      <Text variant="body-sm" color="secondary">
        {picker.emptyTitle}
      </Text>
    );
  }
  return <TeamDock {...dockPropsOf(props, card)} />;
}

/** Up next: its head with Select, the bar a selection raises, the rows and *Show more*. */
function UpNext(props: LeadInboxProps) {
  const { screen, words } = props;
  const { view } = screen;
  if (view.upNext.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <View accessible accessibilityRole="header" style={styles.grow}>
          <Text variant="overline" color="secondary">
            {words.upNext}
          </Text>
        </View>
        {screen.canAssign ? (
          <Button
            variant="ghost"
            size="sm"
            icon={<ShellGlyph name="check-check" size="sm" tone="accent" />}
            onClick={() => screen.setSelecting(!screen.selecting)}
          >
            {screen.selecting ? words.doneSelecting : words.select}
          </Button>
        ) : null}
      </View>
      <View style={styles.column}>
        <Text variant="caption" color="secondary">
          {words.billColumn}
        </Text>
        <ProvenanceTier tier="assumed" />
      </View>
      {view.selection.length > 0 ? (
        <LeadSelectionBar
          count={view.selection.length}
          onAssign={screen.openSelectionPicker}
          onClear={screen.clearSelection}
          words={words.selection}
        />
      ) : null}
      <CardRows>
        {view.upNext.map((card, index) => (
          <LeadTile key={card.lead.id} {...tilePropsOf(props, card, index)} />
        ))}
      </CardRows>
      {view.unread > 0 ? (
        <Button
          variant="secondary"
          size="md"
          loading={screen.loadingMore}
          onClick={screen.showMore}
        >
          {words.showMore(view.unread)}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-6'] },
  section: { gap: theme.spacing['sp-3'] },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: theme.layout['touch-min'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
  column: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
  grow: { flex: 1 },
});
