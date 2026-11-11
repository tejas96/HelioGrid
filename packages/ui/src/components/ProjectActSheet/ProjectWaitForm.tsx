import { BLOCKER_PARTIES, type BlockerParty, type BlockerReason } from '@heliogrid/domain';
import { useState } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { DatePicker } from '../DatePicker';
import { ActSend, ChoiceChips, dayOf } from '../LeadActSheet/LeadActParts';
import { OptionCardGroup } from '../OptionCardGroup';
import { PARTY_GLYPH } from '../ProjectDetail/ProjectDetail.logic';
import { Textarea } from '../Textarea';
import { partyOf, reasonFor, reasonsOf, typedOf } from './ProjectActSheet.logic';
import type { ProjectFormOf } from './ProjectActSheet.types';

/**
 * A wait (`M08-20`…`25`, the picked design): who — the four parties as tiles, each with what it
 * covers — then why, from that party's reasons; since when, said inline (today by default, never
 * after it) and changed with a tap; the team's own note behind *+ Team note*; and what the customer
 * will read of it. The note never reaches the customer.
 */
export function WaitForm({ form, sending, refusal, words }: ProjectFormOf<'wait'>) {
  const [party, setParty] = useState<BlockerParty | null>(null);
  const [reason, setReason] = useState<BlockerReason | null>(null);
  const [since, setSince] = useState<string | null>(form.today);
  const [changing, setChanging] = useState(false);
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState('');
  return (
    <>
      <OptionCardGroup
        ariaLabel={words.wait.title}
        columns={2}
        density="functional"
        disabled={sending}
        value={party ?? undefined}
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
        <ChoiceChips
          label={words.wait.why}
          options={reasonsOf(party).map((value) => ({ value, label: words.wait.reason(value) }))}
          value={reason}
          onChange={setReason}
          disabled={sending}
        />
      )}
      <div className="hg-project-act-inline">
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
      </div>
      {changing ? (
        <DatePicker
          label={words.wait.since}
          words={words.fields.date}
          value={since ?? undefined}
          max={form.today}
          disabled={sending}
          onChange={(value) => setSince(dayOf(value))}
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
        <div className="hg-project-act-sees">
          <span className="hg-project-act-overline">{words.wait.customerSees}</span>
          <span className="hg-project-act-sees-line">
            {words.wait.customerSeesLine(party, reason, since)}
          </span>
        </div>
      )}
      <ActSend
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
    </>
  );
}
