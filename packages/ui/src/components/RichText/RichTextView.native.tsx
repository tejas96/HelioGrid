import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Image, Text as RNText, StyleSheet, View } from 'react-native';
import { foldRows, isListBlock, keyed } from './RichText.model';
import type { RichTextRow, RichTextSpan, RichTextViewProps } from './RichText.types';

interface NativeRichTextViewProps extends RichTextViewProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  logoRow: { marginBottom: theme.spacing['sp-3'] },
  logoSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['rf-sm'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  logoLabel: { fontFamily: theme.type.families.mono, color: theme.colors['text-tertiary'] },
  listRow: { flexDirection: 'row' },
  bullet: { fontFamily: theme.type.families.sans },
  link: { color: theme.colors.link, textDecorationLine: 'underline' },
});

function renderSpans(spans: RichTextSpan[], prefix: string, base: TextStyle): ReactNode[] {
  return keyed(spans, prefix).map(({ key, item }) => (
    <RNText
      key={key}
      style={[
        base,
        item.b === true ? { fontWeight: '700' } : null,
        item.i === true ? { fontStyle: 'italic' } : null,
        item.href !== undefined ? styles.link : null,
      ]}
    >
      {item.text}
    </RNText>
  ));
}

/**
 * The read-only rendering of every mark the editor produces, on touch.
 *
 * `data-flow-row` has no native counterpart — `PagedDocument` is a web/print surface and cuts a
 * DOM. A native document preview would need its own measurement pass; nothing here declares one.
 *
 * A link is drawn as a link but does not open: `RichTextViewProps` carries no press handler, and
 * inventing navigation inside a design-system component is out of bounds for this package.
 */
export function RichTextView({
  value,
  logoSrc,
  logoLabel = 'tenant logo',
  fontSize = 14,
  color,
  muted,
  emptyText,
  style,
}: NativeRichTextViewProps) {
  const blocks = value?.blocks ?? [];
  const ink = color ?? theme.colors['text-primary'];
  const sub = muted ?? theme.colors['text-secondary'];
  const lineHeight = Math.round(fontSize * 1.6);
  const gap = Math.round(fontSize * 0.7);

  if (blocks.length === 0) {
    return emptyText === undefined ? null : (
      <RNText style={{ fontSize, color: theme.colors['text-tertiary'] }}>{emptyText}</RNText>
    );
  }

  const body: TextStyle = {
    fontFamily: theme.type.families.sans,
    fontSize,
    lineHeight,
    color: sub,
  };
  const head: TextStyle = { ...body, fontSize: fontSize + 1, fontWeight: '700', color: ink };

  return (
    <View style={style}>
      {keyed(blocks, 'b').map(({ key, item: b }, i) => {
        if (b.type === 'logo') {
          const h = Math.round(fontSize * 2.4);
          const w = Math.round(fontSize * 6);
          return (
            <View key={key} style={styles.logoRow}>
              {logoSrc === undefined ? (
                <View style={[styles.logoSlot, { width: w, height: h }]}>
                  <RNText style={[styles.logoLabel, { fontSize: Math.max(9, fontSize - 4) }]}>
                    {logoLabel}
                  </RNText>
                </View>
              ) : (
                <Image
                  source={{ uri: logoSrc }}
                  accessibilityIgnoresInvertColors
                  resizeMode="contain"
                  style={{ width: w, height: h }}
                />
              )}
            </View>
          );
        }
        if (b.type === 'h') {
          return (
            <RNText
              key={key}
              style={[
                head,
                { marginTop: i > 0 ? fontSize : 0, marginBottom: Math.round(fontSize * 0.4) },
              ]}
            >
              {renderSpans(b.spans, `${key}-s`, head)}
            </RNText>
          );
        }
        if (isListBlock(b)) {
          const start = b.start ?? 1;
          return (
            <View key={key} style={{ marginBottom: gap, paddingLeft: Math.round(fontSize * 0.6) }}>
              {keyed(b.items, `${key}-i`).map((entry, j) => (
                <View key={entry.key} style={styles.listRow}>
                  <RNText style={[body, { width: Math.round(fontSize * 1.4) }]}>
                    {b.type === 'ul' ? '•' : `${start + j}.`}
                  </RNText>
                  <RNText style={[body, { flex: 1 }]}>
                    {renderSpans(entry.item, `${entry.key}-s`, body)}
                  </RNText>
                </View>
              ))}
            </View>
          );
        }
        return (
          <RNText key={key} style={[body, { marginBottom: gap }]}>
            {renderSpans(b.spans, `${key}-s`, body)}
          </RNText>
        );
      })}
    </View>
  );
}

/** Renders a chunk of rows — adjacent list rows fold back into one list with numbering intact. */
export function renderRichTextRows(
  rows: RichTextRow[],
  props?: Omit<RichTextViewProps, 'value'>,
): ReactNode {
  return <RichTextView value={{ version: 1, blocks: foldRows(rows) }} {...props} />;
}
