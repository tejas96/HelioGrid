import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Input } from '../Input/Input.native';
import { NumberField } from '../NumberField/NumberField.native';
import { Select } from '../Select/Select.native';
import { Textarea } from '../Textarea/Textarea.native';
import { BrandMark } from './PartPicker.native';
import { PartSheetFrame } from './PartSheetFrame.native';
import type { ProposalPartEditProps } from './ProposalPartSheets.types';
import { type PartFactField, partFactRows } from './sheet-fields';
import { sheetLayout } from './sheet-layout.native';
import { type PartEditing, usePartEdit } from './use-part-edit';

function Field({ field }: { field: PartFactField }) {
  if (field.kind === 'number') return <NumberField {...field.props} />;
  if (field.kind === 'choice') return <Select {...field.props} />;
  return <Input {...field.props} />;
}

function EditFields({ edit, words }: { edit: PartEditing; words: ProposalPartEditProps['words'] }) {
  const { line, facts, description } = edit;
  return (
    <View style={sheetLayout.body}>
      <View style={[tileSurface, sheetLayout.row]}>
        <GroundProvider ground="tile">
          <BrandMark brand={line.brand} />
          <View style={sheetLayout.words}>
            <Text variant="h3">{line.brand}</Text>
          </View>
          <ShellGlyph name="lock" size="sm" />
          <Text variant="caption" color="secondary">
            {words.brandFixed}
          </Text>
        </GroundProvider>
      </View>
      {partFactRows(facts).map((row) =>
        row.length === 1 && row[0] !== undefined ? (
          <Field key={row[0].key} field={row[0]} />
        ) : (
          <View key={row.map((field) => field.key).join(':')} style={styles.pair}>
            {row.map((field) => (
              <View key={field.key} style={styles.half}>
                <Field field={field} />
              </View>
            ))}
          </View>
        ),
      )}
      <View style={sheetLayout.field}>
        <View style={sheetLayout.top}>
          <Text variant="field-label" color="secondary">
            {description.label}
          </Text>
          <Text variant="caption" color="secondary">
            {description.tag}
          </Text>
        </View>
        <Textarea {...description.props} />
      </View>
      <View style={sheetLayout.hint}>
        <ShellGlyph name="info-circle" size="sm" />
        <View style={sheetLayout.words}>
          <Text variant="body-sm" color="secondary">
            {words.staysHere}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * *Edit what prints* (`M06-29`): the brand is fixed; the kind's own facts and one line for the
 * customer are this proposal's alone — the catalog item never changes (`M06-31`).
 */
export function ProposalPartEdit({ open, onClose, words, line, onDone }: ProposalPartEditProps) {
  const edit = usePartEdit(open, line, words);
  return (
    <PartSheetFrame
      open={open}
      onClose={onClose}
      words={words}
      done={edit === null ? null : { disabled: false, press: () => onDone(edit.line) }}
    >
      {open && edit !== null ? <EditFields edit={edit} words={words} /> : null}
    </PartSheetFrame>
  );
}

const styles = StyleSheet.create({
  /* Two figures of one kind side by side — a panel's count and its watt peak, as the web draws them. */
  pair: { flexDirection: 'row', gap: theme.spacing['sp-3'] },
  half: { flex: 1, minWidth: 0 },
});
