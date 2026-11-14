/**
 * ProposalPrintDocument — the shared prop contract.
 *
 * PRINT SURFACE — the web prints it; a phone never produces the artefact. There is deliberately no
 * `ProposalPrint.native.tsx`: `@page` and one-sheet-one-page have no React Native equivalent. The
 * phone reads the same pages through `ScaledProposalPage`. This file stays platform-neutral
 * because both tsconfig projects compile it.
 */
import type { ProposalPageProps } from '../ProposalPages/ProposalPages.types';

/** The whole document: every sheet the version prints (`proposalSheetsOf`), in order. */
export type ProposalPrintDocumentProps = Pick<ProposalPageProps, 'snapshot' | 'facts' | 'words'>;
