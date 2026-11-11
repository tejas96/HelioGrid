import { theme } from '@heliogrid/theme';
import { type RefObject, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { FileLink } from '../FileLink/FileLink.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import { leadFilePendingOf, leadFilesFailedOf } from './LeadSections.logic';
import type { LeadFilesPanel, LeadSectionsWords } from './LeadSections.types';

interface LeadFileListProps {
  readonly files: LeadFilesPanel;
  readonly words: LeadSectionsWords;
}

/**
 * The Files section on the phone (`M02-32`): the lead's papers, oldest first, each by its own name
 * with who added it and when, opened with a tap; then the pick going up — or come back undone,
 * with its retry — and *Add a file*. One frame holds every state, so the screen reader sent to it
 * after *Try again* stays while the list reads again.
 */
export function LeadFileList({ files, words }: LeadFileListProps) {
  const frame = useRef<View>(null);
  const add = useRef<View>(null);
  const line = leadFilePendingOf(files, words, add);
  const going = files.pending !== null && !files.pending.failed;
  return (
    <View ref={frame} style={styles.files}>
      <FileRows files={files} words={words} frame={frame} />
      {line === null ? null : <PendingAction {...line} />}
      {files.onAdd === null ? null : (
        <View ref={add} style={styles.foot}>
          <Button
            variant="secondary"
            size="sm"
            icon={<ShellGlyph name="plus" size="sm" tone="primary" />}
            loading={going}
            onClick={files.onAdd}
          >
            {words.addFile}
          </Button>
        </View>
      )}
    </View>
  );
}

function FileRows({ files, words, frame }: LeadFileListProps & { frame: RefObject<View | null> }) {
  const { read } = files;
  switch (read.kind) {
    case 'loading':
      return <LoadingBars bars={['row', 'row']} label={words.loadingFiles} />;
    case 'failed':
      return <FailedRead {...leadFilesFailedOf(read.retry, words, frame)} />;
    case 'empty':
      return (
        <View style={styles.gap}>
          <NamedGap gap={words.noFiles} />
          <Text variant="body-sm" color="secondary">
            {words.filesLine}
          </Text>
        </View>
      );
    case 'ready':
      return (
        <View>
          {read.value.map((file) => (
            <View key={file.id} style={styles.file}>
              <FileLink name={file.name} onOpen={() => files.onOpen(file.fileId)} />
              <Text variant="body-sm" color="secondary">
                {file.line}
              </Text>
            </View>
          ))}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  files: { gap: theme.spacing['sp-3'] },
  gap: { gap: theme.spacing['sp-1'] },
  file: {
    gap: theme.spacing['sp-0-5'],
    paddingVertical: theme.spacing['sp-2'],
    borderBottomWidth: 1,
    borderBottomColor: colors['line-soft'],
  },
  foot: { flexDirection: 'row' },
});
