import { theme } from '@heliogrid/theme';
import { useCallback, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable as RNPressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable/Pressable.types';
import { Text } from '../../primitives/Text/Text.native';
import { OperationProgress } from '../OperationProgress/OperationProgress.native';
import { IndeterminateRail } from '../PendingAction/IndeterminateRail.native';
import { isRunning, summariseJobs } from './JobTray.summary';
import type { JobTrayProps } from './JobTray.types';

interface NativeJobTrayProps extends JobTrayProps {
  style?: StyleProp<ViewStyle>;
}

const TONE_COLOUR = {
  warning: theme.colors['warning-text'],
  success: theme.colors['success-text'],
};

/**
 * Work you walked away from, and the one place it lives. Renders nothing with no jobs.
 *
 * Touch mapping: the web half closes on Escape and on a press outside the tray. Neither exists
 * here — RN has no key events on a phone, and a full-screen catcher would have to live in the
 * portal layer, which draws ABOVE this panel and would swallow the rows. So the trigger toggles,
 * which is the ordinary touch gesture for a popover of this size.
 */
export function JobTray({
  jobs = [],
  open,
  onOpenChange,
  label = 'Background work',
  onClear,
  clearLabel = 'Clear finished',
  align = 'right',
  style,
}: NativeJobTrayProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = open ?? innerOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) {
        setInnerOpen(next);
      }
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );

  if (jobs.length === 0) {
    return null;
  }
  const summary = summariseJobs(jobs);
  const finished = jobs.some((job) => !isRunning(job));
  const tone =
    summary.tone === undefined ? theme.colors['text-secondary'] : TONE_COLOUR[summary.tone];

  return (
    <View style={[styles.root, style]}>
      {/* The web half's `aria-expanded` — the Pressable primitive has no prop for it, so the
          trigger is an RN Pressable holding the same 44dp floor from MIN_TOUCH_TARGET. A trigger
          that cannot say whether the tray is open is the one control here a reader must not have
          to guess at. (`aria-haspopup` has no RN counterpart; the role and the state carry it.) */}
      <RNPressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${label}, ${summary.words}`}
        onPress={() => setOpen(!isOpen)}
        style={[styles.trigger, isOpen ? styles.triggerOpen : null]}
      >
        {summary.busy ? (
          <IndeterminateRail width={18} />
        ) : (
          <Svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke={tone}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Circle cx={12} cy={12} r={9} />
            <Path d="M12 7.5V12l3 2" />
          </Svg>
        )}
        <Text variant="body-sm" style={[styles.words, { color: tone }]}>
          {summary.words}
        </Text>
      </RNPressable>

      {isOpen ? (
        /* The web half's `role="dialog" aria-label` — so the native half takes the dialog role and
           keeps the name on it. Without a role the name was inert: a bare View is not an
           accessibility element, and the panel opened silent. The role, never `accessible`: the
           panel holds "Clear finished" and one OperationProgress per job, and folding would put
           the clear control and every job's own state out of reach. It stays NOT modal — nothing
           traps the reader behind it, which is what `accessibilityViewIsModal={false}` says. */
        <View
          role="dialog"
          accessibilityViewIsModal={false}
          accessibilityLabel={label}
          style={[styles.panel, align === 'left' ? styles.panelLeft : styles.panelRight]}
        >
          <View style={styles.panelHead}>
            <Text variant="overline" color="tertiary">
              {label}
            </Text>
            {onClear !== undefined && finished ? (
              <Pressable onPress={onClear} style={styles.clear}>
                <Text variant="caption" color="secondary" style={styles.clearWords}>
                  {clearLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView style={styles.jobs} contentContainerStyle={styles.jobsContent}>
            {jobs.map((job) => (
              <View key={job.id}>
                <OperationProgress size="inline" {...job} label={job.label} />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  trigger: {
    flexDirection: 'row',
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: 'transparent',
  },
  triggerOpen: {
    backgroundColor: theme.colors['accent-subtle'],
  },
  words: {
    fontWeight: '500',
  },
  panel: {
    position: 'absolute',
    top: MIN_TOUCH_TARGET + theme.spacing['sp-2'],
    zIndex: 40,
    width: 340,
    maxHeight: 420,
    padding: theme.spacing['sp-4'],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-md'],
    ...theme.elevation.e4,
  },
  panelRight: {
    right: 0,
  },
  panelLeft: {
    left: 0,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  clear: {
    marginRight: -theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
  },
  clearWords: {
    fontWeight: '500',
  },
  jobs: {
    flexGrow: 0,
  },
  jobsContent: {
    gap: 18,
  },
});
