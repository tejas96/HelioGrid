import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { AvatarGroup } from '../Avatar/Avatar.native';
import { PRESET_GLYPH } from '../SettingsList/SettingsList.logic';
import { GRANT_DISC_SIZE, GRANT_DISCS_SHOWN } from './AssignRoles.logic';
import type { AssignRolesGrant } from './AssignRoles.types';

/** The grant line's card, as the web half draws it: the cluster is decoration, the sentence the meaning. */
export function GrantCard({ grant, label }: { grant: AssignRolesGrant; label: string }) {
  useSaidAgainOnIos(grant.parts.map((part) => part.text).join(''));
  return (
    <View style={styles.card} accessibilityLabel={label} role="region" collapsable={false}>
      {grant.speakers.length === 0 ? null : (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <AvatarGroup
            people={grant.speakers.map((preset) => ({
              name: preset,
              glyph: <ShellGlyph name={PRESET_GLYPH[preset]} size="sm" tone="accent" />,
            }))}
            size={GRANT_DISC_SIZE}
            max={GRANT_DISCS_SHOWN}
            ring={theme.colors['accent-subtle']}
          />
        </View>
      )}
      <View style={styles.words}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text variant="overline" color="secondary">
            {label}
          </Text>
        </View>
        <View accessibilityLiveRegion="polite">
          <Text variant="body">
            {grant.parts.map((part, index) =>
              part.strong ? (
                // biome-ignore lint/suspicious/noArrayIndexKey: the parts are one sentence, rebuilt whole on every change
                <Text key={index} variant="body" bold>
                  {part.text}
                </Text>
              ) : (
                part.text
              ),
            )}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
    backgroundColor: theme.colors['accent-subtle'],
    borderRadius: theme.radius['r-tile'],
  },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
});

/**
 * VoiceOver has no live region, so the changed sentence is said once per change on iOS — never on
 * the first draw, which the reader reaches on their own. TalkBack hears the polite live region.
 */
function useSaidAgainOnIos(sentence: string) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(sentence);
  }, [sentence]);
}
