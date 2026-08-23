import { theme } from '@heliogrid/theme';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { RichTextAt } from './RichText.edit';
import { isListBlock, keyed, textOf } from './RichText.model';
import type { RichTextSpan, RichTextValue } from './RichText.types';

const styles = StyleSheet.create({
  input: {
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.roles.body.fontSize,
    lineHeight: Math.round(theme.type.roles.body.fontSize * 1.6),
    color: theme.colors['text-primary'],
    padding: 0,
  },
  heading: { fontWeight: '700', fontSize: theme.type.roles.body.fontSize + 1 },
  item: { flex: 1 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  logo: {
    marginBottom: theme.spacing['sp-3'],
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius['rf-lg'],
    backgroundColor: theme.colors['neutral-bg'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoChip: {
    width: 34,
    height: 24,
    borderRadius: theme.radius['rf-xs'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
});

export interface RichTextBlocksProps {
  value: RichTextValue;
  disabled: boolean;
  /** Shown only while the body is empty, the same rule the web half's overlay follows. */
  placeholder?: string;
  showPlaceholder: boolean;
  label?: string;
  onCaret: (at: RichTextAt) => void;
  onBlur: () => void;
  onText: (at: RichTextAt, text: string) => void;
  onEnter: (at: RichTextAt) => void;
}

/**
 * The editable body: one `TextInput` per paragraph, heading and list ITEM.
 *
 * That granularity is the whole touch design — RN has no caret-selection API, so the block
 * holding the caret is what a mark applies to, and a block is therefore its own input.
 * The logo is placed, never typed, exactly as `contenteditable="false"` makes it on the web.
 */
export function RichTextBlocks({
  value,
  disabled,
  placeholder,
  showPlaceholder,
  label,
  onCaret,
  onBlur,
  onText,
  onEnter,
}: RichTextBlocksProps) {
  const editor = (at: RichTextAt, spans: RichTextSpan[], heading: boolean) => (
    <TextInput
      style={[
        styles.input,
        heading ? styles.heading : null,
        at.item === undefined ? null : styles.item,
      ]}
      multiline
      editable={!disabled}
      value={textOf(spans)}
      placeholder={showPlaceholder ? placeholder : undefined}
      placeholderTextColor={theme.colors['text-tertiary']}
      accessibilityLabel={label ?? 'Terms and conditions'}
      onFocus={() => onCaret(at)}
      onBlur={onBlur}
      onChangeText={(text) => onText(at, text)}
      onSubmitEditing={() => onEnter(at)}
    />
  );

  return (
    <>
      {keyed(value.blocks, 'b').map(({ key, item: b }, i) => {
        if (b.type === 'logo') {
          return (
            <View key={key} style={styles.logo}>
              <View style={styles.logoChip} />
              <Text variant="caption" color="secondary">
                Logo prints here
              </Text>
            </View>
          );
        }
        if (isListBlock(b)) {
          const start = b.start ?? 1;
          return (
            <View key={key}>
              {keyed(b.items, `${key}-i`).map((entry, j) => (
                <View key={entry.key} style={styles.listRow}>
                  <Text variant="body" color="secondary">
                    {b.type === 'ul' ? '•' : `${start + j}.`}
                  </Text>
                  {editor({ block: i, item: j }, entry.item, false)}
                </View>
              ))}
            </View>
          );
        }
        return <View key={key}>{editor({ block: i }, b.spans, b.type === 'h')}</View>;
      })}
    </>
  );
}
