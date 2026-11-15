import { z } from 'zod';
import type { PageToPrint, PrintedDocument } from './invoice-document';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * A proposal version's PDF (`M06-51`, `F5-39`, `F3-15`): made the first time someone asks for it —
 * the rep after Generate, the customer on the link — then kept on the version and handed out again.
 * Its id is the VERSION's, so however often it is asked for, a version gets one run and one PDF.
 *
 * Three steps, as a receipt's, with two differences. The page is not HTML the api writes but the
 * web's own print page, drawn from the same parts as the preview and the customer's link, so the
 * PDF cannot differ from them (`F5-38`). And the PDF never rides the workflow: the api answers the
 * page's address, the origins it may load from and a signed store address; the worker prints the
 * page and PUTs the bytes there; the api checks the store holds what was printed and keeps it
 * against the version. Ids and small facts only (`infra/temporal/README.md` §4).
 *
 * A render is tried twice, then the run FAILS and the operator is told (`F5-39`); the customer's
 * page still reads every figure. A failed run's id may start again, so the next ask prints anew.
 */
export const proposalDocumentWorkflow = defineWorkflow({
  name: 'proposalDocument',
  taskQueue: 'heliogrid-projects',
  input: z.object({
    tenantId: z.string().uuid(),
    versionId: z.string().uuid(),
  }),
  /** The kept PDF; null when the version is gone. */
  result: z.object({ fileId: z.string().uuid().nullable() }),
  signals: {},
  queries: {},
  workflowId: (input) => `proposal-document-${input.versionId}`,
  startsAgainAfterFailure: true,
});

/** Whose version, by id. */
export interface ProposalDocumentStepInput {
  readonly tenantId: string;
  readonly versionId: string;
}

/** The page to print; the PDF already kept, so nothing is made again; or null: no such version. */
export type ProposalDocumentPage =
  | ({ readonly kind: 'page' } & PageToPrint)
  | { readonly kind: 'kept'; readonly fileId: string }
  | null;

export type ProposalDocumentStepResult = WorkflowResult<typeof proposalDocumentWorkflow>;

/**
 * The api's two steps, as both processes see them: the workflow (worker) calls them by NAME and
 * the api registers them by name, so a renamed step is a compile error on both sides.
 */
export interface ProposalDocumentActivities {
  proposalDocumentPage(input: ProposalDocumentStepInput): Promise<ProposalDocumentPage>;
  /** Fails for good when the store does not hold what was printed, so the run ends as failed. */
  keepProposalDocument(
    input: ProposalDocumentStepInput & PrintedDocument,
  ): Promise<ProposalDocumentStepResult>;
  /** Tells the operator the PDF could not be made (`F5-39`); once while the last notice is unread. */
  proposalDocumentFailed(input: ProposalDocumentStepInput): Promise<void>;
}
