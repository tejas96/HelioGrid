import { View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Input } from '../Input/Input.native';
import { NumberField } from '../NumberField/NumberField.native';
import { Textarea } from '../Textarea/Textarea.native';
import { PartSheetFrame } from './PartSheetFrame.native';
import type { ProposalPhaseSheetProps } from './ProposalPartSheets.types';
import { phaseFields } from './sheet-fields';
import { sheetLayout } from './sheet-layout.native';
import { useSheetDraft } from './use-sheet-draft';

function PhaseFields({ fields }: { fields: ReturnType<typeof phaseFields> }) {
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
      <View style={sheetLayout.field}>
        <View style={sheetLayout.top}>
          <Text variant="field-label" color="secondary">
            {fields.description.label}
          </Text>
          <Text variant="caption" color="secondary">
            {fields.description.tag}
          </Text>
        </View>
        <Textarea {...fields.description.props} />
      </View>
      {fields.duration === null ? null : <NumberField {...fields.duration} />}
    </View>
  );
}

/**
 * One timeline step (`M06-12`, `T-M06-008`): its name, its one sentence and how long it takes.
 * *Done* stands in the sheet's own foot, as every shipped sheet with a main act.
 */
export function ProposalPhaseSheet({
  open,
  onClose,
  words,
  phase,
  needsSentence = false,
  onDone,
}: ProposalPhaseSheetProps) {
  const [draft, setDraft] = useSheetDraft(open, phase);
  const fields = draft === null ? null : phaseFields(draft, words, setDraft, needsSentence);
  return (
    <PartSheetFrame
      open={open}
      onClose={onClose}
      words={words}
      done={
        fields === null ? null : { disabled: !fields.named, press: () => onDone(fields.finished) }
      }
    >
      {open && fields !== null ? <PhaseFields fields={fields} /> : null}
    </PartSheetFrame>
  );
}
