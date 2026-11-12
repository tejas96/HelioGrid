import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { Input } from '../Input/Input.native';
import { useFormat } from '../MarketProvider';
import { ProjectSheetSend } from '../ProjectActSheet/ProjectSheetSend.native';
import { Sheet } from '../Sheet/Sheet.native';
import { CollectForm } from './CollectForm.native';
import { sheetHeadOf } from './MoneySheet.logic';
import type { MoneySheetForm, MoneySheetProps } from './ProjectMoney.parts.types';
import { RecordForm } from './RecordForm.native';
import { type ReasonProps, useReasonForm } from './use-reason-form';

/**
 * The money sheets on the phone: one sheet each. While a send is out its fields are inert and
 * every way out — the drag, the backdrop, Back — waits; a refusal is said inside the sheet, above
 * its send. Each form keeps its own draft, so a closed sheet forgets it.
 */
export function MoneySheet(props: MoneySheetProps) {
  const { form, onClose, sending, words } = props;
  const format = useFormat();
  const head = form === null ? null : sheetHeadOf(form, words, format);
  const body = useRef<View>(null);
  const kind = form?.kind ?? null;
  // Collect hands over to Record inside the same sheet: the screen reader goes to the new form.
  useEffect(() => {
    if (kind !== null) focusScreenReaderOn(() => body.current);
  }, [kind]);
  const close = () => {
    if (!sending) onClose();
  };
  return (
    <Sheet
      open={form !== null}
      onClose={close}
      closeLabel={words.close}
      title={head?.title}
      subtitle={head?.line ?? undefined}
      dismissible={!sending}
    >
      {form === null ? null : (
        <View ref={body} style={styles.body} accessible={false}>
          <FormOf {...props} form={form} />
        </View>
      )}
    </Sheet>
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
    <>
      <Input {...reason.field} />
      <ProjectSheetSend {...reason.send} />
    </>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
});
