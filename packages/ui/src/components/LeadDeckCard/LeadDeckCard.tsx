import { type ReactNode, type Ref, useEffect, useRef } from 'react';
import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { HeroPanel } from '../HeroPanel';
import { IconButton } from '../IconButton';
import { LeadAge } from '../LeadAge';
import { LeadSourceMark } from '../LeadSourceMark';
import { NamedGap } from '../NamedGap';
import { PendingAction } from '../PendingAction';
import { ProgressRing } from '../ProgressRing';
import { ProvenanceTier } from '../Provenance';
import { ageShareOf, DECK_KEY_CAPS, isPastDay, peeksOf } from './LeadDeckCard.logic';
import type {
  LeadDeckCardLayout,
  LeadDeckCardProps,
  LeadDeckCardWords,
  LeadDeckPlace,
  WaitingLead,
} from './LeadDeckCard.types';

/**
 * The deck (`SCR-M02-02`): the lead on the solar glass, the team under it. A lead that leaves flies
 * off over the one rising into its place, and the keyboard's focus — when it was on the deck or on
 * nothing — lands on the new lead's name, so the next decision starts where the eye already is.
 */
export function LeadDeckCard({
  lead,
  sourceLabel,
  layout,
  behind,
  place,
  onJunk,
  pending,
  waiting,
  team,
  departed,
  words,
}: LeadDeckCardProps) {
  const deck = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLHeadingElement>(null);
  const shownId = useRef(lead.id);
  useEffect(() => {
    if (shownId.current === lead.id) return;
    shownId.current = lead.id;
    const active = document.activeElement;
    const resting = active === null || active === document.body;
    if (resting || deck.current?.contains(active)) name.current?.focus({ preventScroll: true });
  }, [lead.id]);

  return (
    <div ref={deck} className="hg-lead-deck" data-layout={layout} data-peeks={peeksOf(behind)}>
      {departed === null ? null : (
        <div key={departed.lead.id} className="hg-lead-deck-departed" aria-hidden="true" inert>
          <DeckFace
            lead={departed.lead}
            sourceLabel={departed.sourceLabel}
            layout={layout}
            words={words}
          />
        </div>
      )}
      <div key={lead.id} className="hg-lead-deck-card" aria-busy={waiting ? true : undefined}>
        <DeckFace
          lead={lead}
          sourceLabel={sourceLabel}
          layout={layout}
          words={words}
          nameRef={name}
          place={place}
          junk={onJunk === undefined ? null : { onJunk, waiting }}
          give={
            <div className="hg-lead-deck-give">
              {pending === undefined ? (
                <GiveHead layout={layout} words={words} hasTeam={team !== undefined} />
              ) : (
                <PendingAction {...pending} />
              )}
              {team}
            </div>
          }
        />
      </div>
    </div>
  );
}

interface DeckFaceProps {
  lead: WaitingLead;
  sourceLabel: LeadDeckCardProps['sourceLabel'];
  layout: LeadDeckCardLayout;
  words: LeadDeckCardWords;
  nameRef?: Ref<HTMLHeadingElement>;
  place?: LeadDeckPlace;
  junk?: { onJunk: () => void; waiting: boolean } | null;
  give?: ReactNode;
}

/** One card's face: what the lead is, and — on the live card — its acts. */
function DeckFace({ lead, sourceLabel, layout, words, nameRef, place, junk, give }: DeckFaceProps) {
  const stage = layout === 'stage';
  const source = <LeadSourceMark source={lead.source} label={sourceLabel} />;
  return (
    <HeroPanel name={words.region(lead.name)}>
      <div className="hg-lead-deck-top">
        {stage && place !== undefined ? <Place place={place} words={words} /> : null}
        <span className="hg-lead-deck-source">{source}</span>
        {stage ? null : <LeadAge elapsedMs={lead.elapsedMs} words={words.age} />}
        <span className="hg-lead-deck-grow" />
        {junk === null || junk === undefined ? null : stage ? (
          <Button
            variant="secondary"
            size="sm"
            icon={<ShellGlyph name="blocked" size="sm" tone="primary" />}
            iconRight={<kbd className="hg-lead-deck-key">{DECK_KEY_CAPS.junk}</kbd>}
            disabled={junk.waiting}
            spokenName={words.junkThis}
            onClick={junk.onJunk}
          >
            {words.junk}
          </Button>
        ) : (
          <IconButton label={words.junkThis} disabled={junk.waiting} onClick={junk.onJunk}>
            <ShellGlyph name="blocked" size="md" tone="primary" />
          </IconButton>
        )}
      </div>
      <div className="hg-lead-deck-main">
        <div className="hg-lead-deck-who">
          <h2 ref={nameRef} tabIndex={-1} className="hg-lead-deck-name hg-focus-target">
            {lead.name ?? <NamedGap gap={words.noName} scale="headline" />}
          </h2>
          <span className="hg-lead-deck-city">
            <ShellGlyph name="pin" size="sm" tone="secondary" />
            {lead.city ?? <NamedGap gap={words.noCity} scale="field" />}
          </span>
        </div>
        <Bill lead={lead} words={words} noted={stage} />
        {stage ? <AgeRing elapsedMs={lead.elapsedMs} words={words} /> : null}
      </div>
      {give}
    </HeroPanel>
  );
}

