import { theme } from '@heliogrid/theme';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Banner } from '../Banner/Banner.native';
import { BannerAction } from '../Banner/BannerAction.native';
import { Button } from '../Button/Button.native';
import { Badge } from '../Chip/Chip.native';
import { ChipGroup } from '../ChipGroup/ChipGroup.native';
import { Explainer } from '../Explainer/Explainer.native';
import { ListRow } from '../ListRow/ListRow.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { SettingsCard } from '../SettingsSection/SettingsSection.native';
import { Switch } from '../Switch/Switch.native';
import { ValueSource } from '../ValueSource/ValueSource.native';
import {
  languageOf,
  PROFILE_PREFERENCES_LOADING,
  pushSwitchesOf,
  pushSwitchWords,
  roleBadges,
  unitOptions,
  unitsOf,
} from './ProfilePreferences.logic';
import type { ProfilePreferencesProps } from './ProfilePreferences.types';

/**
 * The phone's page (`m-default`): the account tile, the language and the units, each with the line
 * that says where its value comes from, then a push switch per group. Until the push read answers
 * the page is its loading bars (`m-loading`) or its banner (`m-error`). The title is the settings
 * page bar's, not the page's.
 */
export function ProfilePreferences(props: ProfilePreferencesProps) {
  const { words, read } = props;
  /* *Try again* leaves with its banner; the page that follows takes the screen reader's focus. */
  const [retried, setRetried] = useState(false);
  if (read.kind === 'loading') {
    return <LoadingBars label={words.loading} bars={PROFILE_PREFERENCES_LOADING} />;
  }
  if (read.kind === 'failed') {
    return (
      <Banner
        kind="state"
        tone="danger"
        title={words.loadFailed.title}
        action={
          <BannerAction
            onClick={() => {
              setRetried(true);
              read.retry();
            }}
          >
            {words.loadFailed.retry}
          </BannerAction>
        }
      >
        {words.loadFailed.body}
      </Banner>
    );
  }
  return <Page {...props} takeFocus={retried} />;
}

function Page({
  words,
  view,
  name,
  photo,
  onEditName,
  onRole,
  onLanguage,
  onUnits,
  read,
  refused,
  onPush,
  takeFocus,
}: ProfilePreferencesProps & { takeFocus: boolean }) {
  const firstHeading = useRef<View>(null);
  useEffect(() => {
    if (!takeFocus) return;
    const tag = findNodeHandle(firstHeading.current);
    if (tag !== null) AccessibilityInfo.setAccessibilityFocus(tag);
  }, [takeFocus]);
  return (
    <View style={styles.page}>
      <View style={styles.section}>
        <Overline headingRef={firstHeading}>{words.account}</Overline>
        <SettingsCard style={styles.tile}>
          <ListRow
            style={styles.row}
            avatar={<Avatar name={name} src={photo} size={48} />}
            title={name}
            density="expressive"
            trailing={
              <Button variant="secondary" size="sm" onClick={onEditName}>
                {words.editName}
              </Button>
            }
          />
          <View style={styles.hairline} />
          <ListRow
            style={styles.row}
            title={words.roles.title}
            density="functional"
            onClick={onRole}
            trailing={<ShellGlyph name="chevron-right" size="md" tone="secondary" />}
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
      <View style={styles.section}>
        <View style={styles.heading}>
          <Overline>{words.push.title}</Overline>
          <Explainer
            label={words.push.about.label}
            pages={words.push.about.line}
            density="functional"
          />
        </View>
        <View style={styles.switches}>
          {pushSwitchesOf(read).map((one) => {
            const { label, error } = pushSwitchWords(words, refused, one);
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
            /* The name sits outside the switch, in primary text with its Explainer beside it; the
               switch carries it as its spoken name, so the words are not read twice. */
            return (
              <View key={one.group} style={styles.locked}>
                <Switch checked={one.on} disabled ariaLabel={label} />
                <View style={styles.lockedName}>
                  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <Text variant="body">{label}</Text>
                  </View>
                  <Explainer
                    label={words.push.whyBilling.label}
                    pages={words.push.whyBilling.line}
                    density="functional"
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function Overline({ children, headingRef }: { children: string; headingRef?: React.Ref<View> }) {
  return (
    <View ref={headingRef} accessibilityRole="header">
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
  heading: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  switches: { gap: theme.spacing['sp-1'] },
  locked: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  /* The board's `minmax(0, 1fr)` column: a long translated name wraps inside the screen. */
  lockedName: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
  },
});
