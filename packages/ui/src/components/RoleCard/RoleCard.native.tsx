import { theme } from '@heliogrid/theme';
import { type ReactNode, useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
/* Cross-component imports in a native half point at the NATIVE file (see ListRow.native.tsx). */
import { Card, IconCircle } from '../Card/Card.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { ScopeNote, scopeNotePanelFrame } from '../ScopeNote/ScopeNote.native';
import type { RoleCardLine, RoleCardProps, RoleCardWords } from './RoleCard.types';

/**
 * The role card on the phone: its head, then its rows, or their loading lines. Bounded, the rows
 * scroll under the head; flowing, the surface around the card scrolls. React Native has no
 * `status` role: the waiting rows are one element whose name speaks, politely, while busy.
 * *Try again* leaves with the error card, so once the card is back the reader's focus goes to the
 * presets' name, which stays.
 */
export function RoleCard({ words, layout, surface, onRetry }: RoleCardProps) {
  const presets = useRef<View>(null);
  const retried = useRef(false);
  useEffect(() => {
    if (!retried.current || surface === 'error') return;
    retried.current = false;
    const tag = findNodeHandle(presets.current);
    if (tag !== null) AccessibilityInfo.setAccessibilityFocus(tag);
  }, [surface]);
  const bounded = layout === 'bounded';
  if (surface === 'error') {
    return (
      <Card
        style={bounded ? styles.bounded : undefined}
        state="error"
        errorTitle={words.error.title}
        errorMessage={words.error.body}
        retryLabel={words.error.retry}
        onRetry={() => {
          retried.current = true;
          onRetry();
        }}
      />
    );
  }
  return (
    <Card style={bounded ? styles.bounded : undefined}>
      <View style={[styles.body, bounded ? styles.fill : undefined]}>
        <View style={styles.head}>
          <IconCircle size={40}>
            <ShellGlyph name="briefcase" size="md" tone="accent" />
          </IconCircle>
          <View style={styles.names}>
            <View ref={presets} accessible>
              <Text variant="body" bold>
                {words.presets}
              </Text>
            </View>
            {words.credit === null ? null : (
              <Text variant="body-sm" color="secondary">
                {words.credit}
              </Text>
            )}
          </View>
        </View>
        {surface === 'loading' ? (
          <Waiting words={words} />
        ) : bounded ? (
          <ScrollView
            accessibilityLabel={words.region}
            showsVerticalScrollIndicator={false}
            style={styles.fill}
          >
            <Rows words={words} />
          </ScrollView>
        ) : (
          <Rows words={words} />
        )}
      </View>
    </Card>
  );
}

/** The note closes the last list. */
function Rows({ words }: { words: RoleCardWords }) {
  const note =
    words.note === null ? null : (
      <ScopeNote
        style={styles.note}
        variant="panel"
        title={words.note.title}
        message={words.note.message}
      />
    );
  return (
    <View style={styles.lists}>
      <Section title={words.canDo} lines={words.grants} glyph="tick-long" tone="success">
        {words.limits.length === 0 ? note : null}
      </Section>
      {words.limits.length === 0 ? null : (
        <Section title={words.cannotDo} lines={words.limits} glyph="eye-off" tone="secondary">
          {note}
        </Section>
      )}
    </View>
  );
}

function Section({
  title,
  lines,
  glyph,
  tone,
  children,
}: {
  title: string;
  lines: readonly RoleCardLine[];
  glyph: ShellGlyphName;
  tone: 'success' | 'secondary';
  children?: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View accessibilityRole="header">
        <Text variant="overline" color="secondary">
          {title}
        </Text>
      </View>
      <View style={styles.lines}>
        {lines.map((line) => (
          <View key={line.key} style={styles.line}>
            <ShellGlyph name={glyph} size="md" tone={tone} />
            <Text variant="body-sm" style={styles.phrase}>
              {line.text}
            </Text>
          </View>
        ))}
      </View>
      {children}
    </View>
  );
}

/**
 * The rows wait as lines, as many as the rows they stand for, and the note as three lines in the
 * note's own panel frame, so the wait is the size of what it stands for.
 */
function Waiting({ words }: { words: RoleCardWords }) {
  const note = (
    <View style={[...scopeNotePanelFrame, styles.note]}>
      <LoadingBars style={styles.noteLines} inBusyRegion bars={['line', 'line', 'line']} />
    </View>
  );
  return (
    <View
      accessible
      accessibilityLabel={words.loading}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
      style={[styles.lists, styles.waiting]}
    >
      <View style={styles.section}>
        <Text variant="overline" color="secondary">
          {words.canDo}
        </Text>
        <LoadingBars inBusyRegion bars={words.grants.map(() => 'line')} />
        {words.limits.length === 0 ? note : null}
      </View>
      {words.limits.length === 0 ? null : (
        <View style={styles.section}>
          <Text variant="overline" color="secondary">
            {words.cannotDo}
          </Text>
          <LoadingBars inBusyRegion bars={words.limits.map(() => 'line')} />
          {note}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bounded: { flexShrink: 1, minHeight: 0, overflow: 'hidden' },
  fill: { flexShrink: 1, minHeight: 0 },
  body: { gap: theme.spacing['sp-5'] },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  names: { flexShrink: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  lists: { gap: theme.spacing['sp-5'] },
  waiting: { overflow: 'hidden' },
  section: { gap: theme.spacing['sp-3'] },
  lines: { gap: theme.spacing['sp-3'] },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  phrase: { flexShrink: 1 },
  note: { marginTop: theme.spacing['sp-2'], backgroundColor: theme.colors['info-bg'] },
  noteLines: { flex: 1, minWidth: 0 },
});
