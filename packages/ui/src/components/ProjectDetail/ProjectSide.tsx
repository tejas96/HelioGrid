import { PROJECT_STAGE_CHAIN } from '@heliogrid/domain';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { Card } from '../Card';
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

/** The latest of what happened on the project, newest first — nothing edits after the fact. */
export function ProjectActivity({ project, words }: ProjectDetailProps) {
  const format = useFormat();
  const events = projectEventsOf(project, words, format, PROJECT_STAGE_CHAIN);
  return (
    <section aria-label={words.activity}>
      <Card density="functional" className="hg-project-detail-card">
        <CardHead title={words.activity} aside={words.activityNote} />
        <ul className="hg-project-detail-rows">
          {events.map((event) => (
            <li key={event.key} className="hg-project-detail-row" data-plain="true">
              <span className="hg-project-detail-row-main">
                <span className="hg-project-detail-row-name">{event.title}</span>
                {event.line === null ? null : (
                  <span className="hg-project-detail-row-sub">{event.line}</span>
                )}
              </span>
              <span className="hg-project-detail-quiet hg-project-detail-nowrap">{event.on}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
