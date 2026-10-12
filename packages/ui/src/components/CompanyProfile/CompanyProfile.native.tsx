import { theme } from '@heliogrid/theme';
import { useEffect } from 'react';
import { AccessibilityInfo, Keyboard, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import { Accordion } from '../Accordion/Accordion.native';
import { Button } from '../Button/Button.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { DoorTitle } from '../DoorFrame/DoorTitle.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { openedPart, profileItems, UNREAD_GLYPH, UNREAD_GLYPH_SIZE } from './CompanyProfile.logic';
import type { CompanyProfileProps } from './CompanyProfile.types';
import { ProfileSet } from './CompanyProfileSets.native';

/**
 * The company profile in the phone's one column (`SCR-M01-05` at 375): the heading and its line,
 * the five flat parts with one open, and the act held under the scrolling column. While the record
 * is read, bars stand in the list's place; a profile that could not be read is one centred message
 * with its retry, and the way on held at the foot.
 */
export function CompanyProfile({
  words,
  values,
  open,
  onOpen,
  onEdit,
  saving,
  onSave,
  onRetryRead,
  onContinueWithout,
}: CompanyProfileProps) {
  // A live region speaks on Android alone, so the failed save is also announced: iOS hears it too.
  const alert = words.act?.alert ?? null;
  useEffect(() => {
    if (alert !== null) AccessibilityInfo.announceForAccessibility(alert);
  }, [alert]);

  if (words.unread !== null) {
    return (
      <DoorFrame
        trailing={null}
        footer={
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            spokenName={words.unread.onwardSpoken}
            onClick={onContinueWithout}
          >
            {words.unread.onward}
          </Button>
        }
      >
        <View style={styles.unread}>
          <EmptyState
            icon={<UnreadGlyph />}
            title={words.unread.title}
            description={words.unread.line}
            action={
              <Button variant="primary" size="lg" onClick={onRetryRead}>
                {words.unread.retry}
              </Button>
            }
          />
        </View>
      </DoorFrame>
    );
  }

  const { act } = words;
  return (
    <DoorFrame
      trailing={null}
      identity={
        <View style={styles.head}>
          <DoorTitle title={words.title} intro={words.lede} />
        </View>
      }
      footer={
        act === null ? undefined : (
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
                Keyboard.dismiss();
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
        )
      }
    >
      <View style={styles.list}>
        {words.loading === null ? (
          <Accordion
            items={profileItems(words, open, (part) => (
              <ProfileSet part={part} words={words} values={values} onEdit={onEdit} />
            ))}
            value={open}
            onChange={(reported) => onOpen(openedPart(reported))}
          />
        ) : (
          <LoadingBars label={words.loading} bars={['panel', 'row', 'row', 'row', 'row']} />
        )}
      </View>
    </DoorFrame>
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
      {UNREAD_GLYPH.map((mark) =>
        mark.kind === 'path' ? (
          <Path key={mark.d} d={mark.d} />
        ) : (
          <Circle key={`${mark.cx}-${mark.cy}`} cx={mark.cx} cy={mark.cy} r={mark.r} />
        ),
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  /** The heading `sp-6` under the wordmark (`m-default`). */
  head: { paddingTop: theme.spacing['sp-6'] },
  /** The list `sp-5` under the heading's line. */
  list: { paddingTop: theme.spacing['sp-5'] },
  /** A failed read is one message, centred in the column's free height (`m-error`). */
  unread: { flex: 1, justifyContent: 'center' },
  /** The act, what is said above it and under it, `sp-3` apart. */
  act: { gap: theme.spacing['sp-3'] },
});
