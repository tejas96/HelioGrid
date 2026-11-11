import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { HeroPanel } from '../HeroPanel';
import { LeadSourceMark } from '../LeadSourceMark';
import { LeadStateBadge } from '../LeadStateBadge';
import { NamedGap } from '../NamedGap';
import { ProvenanceTier } from '../Provenance';
import { StageTrack } from '../StageTrack';
import { leadRecordMenuOf } from './LeadHero.logic';
import type { LeadHeroIdentity, LeadHeroProps } from './LeadHero.types';

/**
 * The lead's one hero (`SCR-M02-04`): who it is on the desktop, the stage, the deal, where it came
 * from and who has it — the owner chip opens the assign picker — the ⋯ record menu, any parked state and failed tries,
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
  project,
  recordActs,
  recordActsOff,
  words,
}: LeadHeroProps) {
  return (
    <HeroPanel menu={leadRecordMenuOf({ recordActs, recordActsOff, words }, recordGlyph)}>
      {identity === null ? null : <Identity identity={identity} words={words} />}
      <Chips source={source} onOwner={onOwner} ownerName={ownerName} words={words} />
      {words.state === null && words.tries === null ? null : (
        <div className="hg-lead-hero-chips">
          {lifecycleState === null || words.state === null ? null : (
            <LeadStateBadge state={lifecycleState} label={words.state} />
          )}
          {words.tries === null ? null : <StatusMark tone="warning" label={words.tries} />}
        </div>
      )}
      <Value value={value} project={project} words={words} />
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

/** The stage, the deal, where it came from, and the owner chip that opens the assign picker. */
function Chips({
  source,
  onOwner,
  ownerName,
  words,
}: Pick<LeadHeroProps, 'source' | 'onOwner' | 'ownerName' | 'words'>) {
  return (
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
    </div>
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

function Value({ value, project, words }: Pick<LeadHeroProps, 'value' | 'project' | 'words'>) {
  if (project !== null) {
    return (
      <div className="hg-lead-hero-value">
        <span className="hg-lead-hero-overline">{words.projectLabel}</span>
        <Button
          variant="secondary"
          size="sm"
          iconRight={<ShellGlyph name="chevron-right" size="sm" tone="primary" />}
          onClick={project.onOpen}
        >
          {words.openProject(project.number)}
        </Button>
      </div>
    );
  }
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

const recordGlyph = (name: ShellGlyphName) => <ShellGlyph name={name} size="sm" tone="secondary" />;
