import type { InboxCard, InboxLead } from '@heliogrid/domain';
import type { AssignPickerProps } from '../AssignPicker/AssignPicker.types';
import { actLineOf, waitingLeadOf } from '../LeadDeckCard/LeadDeckCard.logic';
import type { LeadDeckCardProps } from '../LeadDeckCard/LeadDeckCard.types';
import type { LeadTileForm, LeadTileProps } from '../LeadTile/LeadTile.types';
import type { TeamDockProps } from '../TeamDock/TeamDock.types';
import type { LeadInboxProps } from './LeadInbox.types';

/** One lead's act line, its retry and its clearing bound to the screen. */
function lineOf(props: LeadInboxProps, card: InboxCard<InboxLead>) {
  const { screen, words, focusAfter } = props;
  const leadId = card.lead.id;
  return actLineOf(
    card.act,
    words.act,
    { onRetry: () => screen.retry(leadId), onDismiss: () => screen.dismiss(leadId) },
    focusAfter,
  );
}

/** The deck's card for the lead at the cursor, the team aside — both halves draw it alike. */
export function deckPropsOf(
  props: LeadInboxProps,
  card: InboxCard<InboxLead>,
): Omit<LeadDeckCardProps, 'team'> {
  const { screen, words, money, layout } = props;
  const { view, departed } = screen;
  const leadId = card.lead.id;
  return {
    lead: waitingLeadOf(card, money),
    sourceLabel: words.source(card.lead.source),
    layout,
    behind: view.upNext.length,
    place: {
      index: view.position,
      total: view.waiting,
      onPrevious: () => screen.step(-1),
      onNext: () => screen.step(1),
    },
    ...(screen.canJunk ? { onJunk: () => screen.junk(leadId) } : {}),
    pending: lineOf(props, card),
    waiting: card.waiting,
    departed:
      departed === null
        ? null
        : { lead: waitingLeadOf(departed, money), sourceLabel: words.source(departed.lead.source) },
    words: words.deck,
  };
}

/** The team docked under the deck's lead: a face gives it, the last face opens everyone. */
export function dockPropsOf(props: LeadInboxProps, card: InboxCard<InboxLead>): TeamDockProps {
  const { screen, words, layout } = props;
  const leadId = card.lead.id;
  return {
    people: screen.team.people,
    readerId: screen.readerId,
    layout: layout === 'stage' ? 'tiles' : 'faces',
    onGive: (userId) => {
      const person = screen.team.people.find((one) => one.userId === userId);
      if (person !== undefined) screen.give(leadId, person);
    },
    onAll: () => screen.openPicker(leadId),
    waiting: card.waiting,
    words: words.dock,
  };
}

/** One lead under the deck: a tile on the stage, a row of the Up next card below it. */
export function tilePropsOf(
  props: LeadInboxProps,
  card: InboxCard<InboxLead>,
  index: number,
): LeadTileProps {
  const { screen, words, money, layout, onOpen } = props;
  const leadId = card.lead.id;
  const form: LeadTileForm = layout === 'stage' ? 'tile' : 'row';
  return {
    lead: waitingLeadOf(card, money),
    sourceLabel: words.source(card.lead.source),
    form,
    first: index === 0,
    selecting: screen.canAssign && (form === 'tile' || screen.selecting),
    selected: card.selected,
    onSelect: (on) => screen.select(leadId, on),
    ...(onOpen === undefined ? {} : { onOpen: () => onOpen(leadId) }),
    ...(screen.canAssign ? { onAssign: () => screen.openPicker(leadId) } : {}),
    ...(screen.canJunk ? { onJunk: () => screen.junk(leadId) } : {}),
    pending: lineOf(props, card),
    waiting: card.waiting,
    words: words.tile,
  };
}

/** The one assign picker, for the lead it was opened from or for the selection (`M02-29`). */
export function pickerPropsOf({ screen, words }: LeadInboxProps): AssignPickerProps {
  const { picking } = screen;
  return {
    open: picking !== null,
    onClose: screen.closePicker,
    read: screen.team.read,
    people: screen.team.people,
    ownerId: null,
    readerId: screen.readerId,
    onPick: screen.pick,
    pending: null,
    words: words.picker(
      picking?.kind === 'selection'
        ? { count: picking.count }
        : { name: picking?.lead.name ?? null },
    ),
  };
}
