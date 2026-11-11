import { theme } from '@heliogrid/theme';
import { type RefObject, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Card } from '../Card/Card.native';
import { packLineOf } from './HandoverPanel.logic';
import type { HandoverPackProps } from './HandoverPanel.types';

/**
 * The handover pack's tile on the phone: what it holds — or will, made at the handover — and once
 * handed over, its download while the server makes it (busy), once it is made, or its retry when
 * it is late. The line is a live region, so the screen reader hears the pack arrive.
 */
export function HandoverPack({ words, pack, onDownload, onLookAgain }: HandoverPackProps) {
  const frame = useRef<View>(null);
  return (
    <Card>
      <View ref={frame} style={styles.row}>
        <View style={styles.mark}>
          <ShellGlyph name="file" size="md" tone="accent" />
        </View>
        <View style={styles.words}>
          <Text variant="body" bold>
            {words.packTitle}
          </Text>
          <View accessibilityLiveRegion="polite">
            <Text variant="body-sm" color="secondary">
              {packLineOf(words, pack)}
            </Text>
          </View>
        </View>
        {pack.kind === 'making' || pack.kind === 'ready' ? (
          <Button
            variant="secondary"
            size="sm"
            loading={pack.kind === 'making'}
            icon={<ShellGlyph name="download" size="sm" tone="primary" />}
            onClick={() => {
              if (pack.kind === 'ready') onDownload(pack.fileId);
            }}
          >
            {words.download}
          </Button>
        ) : null}
        {pack.kind === 'late' ? (
          <LookAgain words={words} onLookAgain={onLookAgain} frame={frame} />
        ) : null}
      </View>
    </Card>
  );
}

/** *Try again* on a late pack: it gives way to the busy download, and the reader lands on the tile. */
function LookAgain({
  words,
  onLookAgain,
  frame,
}: Pick<HandoverPackProps, 'words' | 'onLookAgain'> & { frame: RefObject<View | null> }) {
  const leaving = useFocusAfter(frame);
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={<ShellGlyph name="retry" size="sm" tone="primary" />}
      onClick={leaving(onLookAgain)}
    >
      {words.retry}
    </Button>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.spacing['sp-10'],
    height: theme.spacing['sp-10'],
    flexShrink: 0,
    borderRadius: theme.radius['r-sm'],
    backgroundColor: colors['accent-subtle'],
  },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
});
