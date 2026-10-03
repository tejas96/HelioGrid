import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, tileSurface, useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ActivityGlyph } from '../ActivityStream/ActivityGlyph.native';
import { Button } from '../Button/Button.native';
import { Badge } from '../Chip/Chip.native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import { LogoTile } from '../Wordmark/Wordmark.native';
import { notificationGlyph } from './NotificationCard.logic';
import type {
  NotificationAnnouncementProps,
  NotificationCardProps,
  NotificationLandingProps,
} from './NotificationCard.types';

/**
 * One notification (`SCR-SHELL-03`). The face is a sibling Pressable under the content, as on the
 * web: a Pressable is one accessibility element on iOS, so a tile that WAS the Pressable would hide
 * the act inside it from a screen reader. The words let touches through (`pointerEvents="none"`)
 * to the face; only an act takes its own.
 */
export function NotificationCard({
  type,
  title,
  body,
  time,
  unreadLabel,
  name,
  onOpen,
  act,
  sideAct,
}: NotificationCardProps) {
  return (
    <Tile name={name} onOpen={onOpen} style={styles.card}>
      <View style={styles.top} pointerEvents="box-none">
        <View style={styles.inert} pointerEvents="none">
          <Glyph type={type} unread={unreadLabel !== undefined} />
          <Words title={title} body={body}>
            <Meta time={time} unreadLabel={unreadLabel} />
          </Words>
        </View>
        {sideAct ?? null}
      </View>
      {act ? (
        <View style={styles.foot} pointerEvents="box-none">
          {act}
        </View>
      ) : null}
    </Tile>
  );
}

/** Product news (`F6.4`): the product's tile where a glyph would be, and who speaks, named. */
export function NotificationAnnouncement({
  overline,
  title,
  body,
  time,
  name,
  onOpen,
  act,
}: NotificationAnnouncementProps) {
  return (
    <Tile name={name} onOpen={onOpen} style={styles.card}>
      <View style={[styles.top, styles.inert]} pointerEvents="none">
        <View style={styles.glyphSlot} importantForAccessibility="no-hide-descendants">
          <LogoTile size={theme.spacing['sp-8']} />
        </View>
        <Words title={title} body={body} overline={overline} />
      </View>
      <View style={[styles.foot, styles.spread]} pointerEvents="box-none">
        <Text variant="mono" color="secondary">
          {time}
        </Text>
        {act}
      </View>
    </Tile>
  );
}

/** The honest landing (`F6-16`'s edge): the subject is out of reach, and the way back. */
export function NotificationLanding({
  title,
  message,
  backLabel,
  onBack,
}: NotificationLandingProps) {
  return (
    <View style={styles.landing}>
      <UnavailableNote variant="region" title={title} message={message} />
      <View style={styles.back}>
        <Button variant="secondary" size="sm" onClick={onBack}>
          {backLabel}
        </Button>
      </View>
    </View>
  );
}

/** A tile (`F7-49`), with its face under the content when a tap on it does something. */
export function Tile({
  name,
  onOpen,
  style,
  children,
}: {
  name: string;
  onOpen?: () => void;
  style: object;
  children: ReactNode;
}) {
  return (
    <View style={[tileSurface, style]}>
      {onOpen === undefined ? null : (
        <Pressable onPress={onOpen} accessibilityLabel={name} style={styles.face} />
      )}
      <GroundProvider ground="tile">{children}</GroundProvider>
    </View>
  );
}

export function Glyph({ type, unread }: { type: string; unread: boolean }) {
  const { controlFill, ground } = useGround();
  return (
    <View
      style={[styles.glyphSlot, styles.glyph, { backgroundColor: controlFill }]}
      importantForAccessibility="no-hide-descendants"
    >
      <ActivityGlyph name={notificationGlyph(type)} size={20} color={theme.colors.accent} />
      {unread ? <View style={[styles.dot, { borderColor: ground }]} /> : null}
    </View>
  );
}

function Words({
  title,
  body,
  overline,
  children,
}: {
  title: string;
  body: string;
  overline?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.words}>
      {overline === undefined ? null : (
        <Text variant="overline" color="secondary">
          {overline}
        </Text>
      )}
      <View style={styles.sentence}>
        <Text variant="body" bold style={styles.title}>
          {title}
        </Text>
        <Text variant="body-sm" color="secondary">
          {body}
        </Text>
      </View>
      {children}
    </View>
  );
}

export function Meta({ time, unreadLabel }: { time: string; unreadLabel?: string }) {
  return (
    <View style={styles.meta}>
      <Text variant="mono" color="secondary" style={styles.time}>
        {time}
      </Text>
      {unreadLabel === undefined ? null : (
        <Badge tone="accent" density="functional">
          {unreadLabel}
        </Badge>
      )}
    </View>
  );
}

export const styles = StyleSheet.create({
  /* The board's meta line: the time in mono at the caption size (12), not body-sm. */
  time: {
    fontSize: theme.type.roles.caption.fontSize,
    lineHeight: theme.type.roles.caption.lineHeight,
  },
  card: {
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-expressive'],
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  inert: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  face: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: theme.radius['r-card-expressive'],
  },
  glyphSlot: {
    width: theme.spacing['sp-10'],
    height: theme.spacing['sp-10'],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  glyph: { borderRadius: theme.radius['r-pill'] },
  /* Decoration beside the word "Unread", never instead of it. */
  dot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: theme.radius['r-pill'],
    borderWidth: 2,
    backgroundColor: theme.colors.accent,
  },
  words: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing['sp-1'],
    paddingTop: theme.spacing['sp-1'],
  },
  sentence: { gap: theme.spacing['sp-0-5'] },
  /* `--tr-h4`, −0.01em, at the body's 15 — the web half's tracking token, in dp. */
  title: { letterSpacing: -0.15 },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    marginTop: theme.spacing['sp-1'],
  },
  /* The foot sits under the words, past the glyph's column. */
  foot: { paddingLeft: theme.spacing['sp-10'] + theme.spacing['sp-3'] },
  spread: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  landing: { gap: theme.spacing['sp-4'] },
  back: { flexDirection: 'row' },
});
