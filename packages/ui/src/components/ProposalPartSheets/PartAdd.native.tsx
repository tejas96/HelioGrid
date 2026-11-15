import { View } from 'react-native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { HueTile } from '../HueTile/HueTile.native';
import { Input } from '../Input/Input.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { Sheet } from '../Sheet/Sheet.native';
import type { ProposalPartAddProps } from './ProposalPartSheets.types';
import { sheetLayout } from './sheet-layout.native';
import { usePartAdd } from './use-part-add';

type PartAdding = ReturnType<typeof usePartAdd>;

function AddFields({ props, add }: { props: ProposalPartAddProps; add: PartAdding }) {
  const { words, saving, onSpreadsheet } = props;
  const { fields, certifiedChoice } = add;
  return (
    <View style={sheetLayout.body}>
      {fields.map(({ key, ...field }) => (
        <Input key={key} {...field} />
      ))}
      {words.certified === undefined || certifiedChoice === null ? null : (
        <View style={[tileSurface, sheetLayout.row]}>
          <GroundProvider ground="tile">
            <HueTile glyph="shield-check" hue="success" size={36} stroke={1.7} />
            <View style={sheetLayout.words}>
              <Text variant="body" bold>
                {words.certified.title}
              </Text>
              <Text variant="body-sm" color="secondary">
                {words.certified.line}
              </Text>
            </View>
            <SegmentedControl {...certifiedChoice} />
          </GroundProvider>
        </View>
      )}
      {onSpreadsheet === undefined ? null : (
        <Pressable
          style={[sheetLayout.row, sheetLayout.outlined]}
          onPress={onSpreadsheet}
          disabled={saving}
        >
          <ShellGlyph name="spreadsheet" size="md" tone="accent" />
          <View style={sheetLayout.words}>
            <Text variant="body" color="accent" bold>
              {words.sheet}
            </Text>
            <Text variant="body-sm" color="secondary">
              {words.sheetLine}
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

/** The sheet's foot: why a save was not taken, *Save* and what saving does. */
function AddFoot({ props, add }: { props: ProposalPartAddProps; add: PartAdding }) {
  const { words, saving, failure } = props;
  return (
    <View style={sheetLayout.foot}>
      {failure === undefined ? null : (
        <Text variant="body-sm" color="danger" live>
          {failure}
        </Text>
      )}
      <Button variant="primary" size="lg" fullWidth loading={saving} onClick={add.save}>
        {words.save}
      </Button>
      <Text variant="caption" color="secondary" align="center">
        {words.saveLine}
      </Text>
    </View>
  );
}

/**
 * *Add a new part* (`M06-28`): saved to the catalog or the company's parts and picked in place, so
 * a missing brand is never a dead end and the flow never leaves step 8. While the save is out its
 * fields are inert and the sheet waits.
 */
export function ProposalPartAdd(props: ProposalPartAddProps) {
  const { open, saving, words } = props;
  const add = usePartAdd(props);
  return (
    <Sheet
      open={open}
      onClose={() => {
        if (!saving) props.onClose();
      }}
      closeLabel={words.closeLabel}
      showClose
      dismissible={!saving}
      title={words.title}
      footer={<AddFoot props={props} add={add} />}
    >
      {open ? <AddFields props={props} add={add} /> : null}
    </Sheet>
  );
}
