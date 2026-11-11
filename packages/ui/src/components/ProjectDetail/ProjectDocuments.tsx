import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { HeroPanel } from '../HeroPanel';
import { useFormat } from '../MarketProvider';
import { documentsBlockOf, filesBlockOf } from './ProjectDetail.blocks';
import { provingRowOf, samePlace } from './ProjectDetail.logic';
import type { ProjectDetailProps } from './ProjectDetail.types';
import { DetailCard } from './ProjectDetailParts';

/**
 * The checklist (`SCR-M08-03`): done of all, then each row with its state — done, not needed with
 * its reason, made at handover — or, waiting, *Upload* and *Not needed*. Three rows still waiting
 * with the way to every row, or every row.
 */
export function ProjectDocuments(props: ProjectDetailProps & { rows: 'waiting' | 'all' }) {
  const block = documentsBlockOf(props, props.rows, useFormat());
  return <DetailCard block={block} words={props.words} onOpenFile={props.onOpenFile} />;
}

/**
 * The other files (ruling 8): each by name with who added it and, where there is room, *Show to
 * customer*; then the lead's files, marked as the lead's. They never hold up handover.
 */
export function ProjectFiles(props: ProjectDetailProps & { switches: boolean }) {
  return (
    <DetailCard
      block={filesBlockOf(props, props.switches)}
      words={props.words}
      onOpenFile={props.onOpenFile}
    />
  );
}

/**
 * The checklist screen's one hero: the row whose file moves the project to its next stage by
 * itself, and its upload — a photo or a file. None, no hero: the rows say the rest.
 */
export function ProjectDocumentsHero(props: ProjectDetailProps) {
  const { project, view, words, onUpload, sending, uploading, heroFocus } = props;
  const proving = provingRowOf(view);
  if (proving === null) return null;
  const place = { slot: 'document' as const, slotKey: proving.row };
  return (
    <HeroPanel label={words.movesTheStage}>
      <div className="hg-project-detail-hero-next">
        <span className="hg-project-detail-hero-next-title">{words.row(proving.row)}</span>
        <span className="hg-project-detail-on-panel">{words.movesByItself(proving.to)}</span>
      </div>
      {project.acts.documents ? (
        <div className="hg-project-detail-hero-acts">
          <Button
            ref={heroFocus}
            icon={<ShellGlyph name="camera" size="md" tone="inverse" />}
            loading={samePlace(uploading, place)}
            spokenName={words.uploadRow(proving.row)}
            onClick={() => {
              if (!sending) onUpload(place);
            }}
          >
            {words.photoOrFile}
          </Button>
        </div>
      ) : null}
    </HeroPanel>
  );
}
