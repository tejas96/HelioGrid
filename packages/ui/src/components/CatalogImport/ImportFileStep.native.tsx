import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { Dropzone } from '../Dropzone/Dropzone.native';
import { FileChip } from '../FileChip/FileChip.native';
import { Select } from '../Select/Select.native';
import type { ImportFormats } from './CatalogImport.logic';
import { fileOf } from './CatalogImport.steps';
import type { CatalogImportProps } from './CatalogImport.types';
import { headerCellsOf } from './CatalogImport.view';
import { ImportKeptReports } from './ImportKeptReports.native';

type ImportFileStepProps = CatalogImportProps & { formats: ImportFormats };

/**
 * Step 1 on the phone: with no file, the picker fills the step above the kept reports (m17-k); a
 * file that could not be opened says so above its chip and the picker (m17-l); a file read shows
 * its chip, its sheet and its header row as the file wrote it (m17-a). The phone has no drop:
 * the picker is the Dropzone's tap, and once a file is chosen, *Replace*.
 */
export function ImportFileStep(props: ImportFileStepProps) {
  switch (props.frame) {
    case 'unreadable':
      return <Unreadable {...props} />;
    case 'file':
      return <FileRead {...props} />;
    default:
      return <Choose {...props} />;
  }
}

/** The picker that fills the step; it spins while a file is stored or read. */
function Picker({ props }: { props: ImportFileStepProps }) {
  const { upload, words } = props;
  const busy = upload.state === 'storing' || props.frame === 'reading';
  const refused = upload.state === 'refused' || upload.state === 'failed';
  return (
    <>
      <Dropzone
        style={styles.fill}
        words={words.dropzone}
        label={words.choose}
        hint={words.chooseHint(upload.maxSizeMB)}
        accept={upload.accept}
        multiple={false}
        maxSizeMB={upload.maxSizeMB}
        density="functional"
        state={busy ? 'uploading' : refused ? 'error' : 'idle'}
        {...(refused && upload.message !== null ? { errorMessage: upload.message } : {})}
        disabled={busy}
        onFiles={props.onFiles}
        onRequestFiles={props.onRequestFiles}
      />
      {upload.state === 'failed' ? (
        <Button variant="secondary" size="sm" onClick={upload.onRetry}>
          {words.tryAgain}
        </Button>
      ) : null}
    </>
  );
}

function replaceOf(props: ImportFileStepProps) {
  return () => {
    props.onReplace();
    props.onRequestFiles?.();
  };
}

/** m17-k: the picker, the kept reports, and the promise that nothing changes yet. */
function Choose(props: ImportFileStepProps) {
  return (
    <View style={[styles.step, styles.roomy]}>
      <Picker props={props} />
      <ImportKeptReports
        kept={props.kept}
        words={props.words}
        formats={props.formats}
        onOpen={props.onOpenKept}
      />
      <Untouched props={props} />
    </View>
  );
}

/** m17-l: what went wrong, the file named in the problem ink, and the picker for another. */
function Unreadable(props: ImportFileStepProps) {
  const { words, job } = props;
  const file = job === null ? null : fileOf(job, words, props.formats, props.mapping);
  return (
    <View style={styles.step}>
      <Banner
        kind="validation"
        title={words.unreadableTitle}
        dismissible={false}
        density="functional"
      >
        {words.unreadableMessage}
      </Banner>
      {file === null ? null : (
        <FileChip
          name={file.name}
          meta={file.meta}
          tone="problem"
          layout="compact"
          onReplace={replaceOf(props)}
          replaceLabel={words.replace}
        />
      )}
      <Picker props={props} />
      <Untouched props={props} />
    </View>
  );
}

/** m17-a: the file read — its chip, the sheet and the header row the step reads. */
function FileRead(props: ImportFileStepProps) {
  const { words, job, mapping } = props;
  if (job === null) return null;
  const file = fileOf(job, words, props.formats, props.mapping);
  const sheets = job.sheets ?? [];
  const sheet = mapping === null ? undefined : sheets[mapping.sheet];
  return (
    <View style={[styles.step, styles.roomy]}>
      <FileChip
        name={file.name}
        meta={file.meta}
        tone={file.unreadable ? 'problem' : 'read'}
        layout="compact"
        onReplace={replaceOf(props)}
        replaceLabel={words.replace}
      />
      {mapping === null ? null : (
        <>
          <Select
            label={words.sheetLabel}
            placeholder={words.selectPlaceholder}
            closeLabel={words.closeList}
            value={String(mapping.sheet)}
            options={sheets.map((read, index) => ({ value: String(index), label: read.name }))}
            helper={words.sheetHelper(sheets.length)}
            density="functional"
            onChange={(value) => props.onSheet(Number(value))}
          />
          <View style={styles.header}>
            <Select
              label={words.headerRowLabel}
              placeholder={words.selectPlaceholder}
              closeLabel={words.closeList}
              value={String(mapping.headerRow)}
              options={(sheet?.topRows ?? []).map((_, index) => ({
                value: String(index),
                label: words.rowOption(index + 1),
              }))}
              helper={words.rowReads(mapping.headerRow + 1)}
              density="functional"
              onChange={(value) => props.onHeaderRow(Number(value))}
            />
            <HeaderCells props={props} />
          </View>
        </>
      )}
      <Untouched props={props} />
    </View>
  );
}

/** The header row as the file wrote it: never translated, in the figures' face. */
function HeaderCells({ props }: { props: ImportFileStepProps }) {
  const { mapping } = props;
  const cells = headerCellsOf(props.job, mapping);
  if (mapping === null || cells.length === 0) return null;
  return (
    <View
      accessible
      accessibilityLabel={props.words.rowOfFile(mapping.headerRow + 1)}
      style={styles.cells}
    >
      {cells.map((cell) => (
        <View key={cell.column} style={styles.cell}>
          <Text variant="mono" style={styles.cellText}>
            {cell.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Untouched({ props }: { props: ImportFileStepProps }) {
  return (
    <Text variant="caption" color="secondary" align="center" style={styles.untouched}>
      {props.words.untouched}
    </Text>
  );
}

/* The board's step 1: 16 between parts (12 on the error frame), the header row's cells 6 apart
   at 4 by 8 on the well, radius 8. The picker grows into the room the step leaves. */
const styles = StyleSheet.create({
  step: { flexGrow: 1, gap: theme.spacing['sp-3'], minWidth: 0 },
  roomy: { gap: theme.spacing['sp-4'] },
  fill: { flexGrow: 1 },
  header: { gap: theme.spacing['sp-2'], minWidth: 0 },
  cells: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: {
    paddingVertical: theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-xs'],
    backgroundColor: theme.colors.fill,
  },
  /* The caption's size in the figures' face; the mono role's own line box stays, so no mark of a
     Devanagari header is clipped. */
  cellText: { fontSize: theme.type.roles.caption.fontSize },
  untouched: { paddingTop: theme.spacing['sp-1'] },
});
