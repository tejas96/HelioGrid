import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { Children, isValidElement, useEffect, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { colors, type ThemeColor } from '../../primitives/Color/colors';
import { NO_FOCUS_AFTER, useFocusAfter } from '../../primitives/FocusAfter';
import { GroundProvider } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { TONE, type Tone, type ToneColors } from '../../primitives/Tone/tone.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { bannerKind } from './Banner.kinds';
import {
  ACTION_BELOW,
  actionStacks,
  BANNER_GLYPH,
  bannerDismissal,
  useDisclaimerWarning,
  useFormReport,
} from './Banner.logic';
import type { BannerGlyph, BannerProps } from './Banner.types';

type NativeBannerProps = BannerProps & {
  style?: StyleProp<ViewStyle>;
};

function Glyph({ name, color }: { name: BannerGlyph; color: ThemeColor }) {
  return <ShellGlyph name={BANNER_GLYPH[name]} size="sm" ink={color} />;
}

/**
 * Without a title the body IS the statement, so it keeps the tone colour and a heavier weight.
 * Under a title it steps back to --text-secondary at 400: the title is the fact, this is detail.
 * A body of parts (rows, a working) is laid out in a box: inside a `Text` a part is an inline view
 * with no width, so its own words wrap at nothing and the banner grows tall and empty.
 */
function Body({
  title,
  children,
  tone,
}: {
  title?: TranslatedText;
  children: ReactNode;
  tone: ThemeColor;
}) {
  const parts = Children.toArray(children);
  if (parts.length > 0 && parts.every(isValidElement)) {
    return <View style={title === undefined ? undefined : styles.bodyUnderTitle}>{children}</View>;
  }
  if (title === undefined) {
    return (
      <Text variant="body-sm" style={[styles.bodyAlone, { color: tone }]}>
        {children}
      </Text>
    );
  }
  return (
    <Text variant="body-sm" color="secondary" style={styles.bodyUnderTitle}>
      {children}
    </Text>
  );
}

/** The copy column: the title, the body, and the action when it has dropped under the body. */
function Content({
  title,
  tone,
  children,
  actionBelowBody,
}: {
  title?: TranslatedText;
  tone: ThemeColor;
  children?: ReactNode;
  actionBelowBody?: ReactNode;
}) {
  return (
    <View style={styles.content}>
      {title === undefined ? null : (
        <Text variant="body-sm" style={[styles.title, { color: tone }]}>
          {title}
        </Text>
      )}
      {children === undefined || children === null ? null : (
        <Body title={title} tone={tone}>
          {children}
        </Body>
      )}
      {actionBelowBody === undefined ? null : (
        <View style={styles.actionRow}>{actionBelowBody}</View>
      )}
    </View>
  );
}

function Dismiss({
  tone,
  label,
  onDismiss,
}: {
  tone: ThemeColor;
  label: TranslatedText;
  onDismiss: () => void;
}) {
  return (
    <Pressable accessibilityLabel={label} onPress={onDismiss} style={styles.dismiss}>
      <ShellGlyph name="close" size="dense" ink={tone} />
    </Pressable>
  );
}

/** The in-page statement of a fact about what's on screen. Never covers content, never blocks. */
export function Banner({
  kind = 'state',
  title,
  children,
  action,
  onDismiss,
  dismissLabel,
  focusAfter,
  dismissible,
  tone,
  variant = 'block',
  density = 'expressive',
  icon,
  actionBelow = ACTION_BELOW,
  onFormChange,
  style,
}: NativeBannerProps) {
  const meta = bannerKind(kind);
  const pair = bannerPair(tone ?? meta.tone);
  const dismissal = bannerDismissal({ dismissible, kind, onDismiss, dismissLabel });
  const leaving = useFocusAfter(focusAfter ?? NO_FOCUS_AFTER);
  const [width, setWidth] = useState<number | null>(null);
  const stacked = actionStacks(action !== undefined, width, actionBelow);
  useFormReport(stacked, width, onFormChange);
  useDisclaimerWarning(kind);

  /* RN has no `status` role; a polite live region is its equivalent, and `alert` maps straight. */
  const alerting = meta.role === 'alert';
  // An alert is said once on arrival and again only when its words change: a view that mounts
  // already holding the alert role stays silent, and iOS has no live region (as `TintedBlock`).
  const said = alerting
    ? [title, children].filter((part) => typeof part === 'string').join('. ')
    : '';
  useEffect(() => {
    if (said !== '') AccessibilityInfo.announceForAccessibility(said);
  }, [said]);
  const a11y = {
    accessibilityRole: alerting ? ('alert' as const) : undefined,
    accessibilityLiveRegion: alerting ? undefined : ('polite' as const),
  };

  if (variant === 'pill') {
    return (
      <View {...a11y} style={[styles.pill, { backgroundColor: pair.tint }, style]}>
        <GroundProvider ground="tile">
          {icon ?? <Glyph name={meta.icon} color={pair.ink} />}
          <Text variant="body-sm" style={[styles.pillWords, { color: pair.ink }]}>
            {title ?? children}
          </Text>
          {action}
        </GroundProvider>
      </View>
    );
  }

  return (
    <View
      {...a11y}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[
        styles.block,
        density === 'functional' ? styles.blockFunctional : styles.blockExpressive,
        { backgroundColor: pair.tint },
        style,
      ]}
    >
      {/* The tint is a tile ground: a control inside it takes the white fill (`F7-15`). */}
      <GroundProvider ground="tile">
        <View style={styles.glyph}>{icon ?? <Glyph name={meta.icon} color={pair.ink} />}</View>
        <Content title={title} tone={pair.ink} actionBelowBody={stacked ? action : undefined}>
          {children}
        </Content>
        {action === undefined || stacked ? null : <View style={styles.actionSlot}>{action}</View>}
        {dismissal === null ? null : (
          <Dismiss
            tone={pair.ink}
            label={dismissal.label}
            onDismiss={leaving(dismissal.onDismiss)}
          />
        )}
      </GroundProvider>
    </View>
  );
}

/** A tone's tint and ink; a neutral banner's words read secondary, as `Banner.css` sets them. */
function bannerPair(tone: Tone): ToneColors {
  return tone === 'neutral' ? { ...TONE.neutral, ink: colors['text-secondary'] } : TONE[tone];
}

const styles = StyleSheet.create({
  block: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  blockExpressive: {
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: 14,
    borderRadius: theme.radius['r-sm'],
  },
  blockFunctional: {
    paddingVertical: 10,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['rf-lg'],
  },
  glyph: {
    flexShrink: 0,
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  bodyAlone: {
    fontWeight: '500',
  },
  bodyUnderTitle: {
    marginTop: theme.spacing['sp-0-5'],
  },
  actionSlot: {
    flexShrink: 0,
    marginTop: -2,
  },
  /* Below `actionBelow` of the banner's own width the action takes its own line under the body. */
  actionRow: {
    flexDirection: 'row',
    marginTop: theme.spacing['sp-2'],
    marginLeft: -2,
  },
  dismiss: {
    margin: -theme.spacing['sp-3'],
    marginLeft: 0,
    flexShrink: 0,
    borderRadius: theme.radius['r-pill'],
    opacity: 0.7,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing['sp-2'],
    minHeight: 32,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: theme.radius['r-pill'],
  },
  pillWords: {
    fontWeight: '500',
  },
});
