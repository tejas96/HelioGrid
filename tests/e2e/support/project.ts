import {
  type DeclaredFile,
  type HandoverPreview,
  IDEMPOTENCY_KEY_HEADER,
  type LeadDetail,
  type ProjectDetail,
  type ProjectPerson,
} from '@heliogrid/contracts';
import { checksumSha256Of, type ProjectChainStage } from '@heliogrid/domain';
import type { Translator } from '@heliogrid/i18n';
import { expect, type Page } from '@playwright/test';
import { API } from './api-log';
import { createCompany } from './door';
import { freshMobile } from './phone';
import { markWonBody } from './project-facts';
import { passTheOwnersMark } from './shell';

/*
 * The projects specs' way to a project (`M08`). A new company is empty, so each spec captures its
 * lead through the api under the owner's own session, as the leads specs do; a spec that is not
 * about *Mark won* starts its project through the api too — `projects-[id].spec.ts` drives the
 * lead page's sheet itself.
 */

/** The one customer a projects spec sells to; a project's page is titled with the name. */
export const CUSTOMER = { name: 'Sunil Deshmukh', city: 'Nashik' } as const;

/** What `POST /leads/:id/won` answers: the project the act started. */
export interface StartedProject {
  readonly projectId: string;
  readonly number: string;
}

/** A new number's company, its owner past the first-run mark — no lead and no project in it. */
export async function ownerWithCompany(page: Page, t: Translator): Promise<void> {
  await createCompany(page, t, freshMobile());
  await passTheOwnersMark(page, t);
}

/** The customer's lead — or another customer's — captured as quick add sends it; answers its id. */
export async function captureLead(
  page: Page,
  customer: { readonly name: string; readonly city: string } = CUSTOMER,
): Promise<string> {
  const answer = await page.request.post(`${API}/leads`, {
    data: {
      phoneE164: freshMobile().e164,
      ...customer,
      segment: 'residential',
      capturedAt: new Date().toISOString(),
    },
    headers: { [IDEMPOTENCY_KEY_HEADER]: crypto.randomUUID() },
  });
  expect(answer.status()).toBe(201);
  return ((await answer.json()) as LeadDetail).lead.id;
}

/**
 * *Mark won* through the api, as the lead page's sheet sends it: the company's one project manager
 * — its owner — a final value and an install date a month ahead (`markWonBody`).
 */
export async function markWonThroughApi(page: Page, leadId: string): Promise<StartedProject> {
  const people = await page.request.get(`${API}/projects/people?role=manager`);
  expect(people.status()).toBe(200);
  const [manager] = (await people.json()) as ProjectPerson[];
  if (manager === undefined)
    throw new Error('a new company has no project manager: its owner is one');
  const won = await page.request.post(`${API}/leads/${leadId}/won`, {
    data: markWonBody(manager.userId),
    headers: { [IDEMPOTENCY_KEY_HEADER]: crypto.randomUUID() },
  });
  expect(won.status()).toBe(201);
  return (await won.json()) as StartedProject;
}

/** A new company with one project at Won, started through the api from the customer's lead. */
export async function ownerWithProject(page: Page, t: Translator): Promise<StartedProject> {
  await ownerWithCompany(page, t);
  return markWonThroughApi(page, await captureLead(page));
}

/**
 * The board and the project page lay themselves out wide from their own room (960 and 900 px): the
 * desktop's width beside its sidebar has it, the phone's never does.
 */
const WIDE_FROM = 1200;
export const isWide = (page: Page): boolean => (page.viewportSize()?.width ?? 0) >= WIDE_FROM;

/** The toast an act leaves, by its line. */
export const toastSaying = (page: Page, title: string) =>
  page.getByRole('status').filter({ hasText: title });

/** A project page's one hero, named for where the project stands now (`DETAIL.now`). */
export const projectHeroOf = (page: Page, now: string) =>
  page.getByRole('region', { name: now, exact: true });

/** A new company with one project at Won, opened on its page, titled with its customer. */
export async function openProjectPage(page: Page, t: Translator): Promise<StartedProject> {
  const started = await ownerWithProject(page, t);
  await page.goto(`/projects/${started.projectId}`);
  await expect(page.getByRole('heading', { level: 1, name: CUSTOMER.name })).toBeVisible();
  return started;
}

/** The project as the api reads it — the rows and states its pages draw. */
export async function readProject(page: Page, projectId: string): Promise<ProjectDetail> {
  const answer = await page.request.get(`${API}/projects/${projectId}`);
  expect(answer.status()).toBe(200);
  return (await answer.json()) as ProjectDetail;
}

/** What the handover checks, as the api reads it. */
export async function readHandover(page: Page, projectId: string): Promise<HandoverPreview> {
  const answer = await page.request.get(`${API}/projects/${projectId}/handover`);
  expect(answer.status()).toBe(200);
  return (await answer.json()) as HandoverPreview;
}

