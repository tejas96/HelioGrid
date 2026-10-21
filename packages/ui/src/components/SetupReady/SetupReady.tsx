import type { ReactNode } from 'react';
import { Text } from '../../primitives/Text/Text';
import type { ShellGlyphName, ShellGlyphProps } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { useDesktopShell } from '../AppShell/use-desktop-shell';
import { Button } from '../Button/Button';
import { Card, IconCircle } from '../Card/Card';
import { Badge } from '../Chip/Chip';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { EmptyState } from '../EmptyState/EmptyState';
import { useFocusAfterWall } from './SetupReady.logic';
import type { SetupReadyDoorWords, SetupReadyProps } from './SetupReady.types';

/* The board's `iconCircle`: each door's mark in a 40 circle (`SCR-M01-06`). */
const DOOR_CIRCLE = 40;

/**
 * *You're ready* in the onboarding frame: the heading and the company line — at 1536 in the brand
 * pane — and the two doors, stacked at 375 and side by side at 1536. The wall, when the company
 * cannot be read, follows the wordmark at 375 and is centred in the task pane at 1536.
 */
export function SetupReady({
  words,
  demo,
  leaving,
  onStartWithLead,
  onOpenDemo,
  unreachable,
  retrying,
  onTryAgain,
}: SetupReadyProps) {
  const wide = useDesktopShell() === true;
  const leadAct = useFocusAfterWall(unreachable);
  if (unreachable) {
    return (
      <DoorFrame panes="onboarding" taskMeasure="list">
        <div className="hg-setup-ready-wall">
          <EmptyState
            icon={<ShellGlyph name="alert-ring" size="xl" tone="primary" />}
            title={words.wall.title}
            description={words.wall.line}
            action={
              <Button variant="primary" size="lg" loading={retrying} onClick={onTryAgain}>
                {words.tryAgain}
              </Button>
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
            {words.companyLine}
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
        />
      </div>
    </DoorFrame>
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
 * the card's loading form — its line where the act will appear — or its error form with the title
 * alone is drawn over it: door two keeps the ready door's size in every language, so the heading and
 * door one never move as it resolves. No retry until the demo can be read (`T-M01-029`).
 */
function DemoDoorCard({
  demo,
  door,
  words,
}: {
  demo: SetupReadyProps['demo'];
  door: ReactNode;
  words: SetupReadyProps['words']['demo'];
}) {
  if (demo === 'ready') return <Card>{door}</Card>;
  return (
    <div className="hg-setup-ready-waiting">
      <div className="hg-setup-ready-unseen" aria-hidden="true" inert>
        <Card>{door}</Card>
      </div>
      {demo === 'loading' ? (
        <>
          <Card state="loading" />
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
          state="error"
          errorTitle={words.failed}
          errorMessage=""
          className="hg-setup-ready-failed"
        />
      )}
    </div>
  );
}
