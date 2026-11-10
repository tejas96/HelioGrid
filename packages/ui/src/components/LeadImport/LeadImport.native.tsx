import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import type { ImportFormats } from '../Import/Import.types';
import { ImportColumns } from '../Import/ImportColumns.native';
import { ImportFileStep } from '../Import/ImportFileStep.native';
import { ImportFoot } from '../Import/ImportFoot.native';
import { ImportMatching, ImportRunning } from '../Import/ImportWaits.native';
import { useImportFormats } from '../Import/use-import-formats';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { Stepper } from '../Stepper/Stepper.native';
import { columnsStepOf, fileStepOf, footOf, stepperOf } from './LeadImport.props';
import type { LeadImportProps } from './LeadImport.types';
import { LeadImportPreview } from './LeadImportPreview.native';
import { LeadImportReport } from './LeadImportReport.native';
import { LeadImportRows } from './LeadImportRows.native';

/**
 * The Lead Import Wizard on the phone (`SCR-M02-05`, the 375 frames): the four-step track, the
 * step, and its one act full width with its line under it — the preview's rows below that act, so
 * *Import* sits under the counts it is decided by. One column always; the page that holds it
 * scrolls. The file comes from the system's document picker (`onRequestFiles`).
 */
export function LeadImport(props: LeadImportProps) {
  const formats = useImportFormats();
  const { main, below } = stepOf(props, formats);
  return (
    <View style={styles.wizard}>
      <Stepper {...stepperOf(props, false)} />
      {props.notice === null ? null : (
        <Banner kind="state" title={props.notice.title} dismissible={false} density="functional">
          {props.notice.message}
        </Banner>
      )}
      {main}
      <ImportFoot {...footOf(props, false)} />
      {below}
    </View>
  );
}

/** The frame's body on the phone — always the narrow form — and the preview's rows under its act. */
function stepOf(
  props: LeadImportProps,
  formats: ImportFormats,
): { main: ReactNode; below: ReactNode } {
  const { words, job } = props;
  const only = (main: ReactNode) => ({ main, below: null });
  if (props.jobFailed !== null) {
    const { retry } = props.jobFailed;
    return only(
      <EmptyState
        icon={<ShellGlyph name="alert-triangle" size="lg" tone="warning" />}
        title={words.jobFailedTitle}
        description={words.jobFailedMessage}
        action={
          <Button variant="primary" size="lg" onClick={retry}>
            {words.tryAgain}
          </Button>
        }
      />,
    );
  }
  if (props.opening) {
    return only(<LoadingBars bars={['panel', 'row', 'row']} label={words.opening} />);
  }
  switch (props.frame) {
    case 'matching':
      return only(<ImportMatching words={words} />);
    case 'columns':
      return only(<ImportColumns {...columnsStepOf(props, false)} />);
    case 'report':
      return only(<LeadImportReport {...props} wide={false} />);
    case 'preview':
      return {
        main: <LeadImportPreview {...props} wide={false} />,
        below: <LeadImportRows {...props} phase="preview" />,
      };
    case 'running':
      return only(
        job === null ? null : (
          <ImportRunning words={words} job={job} mapping={props.sheetPick} formats={formats} />
        ),
      );
    default:
      return only(<ImportFileStep {...fileStepOf(props, false, formats)} />);
  }
}

const styles = StyleSheet.create({
  wizard: { gap: theme.spacing['sp-5'], minWidth: 0 },
});
