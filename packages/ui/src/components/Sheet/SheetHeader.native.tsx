import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type {
  GestureResponderHandlers,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import type { OverlayStatus, OverlaySubtitleFace, SheetDensity } from './Sheet.types';

interface SheetHeaderProps {
  density: SheetDensity;
  /** The title's own mark, before the heading block; nothing is drawn for it when absent. */
  leading?: ReactNode;
  /** `moment`: the mark above, the heading centred under it. */
  headerLook: 'row' | 'moment';
  /** With a handle above it the header loses its own top padding, as on web. */
  handle: boolean;
  overline?: TranslatedText;
  /** Set when the title tucks into the handle's row: the heading leaves as it goes there. */
  tuck?: Animated.Value;
  status?: OverlayStatus;
  subtitle?: string;
  subtitleFace: OverlaySubtitleFace;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * A sheet's title is the UI face at semibold, as a system sheet's is — the display face is the
 * page's large title, and over a list it read heavy. A functional sheet, dense with fields, takes
 * the compact size.
 */
const TITLE_VARIANT: Record<SheetDensity, 'h2' | 'h4'> = { expressive: 'h2', functional: 'h4' };

/**
 * The sheet's header. It draws no ✕ on the phone: a drag, a tap outside and Back close the sheet,
 * and its handle is the close a screen reader finds. The title keeps its drawn size whatever text
 * size the person set, as a platform sheet's own title does: grown, one word was wider than the
 * line and broke inside itself. `overline` is the Text primitive's own 11px signature — the one
 * sanctioned appearance below the 12px floor — so this file never re-spells it.
 */
export function SheetHeader({
  density,
  leading,
  headerLook,
  handle,
  overline,
  tuck,
  status,
  subtitle,
  subtitleFace,
  title,
  style,
}: SheetHeaderProps) {
  return (
    <Animated.View
      style={[
        styles.header,
        density === 'functional' ? styles.headerFunctional : styles.headerExpressive,
        handle ? styles.headerWithHandle : undefined,
        tuck === undefined ? undefined : tuckedOut(tuck),
        style,
      ]}
    >
      <Lead leading={leading} moment={headerLook === 'moment'}>
        <Heading
          density={density}
          moment={headerLook === 'moment'}
          overline={overline}
          status={status}
          subtitle={subtitle}
          subtitleFace={subtitleFace}
          title={title}
        />
      </Lead>
    </Animated.View>
  );
}

/** The heading rising a little, shrinking and fading as the title goes up into the handle's row. */
function tuckedOut(tuck: Animated.Value) {
  return {
    opacity: tuck.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [
      { translateY: tuck.interpolate({ inputRange: [0, 1], outputRange: [0, -TUCK_RISE] }) },
      { scale: tuck.interpolate({ inputRange: [0, 1], outputRange: [1, TUCK_SCALE] }) },
    ],
  };
}

/** How far the heading rises and how small it gets on its way out — a nudge, not a journey. */
const TUCK_RISE = theme.spacing['sp-3'];
const TUCK_SCALE = 0.92;

/** The heading block: overline, title with its status, and the line under it — centred for a moment. */
function Heading({
  density,
  moment,
  overline,
  status,
  subtitle,
  subtitleFace,
  title,
}: Pick<
  SheetHeaderProps,
  'density' | 'overline' | 'status' | 'subtitle' | 'subtitleFace' | 'title'
> & {
  moment: boolean;
}) {
  return (
    <View style={[styles.heading, moment ? styles.headingMoment : undefined]}>
      {overline === undefined ? null : (
        <Text variant="overline" color="tertiary" style={styles.overline}>
          {overline}
        </Text>
      )}
      {title === undefined ? null : (
        <View style={styles.titleLine}>
          <Text
            variant={TITLE_VARIANT[density]}
            style={moment ? styles.centred : undefined}
            fixedSize
          >
            {title}
          </Text>
          {status === undefined ? null : (
            <StatusChip
              status={status.label}
              label={status.label}
              tone={status.tone}
              density="functional"
            />
          )}
        </View>
      )}
      {subtitle === undefined ? null : (
        <Text
          variant={subtitleFace === 'mono' ? 'mono' : 'body-sm'}
          color="secondary"
          style={[styles.subtitle, moment ? styles.centred : undefined]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

/**
 * The mark and the heading side by side — or, for a moment, the mark above it — only when there is
 * a mark, so no empty box is drawn.
 */
function Lead({
  leading,
  moment,
  children,
}: {
  leading: ReactNode;
  moment: boolean;
  children: ReactNode;
}) {
  if (leading === undefined || leading === null) return children;
  return (
    <View style={moment ? styles.leadMoment : styles.lead}>
      {leading}
      {children}
    </View>
  );
}

export interface SheetHeaderSlotProps extends Omit<SheetHeaderProps, 'style'> {
  /** The drag, when no handle above the header takes it. */
  panHandlers?: GestureResponderHandlers;
  /**
   * Set when the header lies over the top of the body, which pads itself by this height. It takes
   * no touch: once its title has tucked, the rows beneath it must still answer a tap.
   */
  onLift?: (height: number) => void;
}

/** Where the header sits in the panel: a row of its own, or lifted over the body's top. */
export function SheetHeaderSlot({ panHandlers, onLift, ...header }: SheetHeaderSlotProps) {
  const lifted = onLift !== undefined;
  const measure = (event: LayoutChangeEvent) => onLift?.(event.nativeEvent.layout.height);
  return (
    <View
      {...panHandlers}
      pointerEvents={lifted ? 'none' : 'auto'}
      onLayout={lifted ? measure : undefined}
      style={lifted ? slot.lifted : undefined}
    >
      <SheetHeader {...header} />
    </View>
  );
}

const slot = StyleSheet.create({
  lifted: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
});

const styles = StyleSheet.create({
  header: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingBottom: theme.spacing['sp-3'],
    zIndex: 1,
  },
  /* 10 has no spacing token — it is the reference's own functional top padding. */
  headerExpressive: { paddingTop: theme.spacing['sp-3'], paddingHorizontal: theme.spacing['sp-5'] },
  headerFunctional: { paddingTop: 10, paddingHorizontal: theme.spacing['sp-4'] },
  headerWithHandle: { paddingTop: 0 },
  heading: { flexShrink: 1, minWidth: 0 },
  lead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    flexShrink: 1,
    minWidth: 0,
  },
  leadMoment: { flex: 1, alignItems: 'center', gap: theme.spacing['sp-3'], minWidth: 0 },
  headingMoment: { alignItems: 'center' },
  centred: { textAlign: 'center' },
  titleLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  overline: { marginBottom: 6 },
  subtitle: { marginTop: theme.spacing['sp-0-5'] },
});
