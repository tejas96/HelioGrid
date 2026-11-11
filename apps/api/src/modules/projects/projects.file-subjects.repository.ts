import { project, projectFile, type TenantPool } from '@heliogrid/db';
import { can, projectScopeOf, seesOnlyTheJob } from '@heliogrid/domain';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { and, eq, type SQL } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { FileSubjectRegistry, type SubjectPerson } from '../file/file.public';
import { projectScopeWhere } from './projects.scope.repository';

/**
 * A project's papers and photos (`M08-30`, `M08-42`, ruling 2026-11-10), and the lead's papers read
 * through the project won from it: whoever may see the project reads them; storing one also takes
 * the grant to work its documents or its install steps. Registered with the files module on start.
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
