import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { HueTile } from '../HueTile/HueTile';
import { Input } from '../Input/Input';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import type { ProposalPartAddProps } from './ProposalPartSheets.types';
import { usePartAdd } from './use-part-add';
import './ProposalPartSheets.css';

type PartAdding = ReturnType<typeof usePartAdd>;

function AddFields({ props, add }: { props: ProposalPartAddProps; add: PartAdding }) {
  const { words, saving, onSpreadsheet } = props;
  const { fields, certifiedChoice } = add;
  return (
    <div className="hg-pps-body" aria-busy={saving ? true : undefined}>
      {fields.map(({ key, ...field }) => (
        <Input key={key} {...field} />
      ))}
      {words.certified === undefined || certifiedChoice === null ? null : (
        <div className="hg-pps-certified hg-pps-tile">
          <HueTile glyph="shield-check" hue="success" size={36} stroke={1.7} />
          <span className="hg-pps-option-words">
            <span className="hg-pps-add-title">{words.certified.title}</span>
            <span className="hg-pps-option-line">{words.certified.line}</span>
          </span>
          <SegmentedControl {...certifiedChoice} />
        </div>
      )}
      {onSpreadsheet === undefined ? null : (
        <Pressable className="hg-pps-add" onPress={onSpreadsheet} disabled={saving}>
          <span className="hg-pps-add-in">
            <ShellGlyph name="spreadsheet" size="md" />
            <span className="hg-pps-option-words">
              <span className="hg-pps-add-title">{words.sheet}</span>
              <span className="hg-pps-option-line">{words.sheetLine}</span>
            </span>
          </span>
        </Pressable>
      )}
    </div>
  );
}

/** The sheet's foot: why a save was not taken, *Save* and what saving does. */
function AddFoot({ props, add }: { props: ProposalPartAddProps; add: PartAdding }) {
  const { words, saving, failure } = props;
  return (
    <div className="hg-pps-foot">
      {failure === undefined ? null : (
        <p className="hg-pps-failure" role="alert">
          {failure}
        </p>
      )}
      <Button variant="primary" size="lg" fullWidth loading={saving} onClick={add.save}>
        {words.save}
      </Button>
      <span className="hg-pps-foot-note">{words.saveLine}</span>
    </div>
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
    <EditorSurface
      open={open}
      onClose={() => {
        if (!saving) props.onClose();
      }}
      closeLabel={words.closeLabel}
      showClose
      dismissible={!saving}
      title={words.title}
      desktop="modal"
      footer={<AddFoot props={props} add={add} />}
    >
      {open ? <AddFields props={props} add={add} /> : null}
    </EditorSurface>
  );
}
