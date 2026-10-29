import { FileChip } from '../FileChip';
import { OperationProgress } from '../OperationProgress';
import type { ImportFormats } from './CatalogImport.logic';
import { fileOf } from './CatalogImport.steps';
import type { CatalogImportProps, CatalogImportWords } from './CatalogImport.types';
import './ImportOverview.css';

/**
 * The matching pass (m17-i): a short wait with no count and no cancel — *Back* is the way out. The
 * run carries the counted progress.
 */
export function ImportMatching({ words }: { words: CatalogImportWords }) {
  return (
    <div className="hg-import-step" data-step="matching">
      <OperationProgress
        label={words.matching}
        words={words.progress}
        value={null}
        state="running"
      />
    </div>
  );
}

/**
 * The run (m17-n): the file, and the ring that counts the rows written. Its act stops watching,
 * never the run; it shows no stage line.
 */
export function ImportRunning(props: CatalogImportProps & { formats: ImportFormats }) {
  const { job, words } = props;
  if (job === null) return null;
  const file = fileOf(job, words, props.formats, props.mapping);
  const done = job.run?.done ?? 0;
  const total = job.run?.total ?? 0;
  return (
    <div className="hg-import-step" data-step="running">
      <FileChip name={file.name} meta={file.meta} tone="read" layout="compact" />
      <div className="hg-import-ring">
        <OperationProgress
          size="ring"
          label={words.importing}
          words={words.progress}
          count={{ done, total }}
          countCaption={words.ofRows(total)}
          state="running"
        />
      </div>
    </div>
  );
}
