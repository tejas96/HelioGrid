import { theme } from '@heliogrid/theme';
import { useEffect, useRef, useState } from 'react';
import type { BlurEvent, FocusEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { closeKeyboard } from '../../primitives/Keyboard/use-keyboard.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Input } from '../Input/Input.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import {
  insertedOf,
  locationNoteOf,
  modeOf,
  modeOptionsOf,
  placeListOf,
  type SiteLocationFieldProps,
} from './SiteDetails.logic';
import { SitePlaceList } from './SitePlaceList.native';

/**
 * The location, on the phone: the word and the switch between its two ways, then the address with
 * the places it matched, or the two numbers read as one answer. A phone reports no paste, so more
 * than one character arriving at once is offered as coordinates first, in either way.
 */
export function SiteLocationField(props: SiteLocationFieldProps) {
  const { form, saving, acts, words } = props;
  const note = locationNoteOf(form, words);
  return (
    <View style={styles.field}>
      <View style={styles.top}>
        <Text variant="field-label" color="secondary" style={styles.label}>
          {words.location}
        </Text>
        <SegmentedControl
          ariaLabel={words.modeLabel}
          value={form.mode}
          options={modeOptionsOf(words)}
          fill
          style={styles.modes}
          onChange={(value) => {
            const mode = modeOf(value);
            if (mode !== null && !saving) acts.onMode(mode);
          }}
        />
      </View>
      {form.mode === 'address' ? <AddressSearch {...props} /> : <CoordinatePair {...props} />}
      {note.tone === 'success' ? (
        <View style={styles.found}>
          <ShellGlyph name="check" size="dense" tone="success" />
          <Text variant="field-helper" color="success" style={styles.foundWords}>
            {note.text}
          </Text>
        </View>
      ) : (
        <Text variant="field-helper" color={note.tone} live={note.tone === 'danger'}>
          {note.text}
        </Text>
      )}
    </View>
  );
}

/** A change to one field: a pasted pair of coordinates is used at once, anything else is typed. */
function typedInto(
  acts: SiteLocationFieldProps['acts'],
  previous: string,
  next: string,
  report: (value: string) => void,
): void {
  const inserted = insertedOf(previous, next);
  if (inserted.length > 1 && acts.onPaste(inserted)) return;
  report(next);
}

/**
 * The address and the places it matched, under it in the form's own flow: a list floating over the
 * map would hang outside its holder, where Android delivers no touch. It shows while the field is
 * being typed in and, with no pin yet, stays after the keyboard's return key — the places are the
 * only way on. A tap on a row never leaves the field first, and the field reports as typed, so
 * nothing typed is lost; the pick then closes the keyboard so the map is in view.
 */
function AddressSearch({ form, search, saving, acts, words }: SiteLocationFieldProps) {
  const [focused, setFocused] = useState(false);
  const list = placeListOf(search, words);
  const open = list !== null && (focused || form.pin === null);
  return (
    <View style={styles.search} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
      <Input
        label={words.address}
        labelSpokenOnly
        value={form.address}
        placeholder={words.addressPlaceholder}
        leading={<ShellGlyph name="search" size="sm" />}
        disabled={saving}
        onChange={(next) => typedInto(acts, form.address, next, acts.onAddress)}
      />
      {open && list !== null ? (
        <SitePlaceList
          list={list}
          label={words.placesLabel}
          disabled={saving}
          onPick={(placeId) => {
            closeKeyboard();
            acts.onPickPlace(placeId);
          }}
        />
      ) : null}
    </View>
  );
}

/**
 * Hears the focus leave a pair of fields. Moving from one to the other blurs the first and focuses
 * the second in an order the platform chooses, so a blur waits one turn for a focus to follow it.
 */
function usePairLeave(onLeave: () => void) {
  const held = useRef<number | null>(null);
  const wait = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leave = useRef(onLeave);
  leave.current = onLeave;
  const stop = () => {
    if (wait.current !== null) clearTimeout(wait.current);
    wait.current = null;
  };
  useEffect(
    () => () => {
      if (wait.current !== null) clearTimeout(wait.current);
    },
    [],
  );
  return {
    onFocus: (event: FocusEvent) => {
      stop();
      held.current = event.nativeEvent.target;
    },
    onBlur: (event: BlurEvent) => {
      if (held.current !== event.nativeEvent.target) return;
      held.current = null;
      stop();
      wait.current = setTimeout(() => leave.current(), 0);
    },
  };
}

/**
 * The two numbers are one answer: read when the focus leaves the pair — which the keyboard's
 * return key does too — never when it moves from one to the other.
 */
function CoordinatePair({ form, saving, acts, words }: SiteLocationFieldProps) {
  const pair = usePairLeave(() => {
    if (!saving) acts.onCoordinatesRead();
  });
  return (
    <View style={styles.two} onFocus={pair.onFocus} onBlur={pair.onBlur}>
      <Input
        label={words.latitude}
        mono
        value={form.latitude}
        disabled={saving}
        onChange={(next) => typedInto(acts, form.latitude, next, acts.onLatitude)}
        style={styles.cell}
      />
      <Input
        label={words.longitude}
        mono
        value={form.longitude}
        disabled={saving}
        onChange={(next) => typedInto(acts, form.longitude, next, acts.onLongitude)}
        style={styles.cell}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: theme.spacing['sp-2'] },
  /* One row, shared one part to two: the phone's switch has equal cells and no width of its own,
     so it is given its share and fills it — left to hug, its words broke mid-word. */
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
  },
  label: { flex: 1 },
  modes: { flex: 2 },
  search: { gap: theme.spacing['sp-2'] },
  two: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  /* Equal cells: a growing child sized to its content would crush its neighbour. */
  cell: { flex: 1, minWidth: 0 },
  found: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-1'] },
  foundWords: { flex: 1, minWidth: 0 },
});
