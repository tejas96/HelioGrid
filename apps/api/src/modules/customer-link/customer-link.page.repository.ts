import {
  callbackRequest,
  customerQuestion,
  type DbTransaction,
  linkEvent,
  type TenantPool,
  task,
} from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { CustomerProjectsRegistry } from './customer-link.projects.repository';
import type { PresentedToken } from './customer-link.token.admin.repository';
import { type LinkVisit, visitOf } from './customer-link.visit.repository';

/** What the page shows beside its phase: the link's own questions, its open call, the answer's words. */
export interface PageRead {
  readonly visit: LinkVisit;
  readonly questions: readonly {
    readonly id: string;
    readonly text: string;
    readonly askedAt: Date;
  }[];
  readonly callRequest: { readonly requestedAt: Date; readonly dueAt: Date } | null;
  /** The customer's own words on the served version's change request or decline, as written. */
  readonly answerWords: string | null;
}

/**
 * The customer's page, read (`F5-19`, `F5-52`): one transaction of the link's company. It reads
 * this link's questions and call request and no other link's label, contact or history (`F5-30`).
 */
@Injectable()
export class CustomerLinkPageRepository {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TENANT_DB) private readonly db: TenantPool,
    @Inject(CustomerProjectsRegistry) private readonly projects: CustomerProjectsRegistry,
  ) {}

  read(token: PresentedToken, now: number): Promise<PageRead | null> {
    const { tenantId, linkId } = token;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const visit = await visitOf(tx, token, this.projects, now);
      if (visit === null) return null;
      if (visit.serving.kind !== 'serves') {
        return { visit, questions: [], callRequest: null, answerWords: null };
      }
      const questions = await tx
        .select({
          id: customerQuestion.id,
          text: customerQuestion.questionText,
          askedAt: customerQuestion.askedAt,
        })
        .from(customerQuestion)
        .where(and(eq(customerQuestion.tenantId, tenantId), eq(customerQuestion.linkId, linkId)))
        .orderBy(asc(customerQuestion.askedAt), asc(customerQuestion.id));
      const [callRequest] = await tx
        .select({ requestedAt: callbackRequest.requestedAt, dueAt: callbackRequest.dueAt })
        .from(callbackRequest)
        .innerJoin(
          task,
          and(eq(task.tenantId, callbackRequest.tenantId), eq(task.id, callbackRequest.taskId)),
        )
        .where(
          and(
            eq(callbackRequest.tenantId, tenantId),
            eq(callbackRequest.linkId, linkId),
            eq(task.status, 'open'),
          ),
        )
        .orderBy(desc(callbackRequest.requestedAt))
        .limit(1);
      return {
        visit,
        questions,
        callRequest: callRequest ?? null,
        answerWords: await this.answerWords(tx, visit),
      };
    });
  }

  /**
   * The words written with the answer on the served version — on THIS link only: another
   * contact's words are their own history, never shown on someone else's page (`F5-30`).
   */
  private async answerWords(tx: DbTransaction, visit: LinkVisit): Promise<string | null> {
    const { served } = visit;
    if (served === null || served.answer === null || served.sharedAt === null) return null;
    const [answer] = await tx
      .select({ words: linkEvent.words })
      .from(linkEvent)
      .where(
        and(
          eq(linkEvent.tenantId, visit.tenantId),
          eq(linkEvent.linkId, visit.linkId),
          inArray(linkEvent.eventType, ['negotiate_requested', 'declined']),
          eq(linkEvent.proposalVersion, served.version),
          gte(linkEvent.occurredAt, served.sharedAt),
        ),
      )
      .orderBy(desc(linkEvent.occurredAt))
      .limit(1);
    return answer?.words ?? null;
  }
}
