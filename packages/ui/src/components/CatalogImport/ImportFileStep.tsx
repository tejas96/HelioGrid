import { Text } from '../../primitives/Text/Text';
import { Banner } from '../Banner';
import { Button } from '../Button';
import { Dropzone } from '../Dropzone';
import { FileChip } from '../FileChip';
import { Select } from '../Select';
import type { ImportFormats } from './CatalogImport.logic';
import { fileOf } from './CatalogImport.steps';
import type { CatalogImportProps } from './CatalogImport.types';
import { headerCellsOf, type ImportHeaderCell } from './CatalogImport.view';
import { ImportKeptReports } from './ImportKeptReports';
import './ImportFileStep.css';

interface ImportFileStepProps extends CatalogImportProps {
  wide: boolean;
  formats: ImportFormats;
}

/**
 * Step 1, File: the drop surface and the kept reports before a file is chosen (m17-k); the banner,
 * the named file and the drop surface for a file that would not open (m17-l); and, once read, the
 * file chip, its sheet, its header row and that row's cells (m17-a, m17-f). The caption keeps the
 * promise that nothing changes until the import.
 */
export function ImportFileStep(props: ImportFileStepProps) {
  const { frame, words, wide } = props;
  const untouched = (
    <Text variant="caption" color="secondary" align={wide ? 'start' : 'center'}>
      {words.untouched}
    </Text>
  );
  if (frame === 'file') {
    return (
      <div className="hg-import-step" data-step="file">
        <ReadFile {...props} />
        {wide ? <Drop {...props} again /> : null}
        {untouched}
      </div>
    );
  }
  return (
    <div className="hg-import-step" data-step="file" data-fills="true">
      {frame === 'unreadable' ? (
        <>
          <Banner
            kind="validation"
            title={words.unreadableTitle}
            dismissible={false}
            density="functional"
          >
            {words.unreadableMessage}
          </Banner>
          <Chip {...props} />
        </>
      ) : null}
      <Drop {...props} again={false} />
      {frame === 'unreadable' ? null : (
        <ImportKeptReports
          kept={props.kept}
          words={words}
          formats={props.formats}
          onOpen={props.onOpenKept}
        />
      )}
      {untouched}
    </div>
  );
}

/** The file chip: what was read, or that it would not open; *Replace* only on a read file. */
function Chip(props: ImportFileStepProps) {
  if (props.job === null) return null;
  const file = fileOf(props.job, props.words, props.formats, props.mapping);
  return (
    <FileChip
      name={file.name}
      meta={file.meta}
      tone={file.unreadable ? 'problem' : 'read'}
      layout={props.wide ? 'wide' : 'compact'}
      onReplace={props.onReplace}
      replaceLabel={props.words.replace}
    />
  );
}

/** The drop surface: the step's whole room before a file, a second chance once one is read. */
function Drop(props: ImportFileStepProps & { again: boolean }) {
  const { upload, words, again } = props;
  return (
    <div className="hg-import-drop" data-fills={again ? 'false' : 'true'}>
      <Dropzone
        words={words.dropzone}
        label={again ? words.dropAnother : words.choose}
        hint={again ? words.dropAnotherHint(upload.maxSizeMB) : words.chooseHint(upload.maxSizeMB)}
        accept={upload.accept}
        multiple={false}
        maxSizeMB={upload.maxSizeMB}
        density="functional"
        state={dropStateOf(props)}
        errorMessage={upload.message ?? undefined}
        onFiles={props.onFiles}
        onRequestFiles={props.onRequestFiles}
      />
      {upload.state === 'failed' ? (
        <Button variant="secondary" size="sm" onClick={upload.onRetry}>
          {words.tryAgain}
        </Button>
      ) : null}
    </div>
  );
}

/** The surface's state: busy while the file is stored or read, refused when it was refused. */
function dropStateOf(props: ImportFileStepProps): 'idle' | 'uploading' | 'error' {
  if (props.upload.state === 'storing' || props.frame === 'reading') return 'uploading';
  if (props.upload.state === 'refused' || props.upload.state === 'failed') return 'error';
  return 'idle';
}

/** A read file: the chip, the sheet and header row it is read from, and that row's cells. */
function ReadFile(props: ImportFileStepProps) {
  const { job, mapping, words, wide } = props;
  const sheets = job?.sheets ?? [];
  const sheet = mapping === null ? undefined : sheets[mapping.sheet];
  const headerRow = mapping?.headerRow ?? 0;
  const sheetSelect = (
    <Select
      label={words.sheetLabel}
      placeholder={words.selectPlaceholder}
      closeLabel={words.closeList}
      value={mapping === null ? undefined : String(mapping.sheet)}
      options={sheets.map((read, index) => ({ value: String(index), label: read.name }))}
      helper={words.sheetHelper(sheets.length)}
      density="functional"
      onChange={(value) => props.onSheet(Number(value))}
    />
  );
  const headerSelect = (
    <Select
      label={words.headerRowLabel}
      placeholder={words.selectPlaceholder}
      closeLabel={words.closeList}
      value={String(headerRow)}
      options={(sheet?.topRows ?? []).map((_, index) => ({
        value: String(index),
        label: words.rowOption(index + 1),
      }))}
      helper={wide ? undefined : words.rowReads(headerRow + 1)}
      density="functional"
      onChange={(value) => props.onHeaderRow(Number(value))}
    />
  );
  const cells = (
    <HeaderCells
      cells={headerCellsOf(job, mapping)}
      label={words.rowOfFile(headerRow + 1)}
      wide={wide}
    />
  );
  return (
    <>
      <Chip {...props} />
      {wide ? (
        <>
          <div className="hg-import-selects">
            {sheetSelect}
            {headerSelect}
          </div>
          <div className="hg-import-reads">
            <Text variant="caption" color="secondary">
              {words.rowReads(headerRow + 1)}
            </Text>
            {cells}
          </div>
        </>
      ) : (
        <>
          {sheetSelect}
          <div className="hg-import-reads">
            {headerSelect}
            {cells}
          </div>
        </>
      )}
    </>
  );
}

/** The header row's cells as the file wrote them: file data, in mono, never translated. */
function HeaderCells({
  cells,
  label,
  wide,
}: {
  cells: readonly ImportHeaderCell[];
  label: string;
  wide: boolean;
}) {
  if (cells.length === 0) return null;
  return (
    <ul className="hg-import-cells" aria-label={label} data-wide={wide ? 'true' : 'false'}>
      {cells.map((cell) => (
        <li key={cell.column} className="hg-import-cell">
          {cell.text}
        </li>
      ))}
    </ul>
  );
}
