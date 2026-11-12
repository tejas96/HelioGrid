import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { IconButton } from '../IconButton/IconButton.native';
import { Radio } from '../Radio/Radio.native';
import { Sheet } from '../Sheet/Sheet.native';
import { chosenSortOf } from './ListTop.logic';
import type { ListRoom, ListSortProps } from './ListTop.types';

/**
 * The order of the list on the phone: the sort glyph opens the choices as a sheet of radio rows,
 * and a tap sorts the list and closes it. The phone has one room, so `room` changes nothing here.
 */
export function ListSort({ sort }: { sort: ListSortProps; room: ListRoom }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton
        label={sort.spokenName(chosenSortOf(sort))}
        pressed={open}
        onClick={() => setOpen(true)}
      >
        <ShellGlyph name="sort" size="md" tone="primary" />
      </IconButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        closeLabel={sort.closeLabel}
        title={sort.title}
        size="auto"
      >
        <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel={sort.title}>
          {sort.choices.map((choice) => (
            <Radio
              key={choice.key}
              name="list-sort"
              value={choice.key}
              label={choice.label}
              checked={choice.key === sort.chosen}
              onChange={() => {
                sort.onChoose(choice.key);
                setOpen(false);
              }}
            />
          ))}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  choices: { gap: theme.spacing['sp-1'], paddingBottom: theme.spacing['sp-2'] },
});
