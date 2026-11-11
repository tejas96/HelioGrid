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
  form,
  identity,
  stage,
  source,
  lifecycleState,
  onEditDetails,
  onOwner,
  ownerName,
  value,
  project,
  recordActs,
  recordActsOff,
  words,
}: LeadHeroProps) {
  const narrow = form === 'narrow';
  const chips = narrow ? (
    <QuietFacts words={words} />
  ) : (
    <Chips source={source} ownerName={ownerName} onOwner={onOwner} words={words} />
  );
  return (
    <HeroPanel
      name={words.stage}
      menu={
        narrow ? undefined : leadRecordMenuOf({ recordActs, recordActsOff, words }, recordGlyph)
      }
      edit={{ label: words.editDetails, onPress: onEditDetails }}
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
      <Value value={value} project={project} words={words} />
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
      {narrow ? <OwnerRow ownerName={ownerName} onOwner={onOwner} words={words} /> : null}
    </HeroPanel>
  );
}

/** The narrow hero's facts: the stage its one chip, the deal and where it came from one quiet line. */
function QuietFacts({ words }: Pick<LeadHeroProps, 'words'>) {
  return (
    <View style={styles.chips}>
      <StatusMark tone="accent" label={words.stage} />
      <View style={styles.facts}>
        {words.segment === null ? null : (
          <>
            <Text variant="body-sm" color="secondary">
              {words.segment}
            </Text>
            <View style={styles.factDot} />
          </>
        )}
        <Text variant="body-sm" color="secondary">
          {words.cameFrom ?? words.source}
        </Text>
      </View>
    </View>
  );
}

/** The wide hero's chips: the stage, the deal, where it came from, and the owner chip. */
function Chips({
  source,
  ownerName,
  onOwner,
  words,
}: Pick<LeadHeroProps, 'source' | 'ownerName' | 'onOwner' | 'words'>) {
  return (
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
}

/** Who has the lead, at the narrow hero's foot: their face and name, and the act that changes it. */
function OwnerRow({
  ownerName,
  onOwner,
  words,
}: Pick<LeadHeroProps, 'ownerName' | 'onOwner' | 'words'>) {
  return (
    <View style={styles.owner}>
      {ownerName === null ? (
        <View style={styles.ownerNone}>
          <ShellGlyph name="person-plus" size="sm" tone="secondary" />
        </View>
      ) : (
        <Avatar name={ownerName} size={32} />
      )}
      <View style={styles.ownerName}>
        <Text variant="body" color="secondary">
          {words.owner}
        </Text>
      </View>
      <Button variant="secondary" size="md" spokenName={words.ownerSpoken} onClick={onOwner}>
        {words.ownerAct}
      </Button>
    </View>
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
function Value({ value, project, words }: Pick<LeadHeroProps, 'value' | 'project' | 'words'>) {
  if (project !== null) {
    return (
      <View style={styles.value}>
        <Text variant="overline" color="secondary">
          {words.projectLabel}
        </Text>
        <Button
          variant="secondary"
          size="sm"
          iconRight={<ShellGlyph name="chevron-right" size="sm" tone="primary" />}
          onClick={project.onOpen}
        >
          {words.openProject(project.number)}
        </Button>
      </View>
    );
  }
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
  /* The narrow hero's quiet line: the deal and where it came from, a small dot between. */
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    flexShrink: 1,
  },
  factDot: {
    width: theme.spacing['sp-1'],
    height: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['text-secondary'],
  },
  owner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingTop: theme.spacing['sp-3'],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors['line-soft'],
  },
  ownerNone: {
    width: theme.spacing['sp-8'],
    height: theme.spacing['sp-8'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors['line-strong'],
  },
  ownerName: { flex: 1, minWidth: 0 },
  stepLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
});
