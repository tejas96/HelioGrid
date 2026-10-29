import { OTP_LENGTH } from '@heliogrid/domain';
import type { ReactNode, RefObject } from 'react';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { useDesktopShell } from '../AppShell/use-desktop-shell';
import { Banner } from '../Banner/Banner';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { EmptyState } from '../EmptyState/EmptyState';
import { OtpInput } from '../OtpInput/OtpInput';
import type { FocusHandle } from '../SearchField/SearchField.types';
import { TintedBlock } from '../TintedBlock/TintedBlock';
import { DeclineConfirm, DeclineControl } from './InviteDecline';
import { InviteFactsBlock, InviterRow } from './InviteFacts';
import { useFocusOnNewFrame } from './InviteLanding.logic';
import type {
  InviteDeclineProps,
  InviteLandingProps,
  InviteLandingWords,
} from './InviteLanding.types';

/** The new frame's act, which takes the focus when a press took the old one away. */
type ActRef = { actRef?: RefObject<FocusHandle | null> };

/**
 * The landing in the onboarding frame: at 375 one column — who invited, the heading, the invite
 * card, the code, then the acts following the content and held at the foot only on overflow
 * (brief ruling 14); at 1536 the invite in the context pane and the code task centred in the task
 * pane (ruling 13). A state that names no live invite is centred, as the frame's wall is.
 */
export function InviteLanding(props: InviteLandingProps) {
  const { language, words, frame } = props;
  const actRef = useFocusOnNewFrame(frame.kind);
  const wide = useDesktopShell() === true;
  const shell = (identity: ReactNode, task: ReactNode) => (
    <DoorFrame panes="onboarding" taskMeasure="field" trailing={language} identity={identity}>
      <div className="hg-invite-landing" data-frame={frame.kind}>
        {task}
      </div>
    </DoorFrame>
  );
  switch (frame.kind) {
    case 'loading':
      return shell(undefined, <LandingSkeleton spoken={words.loading} />);
    case 'empty':
    case 'reinvite-requested':
    case 'declined':
      return shell(undefined, <LandingPlace {...props} actRef={actRef} />);
    case 'load-error':
      return shell(
        undefined,
        <div className="hg-invite-landing-stack">
          {words.loadError === null ? null : (
            <Banner kind="validation" tone="danger" title={words.loadError.title}>
              {words.loadError.line}
            </Banner>
          )}
          <PrimaryAct {...props} actRef={actRef} />
        </div>,
      );
    case 'expired':
    case 'landing': {
      const decline = declineOf(props);
      return shell(
        <LandingHead {...props} wide={wide} />,
        <>
          <LandingTask {...props} wide={wide} actRef={actRef} decline={decline} />
          {decline === null ? null : <DeclineConfirm {...decline} />}
        </>,
      );
    }
  }
}

/** The decline's part, on a live invite only. */
function declineOf({ words, frame, onPress }: InviteLandingProps): InviteDeclineProps | null {
  if (words.decline === null || frame.decline === null) return null;
  return { words: words.decline, decline: frame.decline, onPress };
}

/** The context: who invited, the heading, and — at 375 — the banner above the invite card. */
function LandingHead({ words, frame, phone, wide }: InviteLandingProps & { wide: boolean }) {
  const { inviter, title, facts } = words;
  const showsFacts = facts !== null && phone !== null && frame.kind === 'landing';
  return (
    <div className="hg-invite-landing-head">
      <div className="hg-invite-landing-who">
        {inviter === null ? null : <InviterRow inviter={inviter} wide={wide} />}
        {title === null ? null : (
          <Text variant={wide ? 'h1' : 'h2'} as="h1">
            {title}
          </Text>
        )}
      </div>
      {wide ? null : <LandingBanner words={words} />}
      {showsFacts && wide ? <InviteFactsBlock facts={facts} phone={phone} wide /> : null}
      {showsFacts && !wide ? (
        <Card density="expressive">
          <InviteFactsBlock facts={facts} phone={phone} wide={false} />
        </Card>
      ) : null}
    </div>
  );
}

