import { type KeyboardEvent, useEffect, useRef } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { DatePicker } from '../DatePicker';
import { EditorSurface } from '../EditorSurface';
import { LottieMoment } from '../LottieMoment';
import { NumberField } from '../NumberField';
import { MarkWonManagerField } from './MarkWonManager';
import type { MarkWonSheetProps } from './MarkWonSheet.types';
import { useMarkWonForm } from './use-mark-won-form';
import './MarkWonSheet.css';

/**
 * *Mark won* on the web: a sheet below the editor breakpoint, a decision centred over the lead
 * above it. Enter in the value sends, Esc closes; while the send is out its fields are inert and
 * every way out waits. Once the project exists the sheet says so and offers it.
 */
export function MarkWonSheet(props: MarkWonSheetProps) {
  const { open, words, sending, started, onClose } = props;
  return (
    <EditorSurface
      open={open}
      onClose={() => {
        if (!sending) onClose();
      }}
      closeLabel={words.close}
      showClose
      title={words.title}
      subtitle={started === null ? words.who : undefined}
      dismissible={!sending}
      desktop="modal"
    >
      {!open ? null : started === null ? (
        <MarkWonForm {...props} />
      ) : (
        <MarkWonStarted {...props} number={started.number} />
      )}
    </EditorSurface>
  );
}

function MarkWonForm(props: MarkWonSheetProps) {
  const form = useMarkWonForm(props);
  /* A form, so Enter in a typed field sends as the button does — the value field keeps Enter for
     its own commit, so the key is read here; on a trigger (the date, the manager) Enter opens that
     control instead. `dialog`: an Enter before the page is live reloads nothing. */
  const sendOnEnter = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) form.onSend();
  };
  return (
    <form
      className="hg-mark-won"
      method="dialog"
      noValidate
      aria-busy={props.sending ? true : undefined}
      onKeyDown={sendOnEnter}
      onSubmit={(event) => event.preventDefault()}
    >
      <Text variant="body-sm" color="secondary">
        {props.words.line}
      </Text>
      <NumberField {...form.value} />
      <DatePicker {...form.date} />
      <MarkWonManagerField {...form.manager} />
      <div className="hg-mark-won-send">
        {form.failure === null ? null : (
          <Text variant="body-sm" color="danger" live>
            {form.failure}
          </Text>
        )}
        <Button {...form.send} icon={<ShellGlyph name="tick" size="md" tone="inverse" />}>
          {props.words.send}
        </Button>
      </div>
    </form>
  );
}

/** The moment the project exists: its number, and the way to it — which takes the focus. */
function MarkWonStarted({ words, onOpenProject, number }: MarkWonSheetProps & { number: string }) {
  const openRef = useRef<FocusHandle>(null);
  useEffect(() => {
    openRef.current?.focus();
  }, []);
  return (
    <div className="hg-mark-won-started" role="status">
      <LottieMoment name="success" size={96} />
      <Text variant="h2" as="p" align="center">
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
    </div>
  );
}
