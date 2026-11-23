import {
  type AddCadPlan,
  type AddDesignPicture,
  type CreateHeaders,
  DESIGN_PICTURE_FILE_REFUSED,
  type DesignPictureFacts,
  type DesignPictureWire,
  designPictureFactsSchema,
  type FileContentType,
  studioContract,
} from '@heliogrid/contracts';
import type {
  CadPlanRead,
  DesignPlanReadResult,
  DesignPlanSource,
  DesignPlanStepInput,
} from '@heliogrid/contracts/workflows';
import {
  CAD_PLAN_CONTENT_TYPES,
  can,
  type DesignPictureFileRole,
  leadScopeOf,
  METRES_PER_PLAN_UNIT,
} from '@heliogrid/domain';
import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException } from '../../common/errors/contract-exception';
import { OutboxDispatcher } from '../../common/temporal/outbox.dispatcher';
import { type LeadReader, memberRefOf } from '../crm/crm.public';
import { FileDocumentService, FileService, FileSubjectRegistry } from '../file/file.public';
import { refusedAct } from './internal/design-wire';
import {
  type NewPicture,
  type PictureFileRow,
  type PictureRow,
  StudioPictureRepository,
} from './studio.picture.repository';
import { StudioPictureReadRepository } from './studio.picture-read.repository';

const DESIGN = 'studio.create_edit_designs' as const;

/** A picture to keep: read on the device (`addPicture`), or a CAD plan our server reads (`addCadPlan`). */
export type PictureToKeep =
  | ({ readonly read: 'device' } & AddDesignPicture)
  | ({ readonly read: 'server' } & AddCadPlan);

/**
 * The types each part of a picture is stored as: a piece is a JPEG, or — with see-through edges, a
 * drone map's — a WebP, or a PNG where the device writes no WebP; lines are JSON.
 */
const PART_TYPES: Readonly<Record<DesignPictureFileRole, readonly FileContentType[]>> = {
  piece: ['image/jpeg', 'image/webp', 'image/png'],
  lines: ['application/json'],
};

function fileRefused(why: string): ContractException {
  return new ContractException(DESIGN_PICTURE_FILE_REFUSED, why, HttpStatus.UNPROCESSABLE_ENTITY);
}

/**
 * A design's pictures of its own (`T-M05-002d`): kept by whoever may change designs, read by
 * whoever may read the design's lead, and never changed once kept. A CAD plan is read by our
 * server in a workflow (`designPlanRead`), whose api steps are here too. Who may store and read a
 * design's files is this module's answer to the files module (`design`).
 */
