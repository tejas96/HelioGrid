import type { TranslatedText } from '@heliogrid/contracts';
import { type ReactNode, useRef } from 'react';
import { type FocusHandle, useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text';
import type { ShellGlyphName, ShellGlyphProps } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { useDesktopShell } from '../AppShell/use-desktop-shell';
import { Button } from '../Button/Button';
import { Card, IconCircle } from '../Card/Card';
import { Badge } from '../Chip/Chip';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { EmptyState } from '../EmptyState/EmptyState';
import type { SetupReadyDoorWords, SetupReadyProps, SetupWallRetryProps } from './SetupReady.types';

/* The board's `iconCircle`: each door's mark in a 40 circle (`SCR-M01-06`). */
const DOOR_CIRCLE = 40;

/**
 * *You're ready* in the onboarding frame: the heading and the company line — at 1536 in the brand
 * pane — and the two doors, stacked at 375 and side by side at 1536. The wall, when the company
 * cannot be read, follows the wordmark at 375 and is centred in the task pane at 1536.
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
  const wide = useDesktopShell() === true;
  const leadAct = useRef<FocusHandle>(null);
  if (read.kind === 'loading' || read.kind === 'empty') return null;
  if (read.kind === 'failed') {
    return (
      <DoorFrame panes="onboarding" taskMeasure="list">
        <div className="hg-setup-ready-wall">
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
        </div>
      </DoorFrame>
    );
  }
  return (
    <DoorFrame
      panes="onboarding"
      taskMeasure="list"
      column="deep"
      identity={
        <div className="hg-setup-ready-title">
          <Text variant="h1">{words.title}</Text>
          <Text variant="body-lg" color="secondary">
            {words.companyLine(read.value)}
          </Text>
        </div>
      }
    >
      <div className="hg-setup-ready-doors">
        <Card>
          <Door
            glyph="person-plus"
            circle="var(--accent)"
            tone="accent"
            words={words.lead}
            act={
              <Button
                ref={leadAct}
                variant="primary"
                size="lg"
                fullWidth={!wide}
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
              circle="var(--info)"
              tone="info"
              words={words.demo}
              badge={words.demo.badge}
              act={
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth={!wide}
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
      </div>
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

/** One door: its mark, its name, the line under it, and its one act. */
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
    <div className="hg-setup-ready-door">
      <div className="hg-setup-ready-door-head">
        <IconCircle color={circle} size={DOOR_CIRCLE}>
          <ShellGlyph name={glyph} size="md" tone={tone} />
        </IconCircle>
        <div className="hg-setup-ready-door-name">
          <Text variant="h3" as="h2" bold>
            {words.title}
          </Text>
          {badge === undefined ? null : <Badge tone="info">{badge}</Badge>}
        </div>
      </div>
      <Text variant="body-sm" color="secondary">
        {words.line}
      </Text>
      {act}
    </div>
  );
}

/**
 * Door two. While the demo is not ready the ready door still lays out, unseen and out of reach, and
 * the card's loading form — its line where the act will appear — or its error form, the title and
 * *Try again*, is drawn over it: door two keeps the ready door's size in every language, so the
 * heading and door one never move as it resolves. Until the demo can be read (`T-M01-029`), *Try
 * again* reads the screen again.
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
    <div className="hg-setup-ready-waiting">
      <div className="hg-setup-ready-unseen" aria-hidden="true" inert>
        <Card>{door}</Card>
      </div>
      {demo === 'loading' ? (
        <>
          <Card read={{ kind: 'loading' }} loadingLabel={words.loadingCard} />
          <Text
            variant="body-sm"
            color="secondary"
            align="center"
            className="hg-setup-ready-loading-line"
          >
            {words.loading}
          </Text>
        </>
      ) : (
        <Card
          read={{ kind: 'failed', retry: onRetry }}
          loadingLabel={words.loadingCard}
          errorTitle={words.failed}
          retryLabel={retryLabel}
          className="hg-setup-ready-failed"
        />
      )}
    </div>
  );
}
