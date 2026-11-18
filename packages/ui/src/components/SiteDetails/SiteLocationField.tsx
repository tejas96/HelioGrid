import { useState } from 'react';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Input } from '../Input/Input';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import {
  firstPlaceOf,
  locationNoteOf,
  modeOf,
  modeOptionsOf,
  placeListOf,
  type SiteLocationFieldProps,
} from './SiteDetails.logic';
import { SitePlaceList } from './SitePlaceList';

/** Whether the focus that left one element went to another inside `holder`. */
function staysIn(holder: HTMLElement, next: EventTarget | null): boolean {
  return next instanceof Node && holder.contains(next);
}

/**
 * The location, on the web: the word and the switch between its two ways, then the address with
 * the places it matched, or the two numbers read as one answer. A pasted pair of coordinates is
 * used at once, in either way.
 */
export function SiteLocationField(props: SiteLocationFieldProps) {
  const { form, saving, acts, words } = props;
  const note = locationNoteOf(form, words);
  return (
    <div className="hg-site-field hg-site-wide">
      <div className="hg-site-fieldtop">
        <Text variant="field-label" color="secondary">
          {words.location}
        </Text>
        <SegmentedControl
          ariaLabel={words.modeLabel}
          value={form.mode}
          options={modeOptionsOf(words)}
          onChange={(value) => {
            const mode = modeOf(value);
            if (mode !== null && !saving) acts.onMode(mode);
          }}
        />
      </div>
      {/* A paste into either way's field is offered as coordinates first. */}
      <div
        className="hg-site-location"
        onPaste={(event) => {
          if (acts.onPaste(event.clipboardData.getData('text'))) event.preventDefault();
        }}
      >
        {form.mode === 'address' ? <AddressSearch {...props} /> : <CoordinatePair {...props} />}
      </div>
      {note.tone === 'success' ? (
        <Text variant="field-helper" color="success" className="hg-site-found">
          <ShellGlyph name="check" size="dense" tone="success" />
          {note.text}
        </Text>
      ) : (
        <Text variant="field-helper" color={note.tone} live={note.tone === 'danger'}>
          {note.text}
        </Text>
      )}
    </div>
  );
}

/**
 * The address and the places it matched. The list shows while the field or the list holds the
 * focus; a pick closes it, and typing opens it again. Enter picks the first place, Esc closes.
 */
function AddressSearch({ form, search, saving, acts, words }: SiteLocationFieldProps) {
  const [open, setOpen] = useState(false);
  const list = placeListOf(search, words);
  const pick = (placeId: string) => {
    setOpen(false);
    acts.onPickPlace(placeId);
  };
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the holder only hears its field's keys and where the focus is; the field and the rows are the controls
    <div
      className="hg-site-search"
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!staysIn(event.currentTarget, event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (!(event.target instanceof HTMLInputElement)) return;
        if (event.key === 'Escape') setOpen(false);
        const first = firstPlaceOf(search);
        if (event.key === 'Enter' && open && first !== null && !saving) pick(first);
      }}
    >
      <Input
        label={words.address}
        labelSpokenOnly
        value={form.address}
        placeholder={words.addressPlaceholder}
        leading={<ShellGlyph name="search" size="sm" />}
        disabled={saving}
        onChange={(address) => {
          setOpen(true);
          acts.onAddress(address);
        }}
      />
      {open && list !== null ? (
        <SitePlaceList list={list} label={words.placesLabel} disabled={saving} onPick={pick} />
      ) : null}
    </div>
  );
}

/** The two numbers are one answer: read on Enter, or when the focus leaves the pair. */
function CoordinatePair({ form, saving, acts, words }: SiteLocationFieldProps) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the holder only hears Enter and the focus leaving its two fields, which are the controls
    <div
      className="hg-site-two"
      onBlur={(event) => {
        if (!saving && !staysIn(event.currentTarget, event.relatedTarget)) {
          acts.onCoordinatesRead();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
          acts.onCoordinatesRead();
        }
      }}
    >
      <Input
        label={words.latitude}
        mono
        value={form.latitude}
        disabled={saving}
        onChange={acts.onLatitude}
      />
      <Input
        label={words.longitude}
        mono
        value={form.longitude}
        disabled={saving}
        onChange={acts.onLongitude}
      />
    </div>
  );
}
