import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { HueTile } from '../HueTile/HueTile.native';
import { bubbleLines } from './ProposalAfterParts.logic';
import type {
  AfterHintProps,
  AfterRowProps,
  AfterRowsProps,
  AfterSummaryProps,
  MessageBubbleProps,
} from './ProposalAfterParts.types';

export function AfterHint({ glyph = 'info-circle', children }: AfterHintProps) {
  return (
    <View style={styles.hint}>
      <ShellGlyph name={glyph} size="sm" tone="secondary" />
      <Text variant="body-sm" color="secondary" style={styles.grow}>
        {children}
      </Text>
    </View>
  );
}

export function AfterSummary({ rows }: AfterSummaryProps) {
  return (
    <View style={styles.summary}>
      {rows.map((row, index) => (
        <View key={row.label} style={[styles.summaryRow, index > 0 ? styles.ruled : undefined]}>
          <Text variant="body-sm" color="secondary" style={styles.grow}>
            {row.label}
          </Text>
          <Text variant={row.mono ? 'mono' : 'body'} bold align="end" style={styles.value}>
            {row.value}
            {row.figure === undefined ? null : (
              <>
                {' · '}
                <Text variant="mono" bold>
                  {row.figure}
                </Text>
              </>
            )}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function AfterRows({ children }: AfterRowsProps) {
  return <View style={[tileSurface, styles.rows]}>{children}</View>;
}

function RowFace({ glyph, hue = 'ocean', title, line, leading, aside, onOpen }: AfterRowProps) {
  return (
    <View style={styles.row}>
      {leading ??
        (glyph === undefined ? null : <HueTile glyph={glyph} hue={hue} size={36} stroke={1.7} />)}
      <View style={styles.grow}>
        <Text variant="body" bold>
          {title}
        </Text>
        {line === undefined ? null : (
          <Text variant="caption" color="secondary">
            {line}
          </Text>
        )}
      </View>
      {aside ??
        (onOpen === undefined ? null : (
          <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
        ))}
    </View>
  );
}

export function AfterRow(props: AfterRowProps) {
  if (props.onOpen === undefined || props.aside !== undefined) return <RowFace {...props} />;
  return (
    <Pressable onPress={props.onOpen}>
      <RowFace {...props} />
    </Pressable>
  );
}

export function MessageBubble({ text, link, linkToCome, note, name }: MessageBubbleProps) {
  return (
    <View style={styles.bubble} accessibilityLabel={name} role="region" collapsable={false}>
      {bubbleLines(text, link, linkToCome).map((line, index) => (
        <Text
          // biome-ignore lint/suspicious/noArrayIndexKey: a message's lines keep their order and may repeat
          key={index}
          variant={line.kind === 'link' ? 'mono' : 'body'}
          color={line.kind === 'words' ? 'primary' : 'accent'}
        >
          {line.text}
        </Text>
      ))}
      <View style={styles.note}>
        <Text variant="caption" color="secondary">
          {note}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  hint: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  summary: { borderRadius: theme.radius['r-lg'], backgroundColor: colors.fill },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing['sp-4'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  ruled: { borderTopWidth: 1, borderTopColor: colors['line-soft'] },
  value: { flexShrink: 1 },
  rows: { borderRadius: theme.radius['r-lg'], overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: theme.spacing['sp-16'],
    paddingVertical: theme.spacing['sp-3'],
    paddingStart: theme.spacing['sp-4'],
    paddingEnd: theme.spacing['sp-3'],
    borderTopWidth: 1,
    borderTopColor: colors['line-soft'],
  },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    gap: theme.spacing['sp-2'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-lg'],
    borderTopStartRadius: theme.radius['r-xs'],
    backgroundColor: colors['success-bg'],
  },
  note: {
    paddingTop: theme.spacing['sp-1'],
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
});
