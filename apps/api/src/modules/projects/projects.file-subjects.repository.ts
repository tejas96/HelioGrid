import { file, project, projectFile, projectPayment, type TenantPool } from '@heliogrid/db';
import { can, moneyScopeOf, projectScopeOf, seesOnlyTheJob } from '@heliogrid/domain';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { and, eq, isNotNull, like, type SQL } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { FileSubjectRegistry, type SubjectPerson } from '../file/file.public';
import { projectScopeWhere } from './projects.scope.repository';

/**
 * A project's papers and photos (`M08-30`, `M08-42`, ruling 2026-11-10), and the lead's papers read
 * through the project won from it: whoever may see the project reads them; storing one also takes
 * the grant to work its documents or its install steps. A payment's receipt photo is the money's:
 * read by whoever may see the project's money, stored once by who may record payments
 * (`M11-37`, `M11-56`). Registered with the files module on start.
 */
@Injectable()
export class ProjectFileSubjects implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TENANT_DB) private readonly db: TenantPool,
    @Inject(FileSubjectRegistry) private readonly registry: FileSubjectRegistry,
  ) {}

  onModuleInit(): void {
    this.registry.register('project', async (tenantId, projectId, person, act, fileId) => {
      const works =
        can(person.roles, 'projects.project_documents') ||
        can(person.roles, 'projects.installation_checklist');
      if (act === 'upload' && !works) return false;
      if (!(await this.reaches(tenantId, eq(project.id, projectId), person))) return false;
      // The installer opens a step's photo, never a paper (`M08-43`).
      if (act === 'read' && seesOnlyTheJob(projectScopeOf(person.roles))) {
        return fileId !== null && this.isStepPhoto(tenantId, projectId, fileId);
      }
      return true;
    });
    this.registry.register('project_payment', async (tenantId, entryId, person, act) => {
      if (act === 'upload' && !can(person.roles, 'payments.record_payments')) return false;
      const entry = await this.paymentInMoneyReach(tenantId, entryId, person);
      if (entry === null) return false;
      // One photo per payment, and only on a payment: a reversal carries its reason, not a receipt.
      return act === 'read' || (entry.kind === 'payment' && !entry.hasPhoto);
    });
    this.registry.register('lead', async (tenantId, leadId, person, act) =>
      act === 'read' && !seesOnlyTheJob(projectScopeOf(person.roles))
        ? this.reaches(tenantId, eq(project.leadId, leadId), person)
        : false,
    );
  }

  /** Whether the file is a photo on one of the project's install steps. */
  private isStepPhoto(tenantId: string, projectId: string, fileId: string): Promise<boolean> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [found] = await tx
        .select({ id: projectFile.id })
        .from(projectFile)
        .where(
          and(
            eq(projectFile.tenantId, tenantId),
            eq(projectFile.projectId, projectId),
            eq(projectFile.fileId, fileId),
            eq(projectFile.slot, 'step'),
          ),
        );
      return found !== undefined;
    });
  }

  /** A payment on a project whose money the person may see, and whether its photo is stored. */
  private paymentInMoneyReach(
    tenantId: string,
    entryId: string,
    person: SubjectPerson,
  ): Promise<{ readonly kind: string; readonly hasPhoto: boolean } | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [found] = await tx
        .select({ kind: projectPayment.kind })
        .from(projectPayment)
        .innerJoin(
          project,
          and(eq(project.id, projectPayment.projectId), eq(project.tenantId, tenantId)),
        )
        .where(
          and(
            eq(projectPayment.tenantId, tenantId),
            eq(projectPayment.id, entryId),
            projectScopeWhere(moneyScopeOf(projectScopeOf(person.roles)), person.userId),
          ),
        );
      if (found === undefined) return null;
      const [photo] = await tx
        .select({ id: file.id })
        .from(file)
        .where(
          and(
            eq(file.tenantId, tenantId),
            eq(file.subjectKind, 'project_payment'),
            eq(file.subjectRef, entryId),
            like(file.contentType, 'image/%'),
            isNotNull(file.uploadedAt),
          ),
        )
        .limit(1);
      return { kind: found.kind, hasPhoto: photo !== undefined };
    });
  }

  /** Whether a project this clause picks is in the person's reach. */
  private reaches(tenantId: string, which: SQL, person: SubjectPerson): Promise<boolean> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [found] = await tx
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.tenantId, tenantId),
            which,
            projectScopeWhere(projectScopeOf(person.roles), person.userId),
          ),
        );
      return found !== undefined;
    });
  }
}
