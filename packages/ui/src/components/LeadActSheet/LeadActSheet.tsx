import type { TranslatedText } from '@heliogrid/contracts';
import { EditorSurface } from '../EditorSurface';
import {
  CallBackForm,
  DisqualifyForm,
  type FormFrame,
  JunkForm,
  LogForm,
  SnoozeForm,
} from './LeadActForms';
import type { LeadActForm, LeadActSheetProps } from './LeadActSheet.types';
import { LeadContactForm } from './LeadContactForm';
import { LeadDetailsForm } from './LeadDetailsForm';
import { LeadLostForm } from './LeadLostForm';
import { LeadMessageBody } from './LeadMessageBody';
import { LeadVisitForm } from './LeadVisitForm';

/**
 * The lead's acts, each in one sheet (`SCR-M02-04`): below the editor breakpoint a sheet, above it
 * a decision centred over the page. While a send is out its fields are inert and every way out
 * waits; a failure is said inside the sheet, above its send. Each form starts afresh when opened.
 */
export function LeadActSheet({
  form,
  onClose,
  pending,
  failure,
  closeLabel,
  fields,
}: LeadActSheetProps) {
  const head = form === null ? null : headOf(form);
  return (
    <EditorSurface
      open={form !== null}
      onClose={() => {
        if (!pending) onClose();
      }}
      closeLabel={closeLabel}
      showClose
      title={head?.title}
      subtitle={head?.line}
      dismissible={!pending}
      desktop="modal"
    >
      {form === null ? null : (
        <div className="hg-lead-act" aria-busy={pending ? true : undefined}>
          <FormBody
            key={keyOf(form)}
            form={form}
            pending={pending}
            failure={failure}
            fields={fields}
          />
        </div>
      )}
    </EditorSurface>
  );
}

function FormBody({ form, ...frame }: FormFrame & { form: LeadActForm }) {
  switch (form.kind) {
    case 'log':
      return <LogForm form={form} {...frame} />;
    case 'visit':
      return <LeadVisitForm form={form} {...frame} />;
    case 'snooze':
      return <SnoozeForm form={form} {...frame} />;
    case 'disqualify':
      return <DisqualifyForm form={form} {...frame} />;
    case 'lost':
      return <LeadLostForm form={form} {...frame} />;
    case 'junk':
      return <JunkForm form={form} {...frame} />;
    case 'callBack':
      return <CallBackForm form={form} {...frame} />;
    case 'message':
      return <LeadMessageBody form={form} />;
    case 'contact':
      return <LeadContactForm form={form} {...frame} />;
    case 'details':
      return <LeadDetailsForm form={form} {...frame} />;
  }
}

/** The sheet's title and the line under it: what the act is, and what it does. */
function headOf(form: LeadActForm): { title: TranslatedText; line: TranslatedText } {
  if (form.kind === 'contact') {
    return {
      title: form.start === null ? form.words.title : form.words.editTitle,
      line: form.words.line,
    };
  }
  return { title: form.words.title, line: form.words.line };
}

/** A form opened again — another contact, a visit after a booking — starts with a fresh draft. */
function keyOf(form: LeadActForm): string {
  if (form.kind === 'contact') return `contact:${form.start?.phoneE164 ?? ''}`;
  if (form.kind === 'visit') return `visit:${form.mode}`;
  return form.kind;
}
