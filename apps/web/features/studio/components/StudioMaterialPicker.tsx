'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MaterialPickerView, MaterialTile } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Button, IconButton, Input, Pressable, SegmentedControl, ShellGlyph } from '@heliogrid/ui';
import { useEffect, useRef } from 'react';
import { usePressAway } from '../hooks/use-press-away';
import { StudioMaterialPicture } from './StudioMaterialPicture';

interface PickerFacts {
  readonly picker: MaterialPickerView;
  readonly studio: StudioScreen;
  readonly words: StudioCanvasWords;
}

/** A type's picture and its name: a tap is the person's pick. The roof's own type is ringed. */
function Tile({ tile, studio, words }: { tile: MaterialTile } & Omit<PickerFacts, 'picker'>) {
  const { type, fragile, on } = tile;
  return (
    <Pressable
      className="hg-material-tile"
      accessibilityLabel={fragile ? words.materialFragile(type) : words.material(type)}
      accessibilityState={{ selected: on }}
      // A type of one's own is typed first: its tile opens the name.
      onPress={() =>
        type === 'other' ? studio.moves.pickerMode('other') : studio.moves.pickMaterial({ type })
      }
    >
      <StudioMaterialPicture type={type} fragile={fragile} />
      <span className="hg-material-tile-name">{words.material(type)}</span>
    </Pressable>
  );
}

/** The market's first five, All types, what the pick sets, and Confirm for a guess that is right. */
function FirstTypes({ picker, studio, words }: PickerFacts) {
  return (
    <>
      <fieldset className="hg-material-tiles" aria-label={words.pickerTitle}>
        {picker.first.map((tile) => (
          <Tile key={tile.type} tile={tile} studio={studio} words={words} />
        ))}
        <Pressable
          className="hg-material-tile"
          accessibilityLabel={words.allTypes}
          onPress={() => studio.moves.pickerMode('all')}
        >
          <span className="hg-material-tile-more">
            <ShellGlyph name="dots" size="md" />
          </span>
          <span className="hg-material-tile-name">{words.allTypes}</span>
        </Pressable>
      </fieldset>
      <p className="hg-material-line">{words.pickerLine}</p>
      {picker.confirmed ? null : (
        <div className="hg-roofs-acts">
          <Button
            variant="primary"
            size="md"
            icon={<ShellGlyph name="check" size="sm" />}
            onClick={studio.moves.confirmMaterial}
          >
            {words.confirmMaterial(picker.now)}
          </Button>
        </div>
      )}
    </>
  );
}

/** Every type in its group; a type that is on no list is last, on its own. */
function AllTypes({ picker, studio, words }: PickerFacts) {
  return (
    <div className="hg-material-groups">
      {picker.groups.map(({ group, tiles }) => (
        <fieldset key={group} className="hg-material-group">
          <legend className="hg-material-group-name">{words.materialGroup(group)}</legend>
          <div className="hg-material-tiles">
            {tiles.map((tile) => (
              <Tile key={tile.type} tile={tile} studio={studio} words={words} />
            ))}
          </div>
        </fieldset>
      ))}
      <fieldset className="hg-material-group">
        <legend className="hg-material-group-name">{words.notOnList}</legend>
        <div className="hg-material-tiles">
          <Tile
            tile={{ type: 'other', fragile: false, on: picker.now === 'other' }}
            studio={studio}
            words={words}
          />
        </div>
      </fieldset>
    </div>
  );
}

/** A type of one's own: its name, and which family the panels are fixed like. */
function OtherType({ picker, studio, words }: PickerFacts) {
  const { other } = picker;
  const { pick } = other;
  return (
    <div className="hg-material-other">
      <Input
        label={words.otherName}
        value={other.name}
        maxLength={other.nameMax}
        focusRequest={1}
        helper={words.otherLine}
        onChange={(name) => studio.moves.typeOther({ name })}
      />
      <SegmentedControl
        label={words.fixedLikeTitle}
        value={other.fixedLike}
        options={other.families.map((family) => ({
          value: family,
          label: words.fixedLike(family),
        }))}
        onChange={(value) => {
          const family = other.families.find((one) => one === value);
          if (family !== undefined) studio.moves.typeOther({ fixedLike: family });
        }}
      />
      <div className="hg-roofs-acts">
        <Button
          variant="primary"
          size="md"
          icon={<ShellGlyph name="check" size="sm" />}
          disabled={pick === null}
          onClick={() => {
            if (pick !== null) studio.moves.pickMaterial(pick);
          }}
        >
          {words.useOther(pick?.name ?? '')}
        </Button>
      </div>
    </div>
  );
}

/**
 * What a roof is made of (`T-M05-002`, part e): from the foot on a phone, at the right on a
 * desktop. The market's first five as pictures, then every type in its group, then a type of
 * one's own. A tap on a picture is the person's pick; Confirm keeps a guess that is right. It sets
 * how panels are fixed, and the first shape, slope and parapet.
 */
export function StudioMaterialPicker({ picker, studio, words }: PickerFacts) {
  const panel = useRef<HTMLDivElement>(null);
  const { moves } = studio;
  const { mode } = picker;
  usePressAway(panel, true, moves.closePanel, '.hg-studio-pencil');
  // Each list opened lands focus on its head: a keyboard and a screen reader start there.
  useEffect(() => {
    if (mode !== 'other') panel.current?.querySelector<HTMLElement>('.hg-roofs-title')?.focus();
  }, [mode]);
  const title = mode === 'other' ? words.pickerOther : words.pickerTitle;
  return (
    <div
      ref={panel}
      className="hg-studio-glass hg-roofs-panel"
      data-kind="picker"
      role="dialog"
      aria-label={title}
    >
      <div className="hg-roofs-head">
        {mode === 'first' ? null : (
          <IconButton
            label={words.firstTypes}
            variant="ghost"
            onClick={() => moves.pickerMode(mode === 'other' ? 'all' : 'first')}
          >
            <ShellGlyph name="chevron-left" size="sm" />
          </IconButton>
        )}
        <span className="hg-roofs-title" tabIndex={-1}>
          {title}
        </span>
        <IconButton label={words.pickerClose} variant="ghost" onClick={moves.closePanel}>
          <ShellGlyph name="close" size="sm" />
        </IconButton>
      </div>
      {mode === 'first' ? <FirstTypes picker={picker} studio={studio} words={words} /> : null}
      {mode === 'all' ? <AllTypes picker={picker} studio={studio} words={words} /> : null}
      {mode === 'other' ? <OtherType picker={picker} studio={studio} words={words} /> : null}
    </div>
  );
}