/** The task: the code family's block, the code, its resend and the acts, in reading order for the width. */
function LandingTask(
  props: InviteLandingProps & ActRef & { wide: boolean; decline: InviteDeclineProps | null },
) {
  const { words, frame, code, onCode, onPress, wide, decline } = props;
  const field = frame.codeField;
  return (
    <div className="hg-invite-landing-task">
      {wide ? <LandingBanner words={words} /> : null}
      {words.block === null ? null : <TintedBlock {...words.block} announce="alert" />}
      {frame.code === null || field === 'absent' ? null : (
        <div className="hg-invite-landing-code">
          <OtpInput
            length={OTP_LENGTH}
            label={words.codeLabel}
            value={code}
            onChange={onCode}
            disabled={field === 'closed'}
            readOnly={field === 'read-only'}
            busy={frame.busy && !frame.joinFailed}
            helper={words.codeHelper ?? undefined}
            error={words.codeError ?? undefined}
            // The code takes focus on arrival at 1536 only: on the phone the keyboard would hide who invited (ruling 12).
            autoFocus={wide && field === 'open'}
          />
        </div>
      )}
      {/* DOM order is reading order: the resend under the code at 375, under the act at 1536 (d-normal). */}
      {wide ? null : <ResendSlot words={words} onPress={onPress} />}
      <div className="hg-invite-landing-actions">
        <PrimaryAct {...props} />
        {words.foot === null ? null : (
          <Text variant="caption" color="secondary" align="center">
            {words.foot}
          </Text>
        )}
        {wide || decline === null ? null : <DeclineControl {...decline} />}
      </div>
      {wide ? <ResendSlot words={words} onPress={onPress} /> : null}
      {wide && decline !== null ? <DeclineControl {...decline} /> : null}
    </div>
  );
}

function LandingBanner({ words }: { words: InviteLandingWords }) {
  const { banner } = words;
  if (banner === null) return null;
  return (
    <Banner
      kind={banner.tone === 'danger' ? 'validation' : 'state'}
      tone={banner.tone}
      title={banner.title}
    >
      {banner.line ?? undefined}
    </Banner>
  );
}

function ResendSlot({ words, onPress }: Pick<InviteLandingProps, 'words' | 'onPress'>) {
  if (words.resend !== null) {
    return (
      <div className="hg-invite-landing-resend" data-live="">
        <Button variant="ghost" size="md" onClick={() => onPress('resend')}>
          {words.resend}
        </Button>
      </div>
    );
  }
  if (words.wait === null) return null;
  return (
    <div className="hg-invite-landing-resend">
      <Button variant="ghost" size="md" disabled spokenName={words.wait.spoken}>
        {words.wait.label}
      </Button>
    </div>
  );
}

/** The frame's one act: Join, Try again, the ask, or the door control a code refusal offers. */
function PrimaryAct({ words, frame, onPress, actRef }: InviteLandingProps & ActRef) {
  const { primary } = frame;
  if (primary === null || words.primary === null) return null;
  return (
    <Button
      ref={actRef}
      variant="primary"
      size="lg"
      fullWidth
      loading={frame.busy}
      disabled={primary.label === 'join' && frame.joinHeld}
      onClick={() => onPress(primary.press)}
    >
      {words.primary}
    </Button>
  );
}

/** A state that names no live invite: its glyph, its words, *Sign in to HelioGrid* and the line under it. */
function LandingPlace({ words, frame, onSignIn, actRef }: InviteLandingProps & ActRef) {
  const { place } = words;
  if (place === null) return null;
  const gone = frame.kind === 'empty';
  return (
    <div className="hg-invite-landing-place">
      <EmptyState
        icon={<ShellGlyph name={gone ? 'link-off' : 'tick'} size="xl" tone="primary" />}
        title={place.title}
        description={place.line}
        action={
          <div className="hg-invite-landing-place-act">
            <Button
              ref={actRef}
              variant={gone ? 'primary' : 'secondary'}
              size="lg"
              onClick={onSignIn}
            >
              {place.act}
            </Button>
            <Text variant="caption" color="secondary" align="center">
              {place.note}
            </Text>
          </div>
        }
      />
    </div>
  );
}

/** The read in flight: the inviter row, the heading and the invite card at their real heights; no act. */
function LandingSkeleton({ spoken }: { spoken: string }) {
  return (
    <div className="hg-invite-landing-skeleton" role="status" aria-busy="true" aria-label={spoken}>
      <div className="hg-invite-landing-skeleton-row" aria-hidden="true">
        <span className="hg-invite-landing-bar" data-shape="disc" />
        <div className="hg-invite-landing-skeleton-lines">
          <span className="hg-invite-landing-bar" data-shape="name" />
          <span className="hg-invite-landing-bar" data-shape="label" />
        </div>
      </div>
      <div className="hg-invite-landing-skeleton-lines" aria-hidden="true">
        <span className="hg-invite-landing-bar" data-shape="title" />
        <span className="hg-invite-landing-bar" data-shape="title-end" />
      </div>
      <Card
        read={{ kind: 'loading' }}
        density="expressive"
        className="hg-invite-landing-skeleton-card"
      />
    </div>
  );
}
