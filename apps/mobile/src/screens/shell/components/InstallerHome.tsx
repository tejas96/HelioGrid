import { useInstallerJobs } from '@heliogrid/data/react';
import { installerJobWords, projectPackWords, projectToastWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { InstallerJob, installerJobActsOf, useFormat } from '@heliogrid/ui';
import { useRef } from 'react';
import { View } from 'react-native';
import { dial, openDirections, openOutside } from '../../shared/open-outside';
import { ProjectToast } from '../../shared/ProjectToast';
import { useProjectFilePick } from '../../shared/use-file-pick';

/**
 * The installer's job on their home (`SCR-M08-05`, `M08-45`): an installer on a roof, one hand,
 * the sun on the screen — today's job, how to get in, the steps with a photo each (the next one's
 * *Photo and tick*), and nothing else, never a price. Drawn only when the home in force, or one composed into it, is theirs.
 */
export function InstallerHome() {
  const { t, locale } = useI18n();
  const format = useFormat();
  const jobs = useInstallerJobs();
  const { project } = jobs;
  const pick = useProjectFilePick(project);
  const frame = useRef<View>(null);
  if (!jobs.shown) return null;
  const word = projectPackWords(format.pack, locale);
  return (
    <View ref={frame}>
      <InstallerJob
        read={jobs.read}
        jobId={jobs.jobId}
        onChoose={jobs.choose}
        site={project.read.kind === 'ready' ? project.read.value.project : null}
        words={installerJobWords(t, word)}
        {...installerJobActsOf(
          project,
          {
            photo: pick,
            openFile: (file) => {
              void project.fileLink(file.fileId).then(openOutside, () => undefined);
            },
            call: dial,
            directions: openDirections,
          },
          jobs.tickOncePhotographed,
        )}
      />
      <ProjectToast
        screen={project}
        words={projectToastWords(t, word, format.date)}
        focusAfter={frame}
      />
    </View>
  );
}
