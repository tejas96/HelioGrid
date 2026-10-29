import { OTP_LENGTH } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { type ReactNode, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { type FocusAfter, type FocusHandle, useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { Card } from '../Card/Card.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { OtpInput } from '../OtpInput/OtpInput.native';
import { TintedBlock } from '../TintedBlock/TintedBlock.native';
import { InviteDecline } from './InviteDecline.native';
import { InviteFactsBlock, InviterRow } from './InviteFacts.native';
import type { InviteLandingProps, InviteLandingWords } from './InviteLanding.types';

/** The new frame's act, which takes the focus when a press took the old one away. */
/**
 * The frame's act, which takes the screen reader when a press took the old frame's control away —
 * the ask, a confirmed decline. The read that opens the page moves nothing.
 */
type ActRef = { actRef: FocusAfter };

/* The board's skeleton: the two lines under the disc, and the invite card's own height. */
const SKELETON_NAME = 120;
const SKELETON_LABEL = 168;
const SKELETON_CARD = 163;

/**
 * The landing in the phone's one column (`SCR-M01-08` m-normal): who invited, the heading, the
 * invite card and the code, with the acts held at the foot of the screen (brief ruling 17). The code takes no
 * focus on arrival: the platform's auto-read fills it, and a keyboard would hide who invited
 * (ruling 12). A state that names no live invite is centred, as the frame's wall is.
 */
export function InviteLanding(props: InviteLandingProps) {
  const { language, words, frame } = props;
  const actRef = useRef<FocusHandle>(null);
  const shell = (identity: ReactNode, task: ReactNode, footer?: ReactNode) => (
    <DoorFrame trailing={language} identity={identity} footer={footer}>
      <View style={identity === undefined ? [styles.stack, styles.alone] : styles.stack}>
        {task}
      </View>
    </DoorFrame>
  );
  switch (frame.kind) {
    case 'loading':
      return shell(undefined, <LandingSkeleton words={words} />);
    case 'empty':
    case 'reinvite-requested':
    case 'declined':
      return shell(undefined, <LandingPlace {...props} actRef={actRef} />);
    case 'load-error':
      return shell(
        undefined,
        <>
          {words.loadError === null ? null : (
            <Banner kind="validation" tone="danger" title={words.loadError.title}>
              {words.loadError.line}
            </Banner>
          )}
          <PrimaryAct {...props} actRef={actRef} />
        </>,
      );
    case 'expired':
    case 'landing':
      return shell(
        <LandingHead {...props} />,
        <LandingTask {...props} />,
        <LandingActs {...props} actRef={actRef} />,
      );
  }
}

/** Who invited, the heading, the banner above the invite card, and the card. */
function LandingHead({ words, frame, phone }: InviteLandingProps) {
  const { inviter, title, facts, banner } = words;
  return (
    <View style={[styles.stack, styles.head]}>
      {inviter === null ? null : <InviterRow inviter={inviter} />}
      {title === null ? null : <Text variant="h2">{title}</Text>}
      {banner === null ? null : <LandingBanner banner={banner} />}
      {facts === null || phone === null || frame.kind !== 'landing' ? null : (
        <Card density="expressive">
          <InviteFactsBlock facts={facts} phone={phone} />
        </Card>
      )}
    </View>
  );
}

function LandingBanner({ banner }: { banner: NonNullable<InviteLandingWords['banner']> }) {
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

/** The code family's block, the code and its resend. */
function LandingTask(props: InviteLandingProps) {
  const { words, frame, code, onCode, onPress } = props;
  const field = frame.codeField;
  return (
    <>
      {words.block === null ? null : <TintedBlock {...words.block} announce="alert" />}
      {frame.code === null || field === 'absent' ? null : (
        <View style={styles.code}>
          <OtpInput
            length={OTP_LENGTH}
            label={words.codeLabel}
            words={words.otp}
            value={code}
            onChange={onCode}
            disabled={field === 'closed'}
            readOnly={field === 'read-only'}
            busy={frame.busy && !frame.joinFailed}
            helper={words.codeHelper ?? undefined}
            error={words.codeError ?? undefined}
          />
        </View>
      )}
      <ResendSlot words={words} onPress={onPress} />
    </>
  );
}

/**
 * The acts, held at the foot of the screen under the scrolling column (owner ruling 2026-10-22,
 * brief ruling 17): *Join* is never below the fold, with long Hindi or Marathi lines or the
 * keyboard open.
 */
function LandingActs(props: InviteLandingProps & ActRef) {
  const { words, frame, onPress } = props;
  return (
    <View style={styles.actions}>
      <PrimaryAct {...props} />
      {words.foot === null ? null : (
        <Text variant="caption" color="secondary" align="center">
          {words.foot}
        </Text>
      )}
      {words.decline === null || frame.decline === null ? null : (
        <InviteDecline
          words={words.decline}
          decline={frame.decline}
          onPress={onPress}
          focusAfter={props.actRef}
        />
      )}
    </View>
  );
}

function ResendSlot({ words, onPress }: Pick<InviteLandingProps, 'words' | 'onPress'>) {
  if (words.resend !== null) {
    return (
      <View style={styles.resend}>
        <Button variant="ghost" size="md" onClick={() => onPress('resend')}>
          {words.resend}
        </Button>
      </View>
    );
  }
  if (words.wait === null) return null;
  return (
    <View style={styles.resend}>
      <Button variant="ghost" size="md" disabled spokenName={words.wait.spoken}>
        {words.wait.label}
      </Button>
    </View>
  );
}

/** The frame's one act: Join, Try again, the ask, or the door control a code refusal offers. */
function PrimaryAct({ words, frame, onPress, actRef }: InviteLandingProps & ActRef) {
  const { primary } = frame;
  const leaving = useFocusAfter(actRef);
  if (primary === null || words.primary === null) return null;
  return (
    <Button
      ref={actRef}
      variant="primary"
      size="lg"
      fullWidth
      loading={frame.busy}
      disabled={primary.label === 'join' && frame.joinHeld}
      onClick={leaving(() => onPress(primary.press))}
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
    <View style={styles.place}>
      <EmptyState
        icon={<ShellGlyph name={gone ? 'link-off' : 'tick'} size="xl" tone="primary" />}
        title={place.title}
        description={place.line}
        action={
          <View style={styles.placeAct}>
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
          </View>
        }
      />
    </View>
  );
}

/** The read in flight: the inviter row, the heading and the invite card at their real heights; no act. */
function LandingSkeleton({ words }: { words: InviteLandingWords }) {
  return (
    <View
      style={styles.stack}
      accessible
      accessibilityLabel={words.loading}
      accessibilityState={{ busy: true }}
    >
      <View style={styles.skeletonRow}>
        <View style={[styles.bar, styles.disc]} />
        <View style={styles.lines}>
          <View style={[styles.bar, { width: SKELETON_NAME }]} />
          <View style={[styles.bar, { width: SKELETON_LABEL }]} />
        </View>
      </View>
      <View style={styles.lines}>
        <View style={[styles.bar, styles.titleBar, styles.titleStart]} />
        <View style={[styles.bar, styles.titleBar, styles.titleEnd]} />
      </View>
      <Card
        read={{ kind: 'loading' }}
        loadingLabel={words.loadingCard}
        density="expressive"
        style={styles.skeletonCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { flexGrow: 1, gap: theme.spacing['sp-5'] },
  /** The frame's identity sits on the column's first line; the stack keeps `sp-5` down to the code. */
  head: { flexGrow: 0, paddingTop: theme.spacing['sp-6'], paddingBottom: theme.spacing['sp-5'] },
  /** With no identity above it, the body starts `sp-6` under the header row. */
  alone: { paddingTop: theme.spacing['sp-6'] },
  code: { paddingHorizontal: theme.spacing['sp-0-5'] },
  resend: { alignItems: 'center', paddingTop: theme.spacing['sp-2'] },
  actions: { gap: theme.spacing['sp-3'] },
  place: { flexGrow: 1, justifyContent: 'center' },
  placeAct: { alignItems: 'center', gap: theme.spacing['sp-3'] },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  lines: { flexShrink: 1, gap: theme.spacing['sp-2'] },
  bar: {
    height: theme.spacing['sp-3'],
    borderRadius: theme.radius['rf-md'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  disc: {
    width: theme.spacing['sp-10'],
    height: theme.spacing['sp-10'],
    borderRadius: theme.radius['r-pill'],
  },
  titleBar: { height: theme.spacing['sp-6'] },
  titleStart: { width: '88%' },
  titleEnd: { width: '56%' },
  skeletonCard: { minHeight: SKELETON_CARD },
});
