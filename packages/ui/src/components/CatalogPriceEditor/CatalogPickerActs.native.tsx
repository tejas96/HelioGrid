import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { Button } from '../Button/Button.native';
import type {
  CatalogEditorOwnActs,
  CatalogEditorSwitches,
  CatalogPriceEditorWords,
} from './CatalogPriceEditor.types';

/**
 * *Prefer* and *Hide* on the phone (direction A): two buttons side by side, each a pressed toggle
 * with the whole act as its spoken name — a platform item's two picker states, or an own SKU's
 * *Prefer* and *Archive*, done at once. No tier line under them, as on the web (owner ruling).
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
    <View style={styles.section}>
      {/* A field's label, as *Your price* and *Tax rate* above it: one heading style in the sheet. */}
      <Text variant="field-label">{words.inPickers}</Text>
      {switches === null ? null : (
        <View style={styles.pair}>
          <View style={styles.half}>
            <PickToggle
              glyph="star"
              word={words.prefer}
              spoken={words.preferredInPickers}
              on={switches.preferred}
              onToggle={() => switches.onPreferred(!switches.preferred)}
            />
          </View>
          <View style={styles.half}>
            <PickToggle
              glyph="eye-off"
              word={words.hide}
              spoken={words.hideFromPickers}
              on={switches.hidden}
              onToggle={() => switches.onHidden(!switches.hidden)}
            />
          </View>
        </View>
      )}
      {own === null ? null : (
        <View style={styles.pair}>
          <View style={styles.half}>
            <PickToggle
              glyph="star"
              word={words.prefer}
              spoken={words.preferredInPickers}
              on={own.preferred}
              onToggle={own.onPrefer}
            />
          </View>
          <View style={styles.half}>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              icon={<ShellGlyph name="archive" size="sm" tone="primary" />}
              onClick={own.onArchive}
            >
              {words.archive}
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

/** One glass toggle: its glyph and word, pressed while on, the ink pill when on. */
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
  const ground = useGround();
  return (
    <Pressable
      accessibilityLabel={spoken}
      accessibilityState={{ selected: on }}
      onPress={onToggle}
      style={[styles.face, on ? styles.on : { backgroundColor: ground.controlFill }]}
    >
      <View style={styles.faceRow}>
        <ShellGlyph
          name={glyph}
          size="sm"
          filled={glyph === 'star' && on}
          tone={on ? 'inverse' : 'primary'}
        />
        <Text variant="body-sm" bold style={on ? styles.onWord : undefined}>
          {word}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: theme.spacing['sp-2'] },
  pair: { flexDirection: 'row', gap: theme.spacing['sp-2'] },
  half: { flex: 1, minWidth: 0 },
  face: {
    width: '100%',
    borderRadius: theme.radius['r-pill'],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors['line-soft'],
  },
  faceRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  /* On: the ink pill, as a chosen chip is; the toggle also says it is pressed. */
  on: { backgroundColor: colors.ink, borderColor: colors.ink },
  onWord: { color: colors['on-ink'] },
});
