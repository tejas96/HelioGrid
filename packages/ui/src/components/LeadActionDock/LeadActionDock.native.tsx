import type { LeadDetailAction } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { Linking, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { IconButton } from '../IconButton/IconButton.native';
import { Menu } from '../Menu/Menu.native';
import type { MenuItem } from '../Menu/Menu.types';
import { PendingAction } from '../PendingAction/PendingAction.native';
import type { LeadActionDockProps, LeadDockAct } from './LeadActionDock.types';

/** Each act's glyph — the same four the web half draws. */
const GLYPH: Record<Exclude<LeadDetailAction, 'call'>, ShellGlyphName> = {
  message: 'chat',
  log: 'pencil',
  visit: 'calendar',
  design: 'grid',
};

/** The round act's visual size: big enough for a thumb outdoors, the 44 target owned by Pressable. */
const ROUND = 52;

/**
 * The lead's five actions on the phone (`M02-32`): Call the biggest — the dialler opens on its
 * number, never for one that may not be called — the four round acts in thumb reach, and under them
 * the state acts the lead's standing offers with Junk, the referral and Merge behind More.
 */
export function LeadActionDock({
  layout,
  call,
  callLabel,
  acts,
  stateActs,
  more,
  moreLabel,
  standing,
}: LeadActionDockProps) {
  const waiting = standing?.kind === 'waiting';
  const callButton =
    call.kind === 'dial' ? (
      <Button
        variant="primary"
        size="lg"
        icon={<ShellGlyph name="phone" size="md" tone="inverse" />}
        fullWidth={layout === 'grid'}
        onClick={() => {
          void Linking.openURL(`tel:${call.phoneE164}`).catch(() => undefined);
        }}
      >
        {callLabel}
      </Button>
    ) : (
      <Button
        variant="primary"
        size="lg"
        icon={<ShellGlyph name="phone" size="md" tone="inverse" />}
        fullWidth={layout === 'grid'}
        disabled
        disabledReason={call.reason}
      >
        {callLabel}
      </Button>
    );
  const menuItems: MenuItem[] = [
    ...stateActs
      .filter((each) => each.act === 'junk')
      .map((each) => ({
        key: each.act,
        label: each.label,
        destructive: true,
        onSelect: each.onPress,
      })),
    ...more.map((each) => ({ key: each.key, label: each.label, onSelect: each.onPress })),
  ];
  return (
    <View style={styles.dock}>
      {layout === 'dock' ? (
        <View style={styles.row}>
          <View style={styles.call}>{callButton}</View>
          <View style={styles.rounds}>
            {acts.map((act) => (
              <RoundAct key={act.action} act={act} />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.grid}>
          {callButton}
          <View style={styles.pairs}>
            {acts.map((act) => (
              <View key={act.action} style={styles.half}>
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  icon={<ShellGlyph name={GLYPH[act.action]} size="sm" tone="primary" />}
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
      )}
      <View style={styles.stateActs}>
        {stateActs
          .filter((each) => each.act !== 'junk')
          .map((each) => (
            <Button
              key={each.act}
              variant="secondary"
              size="sm"
              disabled={waiting}
              loading={waiting && standing?.act === each.act}
              onClick={each.onPress}
            >
              {each.label}
            </Button>
          ))}
        {menuItems.length === 0 ? null : (
          <Menu label={moreLabel} items={menuItems} disabled={waiting} />
        )}
      </View>
      {standing === null ? null : standing.kind === 'waiting' ? (
        <PendingAction label={standing.line} />
      ) : (
        <PendingAction state="returned" reason={standing.reason} />
      )}
    </View>
  );
}

/** One of the four round acts: a circle with its glyph, its short word under it. */
function RoundAct({ act }: { act: LeadDockAct }) {
  return (
    <View style={styles.round}>
      <IconButton
        size={ROUND}
        label={act.label}
        disabled={act.disabledReason !== null}
        {...(act.disabledReason === null ? {} : { disabledReason: act.disabledReason })}
        onClick={act.onPress}
      >
        <ShellGlyph name={GLYPH[act.action]} size="md" tone="primary" />
      </IconButton>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text variant="caption" color="secondary" align="center">
          {act.short}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { gap: theme.spacing['sp-3'] },
  /* Call and the four rounds share one row while their words fit it, inside the page's gutter;
     when they do not, the rounds move under Call as one row of their own. Each round is as wide as
     its word: squeezed to a share of the row, "Message" broke inside itself. */
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-2'],
  },
  call: { flexGrow: 1, flexShrink: 0, justifyContent: 'center', minHeight: ROUND },
  rounds: {
    flexGrow: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  round: { minWidth: ROUND, alignItems: 'center', gap: theme.spacing['sp-1'] },
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
