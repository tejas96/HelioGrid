import type { HandoverPackStepInput, HandoverPackStepResult } from '@heliogrid/contracts/workflows';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { FileDocumentService, FileService } from '../file/file.public';
import { SettingsService } from '../settings/settings.public';
import { packPdfOf } from './internal/pack-pdf';
import { ProjectsPackRepository } from './projects.pack.repository';

/**
 * The handover pack's one step (`handoverPackWorkflow`): read every file the pack holds, join them
 * into one PDF, keep it as the platform's document for the project and put it on the pack's row.
 * Safe to retry: a project whose pack is on its row is left as it is, and the kept document is
 * found again rather than stored twice.
 */
@Injectable()
export class ProjectsPackService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProjectsPackRepository) private readonly packs: ProjectsPackRepository,
    @Inject(FileService) private readonly files: FileService,
    @Inject(FileDocumentService) private readonly documents: FileDocumentService,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {}

  async make(input: HandoverPackStepInput, now: number): Promise<HandoverPackStepResult> {
    const { tenantId, projectId } = input;
    // A project no longer handed over — or gone with its company — ends the run: retrying a step
    // that cannot succeed would hold the queue for nothing.
    if (!(await this.packs.isHandedOver(tenantId, projectId))) return { attached: false };
    const formats = (await this.settings.packOf(tenantId)).formats;
    const packRow = formats.documentChecklist.find((row) => row.madeBy === 'handover')?.row;
    // A market whose checklist names no pack row hands over no pack file.
    if (packRow === undefined) return { attached: false };
    const order = formats.documentChecklist.map((row) => row.row);
    const parts = await this.packs.partsOf(tenantId, projectId, { order, packRow });
    if (parts.kind !== 'to-make') return { attached: false };
    const read = [];
    for (const part of parts.files) {
      read.push(await this.files.readStored(tenantId, part.fileId, 'project'));
    }
    const { bytes, leftOut } = await packPdfOf(read);
    if (leftOut > 0) {
      this.logger.warn(
        { projectId, leftOut },
        'the handover pack left out files it could not read',
      );
    }
    // Nothing to put in a pack, or no file that could be read: no pack, and the handover is told.
    if (bytes === null) {
      await this.packs.recordUnmade(tenantId, projectId, leftOut);
      return { attached: false };
    }
    const fileId = await this.documents.keep({
      tenantId,
      subjectKind: 'project',
      subjectRef: projectId,
      contentType: 'application/pdf',
      bytes,
      now,
    });
    const attached = await this.packs.attach(
      tenantId,
      projectId,
      {
        fileId,
        name: `${parts.number} handover pack.pdf`,
        by: parts.handedOverBy,
        row: packRow,
        leftOut,
      },
      new Date(now),
    );
    return { attached };
  }
}
