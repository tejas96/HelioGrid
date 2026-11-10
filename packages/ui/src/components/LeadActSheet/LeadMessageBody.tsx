import { Button } from '../Button';
import { LoadingBars } from '../LoadingBars';
import { SegmentedControl } from '../SegmentedControl';
import type { LeadActForm } from './LeadActSheet.types';

type MessageForm = Extract<LeadActForm, { kind: 'message' }>;

/**
 * The message to copy (`M02-33`, `M02-47`): which message, its text ready to paste as the tenant
 * wrote it, and the one act that hands it on — never a sent or delivered claim.
 */
export function LeadMessageBody({ form }: { form: MessageForm }) {
  const { words, read, text } = form;
  return (
    <>
      {form.templates.length > 1 ? (
        <SegmentedControl
          label={words.templateLabel}
          value={form.template}
          options={form.templates.map((template) => ({
            value: template.key,
            label: template.label,
          }))}
          onChange={form.onTemplate}
        />
      ) : null}
      <MessageText form={form} />
      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={read.kind !== 'ready' || text === null}
        onClick={form.onSend}
      >
        {words.send}
      </Button>
      {form.handedOn ? (
        <p className="hg-lead-act-handed" role="status">
          {words.handedOn}
        </p>
      ) : null}
    </>
  );
}

/** The text while it is composed, its failure with Try again, or the text itself, selectable. */
function MessageText({ form }: { form: MessageForm }) {
  const { words, read, text } = form;
  if (read.kind === 'failed') {
    return (
      <div className="hg-lead-act-read">
        <span className="hg-lead-act-label">{words.failed}</span>
        <Button variant="secondary" size="sm" onClick={read.retry}>
          {words.retry}
        </Button>
      </div>
    );
  }
  if (read.kind !== 'ready' || text === null) {
    return <LoadingBars label={words.loading} bars={['line', 'line', 'line']} />;
  }
  return <p className="hg-lead-act-message">{text}</p>;
}
