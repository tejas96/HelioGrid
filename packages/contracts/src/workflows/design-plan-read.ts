import {
  type DESIGN_PICTURE_REFUSALS,
  DESIGN_PICTURE_STATES,
  type PLAN_UNITS,
} from '@heliogrid/domain';
import { z } from 'zod';
import type { SignedUpload } from '../ports/object-store';
import { defineWorkflow, type TaskQueue, type WorkflowResult } from './registry';

/**
 * A design's CAD plan read on our server (`T-M05-002d`): a DWG, or a DXF saved in binary, turned
 * into the plan's lines the studio draws. Its reader may not ship to a device, so it runs here.
 *
 * Three steps: the api hands out where the stored plan is and where its lines go; the worker reads
 * the plan on the CAD reader's own queue and PUTs the lines; the api checks what arrived and marks
 * the picture ready, or refused with the reason. Its id is the PICTURE's, so a picture is read once.
 */
export const designPlanReadWorkflow = defineWorkflow({
  name: 'designPlanRead',
  taskQueue: 'heliogrid-studio',
  input: z.object({
    eventId: z.string().uuid(),
    tenantId: z.string().uuid(),
    pictureId: z.string().uuid(),
  }),
  result: z.object({ state: z.enum(DESIGN_PICTURE_STATES) }),
  signals: {},
  queries: {},
  workflowId: (input) => `design-plan-read-${input.pictureId}`,
});

/** The CAD reader's queue: only the worker polls it, since only its image carries the reader. */
export const CAD_PLAN_READ_QUEUE = 'heliogrid-cad' satisfies TaskQueue;

/** Which picture, by id. */
export interface DesignPlanStepInput {
  readonly tenantId: string;
  readonly pictureId: string;
}

/**
 * Where to read the plan from and where to PUT its lines; `null` when the picture is gone or no
 * longer reading — a run started twice reads once.
 */
export type DesignPlanSource = {
  readonly sourceUrl: string;
  readonly contentType: 'image/vnd.dwg' | 'image/vnd.dxf';
  readonly put: SignedUpload;
} | null;

/**
 * What the reader made: the lines PUT, with their size and checksum for the keep step to check,
 * the unit the file names and our guess from its size; or why it could not.
 */
export type CadPlanRead =
  | {
      readonly kind: 'lines';
      readonly byteSize: number;
      /** Base64 SHA-256 of the bytes PUT. */
      readonly checksumSha256: string;
      readonly unit: (typeof PLAN_UNITS)[number] | null;
      readonly unitGuess: (typeof PLAN_UNITS)[number] | null;
    }
  | { readonly kind: 'refused'; readonly refusal: (typeof DESIGN_PICTURE_REFUSALS)[number] };

export type DesignPlanReadResult = WorkflowResult<typeof designPlanReadWorkflow>;

/** The api's steps, by NAME on both sides: a renamed step fails to compile in both processes. */
export interface DesignPlanReadActivities {
  designPlanSource(input: DesignPlanStepInput): Promise<DesignPlanSource>;
  keepDesignPlan(
    input: DesignPlanStepInput & { readonly read: CadPlanRead },
  ): Promise<DesignPlanReadResult>;
  /** Ends a read that failed past every retry as refused (`broken`), so no picture reads for good. */
  endDesignPlanRead(input: DesignPlanStepInput): Promise<DesignPlanReadResult>;
}

/** The worker's step on the CAD reader's queue. */
export interface CadPlanReadActivities {
  readCadPlan(input: NonNullable<DesignPlanSource>): Promise<CadPlanRead>;
}
