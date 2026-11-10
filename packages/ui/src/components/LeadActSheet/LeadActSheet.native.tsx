import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Sheet } from '../Sheet/Sheet.native';
import type { LeadFormFrame } from './LeadActSend.native';
import type { LeadActForm, LeadActSheetProps } from './LeadActSheet.types';
import { LeadContactForm } from './LeadContactForm.native';
import { LeadLogForm } from './LeadLogForm.native';
import { LeadMessageForm } from './LeadMessageForm.native';
import {
  LeadCallBackForm,
  LeadDisqualifyForm,
  LeadJunkForm,
  LeadSnoozeForm,
} from './LeadParkForms.native';
import { LeadVisitForm } from './LeadVisitForm.native';

function titleOf(form: LeadActForm): TranslatedText {
  if (form.kind === 'contact' && form.start !== null) return form.words.editTitle;
  return form.words.title;
}

/** A new act, or another contact or visit, starts a fresh draft. */
function draftKeyOf(form: LeadActForm): string {
  if (form.kind === 'contact') return `contact:${form.start?.phoneE164 ?? ''}`;
  if (form.kind === 'visit') return `visit:${form.mode}`;
  return form.kind;
}

/**
 * The lead's acts, each in one sheet (`SCR-M02-04`), on the phone: the form the act needs, its
 * failure said inside it, and every way out — the drag, the backdrop, Back — waiting while its
 * send is out.
 */
export function LeadActSheet({
  form,
  onClose,
  pending,
  failure,
  closeLabel,
  fields,
}: LeadActSheetProps) {
  const frame: LeadFormFrame = { pending, failure, fields };
  return (
    <Sheet
      open={form !== null}
      onClose={onClose}
      closeLabel={closeLabel}
      title={form === null ? undefined : titleOf(form)}
      subtitle={form === null ? undefined : form.words.line}
      dismissible={!pending}
    >
      {form === null ? null : (
        <View style={styles.body}>
          <FormOf key={draftKeyOf(form)} form={form} frame={frame} />
        </View>
      )}
    </Sheet>
  );
}

/** The form the act needs — each keeps its own draft, so a closed sheet forgets it. */
function FormOf({ form, frame }: { form: LeadActForm; frame: LeadFormFrame }) {
  switch (form.kind) {
    case 'log':
      return <LeadLogForm form={form} frame={frame} />;
    case 'visit':
      return <LeadVisitForm form={form} frame={frame} />;
    case 'snooze':
      return <LeadSnoozeForm form={form} frame={frame} />;
    case 'disqualify':
      return <LeadDisqualifyForm form={form} frame={frame} />;
    case 'junk':
      return <LeadJunkForm form={form} frame={frame} />;
    case 'callBack':
      return <LeadCallBackForm form={form} frame={frame} />;
    case 'message':
      return <LeadMessageForm form={form} frame={frame} />;
    case 'contact':
      return <LeadContactForm form={form} frame={frame} />;
  }
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
});
