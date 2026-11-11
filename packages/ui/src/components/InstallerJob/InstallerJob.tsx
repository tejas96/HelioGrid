import type { ProjectJob } from '@heliogrid/contracts';
import { type RefObject, useRef } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { CardRow, CardRows } from '../CardRows';
import { EmptyState, FailedRead } from '../EmptyState';
import { HeroPanel } from '../HeroPanel';
import { LoadingBars } from '../LoadingBars';
import { projectFailedOf, projectLoadingOf } from '../ProjectDetail/ProjectDetail.states';
import { accessLinesOf, crewNameOf, jobsOf, siteOf, stepsOf } from './InstallerJob.logic';
import type { InstallerJobProps, InstallerOtherJobsProps } from './InstallerJob.types';
import { InstallerPhotos, InstallerSteps } from './InstallerSteps';
import './InstallerJob.css';

/**
 * The installer's job home on the web (`SCR-M08-05`). Narrow, the phone's column: today's job under
 * its title, how to get in, its steps, the photos it expects, the other jobs. Wide (its own room),
 * the steps beside the photos and the other jobs. One frame holds every state, so focus sent to it after *Try
 * again* stays while the jobs load again.
 */
export function InstallerJob(props: InstallerJobProps) {
  const frame = useRef<HTMLDivElement>(null);
  return (
    <div ref={frame} tabIndex={-1} className="hg-installer-job hg-focus-target">
      <JobBody {...props} frame={frame} />
    </div>
  );
}

function JobBody(props: InstallerJobProps & { frame: RefObject<HTMLDivElement | null> }) {
  const { read, words, frame } = props;
  if (read.kind === 'loading') return <LoadingBars {...projectLoadingOf(words)} />;
  if (read.kind === 'failed') return <FailedRead {...projectFailedOf(words, read.retry, frame)} />;
  const { job, others } =
    read.kind === 'ready' ? jobsOf(read.value, props.jobId) : { job: null, others: [] };
  if (job === null) {
    return <EmptyState scene="settle" title={words.none} description={words.noneLine} />;
  }
  const steps = stepsOf(job, props.site);
  return (
    <>
      <JobHead job={job} {...props} />
      <div className="hg-installer-job-grid">
        <div className="hg-installer-job-column">
          <GettingIn job={job} {...props} />
          <InstallerSteps {...props} steps={steps} />
        </div>
        <div className="hg-installer-job-column">
          <InstallerPhotos words={words} steps={steps} known={siteOf(job, props.site) !== null} />
          <p className="hg-installer-job-caption">{words.photosNeed}</p>
          {others.length === 0 ? null : (
            <OtherJobs words={words} others={others} onChoose={props.onChoose} />
          )}
        </div>
      </div>
    </>
  );
}

/** The page's title for the job, and whose job it is with whose crew. */
function JobHead({ job, site, words }: InstallerJobProps & { job: ProjectJob }) {
  const crew = crewNameOf(siteOf(job, site));
  return (
    <header className="hg-installer-job-head">
      <h2 className="hg-installer-job-title">{words.title}</h2>
      <p className="hg-installer-job-summary">{words.summary(job.name ?? job.number, crew)}</p>
    </header>
  );
}

/** The one hero: where the job is, how to get in, and the way there and the call. */
function GettingIn({ job, words, onDirections, onCall }: InstallerJobProps & { job: ProjectJob }) {
  const lines = accessLinesOf(job.accessNote);
  return (
    <HeroPanel label={words.gettingIn}>
      {job.place === null ? null : <p className="hg-installer-job-place">{job.place}</p>}
      {lines.length === 0 ? (
        <p className="hg-installer-job-quiet">{words.noAccessNote}</p>
      ) : (
        <ul className="hg-installer-job-lines">
          {lines.map((line, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: two lines of a note may read the same
            <li key={index} className="hg-installer-job-line">
              <ShellGlyph name="tick" size="sm" tone="success" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="hg-installer-job-acts">
        {job.place === null ? null : (
          <Button
            variant="primary"
            size="md"
            icon={<ShellGlyph name="pin" size="sm" tone="inverse" />}
            onClick={() => onDirections(job)}
          >
            {words.directions}
          </Button>
        )}
        <Button
          variant="secondary"
          size="md"
          icon={<ShellGlyph name="phone" size="sm" tone="primary" />}
          onClick={() => onCall(job)}
        >
          {words.call(job.name)}
        </Button>
      </div>
    </HeroPanel>
  );
}

/** The installer's other jobs: each row puts that job on screen. */
function OtherJobs({ words, others, onChoose }: InstallerOtherJobsProps) {
  return (
    <section className="hg-installer-job-section" aria-label={words.otherJobs}>
      <h2 className="hg-installer-job-heading">{words.otherJobs}</h2>
      <CardRows form="joined">
        {others.map((job, index) => (
          <CardRow
            key={job.id}
            first={index === 0}
            open={{ name: job.name ?? job.number, onOpen: () => onChoose(job.id) }}
            className="hg-installer-job-other"
          >
            <span className="hg-installer-job-other-name">{job.name ?? job.number}</span>
            <span className="hg-installer-job-other-line">{words.stage(job.stage)}</span>
            {job.place === null ? null : (
              <span className="hg-installer-job-other-line">{job.place}</span>
            )}
          </CardRow>
        ))}
      </CardRows>
    </section>
  );
}
