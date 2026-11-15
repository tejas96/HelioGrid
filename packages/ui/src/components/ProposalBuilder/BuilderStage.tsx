import { ShellGlyph } from '../AppShell/ShellGlyph';
import { EmptyScene } from '../EmptyScene/EmptyScene';
import type { BuilderStage } from './ProposalBuilder.types';
import './BuilderStage.css';

/**
 * The desktop's stage: the page the step feeds, as the customer gets it, or — while no price is
 * typed — what draws it. Desktop only: the phone opens the same page in its preview sheet.
 */
export function BuilderStageView({ stage }: { stage: BuilderStage }) {
  return (
    <section className="hg-pbf-stage" aria-label={stage.caption}>
      <div className="hg-pbf-stage-cap">
        <span className="hg-pbf-stage-who">
          <ShellGlyph name="eye" size="sm" />
          {stage.caption}
        </span>
        {stage.pageLine === null ? null : (
          <span className="hg-pbf-stage-page">{stage.pageLine}</span>
        )}
      </div>
      {stage.page === null || stage.page === undefined ? (
        <div className="hg-pbf-stage-waits">
          <EmptyScene name="settle" />
          {stage.waits === undefined ? null : (
            <p className="hg-pbf-stage-waits-line">{stage.waits}</p>
          )}
        </div>
      ) : (
        <div className="hg-pbf-stage-paper" key={stage.pageKey}>
          {stage.page}
        </div>
      )}
      <div className="hg-pbf-stage-dots" aria-hidden="true">
        {Array.from({ length: stage.pages }, (_, index) => index).map((index) => (
          <span
            key={index}
            className="hg-pbf-stage-dot"
            data-on={index === stage.at ? '' : undefined}
          />
        ))}
      </div>
    </section>
  );
}
