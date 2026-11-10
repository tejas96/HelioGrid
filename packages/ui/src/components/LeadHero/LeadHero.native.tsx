import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { Avatar } from '../Avatar/Avatar.native';
import { Button } from '../Button/Button.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { LeadSourceMark } from '../LeadSourceMark/LeadSourceMark.native';
import { LeadStateBadge } from '../LeadStateBadge/LeadStateBadge.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import { StageTrack } from '../StageTrack/StageTrack.native';
import { leadRecordMenuOf } from './LeadHero.logic';
import type { LeadHeroProps } from './LeadHero.types';

/**
 * The lead's one hero (`SCR-M02-04`, `M02-32`) on the phone: the stage, the deal, where it came
 * from and who has it — the owner chip opens the assign picker — the ⋯ record menu, any parked state and failed tries,
 * the value or its named gap, and the eight-step track with where it goes next.
 */
export function LeadHero({
  identity,
  stage,
  source,
  lifecycleState,
  onOwner,
  ownerName,
  value,
  recordActs,
  recordActsOff,
  words,
}: LeadHeroProps) {
  const chips = (
    <View style={styles.chips}>
      <StatusMark tone="accent" label={words.stage} />
      {words.segment === null ? null : <HeroChip>{words.segment}</HeroChip>}
      {words.cameFrom === null ? (
        <HeroChip>
          <LeadSourceMark source={source} label={words.source} />
        </HeroChip>
      ) : (
        <HeroChip glyph="link">{words.cameFrom}</HeroChip>
      )}
      <OwnerChip ownerName={ownerName} onOwner={onOwner} words={words} />
    </View>
  );
  return (
    <HeroPanel
      name={words.stage}
      menu={leadRecordMenuOf({ recordActs, recordActsOff, words }, recordGlyph)}
    >
      {identity === null ? null : <Identity identity={identity} words={words} />}
      {chips}
      {words.state === null && words.tries === null ? null : (
        <View style={styles.chips}>
          {lifecycleState === null || words.state === null ? null : (
            <LeadStateBadge state={lifecycleState} label={words.state} />
          )}
          {words.tries === null ? null : <StatusMark tone="warning" label={words.tries} />}
        </View>
      )}
      <Value value={value} words={words} />
      <View style={styles.track}>
        <StageTrack stage={stage} size="md" words={words.stageTrack} />
        <View style={styles.stepLine}>
          <Text variant="caption" color="secondary" bold>
            {words.stepLine}
          </Text>
          {words.nextLine === null ? null : (
            <Text variant="caption" color="secondary">
              {words.nextLine}
            </Text>
          )}
        </View>
      </View>
    </HeroPanel>
  );
}

/** The desktop's name, number and city — the phone's large title holds them otherwise. */
function Identity({
  identity,
  words,
}: {
  identity: NonNullable<LeadHeroProps['identity']>;
  words: LeadHeroProps['words'];
}) {
  return (
    <View style={styles.identity}>
      {identity.name === null ? (
        <NamedGap gap={words.noName} scale="headline" />
      ) : (
        <Text variant="h1">{identity.name}</Text>
      )}
      <View style={styles.meta}>
        <Text variant="mono" color="secondary">
          {identity.phone}
        </Text>
        {identity.city === null ? (
          <NamedGap gap={words.noCity} />
        ) : (
          <View style={styles.city}>
            <ShellGlyph name="pin" size="sm" />
            <Text variant="body-sm" color="secondary">
              {identity.city}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

/** The value in the hero's figure with its tier — or its named gap until a proposal supplies one. */
function Value({ value, words }: Pick<LeadHeroProps, 'value' | 'words'>) {
  return (
    <View style={styles.value}>
      <Text variant="overline" color="secondary">
        {words.valueLabel}
      </Text>
      {value === null ? (
        <NamedGap gap={words.noValue} scale="headline" />
      ) : (
        <View style={styles.valueRow}>
          <Text variant="hero">{value.text}</Text>
          <ProvenanceTier tier={value.tier} />
          {value.provisional ? <StatusMark tone="warning" label={words.provisional} /> : null}
        </View>
      )}
    </View>
  );
}

/** A quiet glass chip: the deal, the source, who referred it. */
function HeroChip({ glyph, children }: { glyph?: 'link'; children: ReactNode }) {
  const { controlFill } = useGround();
  return (
    <View style={[styles.chip, { backgroundColor: controlFill }]}>
      {glyph === undefined ? null : <ShellGlyph name={glyph} size="sm" />}
      {typeof children === 'string' ? <Text variant="body-sm">{children}</Text> : children}
    </View>
  );
}

/** The owner's face and name — or "No owner yet" — opening the assign picker (`M02-29`). */
function OwnerChip({
  ownerName,
  onOwner,
  words,
}: Pick<LeadHeroProps, 'ownerName' | 'onOwner' | 'words'>) {
  return (
    <Button
      variant="secondary"
      size="sm"
      spokenName={words.ownerSpoken}
      icon={
        ownerName === null ? (
          <ShellGlyph name="person-plus" size="sm" tone="accent" />
        ) : (
          <Avatar name={ownerName} size={24} />
        )
      }
      iconRight={<ShellGlyph name="caret-down" size="sm" tone="secondary" />}
      onClick={onOwner}
    >
      {words.owner}
    </Button>
  );
}

const recordGlyph = (name: ShellGlyphName) => <ShellGlyph name={name} size="sm" tone="secondary" />;

const styles = StyleSheet.create({
  identity: { gap: theme.spacing['sp-1'] },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
  },
  city: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
  },
  value: { gap: theme.spacing['sp-1'] },
  valueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  track: { gap: theme.spacing['sp-2'] },
  stepLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
});
