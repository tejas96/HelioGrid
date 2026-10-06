import type { FileSubjectKind } from '@heliogrid/domain';

/**
 * Whether a subject a file is declared against exists in the caller's company. One answer per
 * kind, and a kind with rules but no lookup does not compile. A kind owned by another module is
 * answered through that module's `.public.ts` when its slice enrols it.
 */
export type SubjectLookup = (tenantId: string, subjectRef: string) => Promise<boolean>;

/** The company itself: only ever the caller's own. The wire takes a uuid in either case. */
const isTheCompany: SubjectLookup = async (tenantId, subjectRef) =>
  subjectRef.toLowerCase() === tenantId.toLowerCase();

export const SUBJECT_LOOKUPS: Readonly<Record<FileSubjectKind, SubjectLookup>> = {
  tenant: isTheCompany,
  /** The company's catalog is the company's own: its ref is the company's id. */
  catalog: isTheCompany,
};
