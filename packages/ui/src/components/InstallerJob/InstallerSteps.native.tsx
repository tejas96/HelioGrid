import type { ProjectFile } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { glyphStroke } from '../AppShell/ShellGlyph.logic';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { CardRow, CardRows } from '../CardRows/CardRows.native';
import { FileLink } from '../FileLink/FileLink.native';
import { HueTile } from '../HueTile/HueTile.native';
import { Input } from '../Input/Input.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { hasPhoto, progressOf, STEP_TILE } from './InstallerJob.logic';
import type {
  InstallerJobWords,
  InstallerPhotosProps,
  InstallerStepsProps,
} from './InstallerJob.types';
import { type InstallerStepRow, useInstallerSteps } from './use-installer-steps';

/**
 * The job's steps on the phone: ticked of all, then each step — its tile (done, a photo not sent,
 * to do), who ticked it and when, and on the next step alone its *Photo and tick*. While a tick is
 * out every tick waits; a photo that did not reach the project says so on its row with its
 * *Retry*. The tile ticks or unticks its step. *Done by someone else?* names who did the work for
 * the ticks that follow.
 */
export function InstallerSteps(props: InstallerStepsProps) {
  const { words, sending } = props;
  const { rows, progress, naming, doneBy, setDoneBy, doneByToggle } = useInstallerSteps(props);
  if (rows.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text variant="h3">{words.steps}</Text>
        <Text variant="body-sm" color="secondary">
          {words.stepsCount(progress.ticked, progress.total)}
        </Text>
      </View>
      <CardRows form="joined">
        {rows.map((row) => (
          <StepRow key={row.key} row={row} words={words} onOpenFile={props.onOpenFile} />
        ))}
      </CardRows>
      <View style={styles.doneBy}>
        <Button {...doneByToggle}>{words.doneBy}</Button>
        {naming ? (
          <View style={styles.doneByField}>
            <Input
              label={words.doneBy}
              labelSpokenOnly
              value={doneBy}
              onChange={setDoneBy}
              disabled={sending}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** The step's tile: pressed, it ticks or unticks the step; a photo not sent draws it still. */
function StepTile({ row }: { row: InstallerStepRow }) {
  const tile = <HueTile {...STEP_TILE[row.state]} size={44} stroke={glyphStroke('md')} />;
  if (row.tile === null) return tile;
  return (
    <Pressable haptic="impact" {...row.tile}>
      {tile}
    </Pressable>
  );
}

function StepRow({
  row,
  words,
  onOpenFile,
}: {
  row: InstallerStepRow;
  words: InstallerJobWords;
  onOpenFile: (file: ProjectFile) => void;
}) {
  return (
    <CardRow first={row.first} busy={row.busy}>
      <View style={styles.row}>
        <StepTile row={row} />
        <View style={styles.main}>
          {/* The tile, a checkbox, already says the step's name: read twice, TalkBack joined the
              row as "Final check, Final check". */}
          <View
            accessibilityElementsHidden={row.tile !== null}
            importantForAccessibility={row.tile === null ? 'auto' : 'no-hide-descendants'}
          >
            <Text variant="body" bold>
              {row.name}
            </Text>
          </View>
          {row.lines.map((line) => (
            <Text key={line.key} variant="caption" color="secondary">
              {line.text}
            </Text>
          ))}
          {row.photos.map((photo) => (
            <FileLink key={photo.id} name={photo.name} onOpen={() => onOpenFile(photo)} />
          ))}
          {row.state === 'failed' ? (
            <Text variant="caption" color="warning">
              {words.photoNotSent}
            </Text>
          ) : null}
        </View>
        {row.retry === null ? null : (
          <Button {...row.retry} icon={<ShellGlyph name="retry" size="sm" tone="inverse" />}>
            {words.retryPhoto}
          </Button>
        )}
        {row.act === null ? null : (
          <Button {...row.act} icon={<ShellGlyph name="camera" size="sm" tone="primary" />}>
            {row.act.label}
          </Button>
        )}
      </View>
    </CardRow>
  );
}

/**
 * The photos the job expects — one per step (`M08-45`): the steps with a photo of all, each step a
 * glyph and its word. Until the project's read lands they are not known, and the block waits.
 */
export function InstallerPhotos({ words, steps, known }: InstallerPhotosProps) {
  if (steps.length === 0) return null;
  const { photographed, total } = progressOf(steps);
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text variant="h3">{words.photosTitle}</Text>
        {known ? (
          <Text variant="body-sm" color="secondary">
            {words.count(photographed, total)}
          </Text>
        ) : null}
      </View>
      {known ? (
        <View style={styles.photos}>
          {steps.map((step) => (
            <StatusMark
              key={step.step}
              style={styles.photo}
              tone={hasPhoto(step) ? 'success' : 'neutral'}
              label={words.step(step.step)}
            />
          ))}
        </View>
      ) : (
        <LoadingBars bars={['line', 'line']} label={words.loading} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: theme.spacing['sp-3'] },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    columnGap: theme.spacing['sp-3'],
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  main: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  doneBy: { gap: theme.spacing['sp-2'], alignItems: 'flex-start' },
  doneByField: { alignSelf: 'stretch' },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  photo: { minHeight: theme.spacing['sp-10'], paddingHorizontal: theme.spacing['sp-4'] },
});
