import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Chip/Chip';
import { HeroPanel } from '../HeroPanel/HeroPanel';
import { roleBadges } from './ProfilePreferences.logic';
import type { ProfilePreferencesProps } from './ProfilePreferences.types';

/** The avatar's diameter in the hero, inside its brand ring. */
const AVATAR = 80;

/**
 * The person at the top of their own page, as the page's one solar-glass hero: the avatar in the
 * brand ring and the name in the display face, the hero's pencil in its corner to edit the name,
 * then their roles as chips on the row that opens the role card. The same at every width.
 */
export function ProfileHero({
  words,
  name,
  photo,
  onEditName,
  onRole,
}: Pick<ProfilePreferencesProps, 'words' | 'name' | 'photo' | 'onEditName' | 'onRole'>) {
  return (
    <HeroPanel label={words.account} edit={{ label: words.editName, onPress: onEditName }}>
      <div className="hg-profile-hero-who">
        <span className="hg-profile-hero-ring">
          <Avatar name={name} src={photo} size={AVATAR} />
        </span>
        <span className="hg-profile-hero-name">{name}</span>
      </div>
      <Pressable className="hg-profile-hero-roles" onPress={onRole}>
        <span className="hg-profile-hero-roles-label">{words.roles.title}</span>
        <span className="hg-profile-hero-chips">
          {roleBadges(words).map((badge) => (
            <Badge key={badge.preset} tone={badge.tone} density="functional">
              {badge.label}
            </Badge>
          ))}
        </span>
        <ShellGlyph name="chevron-right" size="md" tone="secondary" />
      </Pressable>
    </HeroPanel>
  );
}
