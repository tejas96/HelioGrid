import type { ProposalVersionSummary } from '@heliogrid/contracts';
import type { CSSProperties } from 'react';
import { Text } from '../../primitives/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { FailedRead } from '../EmptyState';
import { HeroPanel } from '../HeroPanel';
import { HueTile } from '../HueTile';
import { LoadingBars } from '../LoadingBars';
import { AfterHint, AfterRow, AfterRows, failedReadOf } from '../ProposalAfterParts';
import { riseOrder } from '../ProposalBlocks/ProposalBlocks.logic';
import { versionActOf, versionFactGlyph } from './ProposalVersions.logic';
import type { ProposalVersionsProps, ProposalVersionsView } from './ProposalVersions.types';
import './ProposalVersions.css';

type Ready = ProposalVersionsProps & { readonly view: ProposalVersionsView };
type RowVars = CSSProperties & Record<'--i', number>;

function Changed({ view, words, won }: Ready) {
  const { latest } = view;
  if (latest === null) return null;
  const changes = latest.diff?.changes ?? [];
  return (
    <HeroPanel label={words.changedTitle(latest.version)}>
      {latest.changeNote === null ? null : (
        <p className="hg-versions-why">{words.note(latest.changeNote)}</p>
      )}
      <span className="hg-versions-who">{words.whoLine(latest, won)}</span>
      {changes.length === 0 ? null : (
        <ul className="hg-versions-changes">
          {changes.map((change, index) => {
            const text = words.change(change);
            const vars: RowVars = { '--i': riseOrder(index) };
            return (
              <li key={change.fact} className="hg-versions-change" style={vars}>
                <HueTile glyph={versionFactGlyph(change.fact)} hue="ocean" size={36} />
                <span className="hg-versions-change-name">{text.name}</span>
                <span className="hg-versions-change-from">{text.from}</span>
                <ShellGlyph name="arrow-right" size="sm" tone="secondary" />
                <span className="hg-versions-change-to">{text.to}</span>
              </li>
            );
          })}
        </ul>
      )}
      {latest.diff === null ? null : (
        <span className="hg-versions-same">
          <ShellGlyph name="check" size="sm" tone="secondary" />
          {words.unchanged(latest.diff.pagesUnchanged)}
        </span>
      )}
    </HeroPanel>
  );
}

function VersionRow(props: Ready & { version: ProposalVersionSummary; newest: boolean }) {
  const { version, newest, words } = props;
  const act = versionActOf(props, version, newest);
  const aside = (
    <Button
      {...act.button}
      icon={act.sends ? <ShellGlyph name="send" size="md" tone="inverse" /> : undefined}
    >
      {act.label}
    </Button>
  );
  return (
    <AfterRow
      glyph="layers"
      title={words.versionTitle(version)}
      line={words.versionLine(version)}
      leading={
        <span className="hg-versions-mark" data-old={newest ? undefined : ''}>
          {words.mark(version.version)}
        </span>
      }
      aside={aside}
    />
  );
}

/** A proposal's versions, on the web (`SCR-M06-16`). */
export function ProposalVersions(props: ProposalVersionsProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['panel', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return <FailedRead {...failedReadOf(words, read.retry, props.focusAfter)} />;
  }
  const ready: Ready = { ...props, view: read.value };
  const { versions } = read.value;
  return (
    <div className="hg-versions">
      <Changed {...ready} />
      {versions.length === 0 ? (
        <Text variant="body" color="secondary">
          {words.none}
        </Text>
      ) : (
        <AfterRows>
          {versions.map((version, index) => (
            <VersionRow key={version.version} {...ready} version={version} newest={index === 0} />
          ))}
        </AfterRows>
      )}
      <AfterHint>{words.hint(props.won)}</AfterHint>
    </div>
  );
}
