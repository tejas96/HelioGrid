import { useId, useRef } from 'react';
import { useOwnWidth } from '../../primitives/use-own-width';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar/Avatar';
import { Banner } from '../Banner/Banner';
import { BannerAction } from '../Banner/BannerAction';
import { Button } from '../Button/Button';
import { Badge } from '../Chip/Chip';
import { ChipGroup } from '../ChipGroup/ChipGroup';
import { ListRow } from '../ListRow/ListRow';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import {
  SettingsCard,
  SettingsSection,
  SettingsSectionRow,
} from '../SettingsSection/SettingsSection';
import { Switch } from '../Switch/Switch';
import { ValueSource } from '../ValueSource/ValueSource';
import {
  languageOf,
  PROFILE_PREFERENCES_LOADING,
  PROFILE_PREFERENCES_WIDE_FROM,
  pushSwitchWords,
  roleBadges,
  unitOptions,
  unitsOf,
} from './ProfilePreferences.logic';
import type { ProfilePreferencesProps } from './ProfilePreferences.types';
import { AboutPush, WhyBilling } from './PushExplainers';

/**
 * The page measures its own room, never the window's: beside the settings side list it has less
 * than the window (`packages/ui/CLAUDE.md`, Traps). Until the first measure it draws the phone's
 * page, which fits every room.
 */
export function ProfilePreferences(props: ProfilePreferencesProps) {
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= PROFILE_PREFERENCES_WIDE_FROM;
  const title = useRef<HTMLHeadingElement>(null);
  /* *Try again* leaves with its banner, so focus goes to the title, which stays through the
     loading bars and the page that follow. */
  const onRetry = () => {
    title.current?.focus({ preventScroll: true });
    props.onRetry();
  };
  return (
    <div ref={room} className="hg-profile-preferences" data-wide={wide ? 'true' : undefined}>
      <h1 ref={title} tabIndex={-1} className="hg-profile-preferences-title">
        {props.words.title}
      </h1>
      <PageBody {...props} onRetry={onRetry} wide={wide} />
    </div>
  );
}

/** Until the push read answers, the page is its loading bars (`m-loading`) or its banner (`m-error`). */
function PageBody({ wide, ...props }: ProfilePreferencesProps & { wide: boolean }) {
  const { words, push, onRetry } = props;
  if (push.surface === 'loading') {
    return <LoadingBars label={words.loading} bars={PROFILE_PREFERENCES_LOADING} />;
  }
  if (push.surface === 'error') {
    return (
      <Banner
        kind="state"
        tone="danger"
        title={words.loadFailed.title}
        action={<BannerAction onClick={onRetry}>{words.loadFailed.retry}</BannerAction>}
      >
        {words.loadFailed.body}
      </Banner>
    );
  }
  return wide ? <WidePage {...props} /> : <PhonePage {...props} />;
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

function Chevron() {
  return <ShellGlyph name="chevron-right" size="md" tone="secondary" />;
}

function PhonePage({
  words,
  view,
  name,
  photo,
  onEditName,
  onRole,
  onLanguage,
  onUnits,
  push,
  onPush,
}: ProfilePreferencesProps) {
  const ids = useId();
  return (
    <>
      <section className="hg-profile-preferences-section">
        <h2 className="hg-profile-preferences-overline">{words.account}</h2>
        <SettingsCard className="hg-profile-preferences-tile">
          <ListRow
            className="hg-profile-preferences-row"
            avatar={<Avatar name={name} src={photo} size={48} />}
            title={name}
            density="expressive"
            trailing={
              <Button variant="secondary" size="sm" onClick={onEditName}>
                {words.editName}
              </Button>
            }
          />
          <ListRow
            className="hg-profile-preferences-row"
            title={words.roles.title}
            density="functional"
            marks={<Roles words={words} />}
            onClick={onRole}
            trailing={<Chevron />}
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
      <section className="hg-profile-preferences-section">
        <div className="hg-profile-preferences-heading">
          <h2 className="hg-profile-preferences-overline">{words.push.title}</h2>
          <AboutPush words={words} />
        </div>
        <div className="hg-profile-preferences-switches">
          {push.switches.map((one) => {
            const { label, error } = pushSwitchWords(words, push, one);
            if (!one.locked) {
              return (
                <Switch
                  key={one.group}
                  label={label}
                  checked={one.on}
                  onChange={() => onPush(one.group)}
                  error={error}
                />
              );
            }
            const id = `${ids}-push-${one.group}`;
            return (
              <div key={one.group} className="hg-profile-preferences-locked">
                <Switch id={id} checked={one.on} disabled />
                <span className="hg-profile-preferences-locked-name">
                  <label htmlFor={id}>{label}</label>
                  <WhyBilling words={words} />
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function WidePage({
  words,
  view,
  name,
  photo,
  onEditName,
  onRole,
  onLanguage,
  onUnits,
  push,
  onPush,
}: ProfilePreferencesProps) {
  const ids = useId();
  return (
    <>
      <SettingsSection title={words.account}>
        <div className="hg-profile-preferences-name">
          <Avatar name={name} src={photo} size={48} />
          <span className="hg-profile-preferences-name-words">{name}</span>
          <Button variant="secondary" size="sm" onClick={onEditName}>
            {words.editName}
          </Button>
        </div>
        <ListRow
          className="hg-profile-preferences-row"
          title={words.roles.title}
          density="functional"
          marks={<Roles words={words} />}
          onClick={onRole}
          trailing={<Chevron />}
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
      <SettingsSection title={words.push.title} titleAside={<AboutPush words={words} />}>
        {push.switches.map((one) => {
          const { label, error } = pushSwitchWords(words, push, one);
          const id = `${ids}-push-${one.group}`;
          return (
            <SettingsSectionRow
              key={one.group}
              label={label}
              labelAside={one.locked ? <WhyBilling words={words} /> : undefined}
              controlId={id}
              control={
                <Switch
                  id={id}
                  checked={one.on}
                  disabled={one.locked}
                  onChange={() => onPush(one.group)}
                  error={error}
                />
              }
            />
          );
        })}
      </SettingsSection>
    </>
  );
}
