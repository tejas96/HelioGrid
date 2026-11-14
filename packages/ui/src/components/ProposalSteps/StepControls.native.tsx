import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors.native';
import type { FocusAfter } from '../../primitives/FocusAfter/FocusAfter.types';
import { landFocusOn, useFocusAfter } from '../../primitives/FocusAfter/use-focus-after.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Chip } from '../Chip/Chip.native';
import { IconButton } from '../IconButton/IconButton.native';
import { Input } from '../Input/Input.native';
import { NumberField } from '../NumberField/NumberField.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { Switch } from '../Switch/Switch.native';
import {
  FieldSaveLine,
  FoldRow,
  LinkAct,
  StepHint,
  StepNote,
  StepTile,
  stepLayout,
} from './StepParts.native';
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
 * A small act at a row's end. One that may take itself away or turn itself off sends the screen
 * reader to the step's title once pressed, so it never stays on a row that is gone.
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
      /* A move that can happen sits on the tile's well, as the web's `.hg-pst-mini`; one that cannot
         keeps IconButton's sunk disabled look. */
      variant={act.disabled === true ? 'ghost' : 'surface'}
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
    <StepTile>
      {rows.map((row, index) => {
        const words = (
          <>
            <Text variant="body" style={styles.rowTitle}>
              {row.title}
            </Text>
            <Text variant="caption" color="secondary">
              {row.line}
            </Text>
          </>
        );
        return (
          <View key={row.key} style={[styles.row, index > 0 ? styles.divided : undefined]}>
            {row.place === undefined ? null : (
              <Text variant="mono" color="secondary">
                {row.place}
              </Text>
            )}
            {row.open === undefined ? (
              <View style={styles.words}>{words}</View>
            ) : (
              <Pressable
                style={styles.press}
                accessibilityLabel={row.open.label}
                onPress={row.open.onPress}
              >
                {words}
              </Pressable>
            )}
            {row.items.map((item) =>
              item.kind === 'share' ? (
                <View key={item.key} style={styles.share}>
                  <NumberField {...item.field} />
                </View>
              ) : (
                <RowAct key={item.key} act={item} focusAfter={focusAfter} />
              ),
            )}
          </View>
        );
      })}
    </StepTile>
  );
}

function Chips({ control }: { control: HeldControl<'chips'> }) {
  return (
    <>
      <View style={stepLayout.chips} role="group" accessibilityLabel={control.name}>
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
      </View>
      {control.note === undefined ? null : (
        <Text variant="caption" color="secondary">
          {control.note}
        </Text>
      )}
    </>
  );
}

function Group({ control, held }: { control: HeldControl<'group'>; held: Held }) {
  return (
    <View style={stepLayout.field}>
      {control.top === undefined ? null : (
        <View style={stepLayout.top}>
          <Text variant="field-label" color="secondary">
            {control.top.label}
          </Text>
          <Text variant="caption" color="secondary">
            {control.top.tag}
          </Text>
        </View>
      )}
      <StepControls controls={control.items} {...held} />
    </View>
  );
}

/** The rows that open in place, one open at a time. */
function Folds({ rows, held }: { rows: readonly FoldControl[]; held: Held }) {
  const folds = useOpenFold<string>();
  return (
    <StepTile>
      {rows.map(({ key, aside, controls, ...head }, index) =>
        aside === undefined ? (
          <FoldRow
            key={key}
            first={index === 0}
            {...head}
            open={folds.isOpen(key)}
            onToggle={folds.toggle(key)}
          >
            <StepControls controls={controls} {...held} />
          </FoldRow>
        ) : (
          <FoldRow key={key} first={index === 0} {...head} aside={<Switch {...aside} />} />
        ),
      )}
    </StepTile>
  );
}

/** Controls side by side, each in an equal share of the row. */
function Cells({ control, held }: { control: HeldControl<'pair' | 'grid'>; held: Held }) {
  const pair = control.kind === 'pair';
  return (
    <View style={pair ? stepLayout.two : styles.months}>
      {control.items.map((item) => (
        <View key={item.key} style={pair ? stepLayout.half : styles.month}>
          <Control control={item} held={held} />
        </View>
      ))}
    </View>
  );
}

function Control({ control, held }: { control: StepControl; held: Held }) {
  switch (control.kind) {
    case 'number':
      return <NumberField {...control.field} />;
    case 'helper':
      return (
        <Text variant="field-helper" color="secondary">
          {control.text}
        </Text>
      );
    case 'save':
      return <FieldSaveLine save={control.save} words={held.shared} />;
    case 'pair':
    case 'grid':
      return <Cells control={control} held={held} />;
    case 'segmented':
      return <SegmentedControl {...control.props} />;
    case 'acts':
      return (
        <View style={stepLayout.acts}>
          {control.acts.map((act) => (
            <LinkAct key={act.glyph} {...act} />
          ))}
        </View>
      );
    case 'switch':
      return <Switch {...control.props} />;
    case 'group':
      return <Group control={control} held={held} />;
    case 'input':
      return <Input {...control.props} />;
    case 'chips':
      return <Chips control={control} />;
    case 'note':
      return <StepNote notice={control.notice} tone={control.tone} glyph={control.glyph} />;
    case 'rows':
      return <Rows rows={control.rows} focusAfter={held.focusAfter} />;
    case 'hint':
      return <StepHint>{control.text}</StepHint>;
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
  return column ? <View style={stepLayout.column}>{drawn}</View> : drawn;
}

const styles = StyleSheet.create({
  // A row's name at medium weight, as the web's `.hg-pst-row-title`.
  rowTitle: { fontWeight: `${theme.type.weights.medium}` },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: 60,
    paddingVertical: 10,
    paddingLeft: theme.spacing['sp-4'],
    paddingRight: theme.spacing['sp-3'],
  },
  divided: { borderTopWidth: 1, borderTopColor: colors['line-soft'] },
  words: { flex: 1, minWidth: 0 },
  press: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  share: { width: 84 },
  months: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  /* Four months a row, as the design draws them: twelve months in three even rows. */
  month: { width: '22%', flexGrow: 1 },
});