/** The monthly bill with its tier, or the named gap — on the stage with the line under it. */
function Bill({
  lead,
  words,
  noted,
}: {
  lead: WaitingLead;
  words: LeadDeckCardWords;
  noted: boolean;
}) {
  return (
    <div className="hg-lead-deck-bill">
      <span className="hg-lead-deck-overline">{words.bill}</span>
      {lead.bill === null ? (
        <NamedGap gap={words.noBill} scale="headline" />
      ) : (
        <span className="hg-lead-deck-money">
          <span className="hg-lead-deck-figure">{lead.bill.money}</span>
          <ProvenanceTier tier={lead.bill.tier} />
        </span>
      )}
      {noted ? (
        <span className="hg-lead-deck-note">
          {lead.bill === null ? words.noBillNote : words.billNote}
        </span>
      ) : null}
    </div>
  );
}

/** How long the lead has waited against the 24 hours before its owner is told (`M02-50`). */
function AgeRing({ elapsedMs, words }: { elapsedMs: number; words: LeadDeckCardWords }) {
  return (
    <div className="hg-lead-deck-age">
      <ProgressRing
        share={ageShareOf(elapsedMs)}
        value={words.age.age(elapsedMs)}
        caption={words.waiting}
        spokenName={words.age.spoken(elapsedMs)}
        onPanel
      />
      {isPastDay(elapsedMs) ? (
        <StatusMark tone="warning" label={words.pastDay} />
      ) : (
        <span className="hg-lead-deck-note">{words.alertAt}</span>
      )}
    </div>
  );
}

/** The stage's "1 of 148" and its two moves. */
function Place({ place, words }: { place: LeadDeckPlace; words: LeadDeckCardWords }) {
  return (
    <span className="hg-lead-deck-place">
      <span className="hg-lead-deck-place-words">{words.place(place.index + 1, place.total)}</span>
      <IconButton label={words.previous} variant="ghost" size={36} onClick={place.onPrevious}>
        <ShellGlyph name="chevron-left" size="sm" tone="primary" />
      </IconButton>
      <IconButton label={words.next} variant="ghost" size={36} onClick={place.onNext}>
        <ShellGlyph name="chevron-right" size="sm" tone="primary" />
      </IconButton>
    </span>
  );
}

/** "Give to" over the faces; on the stage, the one-click promise and the three keys beside it. */
function GiveHead({
  layout,
  words,
  hasTeam,
}: {
  layout: LeadDeckCardLayout;
  words: LeadDeckCardWords;
  hasTeam: boolean;
}) {
  if (!hasTeam) return null;
  return (
    <div className="hg-lead-deck-givehead">
      <span className="hg-lead-deck-overline">{words.give}</span>
      {layout === 'stage' ? (
        <>
          <span className="hg-lead-deck-note">{words.giveHint}</span>
          <span className="hg-lead-deck-grow" />
          <span className="hg-lead-deck-keys" aria-hidden="true">
            <span>
              <kbd className="hg-lead-deck-key">{DECK_KEY_CAPS.give}</kbd>
              {words.keys.give}
            </span>
            <span>
              <kbd className="hg-lead-deck-key">{DECK_KEY_CAPS.junk}</kbd>
              {words.keys.junk}
            </span>
            <span>
              <kbd className="hg-lead-deck-key">
                <ShellGlyph name="arrow-down" size="sm" tone="secondary" />
              </kbd>
              {words.keys.next}
            </span>
          </span>
        </>
      ) : null}
    </div>
  );
}
