import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { Banner } from '../Banner';
import { Card } from '../Card';
import { IconButton } from '../IconButton';
import { InstallerSteps } from '../InstallerJob/InstallerSteps';
import { useFormat } from '../MarketProvider';
import { NamedGap } from '../NamedGap';
import type { ProjectStepsProps } from './ProjectDetail.parts.types';
import { CardHead, DetailCard } from './ProjectDetailParts';
import { installerStepsOf, isClosedProject, stepsReadOf } from './ProjectInstallSteps.logic';
import '../InstallerJob/InstallerJob.css';
import './ProjectDetail.css';

/**
 * A project's install steps on their own screen (`SCR-M08-04`): who is on the crew, how to get in
 * with its edit, then the installer's own steps — a large tick, who ticked it when, and a photo
 * each. The first tick and the last move the project by themselves (ruling 1).
 */
export function ProjectInstallSteps(props: ProjectStepsProps) {
  const { project, words, onAccess, sending, onOpenFile } = props;
  const format = useFormat();
  const mayEdit = project.acts.stages && !isClosedProject(project);
  return (
    <div className="hg-project-detail" data-wide="false">
      {props.refusal === null ? null : (
        <Banner kind="validation" tone="warning" title={props.refusal} density="functional" />
      )}
      <section aria-label={words.crew}>
        <Card density="functional" className="hg-project-detail-card">
          <CardHead title={words.crew} aside={null} />
          {project.crew.length === 0 ? (
            <p className="hg-project-detail-none">{words.noCrew}</p>
          ) : (
            <ul className="hg-project-detail-rows">
              {project.crew.map((member) => (
                <li key={member.userId} className="hg-project-detail-row" data-plain="true">
                  <Avatar name={member.name} size={32} />
                  <span className="hg-project-detail-row-main">
                    <span className="hg-project-detail-row-name">{member.name}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
      <section aria-label={words.accessNote}>
        <Card density="functional" className="hg-project-detail-card">
          <CardHead
            title={words.accessNote}
            aside={null}
            act={
              mayEdit ? (
                <IconButton
                  label={words.changeAccess}
                  variant="ghost"
                  onClick={() => {
                    if (!sending) onAccess();
                  }}
                >
                  <ShellGlyph name="pencil" size="md" tone="primary" />
                </IconButton>
              ) : null
            }
          />
          <div className="hg-project-detail-access">
            {project.accessNote === null ? (
              <NamedGap gap={words.noAccessNote} scale="field" />
            ) : (
              <p className="hg-project-detail-access-note">{project.accessNote}</p>
            )}
          </div>
        </Card>
      </section>
      {project.acts.steps && !isClosedProject(project) ? (
        <InstallerSteps {...installerStepsOf(props)} />
      ) : (
        <DetailCard block={stepsReadOf(props, format)} words={words} onOpenFile={onOpenFile} />
      )}
    </div>
  );
}
