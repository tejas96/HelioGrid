'use client';
import { useInstallerJobs } from '@heliogrid/data/react';
import { installerJobWords, projectPackWords, projectToastWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { InstallerJob, installerJobActsOf, useFormat } from '@heliogrid/ui';
import { useRef } from 'react';
import { openExternal } from '../../../lib/open-external';
import { pickProjectFile } from '../../../lib/pick-file';
import { ProjectToast } from '../../../lib/project-toast';

/**
 * The installer's job on their home (`SCR-M08-05`, `M08-45`): today's job, how to get in, the steps
 * with a photo each — the next one's *Photo and tick* — and nothing else, never a price. Drawn only when the home in force, or one
 * composed into it, is theirs.
 */
export function InstallerHome() {
  const { t, locale } = useI18n();
  const format = useFormat();
  const jobs = useInstallerJobs();
  const { project } = jobs;
  const frame = useRef<HTMLDivElement>(null);
  if (!jobs.shown) return null;
  const word = projectPackWords(format.pack, locale);
  return (
    <div ref={frame} tabIndex={-1} className="hg-focus-target">
      <InstallerJob
        read={jobs.read}
        jobId={jobs.jobId}
        onChoose={jobs.choose}
        site={project.read.kind === 'ready' ? project.read.value.project : null}
        words={installerJobWords(t, word)}
        {...installerJobActsOf(
          project,
          {
            photo: (place) => pickProjectFile(project, place),
            openFile: (file) => {
              void project.fileLink(file.fileId).then(openExternal, () => undefined);
            },
            call: (phoneE164) => window.location.assign(`tel:${phoneE164}`),
            directions: (place) =>
              openExternal(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`,
              ),
          },
          jobs.tickOncePhotographed,
        )}
      />
      <ProjectToast
        screen={project}
        words={projectToastWords(t, word, format.date)}
        focusAfter={frame}
      />
    </div>
  );
}
