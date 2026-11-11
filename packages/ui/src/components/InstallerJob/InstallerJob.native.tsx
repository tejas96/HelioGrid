import type { ProjectJob } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { type RefObject, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { CardRow, CardRows } from '../CardRows/CardRows.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { projectFailedOf, projectLoadingOf } from '../ProjectDetail/ProjectDetail.states';
import { accessLinesOf, crewNameOf, jobsOf, siteOf, stepsOf } from './InstallerJob.logic';
import type { InstallerJobProps, InstallerOtherJobsProps } from './InstallerJob.types';
import { InstallerPhotos, InstallerSteps } from './InstallerSteps.native';

/**
 * The installer's job home on the phone (`SCR-M08-05`): today's job under its title, how to get
 * in, its steps, the photos it expects and the other jobs, one column. One frame holds every
 * state, so the screen reader lands on it after *Try again* while the jobs load again.
 */
export function InstallerJob(props: InstallerJobProps) {
  const frame = useRef<View>(null);
  return (
    <View ref={frame} style={styles.page}>
      <JobBody {...props} frame={frame} />
    </View>
  );
}

function JobBody(props: InstallerJobProps & { frame: RefObject<View | null> }) {
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
    <View style={styles.page}>
      <JobHead job={job} {...props} />
      <GettingIn job={job} {...props} />
      <InstallerSteps {...props} steps={steps} />
      <InstallerPhotos words={words} steps={steps} known={siteOf(job, props.site) !== null} />
      <Text variant="caption" color="secondary" align="center">
        {words.photosNeed}
      </Text>
      {others.length === 0 ? null : (
        <OtherJobs words={words} others={others} onChoose={props.onChoose} />
      )}
    </View>
  );
}

/** The page's title for the job, and whose job it is with whose crew. */
function JobHead({ job, site, words }: InstallerJobProps & { job: ProjectJob }) {
  const crew = crewNameOf(siteOf(job, site));
  return (
    <View style={styles.head}>
      <Text variant="display">{words.title}</Text>
      <Text variant="body" color="secondary">
        {words.summary(job.name ?? job.number, crew)}
      </Text>
    </View>
  );
}

/** The one hero: where the job is, how to get in, and the way there and the call. */
function GettingIn({ job, words, onDirections, onCall }: InstallerJobProps & { job: ProjectJob }) {
  const lines = accessLinesOf(job.accessNote);
  return (
    <HeroPanel label={words.gettingIn}>
      <View style={styles.hero}>
        {job.place === null ? null : (
          <Text variant="h3" bold>
            {job.place}
          </Text>
        )}
        {lines.length === 0 ? (
          <Text variant="body-sm" color="secondary">
            {words.noAccessNote}
          </Text>
        ) : (
          <View style={styles.lines}>
            {lines.map((line, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: two lines of a note may read the same
              <View key={index} style={styles.line}>
                <View style={styles.mark}>
                  <ShellGlyph name="tick" size="sm" tone="success" />
                </View>
                <Text variant="body" style={styles.lineWords}>
                  {line}
                </Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.acts}>
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
        </View>
      </View>
    </HeroPanel>
  );
}

/** The installer's other jobs: each row puts that job on screen. */
function OtherJobs({ words, others, onChoose }: InstallerOtherJobsProps) {
  return (
    <View style={styles.section}>
      <Text variant="h3">{words.otherJobs}</Text>
      <CardRows>
        {others.map((job, index) => (
          <CardRow
            key={job.id}
            first={index === 0}
            open={{ name: job.name ?? job.number, onOpen: () => onChoose(job.id) }}
          >
            <View style={styles.other}>
              <Text variant="body" bold>
                {job.name ?? job.number}
              </Text>
              <Text variant="body-sm" color="secondary">
                {words.stage(job.stage)}
              </Text>
              {job.place === null ? null : (
                <Text variant="body-sm" color="secondary">
                  {job.place}
                </Text>
              )}
            </View>
          </CardRow>
        ))}
      </CardRows>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.layout['section-gap'] },
  head: { gap: theme.spacing['sp-0-5'] },
  hero: { gap: theme.spacing['sp-3'] },
  lines: { gap: theme.spacing['sp-2'] },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  mark: { paddingTop: theme.spacing['sp-0-5'] },
  lineWords: { flex: 1, minWidth: 0 },
  acts: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  section: { gap: theme.spacing['sp-3'] },
  other: { gap: theme.spacing['sp-0-5'] },
});
