import { BLOCKER_PARTIES, type BlockerParty, type BlockerReason } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { DatePicker } from '../DatePicker/DatePicker.native';
import type { ISODate } from '../DatePicker/DatePicker.types';
import { LeadActSend } from '../LeadActSheet/LeadActSend.native';
import { LeadChoiceChips } from '../LeadActSheet/LeadChoiceChips.native';
import { dayOf } from '../LeadActSheet/LeadParkForms.native';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup.native';
import { PARTY_GLYPH } from '../ProjectDetail/ProjectDetail.logic';
import { Textarea } from '../Textarea/Textarea.native';
import { partyOf, reasonFor, reasonsOf, typedOf } from './ProjectActSheet.logic';
import type { ProjectFormOf } from './ProjectActSheet.types';

/**
 * A wait on the phone (`M08-20`…`25`): who — the four parties with what each covers — then why,
 * from that party's reasons, since when (today by default, never after it), the team's own note,
 * and what the customer will read of it. The note never reaches the customer.
 */
export function WaitForm({ form, sending, refusal, words }: ProjectFormOf<'wait'>) {
  const { controlFill } = useGround();
  const [party, setParty] = useState<BlockerParty | null>(null);
  const [reason, setReason] = useState<BlockerReason | null>(null);
  const [since, setSince] = useState<ISODate | null>(form.today);
  const [changing, setChanging] = useState(false);
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState('');
  return (
    <View style={styles.form}>
      <OptionCardGroup
        ariaLabel={words.wait.title}
        columns={2}
        density="functional"
        disabled={sending}
        {...(party === null ? {} : { value: party })}
        options={BLOCKER_PARTIES.map((each) => ({
          value: each,
          title: words.wait.party(each),
          description: words.wait.partyHint[each],
          icon: <ShellGlyph name={PARTY_GLYPH[each] ?? 'clock'} size="md" tone="accent" />,
        }))}
        onChange={(value) => {
          const picked = partyOf(value);
          if (picked === null) return;
          setParty(picked);
          setReason(reasonFor(picked, reason));
        }}
      />
      {party === null ? null : (
        <LeadChoiceChips
          label={words.wait.why}
          choices={reasonsOf(party)}
          chosen={reason}
          word={(each) => words.wait.reason(each)}
          onChoose={setReason}
          disabled={sending}
        />
      )}
      <View style={styles.inline}>
        <Button
          variant="ghost"
          size="sm"
          expanded={changing}
          disabled={sending}
          icon={<ShellGlyph name="calendar" size="sm" tone="primary" />}
          onClick={() => setChanging(!changing)}
        >
          {since === null ? words.wait.since : words.wait.sinceDay(since, since === form.today)}
        </Button>
        {noting ? null : (
          <Button
            variant="ghost"
            size="sm"
            disabled={sending}
            icon={<ShellGlyph name="plus" size="sm" tone="primary" />}
            onClick={() => setNoting(true)}
          >
            {words.wait.teamNote}
          </Button>
        )}
      </View>
      {changing ? (
        <DatePicker
          words={words.fields.date}
          label={words.wait.since}
          max={form.today}
          {...(since === null ? {} : { value: since })}
          onChange={(value) => setSince(dayOf(value))}
          disabled={sending}
        />
      ) : null}
      {noting ? (
        <Textarea
          label={words.wait.note}
          placeholder={words.wait.notePlaceholder}
          value={note}
          onChange={setNote}
          rows={3}
          disabled={sending}
        />
      ) : null}
      {party === null || reason === null || since === null ? null : (
        <View style={[styles.sees, { backgroundColor: controlFill }]}>
          <Text variant="overline" color="secondary">
            {words.wait.customerSees}
          </Text>
          <Text variant="body-sm">{words.wait.customerSeesLine(party, reason, since)}</Text>
        </View>
      )}
      <LeadActSend
        label={words.wait.send}
        ready={party !== null && reason !== null && since !== null}
        pending={sending}
        failure={refusal}
        onSend={() => {
          if (party !== null && reason !== null && since !== null) {
            form.onSend({ party, reason, startedOn: since, note: typedOf(note) });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-4'] },
  inline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  sees: {
    gap: theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-4'],
    paddingVertical: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
  },
});
