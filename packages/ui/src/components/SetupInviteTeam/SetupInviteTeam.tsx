import { numberOnTeam, sendsNothing } from '@heliogrid/domain';
import { useEffect, useRef } from 'react';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { useDesktopShell } from '../AppShell/use-desktop-shell';
import { BannerAction } from '../Banner/BannerAction';
import { Button } from '../Button/Button';
import { IconCircle } from '../Card/Card';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { InviteForm } from '../InviteForm/InviteForm';
import type { FocusHandle } from '../SearchField/SearchField.types';
import type { SetupInviteAfterStep, SetupInviteTeamProps } from './SetupInviteTeam.types';

/* The board's `stepCircle`: each step's mark in a 44 circle (`SCR-M01-07` d-default). */
const STEP_CIRCLE = 44;

/**
 * The invite step in the onboarding frame: the title — at 1536 in the brand pane over *After you
 * send* — the form in the task, and the acts under it. At the cap the pressed *Send invite* goes
 * away, so the focus moves to *Continue setup*, the one act left.
 */
export function SetupInviteTeam({
  bind,
  words,
  roles,
  sending,
  leaving,
  presses,
  refusal = null,
  onSend,
  onSkip,
  onOpenTeam,
  onDifferentNumber,
  phoneRef,
  onActsHeight,
}: SetupInviteTeamProps) {
  const wide = useDesktopShell() === true;
  const onward = useRef<FocusHandle>(null);
  useEffect(() => {
    if (refusal === 'cap') onward.current?.focus();
  }, [refusal]);
  return (
    <DoorFrame
      onFooterHeight={onActsHeight}
      panes="onboarding"
      taskMeasure="list"
      identity={
        <>
          <Text variant="h1">{words.title}</Text>
          <div className="hg-door-wide-only">
            <AfterYouSend words={words.afterYouSend} />
          </div>
        </>
      }
      footer={
        <div className="hg-setup-invite-act">
          {refusal === 'cap' ? (
            <Button ref={onward} variant="primary" size="lg" loading={leaving} onClick={onSkip}>
              {words.continueSetup}
            </Button>
          ) : (
            <div className="hg-setup-invite-ways">
              <Button variant="ghost" size="lg" disabled={sending || leaving} onClick={onSkip}>
                {words.skip}
              </Button>
              {numberOnTeam(refusal) ? (
                <Button variant="primary" size="lg" disabled={leaving} onClick={onDifferentNumber}>
                  {words.differentNumber}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  loading={sending}
                  disabled={leaving}
                  onClick={onSend}
                >
                  {words.send}
                </Button>
              )}
            </div>
          )}
          {/* The expiry only beside a send, and at 1536 the brand pane says it. */}
          {sendsNothing(refusal) || wide ? null : (
            <Text variant="caption" color="secondary" align="center">
              {words.lasts}
            </Text>
          )}
        </div>
      }
    >
      <InviteForm
        bind={bind}
        words={words}
        roles={roles}
        layout={wide ? 'wide' : 'stacked'}
        presses={presses}
        refusal={refusal}
        refusalAction={<BannerAction onClick={onOpenTeam}>{words.openTeam}</BannerAction>}
        phoneRef={phoneRef}
      />
    </DoorFrame>
  );
}

/** The brand pane's promise: what happens once the invite is sent, one marked step a row. */
function AfterYouSend({ words }: { words: SetupInviteTeamProps['words']['afterYouSend'] }) {
  return (
    <div className="hg-setup-invite-after">
      <Text variant="overline" color="secondary">
        {words.heading}
      </Text>
      <ul className="hg-setup-invite-steps">
        <AfterStep step={words.message} glyph="send" />
        <AfterStep step={words.lasts} glyph="calendar-clock" />
        <AfterStep step={words.join} glyph="pair" />
      </ul>
    </div>
  );
}

function AfterStep({
  step,
  glyph,
}: {
  step: SetupInviteAfterStep;
  glyph: 'send' | 'calendar-clock' | 'pair';
}) {
  return (
    <li className="hg-setup-invite-step">
      <IconCircle color="var(--accent)" size={STEP_CIRCLE}>
        <ShellGlyph name={glyph} size="md" tone="accent" />
      </IconCircle>
      <div className="hg-setup-invite-step-words">
        <Text variant="body" bold>
          {step.title}
        </Text>
        {step.line === null ? null : (
          <Text variant="body-sm" color="secondary">
            {step.line}
          </Text>
        )}
      </div>
    </li>
  );
}