/** One project act through the api, as its page sends it; answers the project as it then stands. */
export async function actThroughApi(
  page: Page,
  projectId: string,
  verb: string,
  body: Record<string, unknown> = {},
): Promise<ProjectDetail> {
  const answer = await page.request.post(`${API}/projects/${projectId}/${verb}`, {
    data: { ...body, capturedAt: new Date().toISOString() },
  });
  expect(answer.status(), `${verb}: ${await answer.text()}`).toBe(200);
  return (await answer.json()) as ProjectDetail;
}

/** A checklist row marked *Not needed* through the api, with its reason. */
export async function markNotNeededThroughApi(
  page: Page,
  projectId: string,
  row: string,
  reason: string,
): Promise<void> {
  await actThroughApi(page, projectId, 'documents/not-needed', { row, reason });
}

/**
 * Forward taps through each stage given, in order — Dispatched through its own act, with no crew
 * (a new company has no one on the installation team) and the material left today, the company's
 * own day.
 */
export async function walkThroughApi(
  page: Page,
  projectId: string,
  stages: readonly ProjectChainStage[],
): Promise<ProjectDetail> {
  let project = await readProject(page, projectId);
  for (const to of stages) {
    project =
      to === 'dispatched'
        ? await actThroughApi(page, projectId, 'dispatch', { crew: [], leftOn: project.today })
        : await actThroughApi(page, projectId, 'move', { to });
  }
  return project;
}

/** A residential project's walk from Won to the stage handover follows: the subsidy is claimed. */
export const TO_INCENTIVE_CLAIMED: readonly ProjectChainStage[] = [
  'material_ordered',
  'dispatched',
  'installation',
  'electrical_metering',
  'utility_inspection',
  'commissioned',
  'incentive_claimed',
];

/** The same walk, stopped where the commissioning certificate's upload moves the project on. */
export const TO_UTILITY_INSPECTION: readonly ProjectChainStage[] = TO_INCENTIVE_CLAIMED.slice(0, 5);

/**
 * The project walked to the stage before handover, every row a person fills marked not needed — but
 * those `kept`, which still wait. Answers the project as it then stands.
 */
export async function readyForHandover(
  page: Page,
  projectId: string,
  kept: readonly string[] = [],
): Promise<ProjectDetail> {
  const walked = await walkThroughApi(page, projectId, TO_INCENTIVE_CLAIMED);
  const waiting = walked.documents.filter(
    (document) =>
      document.state === 'pending' &&
      document.madeBy !== 'handover' &&
      !kept.includes(document.row),
  );
  for (const { row } of waiting) {
    await markNotNeededThroughApi(page, projectId, row, 'Handled outside HelioGrid');
  }
  return readProject(page, projectId);
}

/** A project handed over through the api: walked, every row not needed, then handover. */
export async function handOverThroughApi(page: Page, projectId: string): Promise<void> {
  await readyForHandover(page, projectId);
  await actThroughApi(page, projectId, 'handover');
}

/**
 * A one-page PDF, written by hand with its own cross-reference table: what a scanned paper is to
 * the store, and a page the handover pack can join.
 */
export function onePagePdf(): Buffer {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> >>',
  ];
  let body = '%PDF-1.4\n';
  const offsets = objects.map((object, index) => {
    const offset = body.length;
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) body += `${String(offset).padStart(10, '0')} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, 'latin1');
}

/**
 * A PDF put on a checklist row through the api, as the page's upload sends it: declared for the
 * project, its bytes sent to the store's own link, confirmed, then attached — the row is done.
 */
export async function uploadToRowThroughApi(
  page: Page,
  projectId: string,
  row: string,
): Promise<ProjectDetail> {
  const bytes = onePagePdf();
  const declare = await page.request.post(`${API}/files`, {
    data: {
      subjectKind: 'project',
      subjectRef: projectId,
      contentType: 'application/pdf',
      byteSize: bytes.length,
      checksumSha256: checksumSha256Of(new Uint8Array(bytes)),
    },
    headers: { [IDEMPOTENCY_KEY_HEADER]: crypto.randomUUID() },
  });
  expect(declare.status(), await declare.text()).toBe(201);
  const { file, upload } = (await declare.json()) as DeclaredFile;
  if (upload === null) throw new Error('a new file came back with no link to upload to');
  const stored = await page.request.fetch(upload.url, {
    method: upload.method,
    headers: upload.headers,
    data: bytes,
  });
  expect(stored.ok(), await stored.text()).toBe(true);
  const complete = await page.request.post(`${API}/files/${file.id}/complete`);
  expect(complete.status(), await complete.text()).toBe(200);
  return actThroughApi(page, projectId, 'files', {
    fileId: file.id,
    slot: 'document',
    slotKey: row,
    name: 'Signed.pdf',
  });
}

/** The first checklist row still waiting on a person: neither the payments nor the handover fills it. */
export function firstPersonRow(project: ProjectDetail): string {
  const row = project.documents.find(
    (document) => document.state === 'pending' && document.madeBy === null,
  )?.row;
  if (row === undefined) throw new Error('a new project has no row waiting on a person');
  return row;
}
