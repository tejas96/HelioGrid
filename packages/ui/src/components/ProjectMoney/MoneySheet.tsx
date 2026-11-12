import { useEffect, useRef } from 'react';
import { EditorSurface } from '../EditorSurface';
import { Input } from '../Input';
import { useFormat } from '../MarketProvider';
import { OneLine } from '../ProjectActSheet/ProjectActForms';
import { ProjectSheetSend } from '../ProjectActSheet/ProjectSheetSend';
import { CollectForm } from './CollectForm';
import { sheetHeadOf } from './MoneySheet.logic';
import type { MoneySheetForm, MoneySheetProps } from './ProjectMoney.parts.types';
import { RecordForm } from './RecordForm';
import { type ReasonProps, useReasonForm } from './use-reason-form';

/**
 * The money sheets on the web: below the editor breakpoint a sheet, above it a decision centred
 * over the page. While a send is out its fields are inert and every way out waits; a refusal is
 * said inside the sheet, above its send. Each form starts afresh when opened.
 */
export function MoneySheet(props: MoneySheetProps) {
  const { form, onClose, sending, words } = props;
  const format = useFormat();
  const head = form === null ? null : sheetHeadOf(form, words, format);
  const body = useRef<HTMLDivElement>(null);
  const kind = form?.kind ?? null;
  // Collect hands over to Record inside the same sheet: focus goes to the new form, not the page.
  useEffect(() => {
    if (kind !== null) body.current?.focus();
  }, [kind]);
  const close = () => {
    if (!sending) onClose();
  };
  return (
    <EditorSurface
      open={form !== null}
      onClose={close}
      closeLabel={words.close}
      showClose
      title={head?.title}
      subtitle={head?.line ?? undefined}
      dismissible={!sending}
      desktop="modal"
    >
      {form === null ? null : (
        <div
          ref={body}
          tabIndex={-1}
          className="hg-money-sheet hg-focus-target"
          aria-busy={sending ? true : undefined}
        >
          <FormOf {...props} form={form} />
        </div>
      )}
    </EditorSurface>
  );
}

function FormOf(props: MoneySheetProps & { readonly form: MoneySheetForm }) {
  const { form } = props;
  switch (form.kind) {
    case 'collect':
      return <CollectForm {...props} form={form} />;
    case 'record':
      return <RecordForm {...props} form={form} />;
    case 'reverse':
    case 'waive':
      return <ReasonForm {...props} form={form} />;
  }
}

/** Why a payment is taken back or a part waived — the record explains itself (`M11-46`, `M11-49`). */
function ReasonForm(props: ReasonProps) {
  const reason = useReasonForm(props);
  return (
    <OneLine onSend={() => !props.sending && reason.send.onSend()}>
      <Input {...reason.field} />
      <ProjectSheetSend {...reason.send} />
    </OneLine>
  );
}
