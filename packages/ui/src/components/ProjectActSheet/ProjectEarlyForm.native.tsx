import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Button } from '../Button/Button.native';
import { Timeline } from '../Timeline/Timeline.native';
import { earlyStepsOf, footOf, keepOf } from './ProjectActSheet.logic';
import type { ProjectFormOf } from './ProjectActSheet.types';
import { ProjectSheetSend } from './ProjectSheetSend.native';

/**
 * A proof that came early on the phone (ruling 1) — its spark is the sheet's own header — where it
 * stands now, the stages that count as passed and the stage the file moves it to — then *Move*, or
 * *Not now* and the file stays.
 */
export function EarlyForm({ form, words, ...frame }: ProjectFormOf<'earlyProof'>) {
  const { controlFill } = useGround();
  return (
    <View style={styles.form}>
      <View style={[styles.steps, { backgroundColor: controlFill }]}>
        <Timeline variant="page" density="functional" items={earlyStepsOf(form, words)} />
      </View>
      <ProjectSheetSend
        label={words.early.send(form.to)}
        ready
        {...footOf(frame)}
        onSend={form.onSend}
        glyph={null}
        destructive={false}
      />
      <Button {...keepOf(frame)}>{words.early.keep}</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-4'] },
  steps: { padding: theme.spacing['sp-3'], borderRadius: theme.radius['r-md'] },
});
