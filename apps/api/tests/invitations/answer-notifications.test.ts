import { notification, tenantMembership, userAccount } from '@heliogrid/db';
import {
  FOUNDER_ROLE,
  INVITATION_EXPIRY_DAYS,
  ROLE_PRESETS,
  type RolePreset,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { hashSecret } from '../../src/common/auth/secrets';
import { inviteLinkSecret } from '../../src/modules/invitation/invitation.message.service';
import {
  aCompany,
  aMembership,
  anInvite,
  aPerson,
  aPhone,
  type Company,
  type Fixture,
  type Invite,
  openPools,
  type Person,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { bootHttp, type Http } from '../support/http';

/**
 * The invited person's two answers tell someone (`M01.2` S1.wrong.1, S1.wrong.2): a decline is a
 * notice to each active EPC Owner of the inviting company, and the one-tap ask on a run-out link is
 * a notice to the person who sent it. Both routes are public and cross tenancy by nature, so the
 * proofs read the notification rows of every company in the run: a notice reaches only its own.
 */

const [WORKING_PRESET] = ROLE_PRESETS.filter((preset) => preset !== FOUNDER_ROLE) as [RolePreset];
const DAY = 86_400_000;
const RAN_OUT = Date.now() - (INVITATION_EXPIRY_DAYS + 1) * DAY;

const here = aCompany('Inviting Solar');
const elsewhere = aCompany('Neighbour Solar');
const owner = aPerson('Rajesh Kulkarni');
const hindiOwner = aPerson('Sunita Patil');
const leftOwner = aPerson('Anil Deshmukh');
const worker = aPerson('Priya Joshi');
const otherOwner = aPerson('Suresh Iyer');
const demoted = aPerson('Vikram Rao');

/** An invite whose link the test holds, minted as the text's is: the store keeps only its hash. */
const withLink = (invite: Invite) => {
  const token = inviteLinkSecret(invite.invitationId);
  return { invite: { ...invite, tokenHash: hashSecret(token) }, token };
};
const invitee = (name: string) => ({ name, phoneE164: aPhone() });

const toDecline = withLink(anInvite(here, owner, invitee('Meera Joshi'), [WORKING_PRESET]));
const runOut = withLink(
  anInvite(here, hindiOwner, invitee('Asha Rao'), [WORKING_PRESET], { sentAt: RAN_OUT }),
);
const live = withLink(anInvite(here, owner, invitee('Kiran Shah'), [WORKING_PRESET]));
const runOutByLeaver = withLink(
  anInvite(here, leftOwner, invitee('Neha Gupta'), [WORKING_PRESET], { sentAt: RAN_OUT }),
);
/** Sent while its sender was an owner, who has since been moved to another preset. */
const runOutByDemoted = withLink(
  anInvite(here, demoted, invitee('Ravi Menon'), [WORKING_PRESET], { sentAt: RAN_OUT }),
);

const fixture: Fixture = {
  companies: [here, elsewhere],
  people: [owner, hindiOwner, leftOwner, worker, otherOwner, demoted],
  memberships: [
    aMembership(here, owner, [FOUNDER_ROLE]),
    aMembership(here, hindiOwner, [FOUNDER_ROLE]),
    aMembership(here, leftOwner, [FOUNDER_ROLE]),
    aMembership(here, worker, [WORKING_PRESET]),
    aMembership(here, demoted, [WORKING_PRESET]),
    aMembership(elsewhere, otherOwner, [FOUNDER_ROLE]),
  ],
  invites: [
    toDecline.invite,
    runOut.invite,
    live.invite,
    runOutByLeaver.invite,
    runOutByDemoted.invite,
  ],
};

const skip = skipWithoutDatabase(
  'INVITE ANSWER NOTICES PROOF',
  'The decline and re-invite notices are UNPROVEN in this run.',
);

describe.skipIf(skip)('the invited person’s answers, over HTTP against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;

  const answer = (token: string, act: 'decline' | 'request-reinvite') =>
    http.call('POST', `/invitations/landing/${token}/${act}`, {});

  const noticesAbout = (invite: Invite) =>
    pools.admin.db
      .select({
        tenantId: notification.tenantId,
        recipient: notification.recipientUserRef,
        type: notification.type,
        subjectKind: notification.subjectKind,
        title: notification.title,
        body: notification.body,
        language: notification.language,
      })
      .from(notification)
      .where(
        and(
          eq(notification.subjectRef, invite.invitationId),
          inArray(notification.tenantId, companiesOf(fixture.companies)),
        ),
      );

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
    await pools.admin.db
      .update(userAccount)
      .set({ interfaceLanguage: 'hi' })
      .where(eq(userAccount.id, hindiOwner.userId));
    await deactivate(leftOwner, here);
    http = await bootHttp();
  });

  afterAll(async () => {
    await http.close();
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('a decline tells each active EPC Owner of the inviting company once, in their own language, and no other company', async () => {
    expect((await answer(toDecline.token, 'decline')).status).toBe(HttpStatus.NO_CONTENT);

    const notices = await noticesAbout(toDecline.invite);
    expect(notices.map((n) => n.recipient).sort()).toEqual(
      [owner.userId, hindiOwner.userId].sort(),
    );
    for (const notice of notices) {
      expect(notice).toMatchObject({
        tenantId: here.tenantId,
        type: 'invite_declined',
        subjectKind: 'invitation',
      });
      expect(`${notice.title} ${notice.body}`).toContain('Meera Joshi');
    }
    const byRecipient = new Map(notices.map((n) => [n.recipient, n]));
    expect(byRecipient.get(owner.userId)?.language).toBe('en');
    expect(byRecipient.get(hindiOwner.userId)?.language).toBe('hi');
    expect(byRecipient.get(hindiOwner.userId)?.title).toBe('Meera Joshi ने आमंत्रण अस्वीकार किया');
    expect(byRecipient.get(owner.userId)?.title).toBe('Meera Joshi declined the invite');
  });

  it('a second decline is the retry and tells nobody again', async () => {
    expect((await answer(toDecline.token, 'decline')).status).toBe(HttpStatus.NO_CONTENT);
    expect(await noticesAbout(toDecline.invite)).toHaveLength(2);
  });

  it('the ask on a run-out link tells the person who sent it, once', async () => {
    expect((await answer(runOut.token, 'request-reinvite')).status).toBe(HttpStatus.NO_CONTENT);
    expect((await answer(runOut.token, 'request-reinvite')).status).toBe(HttpStatus.NO_CONTENT);

    const notices = await noticesAbout(runOut.invite);
    expect(notices).toHaveLength(1);
    expect(notices[0]).toMatchObject({
      tenantId: here.tenantId,
      recipient: hindiOwner.userId,
      type: 'reinvite_requested',
      subjectKind: 'invitation',
      language: 'hi',
    });
  });

  it('the ask on a link whose sender has left tells the active EPC Owners instead', async () => {
    expect((await answer(runOutByLeaver.token, 'request-reinvite')).status).toBe(
      HttpStatus.NO_CONTENT,
    );
    const notices = await noticesAbout(runOutByLeaver.invite);
    expect(notices.map((n) => n.recipient).sort()).toEqual(
      [owner.userId, hindiOwner.userId].sort(),
    );
  });

  it('the ask on a link whose sender is no longer an owner tells the active EPC Owners instead', async () => {
    expect((await answer(runOutByDemoted.token, 'request-reinvite')).status).toBe(
      HttpStatus.NO_CONTENT,
    );
    const notices = await noticesAbout(runOutByDemoted.invite);
    expect(notices.map((n) => n.recipient).sort()).toEqual(
      [owner.userId, hindiOwner.userId].sort(),
    );
  });

  it('the ask on a live link is refused with 409 and tells nobody', async () => {
    expect((await answer(live.token, 'request-reinvite')).status).toBe(HttpStatus.CONFLICT);
    expect(await noticesAbout(live.invite)).toHaveLength(0);
  });

  async function deactivate(person: Person, of: Company) {
    await pools.admin.db
      .update(tenantMembership)
      .set({ status: 'deactivated' })
      .where(
        and(
          eq(tenantMembership.userAccountId, person.userId),
          eq(tenantMembership.tenantId, of.tenantId),
        ),
      );
  }
});

function companiesOf(companies: readonly Company[]): string[] {
  return companies.map((company) => company.tenantId);
}
