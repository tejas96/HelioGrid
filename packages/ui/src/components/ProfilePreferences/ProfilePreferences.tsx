import { useOwnWidth } from '../../primitives/use-own-width';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Chip/Chip';
import { ChipGroup } from '../ChipGroup/ChipGroup';
import { ListRow } from '../ListRow/ListRow';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import {
  SettingsCard,
  SettingsSection,
  SettingsSectionRow,
} from '../SettingsSection/SettingsSection';
import { ValueSource } from '../ValueSource/ValueSource';
import {
  languageOf,
  PROFILE_PREFERENCES_WIDE_FROM,
  roleBadges,
  unitOptions,
  unitsOf,
} from './ProfilePreferences.logic';
import type { ProfilePreferencesProps } from './ProfilePreferences.types';

/**
 * The page measures its own room, never the window's: beside the settings side list it has less
 * than the window (`packages/ui/CLAUDE.md`, Traps). Until the first measure it draws the phone's
 * page, which fits every room.
 */
export function ProfilePreferences(props: ProfilePreferencesProps) {
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= PROFILE_PREFERENCES_WIDE_FROM;
  return (
    <div ref={room} className="hg-profile-preferences" data-wide={wide ? 'true' : undefined}>
      <h1 className="hg-profile-preferences-title">{props.words.title}</h1>
      {wide ? <WidePage {...props} /> : <PhonePage {...props} />}
    </div>
  );
}

function Roles({ words }: Pick<ProfilePreferencesProps, 'words'>) {
  return (
    <ChipGroup label={words.roles.title} max={0} density="functional">
      {roleBadges(words).map((badge) => (
        <Badge key={badge.preset} tone={badge.tone} density="functional">
          {badge.label}
        </Badge>
      ))}
    </ChipGroup>
  );
}

function PhonePage({ words, view, name, onLanguage, onUnits }: ProfilePreferencesProps) {
  return (
    <>
      <section className="hg-profile-preferences-section">
        <h2 className="hg-profile-preferences-overline">{words.account}</h2>
        <SettingsCard className="hg-profile-preferences-tile">
          <ListRow
            className="hg-profile-preferences-row"
            avatar={<Avatar name={name} size={48} />}
            title={name}
            density="expressive"
          />
          <ListRow
            className="hg-profile-preferences-row"
            title={words.roles.title}
            density="functional"
            marks={<Roles words={words} />}
          />
        </SettingsCard>
      </section>
      <section className="hg-profile-preferences-section" data-gap="wide">
        <h2 className="hg-profile-preferences-overline">{words.languageAndUnits}</h2>
        <div className="hg-profile-preferences-control">
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
        </div>
        <div className="hg-profile-preferences-control">
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
        </div>
      </section>
    </>
  );
}

function WidePage({ words, view, name, onLanguage, onUnits }: ProfilePreferencesProps) {
  return (
    <>
      <SettingsSection title={words.account}>
        <div className="hg-profile-preferences-name">
          <Avatar name={name} size={48} />
          <span className="hg-profile-preferences-name-words">{name}</span>
        </div>
        <ListRow
          className="hg-profile-preferences-row"
          title={words.roles.title}
          density="functional"
          marks={<Roles words={words} />}
        />
      </SettingsSection>
      <SettingsSection title={words.languageAndUnits}>
        <SettingsSectionRow
          label={words.language.label}
          caption={words.language.source}
          control={
            <SegmentedControl
              ariaLabel={words.language.label}
              value={view.language.value}
              options={words.language.options.map((option) => ({ ...option }))}
              onChange={(value) => {
                const next = languageOf(value);
                if (next !== null) onLanguage(next);
              }}
              error={words.language.error ?? undefined}
            />
          }
        />
        <SettingsSectionRow
          label={words.units.label}
          caption={words.units.source}
          control={
            <SegmentedControl
              ariaLabel={words.units.label}
              value={view.units.value}
              options={unitOptions(words)}
              onChange={(value) => {
                const next = unitsOf(value);
                if (next !== null) onUnits(next);
              }}
              error={words.units.error ?? undefined}
            />
          }
        />
      </SettingsSection>
    </>
  );
}
