import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { type ReactNode, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { type FocusHandle, useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import type { ShellGlyphName, ShellGlyphProps } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Card, IconCircle } from '../Card/Card.native';
import { Badge } from '../Chip/Chip.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import type { SetupReadyDoorWords, SetupReadyProps, SetupWallRetryProps } from './SetupReady.types';

/* The board's `iconCircle`: each door's mark in a 40 circle (`SCR-M01-06`). */
const DOOR_CIRCLE = 40;

/**
 * *You're ready* in the phone's one column (`SCR-M01-06` m-default): the heading and the company
 * line under the wordmark, then the two doors stacked, the spare room below the last one.
 */
export function SetupReady({
  read,
  words,
  demo,
  leaving,
  onStartWithLead,
  onOpenDemo,
  onRetryDemo,
  retrying,
}: SetupReadyProps) {
  const leadAct = useRef<FocusHandle>(null);
  if (read.kind === 'loading' || read.kind === 'empty') return null;
  if (read.kind === 'failed') {
    return (
      <DoorFrame>
        <EmptyState
          icon={<ShellGlyph name="alert-ring" size="xl" tone="primary" />}
          title={words.wall.title}
          description={words.wall.line}
          action={
            <WallRetry
              label={words.tryAgain}
              retrying={retrying}
              onRetry={read.retry}
              focusAfter={leadAct}
            />
          }
        />
      </DoorFrame>
    );
  }
  return (
    <DoorFrame
      column="deep"
      identity={
        <View style={styles.title}>
          <Text variant="h2">{words.title}</Text>
          <Text variant="body" color="secondary">
            {words.companyLine(read.value)}
          </Text>
        </View>
      }
    >
      <View style={styles.doors}>
        <Card>
          <Door
            glyph="person-plus"
            circle={theme.colors.accent}
            tone="accent"
            words={words.lead}
            act={
              <Button
                ref={leadAct}
                variant="primary"
                size="lg"
                fullWidth
                loading={leaving}
                onClick={onStartWithLead}
              >
                {words.lead.act}
              </Button>
            }
          />
        </Card>
        <DemoDoorCard
          demo={demo}
          door={
            <Door
              glyph="house-door"
              circle={theme.colors.info}
              tone="info"
              words={words.demo}
              badge={words.demo.badge}
              act={
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  disabled={leaving || demo !== 'ready'}
                  onClick={onOpenDemo}
                >
                  {words.demo.act}
                </Button>
              }
            />
          }
          words={words.demo}
          onRetry={onRetryDemo}
          retryLabel={words.tryAgain}
        />
      </View>
    </DoorFrame>
  );
}

/** The wall's *Try again*: once the company reads it leaves with the wall, and focus goes on. */
function WallRetry({ label, retrying, onRetry, focusAfter }: SetupWallRetryProps) {
  const leaving = useFocusAfter(focusAfter);
  return (
    <Button variant="primary" size="lg" loading={retrying} onClick={leaving(onRetry)}>
      {label}
    </Button>
  );
}

function Door({
  glyph,
  circle,
  tone,
  words,
  badge,
  act,
}: {
  glyph: ShellGlyphName;
  circle: string;
  tone: NonNullable<ShellGlyphProps['tone']>;
  words: SetupReadyDoorWords;
  badge?: string;
  act: ReactNode;
}) {
  return (
    <View style={styles.door}>
      <View style={styles.head}>
        <IconCircle color={circle} size={DOOR_CIRCLE}>
          <ShellGlyph name={glyph} size="md" tone={tone} />
        </IconCircle>
        <View style={styles.name}>
          <Text variant="h3" bold>
            {words.title}
          </Text>
          {badge === undefined ? null : <Badge tone="info">{badge}</Badge>}
        </View>
      </View>
      <Text variant="body-sm" color="secondary">
        {words.line}
      </Text>
      {act}
    </View>
  );
}

/**
 * Door two. While the demo is not ready the ready door still lays out, unseen and out of reach, and
 * the card's loading or error form is drawn over it, so door two keeps the ready door's size in
 * every language. Its *Try again* reads the screen again until the demo can be read (`T-M01-029`).
 */
function DemoDoorCard({
  demo,
  door,
  words,
  onRetry,
  retryLabel,
}: {
  demo: SetupReadyProps['demo'];
  door: ReactNode;
  words: SetupReadyProps['words']['demo'];
  onRetry: () => void;
  retryLabel: TranslatedText;
}) {
  if (demo === 'ready') return <Card>{door}</Card>;
  return (
    <View>
      <View
        style={styles.unseen}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Card>{door}</Card>
      </View>
      {demo === 'loading' ? (
        <>
          <Card read={{ kind: 'loading' }} loadingLabel={words.loadingCard} style={styles.over} />
          <View style={styles.loadingLine}>
            <Text variant="body-sm" color="secondary" align="center">
              {words.loading}
            </Text>
          </View>
        </>
      ) : (
        <Card
          read={{ kind: 'failed', retry: onRetry }}
          loadingLabel={words.loadingCard}
          errorTitle={words.failed}
          retryLabel={retryLabel}
          style={[styles.over, styles.failed]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /** The heading `sp-8` under the wordmark (`deep`), the line `sp-2` under it, the doors `sp-6` under that. */
  title: { gap: theme.spacing['sp-2'], paddingBottom: theme.spacing['sp-6'] },
  doors: { gap: theme.spacing['sp-4'] },
  door: { gap: theme.spacing['sp-4'] },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  /** The name and its `Demo` mark, wrapping under the name when the language is long. */
  name: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  /** The ready door, laid out unseen under the waiting card. */
  unseen: { opacity: 0 },
  over: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  failed: { justifyContent: 'center' },
  /** The loading line sits where the door's act will appear. */
  loadingLine: {
    position: 'absolute',
    left: theme.layout['tile-pad'],
    right: theme.layout['tile-pad'],
    bottom: theme.layout['tile-pad'],
    minHeight: theme.spacing['sp-12'],
    justifyContent: 'center',
  },
});
