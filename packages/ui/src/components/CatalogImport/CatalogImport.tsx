'use client';

import { importWizardStepIndex } from '@heliogrid/domain';
import { useId, useState } from 'react';
import { Banner } from '../Banner';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { Stepper } from '../Stepper';
import type { ImportFormats } from './CatalogImport.logic';
import { actOf, fileOf } from './CatalogImport.steps';
import type { CatalogImportProps } from './CatalogImport.types';
import { readyNowOf, scopeIn } from './CatalogImport.view';
import { ImportColumns } from './ImportColumns';
import { ImportFileStep } from './ImportFileStep';
import { ImportFoot } from './ImportFoot';
import { ImportHead } from './ImportHead';
import { ImportRows } from './ImportRows';
import { ImportSkeleton } from './ImportSkeleton';
import { ImportStepList } from './ImportStepList';
import { ImportMatching, ImportRunning } from './ImportWaits';
import { useImportFormats } from './use-import-formats';
import './CatalogImport.css';

/** The panel's width at 1536, and the layer width under which the wizard is a sheet. */
const PANEL_WIDTH = 960;
const PANEL_ABOVE = 720;

/**
 * The catalog import wizard on the web (`SCR-M01-17`): a 960px non-modal side panel over the page
 * that opened it, drawing the 1536 frames, and below the panel's width a sheet drawing the 375
 * frames — full height for the four steps, sized to its content for the two waits. Which width is
 * drawn is `EditorSurface`'s answer, never the window's.
 */
export function CatalogImport(given: CatalogImportProps) {
  // A filter the step cannot show is dropped, so the report never opens empty.
  const props = { ...given, scope: scopeIn(given.scope, given.frame) };
  const { words, frame, job } = props;
  const formats = useImportFormats();
  const titleId = useId();
  const [stepsOpen, setStepsOpen] = useState(false);
  const step = importWizardStepIndex(frame);
  const readyNow = readyNowOf(props);
  // A report still opening draws its line alone, no act (m17-j).
  const act = reportUnread(props) ? null : actOf(props, readyNow);
  const file = job === null ? null : fileOf(job, words, formats, props.mapping);
  const wait = frame === 'matching' || frame === 'running';

  return (
    <>
      <EditorSurface
        open={props.open}
        onClose={props.onClose}
        closeLabel={words.close}
        panelAbove={PANEL_ABOVE}
        width={PANEL_WIDTH}
        modal={false}
        density="functional"
        sheetProps={{
          modal: true,
          showClose: false,
          handle: wait,
          size: wait ? 'auto' : 'full',
          bodyScrolls: false,
          labelId: titleId,
          footer: <ImportFoot {...props} act={act} wide={false} />,
        }}
        panelProps={{
          title: words.title,
          subtitle: file?.subtitle,
          subtitleFace: 'sans',
          showClose: true,
          meta: (
            <Stepper
              variant="numbered-bars"
              steps={[...words.steps]}
              current={step}
              label={words.stepsLabel}
            />
          ),
          footer: <ImportFoot {...props} act={act} wide />,
        }}
      >
        {({ panel }) => (
          <div
            className="hg-import"
            data-wide={panel ? 'true' : 'false'}
            data-wait={wait ? 'true' : 'false'}
          >
            {panel ? null : (
              <ImportHead
                words={words}
                frame={frame}
                step={step}
                titleId={titleId}
                onClose={props.onClose}
                onBack={props.onBack}
                onSteps={() => setStepsOpen(true)}
              />
            )}
            <div className="hg-import-body" data-frame={frame}>
              {props.notice === null ? null : (
                <Banner
                  kind="state"
                  title={props.notice.title}
                  dismissible={false}
                  density="functional"
                >
                  {props.notice.message}
                </Banner>
              )}
              <ImportStep props={props} wide={panel} formats={formats} readyNow={readyNow} />
            </div>
          </div>
        )}
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

interface ImportStepProps {
  props: CatalogImportProps;
  wide: boolean;
  formats: ImportFormats;
  readyNow: number;
}

/** The frame's body: a step, or one of its waits. */
function ImportStep({ props, wide, formats, readyNow }: ImportStepProps) {
  switch (props.frame) {
    case 'empty':
    case 'reading':
    case 'unreadable':
    case 'file':
      return <ImportFileStep {...props} wide={wide} formats={formats} />;
    case 'columns':
      return <ImportColumns {...props} wide={wide} />;
    case 'matching':
      return <ImportMatching words={props.words} />;
    case 'running':
      return <ImportRunning {...props} formats={formats} />;
    case 'preview':
    case 'report':
      // A kept report opening, or its lists not yet read: the report's own loading form (m17-j).
      return props.opening || reportUnread(props) ? (
        <ImportSkeleton {...props} wide={wide} formats={formats} />
      ) : (
        <ImportRows {...props} wide={wide} formats={formats} readyNow={readyNow} />
      );
  }
}

/** The report's lists have not answered yet: none holds a row, and each is still loading. */
function reportUnread(props: CatalogImportProps): boolean {
  const { groups } = props.lists;
  return (
    props.frame === 'report' &&
    groups.length > 0 &&
    groups.every((group) => group.loading && group.rows.length === 0)
  );
}
