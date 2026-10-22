import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Badge } from '../Chip/Chip.native';
import { ChipGroup } from '../ChipGroup/ChipGroup.native';
import { ListRow } from '../ListRow/ListRow.native';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { SettingsCard } from '../SettingsSection/SettingsSection.native';
import { ValueSource } from '../ValueSource/ValueSource.native';
import { languageOf, roleBadges, unitOptions, unitsOf } from './ProfilePreferences.logic';
import type { ProfilePreferencesProps } from './ProfilePreferences.types';

/**
 * The phone's page (`m-default`): the account tile, then the language and the units, each with the
 * line that says where its value comes from. The title is the settings page bar's, not the page's.
 */
export function ProfilePreferences({
  words,
  view,
  name,
  onLanguage,
  onUnits,
}: ProfilePreferencesProps) {
  return (
    <View style={styles.page}>
      <View style={styles.section}>
        <Overline>{words.account}</Overline>
        <SettingsCard style={styles.tile}>
          <ListRow
            style={styles.row}
            avatar={<Avatar name={name} size={48} />}
            title={name}
            density="expressive"
          />
          <View style={styles.hairline} />
          <ListRow
            style={styles.row}
            title={words.roles.title}
            density="functional"
            marks={
              <ChipGroup label={words.roles.title} max={0} density="functional">
                {roleBadges(words).map((badge) => (
                  <Badge key={badge.preset} tone={badge.tone} density="functional">
                    {badge.label}
                  </Badge>
                ))}
              </ChipGroup>
            }
          />
        </SettingsCard>
      </View>
      <View style={[styles.section, styles.sectionWide]}>
        <Overline>{words.languageAndUnits}</Overline>
        <View style={styles.control}>
          <OptionCardGroup
            label={words.language.label}
            value={view.language.value}
            columns={1}
            density="functional"
            options={words.language.options.map((option) => ({
              value: option.value,
              title: option.label,
              lang: option.lang,
            }))}
            onChange={(value) => {
              const next = languageOf(value);
              if (next !== null) onLanguage(next);
            }}
            error={words.language.error ?? undefined}
          />
          <ValueSource level={view.language.source} layerName={words.language.source} />
        </View>
        <View style={styles.control}>
          <SegmentedControl
            label={words.units.label}
            value={view.units.value}
            options={unitOptions(words)}
            onChange={(value) => {
              const next = unitsOf(value);
              if (next !== null) onUnits(next);
            }}
            error={words.units.error ?? undefined}
          />
          <ValueSource level={view.units.source} layerName={words.units.source} />
        </View>
      </View>
    </View>
  );
}

function Overline({ children }: { children: string }) {
  return (
    <View accessibilityRole="header">
      <Text variant="overline" color="secondary">
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-6'] },
  section: { gap: theme.spacing['sp-2'] },
  sectionWide: { gap: theme.spacing['sp-4'] },
  tile: { paddingVertical: theme.spacing['sp-1'] },
  /* A row laid on its card: no ground or lift of its own, the card's row padding. */
  row: {
    minHeight: theme.spacing['sp-16'],
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-4'],
    gap: theme.spacing['sp-3'],
    backgroundColor: 'transparent',
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  hairline: { height: 1, backgroundColor: theme.colors['line-soft'] },
  control: { gap: theme.spacing['sp-2'] },
});
