import { Pressable } from '../../primitives/Pressable';
import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { HeroPanel } from '../HeroPanel';
import { LeadSourceMark } from '../LeadSourceMark';
import { LeadStateBadge } from '../LeadStateBadge';
import { NamedGap } from '../NamedGap';
import { ProvenanceTier } from '../Provenance';
import { StageTrack } from '../StageTrack';
import type { LeadHeroIdentity, LeadHeroProps, LeadHeroValue } from './LeadHero.types';

/**
 * The lead's one hero (`SCR-M02-04`): who it is on the desktop, the stage, the deal, where it came
 * from and who has it — the owner chip opens the assign picker — any parked state and failed tries,
 * the value or its named gap, and the eight-step track with where the lead goes next.
 */
export function LeadHero({
  identity,
  stage,
  source,
  lifecycleState,
  onOwner,
  ownerName,
  value,
  words,
}: LeadHeroProps) {
  return (
    <HeroPanel>
      {identity === null ? null : <Identity identity={identity} words={words} />}
      <div className="hg-lead-hero-chips">
        <StatusMark tone="accent" label={words.stage} />
        {words.segment === null ? null : <span className="hg-lead-hero-chip">{words.segment}</span>}
        {words.cameFrom === null ? (
          <span className="hg-lead-hero-chip">
            <LeadSourceMark source={source} label={words.source} />
          </span>
        ) : (
          <span className="hg-lead-hero-chip">
            <ShellGlyph name="link" size="sm" tone="secondary" />
            {words.cameFrom}
          </span>
        )}
        <Pressable
          className="hg-lead-hero-owner"
          accessibilityLabel={words.ownerSpoken}
          onPress={onOwner}
        >
          {ownerName === null ? (
            <ShellGlyph name="user-plus" size="sm" tone="secondary" />
          ) : (
            <Avatar name={ownerName} size={24} />
          )}
          <span aria-hidden="true">{words.owner}</span>
        </Pressable>
      </div>
      {words.state === null && words.tries === null ? null : (
        <div className="hg-lead-hero-chips">
          {lifecycleState === null || words.state === null ? null : (
            <LeadStateBadge state={lifecycleState} label={words.state} />
          )}
          {words.tries === null ? null : <StatusMark tone="warning" label={words.tries} />}
        </div>
      )}
      <Value value={value} words={words} />
      <div className="hg-lead-hero-track">
        <StageTrack stage={stage} size="md" words={words.stageTrack} />
        <div className="hg-lead-hero-step">
          <span className="hg-lead-hero-step-now">{words.stepLine}</span>
          {words.nextLine === null ? null : <span>{words.nextLine}</span>}
        </div>
      </div>
    </HeroPanel>
  );
}

function Identity({
  identity,
  words,
}: {
  identity: LeadHeroIdentity;
  words: LeadHeroProps['words'];
}) {
  return (
    <div className="hg-lead-hero-who">
      {identity.name === null ? (
        <h1 className="hg-lead-hero-name">
          <NamedGap gap={words.noName} scale="headline" />
        </h1>
      ) : (
        <h1 className="hg-lead-hero-name">{identity.name}</h1>
      )}
      <p className="hg-lead-hero-meta">
        <span className="hg-lead-hero-phone">{identity.phone}</span>
        <span className="hg-lead-hero-city">
          <ShellGlyph name="pin" size="sm" tone="secondary" />
          {identity.city === null ? <NamedGap gap={words.noCity} scale="cell" /> : identity.city}
        </span>
      </p>
    </div>
  );
}

function Value({ value, words }: { value: LeadHeroValue | null; words: LeadHeroProps['words'] }) {
  return (
    <div className="hg-lead-hero-value">
      <span className="hg-lead-hero-overline">{words.valueLabel}</span>
      {value === null ? (
        <NamedGap gap={words.noValue} scale="headline" />
      ) : (
        <div className="hg-lead-hero-value-row">
          <span className="hg-lead-hero-money">{value.text}</span>
          <ProvenanceTier tier={value.tier} />
          {value.provisional ? <StatusMark tone="warning" label={words.provisional} /> : null}
        </div>
      )}
    </div>
  );
}
