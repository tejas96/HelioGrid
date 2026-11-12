import type { CSSProperties, ReactNode } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Badge } from '../Chip';
import { FailedRead } from '../EmptyState';
import { IconButton } from '../IconButton';
import { LoadingBars } from '../LoadingBars';
import { CashCard } from './CashCard';
import { NeedsYouHero } from './NeedsYouHero';
import type { DashboardPartProps } from './OwnerDashboard.logic';
import type { OwnerDashboardProps } from './OwnerDashboard.types';
import { PipelineCard } from './PipelineCard';
import { WinLossCard } from './WinLossCard';
import { ForecastTile, WonCard } from './WonCard';
import './OwnerDashboard.css';

/** A rise's place in the stagger; the delay itself is the stylesheet's, from the motion tokens. */
type RiseVars = CSSProperties & Record<'--i', string>;

/** A part rising into place once, after the parts before it — transform and opacity only. */
function Rise({
  order,
  className,
  children,
}: {
  order: number;
  className?: string;
  children: ReactNode;
}) {
  const vars: RiseVars = { '--i': String(order) };
  return (
    <div
      className={className === undefined ? 'hg-owner-rise' : `hg-owner-rise ${className}`}
      style={vars}
    >
      {children}
    </div>
  );
}

/**
 * The owner dashboard on the web (`SCR-M13-01`, sample B · Focus): what needs you now as the hero —
 * one item at a time, or the row of them where the room is wide — then cash, won against the
 * target beside the forecast's honest gap, the pipeline by stage and why deals were lost.
 */
export function OwnerDashboard(props: OwnerDashboardProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['panel', 'panel', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return (
      <div className="hg-owner">
        <FailedRead
          title={words.failedTitle}
          message={words.failedMessage}
          retryLabel={words.retry}
          onRetry={read.retry}
          focusAfter={props.focusAfter}
        />
      </div>
    );
  }
  const part: DashboardPartProps = { ...props, view: read.value };
  return (
    <div className="hg-owner">
      <div className="hg-owner-top">
        {read.value.scope === 'team' ? (
          <Badge tone="accent" density="functional">
            {words.teamScope}
          </Badge>
        ) : null}
        <span className="hg-owner-export">
          <IconButton label={words.export} onClick={props.onExport}>
            <ShellGlyph name="download" size="md" tone="primary" />
          </IconButton>
        </span>
      </div>
      <Rise order={0}>
        <NeedsYouHero {...part} />
      </Rise>
      <div className="hg-owner-money-row">
        <Rise order={1} className="hg-owner-cash">
          <CashCard {...part} />
        </Rise>
        <div className="hg-owner-side">
          <Rise order={2}>
            <WonCard {...part} />
          </Rise>
          <Rise order={3}>
            <ForecastTile words={words} />
          </Rise>
        </div>
      </div>
      <div className="hg-owner-deals">
        <Rise order={4} className="hg-owner-pipeline">
          <PipelineCard {...part} />
        </Rise>
        <Rise order={5} className="hg-owner-winloss">
          <WinLossCard {...part} />
        </Rise>
      </div>
    </div>
  );
}
