import { type FocusAfter, landFocusOn, useFocusAfter } from '../../primitives/FocusAfter';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Chip } from '../Chip/Chip';
import { IconButton } from '../IconButton/IconButton';
import { Input } from '../Input/Input';
import { NumberField } from '../NumberField/NumberField';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { Switch } from '../Switch/Switch';
import { FieldSaveLine, FoldRow, LinkAct, StepHint, StepNote } from './StepParts';
import type {
  FoldControl,
  HeldControl,
  MiniActProps,
  RowControl,
  StepControl,
  StepControlsProps,
} from './step-controls';
import { useOpenFold } from './use-open-fold';

/** What every part of the list hands down: the shared words and where focus lands after a row act. */
type Held = Pick<StepControlsProps, 'shared' | 'focusAfter'>;

/**
 * A small act at a row's end. One that may take itself away or turn itself off hands focus to the
 * step's title once pressed, so the keyboard never falls to the page's start.
 */
function RowAct({ act, focusAfter }: { act: MiniActProps; focusAfter: FocusAfter }) {
  const leaving = useFocusAfter(focusAfter);
  const press =
    act.leaves === true
      ? leaving(() => {
          act.onPress();
          landFocusOn(focusAfter);
        })
      : act.onPress;
  return (
    <IconButton
      size={36}
      variant="ghost"
      className="hg-pst-mini"
      label={act.label}
      disabled={act.disabled === true}
      onClick={press}
    >
      <ShellGlyph name={act.glyph} size="sm" />
    </IconButton>
  );
}

function Rows({ rows, focusAfter }: { rows: readonly RowControl[]; focusAfter: FocusAfter }) {
  return (
    <div className="hg-pst-rows hg-pst-tile">
      {rows.map((row) => {
        const words = (
          <span className="hg-pst-row-words">
            <span className="hg-pst-row-title">{row.title}</span>
            <span className="hg-pst-row-line">{row.line}</span>
          </span>
        );
        return (
          <div className="hg-pst-row" key={row.key}>
            {row.place === undefined ? null : <span className="hg-pst-row-n">{row.place}</span>}
            {row.open === undefined ? (
              words
            ) : (
              <Pressable
                className="hg-pst-row-press"
                accessibilityLabel={row.open.label}
                onPress={row.open.onPress}
              >
                {words}
              </Pressable>
            )}
            {row.items.map((item) =>
              item.kind === 'share' ? (
                <span className="hg-pst-share" key={item.key}>
                  <NumberField {...item.field} />
                </span>
              ) : (
                <RowAct key={item.key} act={item} focusAfter={focusAfter} />
              ),
            )}
          </div>
        );
      })}
    </div>
  );
}

function Chips({ control }: { control: HeldControl<'chips'> }) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a set of chips, named, not a form's fieldset
    <div className="hg-pst-chips" role="group" aria-label={control.name}>
      {control.chips.map((chip) => (
        <Chip
          key={chip.key}
          density="pick"
          active={chip.active === true}
          {...(chip.glyph === undefined ? {} : { glyph: chip.glyph })}
          onClick={chip.onPress}
        >
          {chip.label}
        </Chip>
      ))}
      {control.note === undefined ? null : (
        <span className="hg-pst-chips-note">{control.note}</span>
      )}
    </div>
  );
}

function Group({ control, held }: { control: HeldControl<'group'>; held: Held }) {
  return (
    <div className="hg-pst-field">
      {control.top === undefined ? null : (
        <span className="hg-pst-field-top">
          <span className="hg-pst-field-label">{control.top.label}</span>
          <span className="hg-pst-field-tag">{control.top.tag}</span>
        </span>
      )}
      <StepControls controls={control.items} {...held} />
    </div>
  );
}

/** The rows that open in place, one open at a time. */
function Folds({ rows, held }: { rows: readonly FoldControl[]; held: Held }) {
  const folds = useOpenFold<string>();
  return (
    <div className="hg-pst-folds hg-pst-tile">
      {rows.map(({ key, aside, controls, ...head }) =>
        aside === undefined ? (
          <FoldRow key={key} {...head} open={folds.isOpen(key)} onToggle={folds.toggle(key)}>
            <StepControls controls={controls} {...held} />
          </FoldRow>
        ) : (
          <FoldRow key={key} {...head} aside={<Switch {...aside} />} />
        ),
      )}
    </div>
  );
}

function Control({ control, held }: { control: StepControl; held: Held }) {
  switch (control.kind) {
    case 'number':
      return <NumberField {...control.field} />;
    case 'helper':
      return <span className="hg-pst-helper">{control.text}</span>;
    case 'save':
      return <FieldSaveLine save={control.save} words={held.shared} />;
    case 'pair':
      return (
        <div className="hg-pst-two">
          <StepControls controls={control.items} {...held} />
        </div>
      );
    case 'segmented':
      return <SegmentedControl {...control.props} />;
    case 'grid':
      return (
        <div className="hg-pst-months">
          <StepControls controls={control.items} {...held} />
        </div>
      );
    case 'switch':
      return <Switch {...control.props} />;
    case 'acts':
      return (
        <div className="hg-pst-acts">
          {control.acts.map((act) => (
            <LinkAct key={act.glyph} {...act} />
          ))}
        </div>
      );
    case 'input':
      return <Input {...control.props} />;
    case 'group':
      return <Group control={control} held={held} />;
    case 'note':
      return <StepNote notice={control.notice} tone={control.tone} glyph={control.glyph} />;
    case 'chips':
      return <Chips control={control} />;
    case 'hint':
      return <StepHint>{control.text}</StepHint>;
    case 'rows':
      return <Rows rows={control.rows} focusAfter={held.focusAfter} />;
    case 'folds':
      return <Folds rows={control.rows} held={held} />;
  }
}

/**
 * A step's controls, drawn in order from their data (`step-controls.ts`). `column` sets them in
 * the step's one column; without it they join the layout of whatever holds them.
 */
export function StepControls({ controls, column = false, ...held }: StepControlsProps) {
  const drawn = controls.map((control) => (
    <Control key={control.key} control={control} held={held} />
  ));
  return column ? <div className="hg-pst-controls">{drawn}</div> : drawn;
}
