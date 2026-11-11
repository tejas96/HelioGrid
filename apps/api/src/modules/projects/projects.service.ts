import type {
  closedProjectsQuerySchema,
  HandoverPreview,
  ProjectBoard,
  ProjectCard,
  ProjectDetail,
  ProjectJob,
} from '@heliogrid/contracts';
import {
  type FormatPack,
  packLabel,
  rowsWaitingForHandover,
  UI_LANGUAGES,
  type UiLanguage,
} from '@heliogrid/domain';
import { createTranslator, handoverMessage } from '@heliogrid/i18n';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { z } from 'zod';
import { SettingsService } from '../settings/settings.public';
import type { ProjectReader } from './internal/reader';
import { ProjectsBoardRepository } from './projects.board.repository';
import { ProjectsDetailReadRepository } from './projects.detail-read.repository';
import { ProjectsPeopleRepository } from './projects.people.repository';

/**
 * The projects' reads (`SCR-M08-01`…`SCR-M08-06`): the board, the closed list, one project, what
 * handover checks, the pickers' people and the installer's jobs. Every read is the reader's scope
 * of their company; a project outside it answers 404.
 */
@Injectable()
export class ProjectsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProjectsBoardRepository) private readonly board_: ProjectsBoardRepository,
    @Inject(ProjectsDetailReadRepository) private readonly detail_: ProjectsDetailReadRepository,
    @Inject(ProjectsPeopleRepository) private readonly people_: ProjectsPeopleRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  async board(reader: ProjectReader): Promise<ProjectBoard> {
    return this.board_.board(reader, await this.formatsOf(reader));
  }

  async closed(
    reader: ProjectReader,
    query: ClosedAsk,
  ): Promise<{ items: ProjectCard[]; totalCount: number; page: number; limit: number }> {
    const page = await this.board_.closed(
      reader,
      await this.formatsOf(reader),
      query.stage,
      { limit: query.limit, offset: (query.page - 1) * query.limit },
      query.since ?? null,
    );
    return { ...page, page: query.page, limit: query.limit };
  }

  async detail(reader: ProjectReader, projectId: string): Promise<ProjectDetail> {
    const detail = await this.detail_.detail(reader, projectId, await this.formatsOf(reader));
    if (detail === null) throw new NotFoundException('No such project.');
    return detail;
  }

  /**
   * What handover checks (`M08-32`) and the message it hands over, in the customer's own language
   * (`F3-06`) — the documents named by the pack's labels in that language.
   */
  async handoverPreview(reader: ProjectReader, projectId: string): Promise<HandoverPreview> {
    const formats = await this.formatsOf(reader);
    const detail = await this.detail_.detail(reader, projectId, formats);
    if (detail === null) throw new NotFoundException('No such project.');
    const company = await this.detail_.companyNameOf(reader.tenantId);
    const language = languageOf(detail.customer.preferredLanguage);
    const { t } = await createTranslator(language);
    const documents = detail.documents
      .filter((document) => document.state === 'done' && document.madeBy !== 'handover')
      .map((document) => {
        const label = formats.documentChecklist.find((row) => row.row === document.row)?.label;
        return label === undefined ? document.row : packLabel(label, language);
      })
      .join(', ');
    return {
      pendingRows: [
        ...rowsWaitingForHandover(
          detail.documents.map((document) => ({
            row: document.row,
            state:
              document.state === 'done'
                ? 'done'
                : document.state === 'not_needed'
                  ? 'not_needed'
                  : 'pending',
            madeBy: document.madeBy,
          })),
        ),
      ],
      pack: { files: packFilesOf(detail) },
      message: {
        language,
        text: handoverMessage(t, { customer: detail.customer.name, documents, company }),
      },
    };
  }

  people(reader: ProjectReader, role: 'manager' | 'crew') {
    return this.people_.people(reader.tenantId, role);
  }

  jobs(reader: ProjectReader): Promise<ProjectJob[]> {
    return this.people_.jobs(reader);
  }

  private async formatsOf(reader: ProjectReader): Promise<FormatPack> {
    return (await this.settings.packOf(reader.tenantId)).formats;
  }
}

/** The customer's own language where the platform speaks it, else the source language (`F3-06`). */
function languageOf(preferred: string | null): UiLanguage {
  return UI_LANGUAGES.find((language) => language === preferred) ?? 'en';
}

/** The files the pack holds: every done row's, and every other file switched on for the customer. */
function packFilesOf(detail: ProjectDetail): number {
  const rows = detail.documents
    .filter((document) => document.state === 'done' && document.madeBy !== 'handover')
    .reduce((sum, document) => sum + document.files.length, 0);
  return rows + detail.otherFiles.filter((other) => other.shownToCustomer).length;
}

/** The closed list's ask, as the contract parses it. */
type ClosedAsk = z.infer<typeof closedProjectsQuerySchema>;
