import { existsSync, readFileSync } from 'node:fs';
import type { Member, OnboardingProgress, SessionProjection } from '@heliogrid/contracts';
import { ONBOARDING_STEPS } from '@heliogrid/domain';
import { type APIRequestContext, expect, test } from '@playwright/test';
import { API_LOG } from '../support/api-log';
import { QA_COMPANIES, type QaCompany, type QaPerson } from '../support/qa-accounts';

/**
 * The QA companies (`support/qa-accounts.ts`), made through the api as people make them: the owner
 * signs up and answers every setup step (skipped), invites each member, and each member signs in
 * and accepts from the link the invite message carries. Run again, it adds what is missing and puts
 * back roles a QA row changed. Runs only as its own project (`--project qa-seed`, off CI) with the
 * api, the worker and Temporal up — the invite message is the worker's step — on the test database.
 */
const LINK = /\/invite\/([A-Za-z0-9_-]{43})\b/;
const LINK_WAIT_MS = 30_000;

test.describe.configure({ mode: 'serial' });

for (const qa of QA_COMPANIES) {
  test(`seed ${qa.companyName}`, async ({ playwright }, testInfo) => {
    const code = String(testInfo.project.metadata.otpCode ?? '');
    expect(code, 'DEV_OTP_CODE reaches the seed through the project metadata').not.toBe('');
    const as = async (person: QaPerson) => {
      const context = await playwright.request.newContext({
        baseURL: String(testInfo.project.metadata.api),
      });
      return { context, session: await signIn(context, person.phoneE164, code) };
    };
    const owner = await as(qa.owner);
    if (owner.session.membership === null) await signUp(owner.context, qa);
    await answerSetup(owner.context);
    const roster = await rosterOf(owner.context);
    for (const member of qa.members) {
      const row = roster.get(member.phoneE164);
      if (row?.status === 'active') continue;
      expect(row, `${member.name} was deactivated by a QA row: seed a new number`).toBeUndefined();
      const since = Date.now();
      const pending = await invite(owner.context, member);
      const token = await linkSentTo(member.phoneE164, pending ? 0 : since);
      const joining = await as(member);
      const accepted = await joining.context.post(`/invitations/landing/${token}/accept`);
      expect(accepted.status(), `${member.name} accepts`).toBe(200);
      await joining.context.dispose();
    }
    await putRolesBack(owner.context, qa, await as(qa.members[0] ?? qa.owner));
    await owner.context.dispose();
  });
}

async function signIn(
  context: APIRequestContext,
  phoneE164: string,
  code: string,
): Promise<SessionProjection> {
  const challenge = await context.post('/auth/otp/request', {
    data: { phoneE164, channel: 'sms' },
  });
  expect(challenge.status(), `a code for ${phoneE164}`).toBe(200);
  const { challengeId } = (await challenge.json()) as { challengeId: string };
  const verified = await context.post('/auth/otp/verify', {
    data: { challengeId, code, platform: 'web' },
  });
  expect(verified.status(), `${phoneE164} signs in`).toBe(200);
  return (await verified.json()) as SessionProjection;
}

async function signUp(context: APIRequestContext, qa: QaCompany): Promise<void> {
  const made = await context.post('/tenants', {
    data: { companyName: qa.companyName, ownerName: qa.owner.name, city: 'Pune' },
  });
  expect(made.status(), `${qa.companyName} is made`).toBe(201);
}

/** Every setup step answered (skipped), so a seeded owner lands on home, never in setup. */
async function answerSetup(context: APIRequestContext): Promise<void> {
  const read = await context.get('/onboarding/progress');
  expect(read.status(), 'the owner reads setup progress').toBe(200);
  const { steps } = (await read.json()) as OnboardingProgress;
  for (const step of ONBOARDING_STEPS) {
    if (steps[step] !== undefined) continue;
    const answered = await context.put(`/onboarding/progress/${step}`, {
      data: { state: 'skipped' },
    });
    expect(answered.status(), `setup step ${step} answered`).toBe(200);
  }
  const after = (await (await context.get('/onboarding/progress')).json()) as OnboardingProgress;
  expect(after.resumeStep, 'no setup step is owed').toBeNull();
}

async function rosterOf(context: APIRequestContext): Promise<Map<string, Member>> {
  const read = await context.get('/tenants/me/members?page=1&limit=100');
  expect(read.status(), 'the owner reads the roster').toBe(200);
  const { items } = (await read.json()) as { items: Member[] };
  return new Map(items.map((member) => [member.phoneE164, member]));
}

/** Sent now (false) or already pending from an earlier run (true): either way its link is logged. */
async function invite(context: APIRequestContext, member: QaPerson): Promise<boolean> {
  const sent = await context.post('/invitations', {
    data: { inviteeName: member.name, phoneE164: member.phoneE164, roles: member.roles },
  });
  if (sent.status() === 201) return false;
  const code = ((await sent.json()) as { error?: { code?: string } }).error?.code;
  expect(code, `${member.name} is invited`).toBe('ALREADY_INVITED');
  return true;
}

/**
 * Each seeded person's roles as `qa-accounts.ts` gives them: the owner puts back the members' first
 * (the second owner's EPC Owner included), then the second owner the owner's — an owner never edits
 * their own EPC Owner (`OWN_ADMIN`).
 */
async function putRolesBack(
  owner: APIRequestContext,
  qa: QaCompany,
  second: { context: APIRequestContext },
): Promise<void> {
  const roster = await rosterOf(second.context);
  const fix = async (by: APIRequestContext, person: QaPerson) => {
    const row = roster.get(person.phoneE164);
    expect(row?.status, `${person.name} is active in ${qa.companyName}`).toBe('active');
    if (row === undefined || sameSet(row.roles, person.roles)) return;
    const put = await by.put(`/tenants/me/members/${row.membershipId}/roles`, {
      data: { roles: person.roles },
    });
    expect(put.status(), `${person.name}'s roles put back`).toBe(200);
  };
  for (const member of qa.members) await fix(owner, member);
  await fix(second.context, qa.owner);
  await second.context.dispose();
}

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((role) => b.includes(role));

/** The newest invite link the api's message delivery wrote for this number at or after `since`. */
async function linkSentTo(phoneE164: string, since: number): Promise<string> {
  const deadline = Date.now() + LINK_WAIT_MS;
  while (Date.now() < deadline) {
    const token = newestLink(phoneE164, since);
    if (token !== null) return token;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `no invite link for ${phoneE164} reached ${API_LOG} within ${LINK_WAIT_MS} ms — are the worker and Temporal running?`,
  );
}

function newestLink(phoneE164: string, since: number): string | null {
  if (!existsSync(API_LOG)) return null;
  const marker = `Message for ${phoneE164} via`;
  for (const line of readFileSync(API_LOG, 'utf8').split('\n').reverse()) {
    if (!line.includes(marker)) continue;
    const time = /"time":(\d+)/.exec(line)?.[1];
    if (time !== undefined && Number(time) < since) return null;
    const token = LINK.exec(line)?.[1];
    if (token !== undefined) return token;
  }
  return null;
}
