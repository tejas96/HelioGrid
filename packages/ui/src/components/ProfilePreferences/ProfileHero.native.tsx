import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Button } from '../Button/Button.native';
import { Badge } from '../Chip/Chip.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { roleBadges } from './ProfilePreferences.logic';
import type { ProfilePreferencesProps } from './ProfilePreferences.types';

/** The avatar's diameter in the hero. */
const AVATAR = 72;

/**
 * The person at the top of their own page, as the page's one solar-glass hero: the avatar, the
 * name in the display face, *Edit name*, then their roles as chips on the row that opens the role
 * card.
 */
export function ProfileHero({
  words,
  name,
  photo,
  onEditName,
  onRole,
}: Pick<ProfilePreferencesProps, 'words' | 'name' | 'photo' | 'onEditName' | 'onRole'>) {
  return (
    <HeroPanel label={words.account}>
      <View style={styles.who}>
        <Avatar name={name} src={photo} size={AVATAR} />
        <View style={styles.name}>
          <Text variant="h1">{name}</Text>
        </View>
      </View>
      <View style={styles.edit}>
        <Button variant="secondary" size="sm" onClick={onEditName}>
          {words.editName}
        </Button>
      </View>
      <Pressable onPress={onRole} style={styles.roles}>
        <Text variant="body" bold>
          {words.roles.title}
        </Text>
        <View style={styles.chips}>
          {roleBadges(words).map((badge) => (
            <Badge key={badge.preset} tone={badge.tone} density="functional">
              {badge.label}
            </Badge>
          ))}
        </View>
        <ShellGlyph name="chevron-right" size="md" tone="secondary" />
      </Pressable>
    </HeroPanel>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-4'] },
  name: { flex: 1, minWidth: 0 },
  edit: { flexDirection: 'row', marginTop: theme.spacing['sp-3'] },
  roles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    minHeight: theme.spacing['sp-12'],
    marginTop: theme.spacing['sp-3'],
    paddingTop: theme.spacing['sp-3'],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors['panel-line'],
  },
  chips: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-1'],
  },
});
