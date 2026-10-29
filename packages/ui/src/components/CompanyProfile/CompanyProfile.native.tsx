import { theme } from '@heliogrid/theme';
import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { closeKeyboard } from '../../primitives/Keyboard/use-keyboard.native';
import { Text } from '../../primitives/Text/Text.native';
import { Accordion } from '../Accordion/Accordion.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { Button } from '../Button/Button.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { DoorTitle } from '../DoorFrame/DoorTitle.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { openedPart, PARTS_DENSITY, profileItems, UNREAD_GLYPH_SIZE } from './CompanyProfile.logic';
import type { CompanyProfileProps, CompanyProfileWords } from './CompanyProfile.types';
import { ProfileSet } from './CompanyProfileSets.native';

/**
 * The company profile in the phone's one column (`SCR-M01-05` at 375). In setup it is the door:
 * the heading and its line, the five flat parts with one open, and the act held under the
 * scrolling column. In settings it is the shell's page, which the shell scrolls: the line, the
 * parts and the act after them (`m-settings`). While the record is read, bars stand in the list's
 * place; a profile that could not be read is one centred message with its retry.
 */
export function CompanyProfile(props: CompanyProfileProps) {
  // A live region speaks on Android alone, so the failed save is also announced: iOS hears it too.
  const alert = props.words.act?.alert ?? null;
  useEffect(() => {
    if (alert !== null) AccessibilityInfo.announceForAccessibility(alert);
  }, [alert]);
  return props.life === 'settings' ? <SettingsPage {...props} /> : <SetupDoor {...props} />;
}

/** The setup step in the door's frame; a failed read keeps the way on held at the foot. */
function SetupDoor(props: CompanyProfileProps) {
  const { words, onContinueWithout } = props;
  const { unread } = words;
  if (unread !== null) {
    return (
      <DoorFrame
        trailing={null}
        footer={
          unread.onward === null ? undefined : (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              spokenName={unread.onwardSpoken ?? undefined}
              onClick={onContinueWithout}
            >
              {unread.onward}
            </Button>
          )
        }
      >
        <Unread unread={unread} read={props.read} />
      </DoorFrame>
    );
  }
  return (
    <DoorFrame
      trailing={null}
      identity={
        <View style={styles.head}>
          <DoorTitle title={words.title} intro={words.lede} />
        </View>
      }
      footer={<ProfileAct {...props} />}
    >
      <View style={styles.list}>
        <ProfileList {...props} />
      </View>
    </DoorFrame>
  );
}

/**
 * The page inside the shell: the heading, unless the app's bar holds it, its line, the parts at
 * the functional density and the act after them, scrolling with them. A failed read is the
 * message and its retry alone: settings sits in no corridor, so there is nowhere onward to go.
 */
function SettingsPage(props: CompanyProfileProps) {
  const { words, titleInBar = false } = props;
  if (words.unread !== null) {
    return (
      <View style={styles.page}>
        <Unread unread={words.unread} read={props.read} />
      </View>
    );
  }
  return (
    <View style={styles.page}>
      <View style={styles.pageHead}>
        {titleInBar ? null : <Text variant="h2">{words.title}</Text>}
        <Text variant="body" color="secondary">
          {words.lede}
        </Text>
      </View>
      <ProfileList {...props} />
      <ProfileAct {...props} />
    </View>
  );
}

/** The five flat parts with one open, or the bars that stand in their place while it is read. */
function ProfileList({
  life,
  words,
  values,
  open,
  onOpen,
  onEdit,
  onChooseSegment,
  onDeclareSize,
  saving,
  logoPicture,
  onRequestLogo,
}: CompanyProfileProps) {
  if (words.loading !== null) {
    return <LoadingBars label={words.loading} bars={['panel', 'row', 'row', 'row', 'row']} />;
  }
  return (
    <Accordion
      density={PARTS_DENSITY[life]}
      items={profileItems(words, open, (part) => (
        <ProfileSet
          part={part}
          words={words}
          values={values}
          onEdit={onEdit}
          onChooseSegment={onChooseSegment}
          onDeclareSize={onDeclareSize}
          density={PARTS_DENSITY[life]}
          saving={saving}
          logoPicture={logoPicture}
          onRequestLogo={onRequestLogo}
        />
      ))}
      value={open}
      onChange={(reported) => onOpen(openedPart(reported))}
    />
  );
}

/** The act: a failed save said once above it, the way on under it in setup, and its one line. */
function ProfileAct({ words, saving, onSave, onContinueWithout }: CompanyProfileProps) {
  const { act } = words;
  if (act === null) return null;
  return (
    <View style={styles.act}>
      {act.alert === null ? null : (
        <Text variant="caption" color="danger" align="center" live>
          {act.alert}
        </Text>
      )}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={saving}
        disabled={act.waiting !== null}
        disabledReason={act.waiting ?? undefined}
        spokenName={act.primarySpoken}
        onClick={() => {
          // The field is left before the act, so the keyboard never covers what the save answers.
          closeKeyboard();
          onSave();
        }}
      >
        {act.primary}
      </Button>
      {act.secondary === null ? null : (
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          disabled={saving}
          spokenName={act.secondarySpoken ?? undefined}
          onClick={onContinueWithout}
        >
          {act.secondary}
        </Button>
      )}
      {act.line === null ? null : (
        <Text variant="caption" color="secondary" align="center">
          {act.line}
        </Text>
      )}
    </View>
  );
}

/** A profile that could not be read: one centred message and its retry. */
function Unread({
  unread,
  read,
}: {
  unread: NonNullable<CompanyProfileWords['unread']>;
  read: CompanyProfileProps['read'];
}) {
  const retry = () => {
    if (read.kind === 'failed') read.retry();
  };
  return (
    <View style={styles.unread}>
      <EmptyState
        icon={<UnreadGlyph />}
        title={unread.title}
        description={unread.line}
        action={
          <Button variant="primary" size="lg" onClick={retry}>
            {unread.retry}
          </Button>
        }
      />
    </View>
  );
}

/** Decorative: the message beside it carries the meaning. react-native-svg has no currentColor. */
function UnreadGlyph() {
  const color = theme.colors['text-tertiary'];
  return (
    <Svg
      width={UNREAD_GLYPH_SIZE}
      height={UNREAD_GLYPH_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <ShellGlyphMarks name="alert-ring" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  /** The heading `sp-6` under the wordmark (`m-default`). */
  head: { paddingTop: theme.spacing['sp-6'] },
  /** The list `sp-5` under the heading's line. */
  list: { paddingTop: theme.spacing['sp-5'] },
  /** The settings page: its line, the list and the act after them, `sp-6` apart (`m-settings`). */
  page: { flex: 1, gap: theme.spacing['sp-6'] },
  /** A heading and its line, `sp-2` apart. */
  pageHead: { gap: theme.spacing['sp-2'] },
  /** A failed read is one message, centred in the column's free height (`m-error`). */
  unread: { flex: 1, justifyContent: 'center' },
  /** The act, what is said above it and under it, `sp-3` apart. */
  act: { gap: theme.spacing['sp-3'] },
});
