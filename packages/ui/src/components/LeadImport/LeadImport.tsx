'use client';

import type { ReactNode } from 'react';
import { useOwnWidth } from '../../primitives/use-own-width';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Banner } from '../Banner';
import { Button } from '../Button';
import { EmptyState } from '../EmptyState';
import {
  ImportColumns,
  ImportFileStep,
  ImportFoot,
  ImportMatching,
  ImportRunning,
} from '../Import';
import type { ImportFormats } from '../Import/Import.types';
import { useImportFormats } from '../Import/use-import-formats';
import { LoadingBars } from '../LoadingBars';
import { Stepper } from '../Stepper';
import { WIDE_FROM } from './LeadImport.logic';
import { columnsStepOf, fileStepOf, footOf, stepperOf } from './LeadImport.props';
import type { LeadImportProps } from './LeadImport.types';
import { LeadImportPreview } from './LeadImportPreview';
import { LeadImportReport } from './LeadImportReport';
import { LeadImportRows } from './LeadImportRows';
import './LeadImport.css';

/**
 * The Lead Import Wizard on the web (`SCR-M02-05`): the four-step track, the step, and its act —
 * one column below the desktop's room, and the preview's hero and the report's rows beside their
 * side cards at it. The width is the wizard's own room, never the window's.
 */
export function LeadImport(props: LeadImportProps) {
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= WIDE_FROM;
  const formats = useImportFormats();
  const { main, below } = stepOf(props, wide, formats);
  return (
    <div ref={room} className="hg-lead-import" data-wide={wide ? 'true' : 'false'}>
      <Stepper {...stepperOf(props, wide)} />
      {props.notice === null ? null : (
        <Banner kind="state" title={props.notice.title} dismissible={false} density="functional">
          {props.notice.message}
        </Banner>
      )}
      {main}
      <ImportFoot {...footOf(props, wide)} />
      {below}
    </div>
  );
}

/** The frame's body on the desk, and what sits under its act: the preview's rows. */
function stepOf(
  props: LeadImportProps,
  wide: boolean,
  formats: ImportFormats,
): { main: ReactNode; below: ReactNode } {
  const { words, job } = props;
  const only = (main: ReactNode) => ({ main, below: null });
  if (props.jobFailed !== null) {
    return only(
      <EmptyState
        icon={<ShellGlyph name="alert-triangle" size="lg" tone="warning" />}
        title={words.jobFailedTitle}
        description={words.jobFailedMessage}
        action={
          <Button variant="primary" size="lg" onClick={props.jobFailed.retry}>
            {words.tryAgain}
          </Button>
        }
      />,
    );
  }
  if (props.opening)
    return only(<LoadingBars bars={['panel', 'row', 'row']} label={words.opening} />);
  switch (props.frame) {
    case 'columns':
      return only(<ImportColumns {...columnsStepOf(props, wide)} />);
    case 'matching':
      return only(<ImportMatching words={words} />);
    case 'preview':
      return {
        main: <LeadImportPreview {...props} wide={wide} />,
        below: <LeadImportRows {...props} phase="preview" />,
      };
    case 'running':
      return only(
        job === null ? null : (
          <ImportRunning words={words} job={job} mapping={props.sheetPick} formats={formats} />
        ),
      );
    case 'report':
      return only(<LeadImportReport {...props} wide={wide} />);
    default:
      return only(<ImportFileStep {...fileStepOf(props, wide, formats)} />);
  }
}
