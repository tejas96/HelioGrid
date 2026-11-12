import { PROJECT_STAGE_CHAIN } from '@heliogrid/domain';
import { StreamEntries } from '../ActivityStream/ActivityStreamEntries';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { Card } from '../Card';
import { leadActivityKinds } from '../LeadTimeline/LeadTimeline.logic';
import { useFormat } from '../MarketProvider';
import { Timeline } from '../Timeline';
import { projectEventsOf } from './ProjectDetail.activity';
import { journeyItemsOf } from './ProjectDetail.logic';
import type { ProjectDetailProps } from './ProjectDetail.types';
import { CardHead } from './ProjectDetailParts';

/** Every stage of the deal's chain with its date and who or what moved it — never a % bar. */
export function ProjectJourney(props: ProjectDetailProps) {
  const format = useFormat();
  const { words } = props;
  const sun = <ShellGlyph name="sun" size="sm" tone="inverse" />;
  return (
    <section aria-label={words.journey}>
      <Card density="functional" className="hg-project-detail-card">
        <CardHead title={words.journey} aside={words.journeyNote} />
        <Timeline
          variant="page"
          density="functional"
          className="hg-project-detail-journey"
          items={journeyItemsOf(props, format, sun)}
        />
      </Card>
    </section>
  );
}

/**
 * The deal behind the project (wide): the customer with their number, who manages it, and the
 * design and proposal it will point at once their modules land — none linked yet, said so.
 */
export function ProjectDeal({ project, words }: ProjectDetailProps) {
  const format = useFormat();
  const { customer, manager } = project;
  return (
    <section aria-label={words.deal}>
      <Card density="functional" className="hg-project-detail-card">
        <CardHead title={words.deal} aside={null} />
        <dl className="hg-project-detail-facts-list">
          <dt>{words.customer}</dt>
          <dd>
            <span>{customer.name ?? project.number}</span>
            <span className="hg-project-detail-mono">{format.phone(customer.phoneE164)}</span>
          </dd>
          <dt>{words.managerLabel}</dt>
          <dd>
            <span className="hg-project-detail-person">
              <Avatar name={manager.name} size={24} />
              {manager.name}
            </span>
          </dd>
          <dt>{words.design}</dt>
          <dd className="hg-project-detail-quiet">{words.noneLinked}</dd>
          <dt>{words.proposal}</dt>
          <dd className="hg-project-detail-quiet">{words.noneLinked}</dd>
        </dl>
      </Card>
    </section>
  );
}

/**
 * The latest of what happened on the project, newest first — the product's one timeline
 * (`M08-17`), each entry drawn as the lead's timeline draws it.
 */
export function ProjectActivity({ project, words }: ProjectDetailProps) {
  return (
    <section aria-label={words.activity}>
      <Card density="functional" className="hg-project-detail-card">
        <CardHead title={words.activity} aside={words.activityNote} />
        <div className="hg-project-detail-stream">
          <StreamEntries
            entries={projectEventsOf(project, words, PROJECT_STAGE_CHAIN)}
            kinds={leadActivityKinds(words.activityKind)}
            words={words.stream}
            density="functional"
            {...words.streamFrame}
          />
        </div>
      </Card>
    </section>
  );
}
