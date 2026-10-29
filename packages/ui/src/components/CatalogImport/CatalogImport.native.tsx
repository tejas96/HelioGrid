import { importWizardStepIndex } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Banner } from '../Banner/Banner.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import type { ImportFormats } from './CatalogImport.logic';
import { actOf } from './CatalogImport.steps';
import type { CatalogImportProps } from './CatalogImport.types';
import { readyNowOf, scopeIn } from './CatalogImport.view';
import { ImportColumns } from './ImportColumns.native';
import { ImportFileStep } from './ImportFileStep.native';
import { ImportFoot } from './ImportFoot.native';
import { ImportHead } from './ImportHead.native';
import { ImportRows } from './ImportRows.native';
import { ImportSkeleton } from './ImportSkeleton.native';
import { ImportStepList } from './ImportStepList.native';
import { ImportMatching, ImportRunning } from './ImportWaits.native';
import { useImportFormats } from './use-import-formats';

/** The layer width under which the wizard is a sheet: every phone. */
const PANEL_ABOVE = 720;

/**
 * The catalog import wizard on the phone (`SCR-M01-17`, the 375 frames): a sheet over the page
 * that opened it — full height with no handle for the four steps, sized to its content for the
 * matching wait and the run. The head stays in view; the step under it scrolls in one
 * `ScrollView`, so the empty step's picker can grow into the room the sheet leaves.
 */
export function CatalogImport(given: CatalogImportProps) {
  // A filter the step cannot show is dropped, so the report never opens empty.
  const props = { ...given, scope: scopeIn(given.scope, given.frame) };
  const { words, frame } = props;
  const formats = useImportFormats();
  const [stepsOpen, setStepsOpen] = useState(false);
  const step = importWizardStepIndex(frame);
  const readyNow = readyNowOf(props);
  // A report still opening draws its line alone, no act (m17-j).
  const act = reportUnread(props) ? null : actOf(props, readyNow);
  const wait = frame === 'matching' || frame === 'running';

  const body = (
    <>
      {props.notice === null ? null : (
        <Banner kind="state" title={props.notice.title} dismissible={false} density="functional">
          {props.notice.message}
        </Banner>
      )}
      <ImportStep props={props} formats={formats} />
    </>
  );

  return (
    <>
      <EditorSurface
        open={props.open}
        onClose={props.onClose}
        closeLabel={words.close}
        inset
        panelAbove={PANEL_ABOVE}
        size={wait ? 'auto' : 'full'}
        density="functional"
        footer={<ImportFoot props={props} act={act} />}
        sheetProps={wait ? {} : { handle: false, bodyScrolls: false }}
        style={wait ? undefined : styles.fullSheet}
      >
        <View style={wait ? undefined : [styles.fullBody, { paddingTop: props.safeTop }]}>
          <ImportHead
            words={words}
            frame={frame}
            step={step}
            onClose={props.onClose}
            onBack={props.onBack}
            onSteps={() => setStepsOpen(true)}
          />
          {wait ? (
            <View style={styles.waitBody}>{body}</View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollBody}
              keyboardShouldPersistTaps="handled"
            >
              {body}
            </ScrollView>
          )}
        </View>
      </EditorSurface>
      <ImportStepList
        open={props.open && stepsOpen}
        words={words}
        step={step}
        onClose={() => setStepsOpen(false)}
        onBack={() => {
          setStepsOpen(false);
          props.onBack();
        }}
      />
    </>
  );
}

/** The frame's body: a step, or one of its waits. */
function ImportStep({ props, formats }: { props: CatalogImportProps; formats: ImportFormats }) {
  switch (props.frame) {
    case 'empty':
    case 'reading':
    case 'unreadable':
    case 'file':
      return <ImportFileStep {...props} formats={formats} />;
    case 'columns':
      return <ImportColumns {...props} />;
    case 'matching':
      return <ImportMatching words={props.words} />;
    case 'running':
      return <ImportRunning {...props} formats={formats} />;
    case 'preview':
    case 'report':
      // A kept report opening, or its lists not yet read: the report's own loading form (m17-j).
      return props.opening || reportUnread(props) ? (
        <ImportSkeleton {...props} formats={formats} />
      ) : (
        <ImportRows {...props} formats={formats} />
      );
  }
}

/*
 * The full sheet fills the layer under the status bar with square corners, as the board draws
 * it. The sheet's body pads 16 at each side and 8 above the footer; the scroller reaches back over
 * both so a raised card's shadow is not cut at the edge, and lays the board's own 6 above and 16
 * under the step back inside.
 */
const styles = StyleSheet.create({
  fullSheet: {
    height: '100%',
    maxHeight: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  fullBody: { flex: 1, minHeight: 0 },
  scroll: {
    flex: 1,
    marginHorizontal: -theme.spacing['sp-4'],
    marginBottom: -theme.spacing['sp-2'],
  },
  scrollBody: {
    flexGrow: 1,
    gap: theme.spacing['sp-3'],
    paddingTop: 6,
    paddingHorizontal: theme.spacing['sp-4'],
    paddingBottom: theme.spacing['sp-4'],
  },
  waitBody: { gap: theme.spacing['sp-3'] },
});

/** The report's lists have not answered yet: none holds a row, and each is still loading. */
function reportUnread(props: CatalogImportProps): boolean {
  const { groups } = props.lists;
  return (
    props.frame === 'report' &&
    groups.length > 0 &&
    groups.every((group) => group.read.kind === 'loading')
  );
}
