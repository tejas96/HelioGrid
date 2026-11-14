import type { CustomerPage, FileDownload } from '@heliogrid/contracts';
import type { DbTransaction } from '@heliogrid/db';
import type { ProjectStage, UiLanguage } from '@heliogrid/domain';
import { Injectable } from '@nestjs/common';

/** What a link reads of the project its lead became, to know its phase and whom to name. */
export interface ProjectPhaseFacts {
  readonly projectId: string;
  readonly stage: ProjectStage;
  readonly cancelledAt: Date | null;
  readonly handedOverAt: Date | null;
  readonly managerId: string;
}

/** The progress page's facts, and the solar file's, as the wire declares them. */
export type LinkProgress = NonNullable<CustomerPage['progress']>;
export type LinkHandover = NonNullable<CustomerPage['handover']>;

/**
 * What the customer's link asks of the projects module once a deal is won (`F5-19`, `F5-61`,
 * `F5-70`): the phase facts, the progress page, the solar file, and one of its files — each the
 * project's own published facts, never an internal note (`F5-64`).
 */
export interface CustomerProjects {
  phaseFactsOf(
    tx: DbTransaction,
    tenantId: string,
    leadId: string,
  ): Promise<ProjectPhaseFacts | null>;
  /** In `language` — the page's own (`F5-08`). */
  progressOf(tenantId: string, leadId: string, language: UiLanguage): Promise<LinkProgress | null>;
  solarFileOf(tenantId: string, leadId: string): Promise<LinkHandover | null>;
  /** Only a file the customer's page lists; `null` for any other. */
  customerFile(tenantId: string, leadId: string, fileId: string): Promise<FileDownload | null>;
}

/**
 * Who answers for a won deal (`T-F5-002`, `T-F5-003`): the projects module's customer service,
 * which registers itself here when it starts, so this module imports nothing of projects — the
 * project reads a link's acceptance proof, and the link reads a project's progress. Until one is
 * bound a link knows no project: every lead reads as still in its proposal phase.
 */
@Injectable()
export class CustomerProjectsRegistry {
  private projects: CustomerProjects | null = null;

  register(projects: CustomerProjects): void {
    this.projects = projects;
  }

  async phaseFactsOf(
    tx: DbTransaction,
    tenantId: string,
    leadId: string,
  ): Promise<ProjectPhaseFacts | null> {
    return (await this.projects?.phaseFactsOf(tx, tenantId, leadId)) ?? null;
  }

  async progressOf(
    tenantId: string,
    leadId: string,
    language: UiLanguage,
  ): Promise<LinkProgress | null> {
    return (await this.projects?.progressOf(tenantId, leadId, language)) ?? null;
  }

  async solarFileOf(tenantId: string, leadId: string): Promise<LinkHandover | null> {
    return (await this.projects?.solarFileOf(tenantId, leadId)) ?? null;
  }

  async customerFile(
    tenantId: string,
    leadId: string,
    fileId: string,
  ): Promise<FileDownload | null> {
    return (await this.projects?.customerFile(tenantId, leadId, fileId)) ?? null;
  }
}
