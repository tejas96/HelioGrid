import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { closeKeyboard } from '../../primitives/Keyboard/use-keyboard.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { DatePicker } from '../DatePicker/DatePicker.native';
import { LottieMoment } from '../LottieMoment/LottieMoment.native';
import { NumberField } from '../NumberField/NumberField.native';
import { Sheet } from '../Sheet/Sheet.native';
import { MarkWonManagerField } from './MarkWonManager.native';
import type { MarkWonSheetProps } from './MarkWonSheet.types';
import { useMarkWonForm } from './use-mark-won-form';

/**
 * *Mark won* on the phone: one sheet over the lead, risen above the keyboard while a field is in
 * use; while the send is out its fields are inert and the drag, the backdrop and Back all wait.
 * Once the project exists the sheet says so and offers it.
 */
export function MarkWonSheet(props: MarkWonSheetProps) {
  const { open, words, sending, started, onClose } = props;
  return (
    <Sheet
      open={open}
      onClose={() => {
        if (!sending) onClose();
      }}
      closeLabel={words.close}
      title={words.title}
      subtitle={started === null ? words.who : undefined}
      dismissible={!sending}
    >
      {!open ? null : started === null ? (
        <MarkWonForm {...props} />
      ) : (
        <MarkWonStarted {...props} number={started.number} />
      )}
    </Sheet>
  );
}

function MarkWonForm(props: MarkWonSheetProps) {
  const form = useMarkWonForm(props);
  return (
    <View style={styles.form}>
      <Text variant="body-sm" color="secondary">
        {props.words.line}
      </Text>
      <NumberField {...form.value} />
      {/* A touch on the date lets the value's keyboard go first: left up, it covers the calendar's
          rows (Android). The touch itself goes on to the picker. */}
      <View onTouchStart={closeKeyboard}>
        <DatePicker {...form.date} />
      </View>
      <MarkWonManagerField {...form.manager} />
      <View style={styles.foot}>
        {form.failure === null ? null : (
          <Text variant="body-sm" color="danger" live>
            {form.failure}
          </Text>
        )}
        <Button {...form.send} icon={<ShellGlyph name="tick" size="md" tone="inverse" />}>
          {props.words.send}
        </Button>
      </View>
    </View>
  );
}

/** The moment the project exists: its number, and the way to it — where the screen reader lands. */
function MarkWonStarted({ words, onOpenProject, number }: MarkWonSheetProps & { number: string }) {
  const openRef = useRef<FocusHandle>(null);
  useEffect(() => {
    openRef.current?.focus();
  }, []);
  return (
    <View style={styles.started} accessibilityLiveRegion="polite">
      <LottieMoment name="success" size={96} />
      <Text variant="h2" align="center">
        {words.started(number)}
      </Text>
      <Button
        ref={openRef}
        variant="primary"
        size="lg"
        fullWidth
        iconRight={<ShellGlyph name="arrow-right" size="md" tone="inverse" />}
        onClick={onOpenProject}
      >
        {words.openProject}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-4'] },
  foot: { gap: theme.spacing['sp-2'], paddingTop: theme.spacing['sp-2'] },
  started: {
    alignItems: 'center',
    gap: theme.spacing['sp-4'],
    paddingTop: theme.spacing['sp-2'],
    paddingBottom: theme.spacing['sp-4'],
  },
});
