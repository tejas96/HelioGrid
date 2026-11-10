import { CALL_OUTCOMES, type CallOutcome } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { Textarea } from '../Textarea/Textarea.native';
import { LeadActSend, type LeadFormFrame } from './LeadActSend.native';
import type { LeadActForm } from './LeadActSheet.types';
import { LeadChoiceChips } from './LeadChoiceChips.native';

type LogKind = 'call' | 'note';

/**
 * Log activity (`M02-35`, `M02-43`): a call and how it ended with an optional note — no answer
 * sets one retry inside the calling window — or a note on its own.
 */
export function LeadLogForm({
  form,
  frame,
}: {
  form: Extract<LeadActForm, { kind: 'log' }>;
  frame: LeadFormFrame;
}) {
  const { words } = form;
  const [kind, setKind] = useState<LogKind>('call');
  const [outcome, setOutcome] = useState<CallOutcome | null>(null);
  const [note, setNote] = useState('');
  const typed = note.trim();
  const ready = kind === 'call' ? outcome !== null : typed !== '';
  const send = () => {
    if (kind === 'note') form.onSend({ kind: 'note', text: typed });
    else if (outcome !== null) {
      form.onSend({ kind: 'call', outcome, note: typed === '' ? null : typed });
    }
  };
  return (
    <View style={styles.form} pointerEvents={frame.pending ? 'none' : 'auto'}>
      <SegmentedControl
        ariaLabel={words.kindLabel}
        value={kind}
        options={[
          { value: 'call', label: words.call },
          { value: 'note', label: words.note },
        ]}
        onChange={(value) => setKind(value === 'note' ? 'note' : 'call')}
      />
      {kind === 'call' ? (
        <View style={styles.group}>
          <LeadChoiceChips
            label={words.outcomeLabel}
            choices={CALL_OUTCOMES}
            chosen={outcome}
            word={(each) => words.outcome[each]}
            onChoose={setOutcome}
            disabled={frame.pending}
          />
          {outcome === 'no_answer' ? (
            <Text variant="body-sm" color="secondary">
              {words.noAnswerLine}
            </Text>
          ) : null}
        </View>
      ) : null}
      <Textarea
        label={words.noteLabel}
        placeholder={words.notePlaceholder}
        value={note}
        onChange={setNote}
        rows={3}
        maxLength={2000}
        disabled={frame.pending}
      />
      <LeadActSend
        label={kind === 'call' ? words.send : words.sendNote}
        ready={ready}
        pending={frame.pending}
        failure={frame.failure}
        onSend={send}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-4'] },
  group: { gap: theme.spacing['sp-2'] },
});
