import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Button } from '../Button/Button.native';
import { DatePicker } from '../DatePicker/DatePicker.native';
import type { ISODate } from '../DatePicker/DatePicker.types';
import { dayOf } from '../LeadActSheet/LeadParkForms.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { dispatchCrewOf, footOf, leftOnOf, managerSendOf, toggled } from './ProjectActSheet.logic';
import type {
  ProjectFormOf,
  ProjectPeopleReadProps,
  ProjectPersonChoice,
} from './ProjectActSheet.types';
import { ProjectSheetSend } from './ProjectSheetSend.native';

/**
 * *Dispatched* on the phone (ruling 6, the picked design): who goes to site, ticked from the
 * installation team, *Add a crew* to invite one, the day it left the warehouse, and what the move
 * does. Sent with no one picked, it says so.
 */
export function DispatchForm({ form, words, ...frame }: ProjectFormOf<'dispatch'>) {
  const { sending } = frame;
  const [chosen, setChosen] = useState<readonly string[]>(form.start);
  const [day, setDay] = useState<ISODate | null>(form.today);
  const [tried, setTried] = useState(false);
  const crew = dispatchCrewOf(form, chosen);
  const leftOn = leftOnOf(form, day);
  return (
    <View style={styles.form}>
      <View style={styles.people} accessibilityLabel={words.dispatch.crew} role="group">
        <Text variant="field-label" color="secondary">
          {words.dispatch.crew}
        </Text>
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
          <Text variant="body-sm" color="danger" live>
            {words.dispatch.crewNeeded}
          </Text>
        ) : null}
        <View style={styles.start}>
          <Button
            variant="ghost"
            size="sm"
            disabled={sending}
            icon={<ShellGlyph name="plus" size="sm" tone="primary" />}
            onClick={form.onAddCrew}
          >
            {words.dispatch.addCrew}
          </Button>
        </View>
      </View>
      <DatePicker
        label={words.dispatch.leftOn}
        words={words.fields.date}
        min={form.firstDay}
        max={form.today}
        {...(day === null ? {} : { value: day })}
        onChange={(value) => setDay(dayOf(value))}
        disabled={sending}
      />
      <Text variant="caption" color="secondary">
        {words.dispatch.help(form.waitingOn)}
      </Text>
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
    </View>
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
  const { controlFill } = useGround();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ checked: on }}
      disabled={sending}
      haptic="selection"
      ripple="bounded"
      onPress={onPress}
      style={[styles.person, { backgroundColor: controlFill }, on ? styles.personOn : undefined]}
    >
      <Avatar name={person.name} size={32} />
      <View style={styles.personWords}>
        <Text variant="body" bold color={on ? 'accent' : 'primary'}>
          {person.name}
        </Text>
        <Text variant="body-sm" color="secondary">
          {line}
        </Text>
      </View>
      {on ? <ShellGlyph name="tick" size="md" tone="accent" /> : null}
    </Pressable>
  );
}

/** A new manager on the phone (ruling 12): one pick, with the live projects of the one picked. */
export function ManagerForm({ form, words, ...frame }: ProjectFormOf<'manager'>) {
  const [managerId, setManagerId] = useState(form.start);
  return (
    <View style={styles.form}>
      <View style={styles.people} accessibilityLabel={words.manager.title} role="radiogroup">
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
      </View>
      <ProjectSheetSend
        label={words.manager.send}
        {...footOf(frame)}
        {...managerSendOf(form, managerId)}
        glyph={null}
        destructive={false}
      />
    </View>
  );
}

/** Who can be picked: the list while it is read, its failure with *Try again*, none yet, or the pick. */
function PeopleRead({ read, words, ready }: ProjectPeopleReadProps) {
  switch (read.kind) {
    case 'loading':
      return <LoadingBars label={words.loading} bars={['option', 'option']} />;
    case 'failed':
      return (
        <View style={styles.state}>
          <Text variant="body-sm" color="danger">
            {words.failed}
          </Text>
          <Button variant="secondary" size="sm" onClick={read.retry}>
            {words.retry}
          </Button>
        </View>
      );
    case 'empty':
      return <NamedGap gap={words.none} />;
    case 'ready':
      return <>{ready(read.value)}</>;
  }
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-4'] },
  state: { gap: theme.spacing['sp-2'], alignItems: 'flex-start' },
  people: { gap: theme.spacing['sp-2'] },
  start: { flexDirection: 'row' },
  /* The radius sits on the target itself, so Android's ripple keeps to the round corners. */
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-tile'],
  },
  personOn: { backgroundColor: colors['accent-subtle'] },
  personWords: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
});
