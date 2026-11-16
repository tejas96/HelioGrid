import { View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Input } from '../Input/Input.native';
import { Select } from '../Select/Select.native';
import { PartSheetFrame } from './PartSheetFrame.native';
import type { ProposalPaymentPartSheetProps } from './ProposalPartSheets.types';
import { paymentPartFields } from './sheet-fields';
import { sheetLayout } from './sheet-layout.native';
import { useSheetDraft } from './use-sheet-draft';

function PartFields({
  fields,
  hint,
}: {
  fields: ReturnType<typeof paymentPartFields>;
  hint: ProposalPaymentPartSheetProps['words']['hint'];
}) {
  return (
    <View style={sheetLayout.body}>
      <View style={sheetLayout.field}>
        <View style={sheetLayout.top}>
          <Text variant="field-label" color="secondary">
            {fields.name.label}
          </Text>
          <Text variant="caption" color="secondary">
            {fields.name.tag}
          </Text>
        </View>
        <Input {...fields.name.props} />
      </View>
      <Select {...fields.due} />
      <View style={sheetLayout.hint}>
        <ShellGlyph name="info" size="sm" />
        <View style={sheetLayout.words}>
          <Text variant="caption" color="secondary">
            {hint}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * One payment part (`M06-13`, `T-M06-009`): its name, and the stage it falls due on. *Done*
 * stands in the sheet's own foot.
 */
export function ProposalPaymentPartSheet({
  open,
  onClose,
  words,
  part,
  stages,
  onDone,
}: ProposalPaymentPartSheetProps) {
  const [draft, setDraft] = useSheetDraft(open, part);
  const fields = draft === null ? null : paymentPartFields(draft, words, stages, setDraft);
  return (
    <PartSheetFrame
      open={open}
      onClose={onClose}
      words={words}
      done={
        fields === null ? null : { disabled: !fields.named, press: () => onDone(fields.finished) }
      }
    >
      {open && fields !== null ? <PartFields fields={fields} hint={words.hint} /> : null}
    </PartSheetFrame>
  );
}
