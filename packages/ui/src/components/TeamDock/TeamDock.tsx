import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { loadSharesOf } from '../AssignPicker/AssignPicker.logic';
import type { AssignPickerPerson } from '../AssignPicker/AssignPicker.types';
import { Avatar } from '../Avatar';
import { dockColumnsOf, dockedOf, KEYED_FACES, shortNameOf } from './TeamDock.logic';
import type { TeamDockLayout, TeamDockProps, TeamDockWords } from './TeamDock.types';

/** A share or a column count rides in as a custom property; the geometry stays in TeamDock.css. */
type DockVars = CSSProperties & Record<`--${string}`, string>;

/**
 * The team under the lead (`M02-28`): one face per person, ringed by their load against the
 * busiest, with their open and overdue counts; a tap gives the lead, no confirm. While the lead's
 * act is out every face waits.
 */
export function TeamDock({
  people,
  readerId,
  layout,
  onGive,
  onAll,
  waiting,
  words,
}: TeamDockProps) {
  const shares = loadSharesOf(people);
  const { shown, overflows } = dockedOf(people, layout);
  const grid: DockVars = {
    '--hg-team-dock-columns': String(dockColumnsOf(shown.length, overflows)),
  };
  return (
    <div className="hg-team-dock" data-layout={layout} style={grid}>
      {shown.map((person, index) => (
        <Face
          key={person.userId}
          person={person}
          share={shares.get(person.userId) ?? 0}
          you={person.userId === readerId}
          keyCap={layout === 'tiles' && index < KEYED_FACES ? index + 1 : null}
          layout={layout}
          waiting={waiting}
          onGive={onGive}
          words={words}
        />
      ))}
      {overflows ? (
        <Pressable
          className="hg-team-dock-face hg-team-dock-all"
          disabled={waiting}
          accessibilityLabel={words.all(people.length)}
          onPress={onAll}
        >
          <span className="hg-team-dock-ring">
            <ShellGlyph name="people" size="md" tone="primary" />
          </span>
          <span className="hg-team-dock-name">{words.all(people.length)}</span>
        </Pressable>
      ) : null}
    </div>
  );
}

interface FaceProps {
  person: AssignPickerPerson;
  share: number;
  you: boolean;
  /** The digit that gives to this face on the stage; null past the ninth or off the stage. */
  keyCap: number | null;
  layout: TeamDockLayout;
  waiting: boolean;
  onGive: (userId: string) => void;
  words: TeamDockWords;
}

/** One person: the ring of their load round their face, their name, open and overdue counts. */
function Face({ person, share, you, keyCap, layout, waiting, onGive, words }: FaceProps) {
  const ring: DockVars = { '--hg-team-dock-share': String(share) };
  const late = person.overdueCount > 0;
  return (
    <Pressable
      className={classNames('hg-team-dock-face', late ? 'hg-team-dock-face-late' : undefined)}
      disabled={waiting}
      accessibilityLabel={words.giveTo(person.name, person.openCount, person.overdueCount)}
      haptic="impact"
      onPress={() => onGive(person.userId)}
    >
      {keyCap === null ? null : <kbd className="hg-team-dock-key">{keyCap}</kbd>}
      <span className="hg-team-dock-ring" style={ring}>
        <Avatar name={person.name} size={layout === 'tiles' ? 56 : 40} />
      </span>
      <span className="hg-team-dock-name">{you ? words.you : shortNameOf(person.name)}</span>
      <span className="hg-team-dock-open">{words.open(person.openCount)}</span>
      {late || layout === 'tiles' ? (
        <span className="hg-team-dock-overdue">
          {late ? <ShellGlyph name="alert-triangle" size="sm" tone="warning" /> : null}
          {words.overdue(person.overdueCount)}
        </span>
      ) : null}
    </Pressable>
  );
}
