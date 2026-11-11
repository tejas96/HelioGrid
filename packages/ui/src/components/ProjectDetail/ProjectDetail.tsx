import { useOwnWidth } from '../../primitives/use-own-width';
import { Banner } from '../Banner';
import { WIDE_FROM } from './ProjectDetail.logic';
import type { ProjectDetailProps } from './ProjectDetail.types';
import { ProjectDocuments, ProjectDocumentsHero, ProjectFiles } from './ProjectDocuments';
import { ProjectHero } from './ProjectHero';
import { ProjectActivity, ProjectDeal, ProjectJourney } from './ProjectSide';
import { ProjectWait } from './ProjectWait';
import './ProjectDetail.css';

/**
 * One project on the web (the picked design), laid out from its own room. Narrow, the phone's page:
 * the hero, the wait, the journey, the deal, the documents still waiting, the other files and the latest
 * activity. Wide, the hero with every document and the journey under it, beside the wait, the deal,
 * the files with *Show to customer* and the activity. Each width keeps one reading order, so the
 * keyboard walks what the eye sees. The checklist's own screen draws its hero, every row, a caption
 * and the files.
 */
export function ProjectDetail(props: ProjectDetailProps) {
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= WIDE_FROM;
  const { refusal, words } = props;
  const said =
    refusal === null ? null : (
      <Banner kind="validation" tone="warning" title={refusal} density="functional" />
    );
  if (props.documents === 'all') {
    return (
      <div ref={room} className="hg-project-detail" data-wide={wide ? 'true' : 'false'}>
        <div className="hg-project-detail-column">
          {said}
          <ProjectDocumentsHero {...props} />
          <ProjectDocuments {...props} rows="all" />
          <p className="hg-project-detail-caption">{words.docsCaption}</p>
        </div>
        <div className="hg-project-detail-column" data-side="true">
          <ProjectFiles {...props} switches />
        </div>
      </div>
    );
  }
  if (!wide) {
    return (
      <div ref={room} className="hg-project-detail" data-wide="false">
        {said}
        <ProjectHero {...props} />
        <ProjectWait {...props} />
        <ProjectJourney {...props} />
        <ProjectDeal {...props} />
        <ProjectDocuments {...props} rows="waiting" />
        <ProjectFiles {...props} switches={false} />
        <ProjectActivity {...props} />
      </div>
    );
  }
  return (
    <div ref={room} className="hg-project-detail" data-wide="true">
      <div className="hg-project-detail-column">
        {said}
        <ProjectHero {...props} />
        <ProjectDocuments {...props} rows="all" />
        <ProjectJourney {...props} />
      </div>
      <div className="hg-project-detail-column" data-side="true">
        <ProjectWait {...props} />
        <ProjectDeal {...props} />
        <ProjectFiles {...props} switches />
        <ProjectActivity {...props} />
      </div>
    </div>
  );
}