@Injectable()
export class StudioPictureService implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(StudioPictureRepository) private readonly pictures: StudioPictureRepository,
    @Inject(StudioPictureReadRepository) private readonly reads: StudioPictureReadRepository,
    @Inject(FileService) private readonly files: FileService,
    @Inject(FileDocumentService) private readonly documents: FileDocumentService,
    @Inject(FileSubjectRegistry) private readonly registry: FileSubjectRegistry,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
    @Inject(OutboxDispatcher) private readonly dispatcher: OutboxDispatcher,
  ) {}

  onModuleInit(): void {
    this.registry.register('design', async (tenantId, designId, person, act) => {
      if (act === 'upload' && !can(person.roles, DESIGN)) return false;
      const scope = leadScopeOf(person.roles);
      return this.pictures.designInScope(tenantId, designId, { userId: person.userId, scope });
    });
  }

  /**
   * Keeps a picture with the design. Every file it names must be stored against this design,
   * confirmed, and of the type its part takes; another company's design, or one out of the reader's
   * reach, is not found before any file is looked at.
   */
  async add(
    reader: LeadReader,
    designId: string,
    body: PictureToKeep,
    headers: CreateHeaders,
    act: Act,
  ): Promise<DesignPictureWire> {
    const scope = { userId: reader.actorId, scope: reader.scope };
    if (!(await this.pictures.designInScope(reader.tenantId, designId, scope))) {
      throw new NotFoundException('No such design.');
    }
    const picture = await this.checked(reader.tenantId, designId, body);
    const route = body.read === 'device' ? studioContract.addPicture : studioContract.addCadPlan;
    const key = creationKeyOf(headers, act.actorUserId, route, { designId, ...body });
    const outcome = await this.pictures.add(reader, designId, picture, key, act);
    if (outcome.outcome === 'not-found') throw new NotFoundException('No such design.');
    if (outcome.outcome === 'refused') throw refusedAct(outcome.refusal);
    const made = this.replies.rowOf(outcome, route, reader.tenantId);
    if (made.eventId !== null) await this.dispatcher.dispatchNow(made.eventId);
    return this.picture(reader, designId, made.pictureId, act.now);
  }

  /** One picture of the design, with short-lived links to its parts. */
  async picture(
    reader: LeadReader,
    designId: string,
    pictureId: string,
    now: number,
  ): Promise<DesignPictureWire> {
    const row = await this.pictures.find(reader, designId, pictureId);
    if (row === null) throw new NotFoundException('No such picture.');
    return this.wireOf(reader.tenantId, row, now);
  }

  /** Where our server reads the plan from and PUTs its lines; `null` when its read has ended. */
  async planSource(input: DesignPlanStepInput): Promise<DesignPlanSource> {
    const toRead = await this.reads.planToRead(input.tenantId, input.pictureId);
    if (toRead === null) return null;
    const source = await this.files.confirmed(input.tenantId, toRead.sourceFileId, 'design');
    const contentType = CAD_PLAN_CONTENT_TYPES.find((type) => type === source.contentType);
    const link = await this.documents.signedDownload(input.tenantId, source.id, Date.now());
    if (contentType === undefined || link === null) return null;
    const put = await this.documents.putAddress(this.linesOf(input), 'application/json');
    return { sourceUrl: link.url, contentType, put };
  }

  /** Keeps what the reader made: the lines checked against the store, or the reason it could not. */
  async keepPlan(
    input: DesignPlanStepInput & { readonly read: CadPlanRead },
  ): Promise<DesignPlanReadResult> {
    const { read } = input;
    if (read.kind === 'refused') return this.endRead(input, read.refusal);
    const linesFileId = await this.documents.keepPut({
      ...this.linesOf(input),
      contentType: 'application/json',
      byteSize: read.byteSize,
      checksumSha256: read.checksumSha256,
      now: Date.now(),
    });
    if (linesFileId === null) return this.endRead(input, 'broken');
    const facts: DesignPictureFacts = {
      takenOn: null,
      metresPerUnit: read.unit === null ? null : METRES_PER_PLAN_UNIT[read.unit],
      turnDeg: null,
      centre: null,
      unit: read.unit,
      unitGuess: read.unitGuess,
      pages: 1,
      pickedPage: 1,
    };
    const state = await this.reads.endRead(input.tenantId, input.pictureId, {
      state: 'ready',
      facts,
      linesFileId,
    });
    return { state: state ?? 'refused' };
  }

  /** Ends a read as refused; a read that already ended keeps its answer. */
  async endRead(
    input: DesignPlanStepInput,
    refusal: 'broken' | 'no_lines' = 'broken',
  ): Promise<DesignPlanReadResult> {
    const state = await this.reads.endRead(input.tenantId, input.pictureId, {
      state: 'refused',
      refusal,
    });
    return { state: state ?? 'refused' };
  }

  private linesOf(input: DesignPlanStepInput) {
    return {
      tenantId: input.tenantId,
      subjectKind: 'design_picture' as const,
      subjectRef: input.pictureId,
    };
  }

  /** The picture to keep, once every file it names is this design's and of its part's type. */
  private async checked(
    tenantId: string,
    designId: string,
    body: PictureToKeep,
  ): Promise<NewPicture> {
    if (body.read === 'server') {
      const source = await this.designFile(tenantId, designId, body.fileId);
      if (!(CAD_PLAN_CONTENT_TYPES as readonly string[]).includes(source.contentType)) {
        throw fileRefused('Our server reads a DWG or a binary DXF alone.');
      }
      return { read: 'server', name: body.name, sourceFileId: body.fileId };
    }
    const wanted: DesignPictureFileRole = body.kind === 'plan' ? 'lines' : 'piece';
    const ids = new Set(body.files.map((part) => part.fileId));
    if (ids.size !== body.files.length) throw fileRefused('A file is named twice.');
    const files: PictureFileRow[] = [];
    for (const part of body.files) {
      if (part.role !== wanted) throw fileRefused(`A ${body.kind} keeps ${wanted} alone.`);
      if (part.page > body.facts.pages) throw fileRefused('A part is on a page past the last.');
      const stored = await this.designFile(tenantId, designId, part.fileId);
      if (!(PART_TYPES[part.role] as readonly string[]).includes(stored.contentType)) {
        throw fileRefused(`A part's file is not ${PART_TYPES[part.role].join(' or ')}.`);
      }
      files.push(part);
    }
    return { read: 'device', kind: body.kind, name: body.name, facts: body.facts, files };
  }

  /** A confirmed file stored against this design; any other is refused, never looked into. */
  private async designFile(tenantId: string, designId: string, fileId: string) {
    const stored = await this.files.confirmed(tenantId, fileId, 'design').catch(() => null);
    if (stored === null || stored.subjectRef !== designId) {
      throw fileRefused('A file is not stored against this design, or not yet confirmed.');
    }
    return stored;
  }

  private async wireOf(tenantId: string, row: PictureRow, now: number): Promise<DesignPictureWire> {
    const facts = row.facts === null ? null : designPictureFactsSchema.parse(row.facts);
    const files = [];
    // A picture still reading, or refused, shows none of its parts.
    if (row.state === 'ready') {
      for (const part of row.files) {
        const link = await this.documents.signedDownload(tenantId, part.fileId, now);
        if (link === null) throw new Error(`picture ${row.id} names a file the company lacks`);
        files.push({ page: part.page, role: part.role, box: part.box, ...link });
      }
    }
    return {
      id: row.id,
      kind: row.kind,
      name: row.name,
      state: row.state,
      refusal: row.refusal,
      facts,
      files,
      addedAt: row.addedAt.toISOString(),
      addedBy: memberRefOf(row.addedBy, row.addedByName),
    };
  }
}
