import type { TranslatedText } from '@heliogrid/contracts';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { Button } from '../Button';
import type {
  CatalogEditorOwnActs,
  CatalogEditorSwitches,
  CatalogPriceEditorWords,
} from './CatalogPriceEditor.types';

/**
 * *Prefer* and *Hide* (direction A): two buttons side by side, each a pressed toggle with the whole
 * act as its spoken name — on a platform item the two picker states saved with the price; on an own
 * SKU *Prefer* and *Archive*, done at once as its row did them. No tier line under them (owner
 * ruling): *Default* told an owner nothing, and the button's own look says on or off. The list's narrow rows carry no toggles: this is where the item is one tap away.
 */
export function CatalogPickerActs({
  words,
  switches,
  own,
}: {
  words: CatalogPriceEditorWords;
  switches: CatalogEditorSwitches | null;
  own: CatalogEditorOwnActs | null;
}) {
  if (switches === null && own === null) return null;
  return (
    <section className="hg-cat-editor-section">
      {/* A field's label, as *Your price* and *Tax rate* above it: one heading style in the sheet. */}
      <Text variant="field-label">{words.inPickers}</Text>
      {switches === null ? null : (
        <div className="hg-cat-pick">
          <PickToggle
            glyph="star"
            word={words.prefer}
            spoken={words.preferredInPickers}
            on={switches.preferred}
            onToggle={() => switches.onPreferred(!switches.preferred)}
          />
          <PickToggle
            glyph="eye-off"
            word={words.hide}
            spoken={words.hideFromPickers}
            on={switches.hidden}
            onToggle={() => switches.onHidden(!switches.hidden)}
          />
        </div>
      )}
      {own === null ? null : (
        <div className="hg-cat-pick">
          <PickToggle
            glyph="star"
            word={words.prefer}
            spoken={words.preferredInPickers}
            on={own.preferred}
            onToggle={own.onPrefer}
          />
          <Button
            variant="secondary"
            size="md"
            fullWidth
            icon={<ShellGlyph name="archive" size="sm" />}
            onClick={own.onArchive}
          >
            {words.archive}
          </Button>
        </div>
      )}
    </section>
  );
}

/** One glass toggle: its glyph and word, pressed while on (`aria-pressed`), the accent wash when on. */
function PickToggle({
  glyph,
  word,
  spoken,
  on,
  onToggle,
}: {
  glyph: ShellGlyphName;
  word: TranslatedText;
  spoken: TranslatedText;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      className="hg-cat-pick-toggle"
      accessibilityLabel={spoken}
      accessibilityState={{ selected: on }}
      onPress={onToggle}
    >
      <span className="hg-cat-pick-face" data-on={on ? 'true' : undefined}>
        <ShellGlyph name={glyph} size="sm" filled={glyph === 'star' && on} />
        {word}
      </span>
    </Pressable>
  );
}
