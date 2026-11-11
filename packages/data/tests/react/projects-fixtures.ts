import type { ProjectBoard, ProjectCard, ProjectDetail, ProjectJob } from '@heliogrid/contracts';
import { PROJECT_STAGE_CHAIN } from '@heliogrid/domain';

/**
 * The projects as the api answers them, in the contract's shapes: one project at Won with a
 * checklist row waiting, live cards for a board, an installer's jobs and the handover's preview.
 */

const id = (n: number) => `01a60000-0000-7000-8000-${String(n).padStart(12, '0')}`;
export const TENANT = id(1);
export const READER = { userId: id(2), name: 'Asha Patil' };
export const PROJECT_ID = id(101);
export const LEAD_ID = id(201);
export const CUSTOMER_ID = id(202);
export const CREW_ID = id(301);
export const FILE_ID = id(401);
export const TODAY = '2026-11-10';
export const AT = '2026-11-04T05:00:00.000Z';

export function aProject(): ProjectDetail {
  return {
    id: PROJECT_ID,
    number: 'PRJ-0042',
    leadId: LEAD_ID,
    today: TODAY,
    customer: {
      id: CUSTOMER_ID,
      name: 'Priya Sharma',
      phoneE164: '+919822014567',
      city: 'Nashik',
      preferredLanguage: 'mr',
    },
    segment: 'residential',
    stage: 'won',
    enteredOn: '2026-11-04',
    incentiveApplies: true,
    manager: READER,
    soldBy: null,
    expectedInstallOn: '2026-11-20',
    accessNote: null,
    cancel: null,
    journey: [
      {
        from: null,
        to: 'won',
        cause: 'person',
        proof: null,
        movedAt: AT,
        enteredOn: '2026-11-04',
        movedBy: READER,
      },
    ],
    wait: null,
    documents: [
      {
        row: 'utility_feasibility',
        state: 'pending',
        reason: null,
        movesTo: null,
        madeBy: null,
        changedAt: AT,
        changedBy: null,
        files: [],
      },
    ],
    steps: [{ step: 'mounting', tickedAt: null, tickedBy: null, doneBy: null, files: [] }],
    crew: [],
    otherFiles: [],
    leadFiles: [],
    todo: null,
    earlyProofTo: null,
    missingProofRow: null,
    packLeftOut: null,
    designId: null,
    proposalId: null,
    acts: { stages: true, documents: true, steps: true },
  };
}

/** One live card: the stage it stands in since `enteredOn`, and what it asks of a person. */
export function aCard(
  n: number,
  stage: string,
  enteredOn: string,
  asks: Partial<ProjectCard> = {},
): ProjectCard {
  return {
    id: id(110 + n),
    number: `PRJ-004${n}`,
    name: null,
    place: 'Nashik',
    segment: 'residential',
    stage,
    enteredOn,
    manager: READER,
    expectedInstallOn: null,
    steps: { ticked: 0, total: 5 },
    wait: null,
    todo: null,
    earlyProofTo: null,
    missingProofRow: null,
    ...asks,
  };
}

/** The board over `live`, each chain stage counted from it with its oldest entry day. */
export function aBoard(live: readonly ProjectCard[]): ProjectBoard {
  const stages = PROJECT_STAGE_CHAIN.map((stage) => {
    const standing = live.filter((card) => card.stage === stage).map((card) => card.enteredOn);
    return { stage, count: standing.length, oldestEnteredOn: standing.sort()[0] ?? null };
  });
  return { today: TODAY, stages, live: [...live] };
}

export function aJob(n: number): ProjectJob {
  return {
    id: id(500 + n),
    number: `PRJ-005${n}`,
    name: 'Priya Sharma',
    place: 'Nashik',
    phoneE164: '+919822014567',
    stage: 'dispatched',
    accessNote: 'Gate code 4411',
    steps: aProject().steps.map(({ files: _photos, ...step }) => step),
  };
}

export const PEOPLE = [{ ...READER, liveProjects: 3 }];

export const PREVIEW = {
  pendingRows: ['commissioning_certificate'],
  pack: { files: 2 },
  message: { language: 'mr', text: 'Your solar system is handed over.' },
};

/** A file on the project as the file routes answer it: declared (`null`), then confirmed. */
export const storedFile = (uploadedAt: string | null) => ({
  id: FILE_ID,
  subjectKind: 'project',
  subjectRef: PROJECT_ID,
  contentType: 'image/jpeg',
  byteSize: 4,
  checksumSha256: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
  uploadedAt,
});
