import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { LeadActSend, type LeadFormFrame } from './LeadActSend.native';
import type { LeadActForm } from './LeadActSheet.types';

/**
 * The message to copy (`M02-33`, `M02-47`): which message, its text composed for this lead, and
 * the phone's share sheet — which holds Copy and the person's own apps. It is sent from their own
 * phone; nothing here ever claims a delivery.
 */
export function LeadMessageForm({
  form,
  frame,
}: {
  form: Extract<LeadActForm, { kind: 'message' }>;
  frame: LeadFormFrame;
}) {
  const { words, read } = form;
  return (
    <View style={styles.form}>
      {form.templates.length > 1 ? (
        <SegmentedControl
          ariaLabel={words.templateLabel}
          value={form.template}
          options={form.templates.map((each) => ({ value: each.key, label: each.label }))}
          onChange={form.onTemplate}
        />
      ) : null}
      {read.kind === 'ready' && form.text !== null ? (
        <View style={styles.text}>
          <Text variant="body">{form.text}</Text>
        </View>
      ) : read.kind === 'failed' ? (
        <View style={styles.state}>
          <Text variant="body-sm" color="danger">
            {words.failed}
          </Text>
          <Button variant="secondary" size="sm" onClick={read.retry}>
            {words.retry}
          </Button>
        </View>
      ) : (
        <LoadingBars label={words.loading} bars={['line', 'line', 'line']} />
      )}
      {form.handedOn ? (
        <View style={styles.handed} accessibilityLiveRegion="polite">
          <ShellGlyph name="tick" size="sm" tone="success" />
          <Text variant="body-sm" color="success" style={styles.handedWords}>
            {words.handedOn}
          </Text>
        </View>
      ) : null}
      <LeadActSend
        label={words.send}
        ready={read.kind === 'ready' && form.text !== null}
        pending={frame.pending}
        failure={frame.failure}
        onSend={form.onSend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-4'] },
  text: {
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-functional'],
    backgroundColor: colors['canvas-sunken'],
  },
  state: { gap: theme.spacing['sp-2'], alignItems: 'flex-start' },
  handed: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  handedWords: { flexShrink: 1 },
});
