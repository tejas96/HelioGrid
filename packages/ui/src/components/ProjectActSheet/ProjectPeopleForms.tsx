import type { TranslatedText } from '@heliogrid/contracts';
import { useState } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { DatePicker } from '../DatePicker';
import { dayOf } from '../LeadActSheet/LeadActParts';
import { LoadingBars } from '../LoadingBars';
import { NamedGap } from '../NamedGap';
import { dispatchCrewOf, footOf, leftOnOf, managerSendOf, toggled } from './ProjectActSheet.logic';
import type {
  ProjectFormOf,
  ProjectPeopleReadProps,
  ProjectPersonChoice,
} from './ProjectActSheet.types';
import { ProjectSheetSend } from './ProjectSheetSend';

/**
 * *Dispatched* (ruling 6, the picked design): who goes to site, ticked from the installation team —
 * the last crew ticked to start with — each with the live projects they are on, and *Add a crew* to
 * invite one; the day it left the warehouse (today by default, never after it, never before the
 * material was ordered); what the move does. Sent with no one picked, it says so.
 */
export function DispatchForm({ form, words, ...frame }: ProjectFormOf<'dispatch'>) {
  const { sending } = frame;
  const [chosen, setChosen] = useState<readonly string[]>(form.start);
  const [day, setDay] = useState<string | null>(form.today);
  const [tried, setTried] = useState(false);
  const crew = dispatchCrewOf(form, chosen);
  const leftOn = leftOnOf(form, day);
  return (
    <>
      <fieldset className="hg-project-act-people" aria-label={words.dispatch.crew}>
        <legend className="hg-project-act-label">{words.dispatch.crew}</legend>
        <PeopleRead
          read={form.people}
          words={{ ...words.dispatch, retry: words.retry }}
          ready={(list) =>
            list.map((person) => (
              <PersonPick
                key={person.userId}
                person={person}
                on={chosen.includes(person.userId)}
                sending={sending}
                line={words.dispatch.liveProjects(person.liveProjects)}
                onPress={() => setChosen(toggled(chosen, person.userId))}
              />
            ))
          }
        />
        {tried && crew === null ? (
          <p className="hg-project-act-failed" role="alert">
            {words.dispatch.crewNeeded}
          </p>
        ) : null}
        <span className="hg-project-act-start">
          <Button
            variant="ghost"
            size="sm"
            disabled={sending}
            icon={<ShellGlyph name="plus" size="sm" tone="primary" />}
            onClick={form.onAddCrew}
          >
            {words.dispatch.addCrew}
          </Button>
        </span>
      </fieldset>
      <DatePicker
        label={words.dispatch.leftOn}
        words={words.fields.date}
        value={day ?? undefined}
        min={form.firstDay}
        max={form.today}
        disabled={sending}
        onChange={(value) => setDay(dayOf(value))}
      />
      <p className="hg-project-act-note">{words.dispatch.help(form.waitingOn)}</p>
      <ProjectSheetSend
        label={words.dispatch.send}
        ready={leftOn !== null}
        {...footOf(frame)}
        onSend={() => {
          setTried(true);
          if (crew !== null && leftOn !== null) form.onSend(crew, leftOn);
        }}
        glyph="truck"
        destructive={false}
      />
    </>
  );
}

/** One installer to tick: their name, the live projects they are on, a tick when picked. */
function PersonPick({
  person,
  role = 'checkbox',
  on,
  sending,
  line,
  onPress,
}: {
  person: ProjectPersonChoice;
  /** A crew ticks any number; a manager is one of them. */
  role?: 'checkbox' | 'radio';
  on: boolean;
  sending: boolean;
  line: TranslatedText;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="hg-project-act-person"
      accessibilityRole={role}
      accessibilityState={{ checked: on }}
      disabled={sending}
      haptic="selection"
      ripple="bounded"
      onPress={onPress}
    >
      <Avatar name={person.name} size={32} />
      <span className="hg-project-act-person-words">
        <span className="hg-project-act-person-name">{person.name}</span>
        <span className="hg-project-act-note">{line}</span>
      </span>
      {on ? <ShellGlyph name="tick" size="md" tone="accent" /> : null}
    </Pressable>
  );
}

/** A new manager (ruling 12): one pick among who may manage, with the live projects of the one picked. */
export function ManagerForm({ form, words, ...frame }: ProjectFormOf<'manager'>) {
  const [managerId, setManagerId] = useState(form.start);
  return (
    <>
      <fieldset className="hg-project-act-people" aria-label={words.manager.title}>
        <PeopleRead
          read={form.people}
          words={{ ...words.manager, retry: words.retry }}
          ready={(list) =>
            list.map((person) => (
              <PersonPick
                key={person.userId}
                person={person}
                role="radio"
                on={person.userId === managerId}
                sending={frame.sending}
                line={words.dispatch.liveProjects(person.liveProjects)}
                onPress={() => setManagerId(person.userId)}
              />
            ))
          }
        />
      </fieldset>
      <ProjectSheetSend
        label={words.manager.send}
        {...footOf(frame)}
        {...managerSendOf(form, managerId)}
        glyph={null}
        destructive={false}
      />
    </>
  );
}

/** Who can be picked: the list while it is read, its failure with *Try again*, none yet, or the pick. */
function PeopleRead({ read, words, ready }: ProjectPeopleReadProps) {
  switch (read.kind) {
    case 'loading':
      return <LoadingBars label={words.loading} bars={['option', 'option']} />;
    case 'failed':
      return (
        <div className="hg-project-act-read">
          <span className="hg-project-act-failed">{words.failed}</span>
          <Button variant="secondary" size="sm" onClick={read.retry}>
            {words.retry}
          </Button>
        </div>
      );
    case 'empty':
      return <NamedGap gap={words.none} />;
    case 'ready':
      return <>{ready(read.value)}</>;
  }
}
