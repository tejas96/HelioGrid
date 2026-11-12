import { theme } from '@heliogrid/theme';
import { Linking, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { IconButton } from '../IconButton/IconButton.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import { DOCK_ACTION_GLYPH } from './LeadActionDock.glyphs';
import { DOCK_ROUND } from './LeadActionDock.logic';
import type { LeadActionDockProps, LeadDockAct, LeadDockCall } from './LeadActionDock.types';

/**
 * The lead's five actions on the phone (`M02-32`). The `dock` draws them as one row of equal
 * circles, Call the one ocean circle — the dialler opens on its number, never for one that may not
 * be called — and a closed lead's Reopen in their place; the `grid` stands Call across and the four
 * as pills two by two. Under them the state acts this layout keeps; the rest are the record menu's.
 */
export function LeadActionDock({
  layout,
  call,
  callLabel,
  acts,
  stateActs,
  standing,
  closed,
}: LeadActionDockProps) {
  const waiting = standing?.kind === 'waiting';
  return (
    <View style={styles.dock}>
      {layout === 'grid' ? (
        <View style={styles.grid}>
          <CallPill call={call} label={callLabel} />
          <View style={styles.pairs}>
            {acts.map((act) => (
              <View key={act.action} style={styles.half}>
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  icon={
                    <ShellGlyph name={DOCK_ACTION_GLYPH[act.action]} size="sm" tone="primary" />
                  }
                  disabled={act.disabledReason !== null}
                  {...(act.disabledReason === null ? {} : { disabledReason: act.disabledReason })}
                  onClick={act.onPress}
                >
                  {act.label}
                </Button>
              </View>
            ))}
          </View>
        </View>
      ) : closed ? null : (
        <View style={styles.rounds}>
          <CallRound call={call} label={callLabel} />
          {acts.map((act) => (
            <RoundAct key={act.action} act={act} />
          ))}
        </View>
      )}
      {stateActs.length === 0 ? null : (
        <View style={styles.stateActs}>
          {stateActs.map((each) => (
            <Button
              key={each.act}
              variant="secondary"
              size={layout === 'dock' ? 'md' : 'sm'}
              fullWidth={layout === 'dock'}
              disabled={waiting}
              loading={waiting && standing?.act === each.act}
              onClick={each.onPress}
            >
              {each.label}
            </Button>
          ))}
        </View>
      )}
      {standing === null ? null : standing.kind === 'waiting' ? (
        <PendingAction label={standing.line} />
      ) : (
        <PendingAction state="returned" reason={standing.reason} />
      )}
    </View>
  );
}

/** The grid's Call: the ocean pill across the column, or off with why. */
function CallPill({
  call,
  label,
}: {
  call: LeadDockCall;
  label: LeadActionDockProps['callLabel'];
}) {
  const glyph = <ShellGlyph name={DOCK_ACTION_GLYPH.call} size="md" tone="inverse" />;
  return call.kind === 'dial' ? (
    <Button variant="primary" size="lg" icon={glyph} fullWidth onClick={() => dial(call.phoneE164)}>
      {label}
    </Button>
  ) : (
    <Button
      variant="primary"
      size="lg"
      icon={glyph}
      fullWidth
      disabled
      disabledReason={call.reason}
    >
      {label}
    </Button>
  );
}

/** The dock's first circle: Call in ocean, the dialler on its number, or off with why. */
function CallRound({
  call,
  label,
}: {
  call: LeadDockCall;
  label: LeadActionDockProps['callLabel'];
}) {
  return (
    <View style={styles.round}>
      <View style={styles.circle}>
        <IconButton
          size={DOCK_ROUND}
          variant="dark"
          label={label}
          disabled={call.kind === 'blocked'}
          {...(call.kind === 'blocked'
            ? { disabledReason: call.reason }
            : { href: `tel:${call.phoneE164}` })}
        >
          <ShellGlyph name={DOCK_ACTION_GLYPH.call} size="md" tone="inverse" />
        </IconButton>
      </View>
      <RoundWord word={label} />
    </View>
  );
}

/** One of the four circles beside Call: its glyph, its short word under it. */
function RoundAct({ act }: { act: LeadDockAct }) {
  return (
    <View style={styles.round}>
      <View style={styles.circle}>
        <IconButton
          size={DOCK_ROUND}
          label={act.label}
          disabled={act.disabledReason !== null}
          {...(act.disabledReason === null ? {} : { disabledReason: act.disabledReason })}
          onClick={act.onPress}
        >
          <ShellGlyph name={DOCK_ACTION_GLYPH[act.action]} size="md" tone="primary" />
        </IconButton>
      </View>
      <RoundWord word={act.short} />
    </View>
  );
}

/** The word under a circle is for the eye; the circle itself speaks the act. */
function RoundWord({ word }: { word: LeadDockAct['short'] }) {
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Text variant="caption" color="secondary" align="center">
        {word}
      </Text>
    </View>
  );
}

function dial(phoneE164: string) {
  void Linking.openURL(`tel:${phoneE164}`).catch(() => undefined);
}

const styles = StyleSheet.create({
  dock: { gap: theme.spacing['sp-3'] },
  /* Five equal cells: each circle centred over its word, the word wrapping inside its own cell. */
  rounds: { flexDirection: 'row', gap: theme.spacing['sp-2'] },
  round: { flex: 1, minWidth: 0, alignItems: 'center', gap: theme.spacing['sp-1'] },
  /* The circle's own box, centred over its word: a circle off with a reason sits in the reason's
     bubble anchor, which starts at the left of whatever holds it. */
  circle: { alignItems: 'center' },
  grid: { gap: theme.spacing['sp-2'] },
  pairs: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  half: { flexGrow: 1, flexBasis: '45%' },
  stateActs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
});
