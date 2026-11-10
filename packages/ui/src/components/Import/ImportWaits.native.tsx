import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { FileChip } from '../FileChip/FileChip.native';
import { OperationProgress } from '../OperationProgress/OperationProgress.native';
import { importFileOf } from './Import.logic';
import type { ImportMatchingProps, ImportRunningProps } from './Import.types';

/**
 * The matching pass (m17-i): a short wait with no count and no cancel — *Back* is the way out. The
 * run carries the counted progress.
 */
export function ImportMatching({ words }: ImportMatchingProps) {
  return (
    <View style={styles.matching}>
      <OperationProgress
        label={words.matching}
        words={words.progress}
        value={null}
        state="running"
      />
    </View>
  );
}

/**
 * The run (m17-n): the file, and the ring that counts the rows written. Its act stops watching,
 * never the run; it shows no stage line.
 */
export function ImportRunning(props: ImportRunningProps) {
  const { job, words } = props;
  const file = importFileOf(job, words, props.formats, props.mapping);
  const done = job.run?.done ?? 0;
  const total = job.run?.total ?? 0;
  return (
    <View style={styles.running}>
      <FileChip name={file.name} meta={file.meta} tone="read" layout="compact" />
      <View style={styles.ring}>
        <OperationProgress
          size="ring"
          label={words.importing}
          words={words.progress}
          count={{ done, total }}
          countCaption={words.ofRows(total)}
          state="running"
        />
      </View>
    </View>
  );
}

/* The board's waits: 6 above each; the run's chip and ring 20 apart, the ring centred, 8 under. */
const styles = StyleSheet.create({
  matching: { paddingTop: 6, paddingBottom: theme.spacing['sp-1'] },
  running: {
    gap: theme.spacing['sp-5'],
    paddingTop: 6,
    paddingBottom: theme.spacing['sp-2'],
  },
  ring: { alignItems: 'center' },
});
