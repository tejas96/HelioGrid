import {
  DESIGN_EDIT_TURN_HELD,
  DESIGN_SAVED_FIRST,
  type DesignDocumentWire,
  designSaveConflictEnvelope,
  type EditTurnWire,
  type SaveDocument,
  type SavedDocument,
  type SkyPictureWire,
  studioDocumentSchema,
} from '@heliogrid/contracts';
import { EMPTY_STUDIO_DOCUMENT } from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { Act } from '../../common/auth/session-context';
import { refusalWithFacts } from '../../common/errors/contract-exception';
import { type LeadReader, memberRefOf } from '../crm/crm.public';
import { refusedAct } from './internal/design-wire';
import {
  SKY_PICTURE_SOURCE,
  type SkyPictureSource,
  type SourcePiece,
} from './internal/sky-picture-source';
import {
  type DocumentEditor,
  type DocumentMember,
  StudioDocumentRepository,
} from './studio.document.repository';
import { StudioRepository } from './studio.repository';

const memberOf = (member: DocumentMember) => memberRefOf(member.userId, member.name);

/** A piece of picture as it travels: the image itself, and the ground it covers. */
const wirePiece = ({ bytes, mediaType, ...ground }: SourcePiece) => ({
  image: `data:${mediaType};base64,${bytes.toString('base64')}`,
  ...ground,
});

/**
 * The openings a person may fetch the sky picture for in a minute. Each fetch is billable at the
 * provider, so a reload loop is capped: past it the studio opens on its grid and says the picture
 * did not load.
 */
const PICTURES_PER_MINUTE = 12;
const MINUTE_MS = 60_000;

/** Whose turn it is, as the reader sees it; a turn that ran out is no one's. */
function turnOf(editor: DocumentEditor | null, reader: LeadReader, now: number): EditTurnWire {
  if (editor === null || editor.until.getTime() <= now) return null;
  const member = memberOf(editor);
  return member === null ? null : { editor: member, mine: editor.userId === reader.actorId };
}

/**
 * The design document (`T-M05-002a`): read by whoever may read the design's lead, saved whole by
 * the one editor whose turn it is, and the sky picture its studio opens on — fetched for each
 * opening and never stored.
 */
@Injectable()
export class StudioDocumentService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(StudioDocumentRepository) private readonly documents: StudioDocumentRepository,
    @Inject(StudioRepository) private readonly designs: StudioRepository,
    @Inject(SKY_PICTURE_SOURCE) private readonly pictures: SkyPictureSource,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StudioDocumentService.name);
  }

  /** When each person last fetched pictures, inside the last minute. Held in memory only. */
  private readonly fetched = new Map<string, number[]>();

  /** Whether the person may fetch one more picture now; counts the fetch when they may. */
  private mayFetch(userId: string, now: number): boolean {
    const recent = (this.fetched.get(userId) ?? []).filter((at) => now - at < MINUTE_MS);
    if (recent.length >= PICTURES_PER_MINUTE) {
      this.fetched.set(userId, recent);
      return false;
    }
    this.fetched.set(userId, [...recent, now]);
    return true;
  }

  async documentOf(reader: LeadReader, designId: string): Promise<DesignDocumentWire> {
    const row = await this.documents.documentOf(reader, designId);
    if (row === undefined) throw new NotFoundException('No such design.');
    if (row === null) {
      return {
        // The wire's lists are its own: the shared empty document's are never handed out.
        document: { ...EMPTY_STUDIO_DOCUMENT, roofs: [] },
        version: 0,
        savedAt: null,
        savedBy: null,
        editTurn: null,
      };
    }
    return {
      document: studioDocumentSchema.parse(row.body),
      version: row.version,
      savedAt: row.savedAt?.toISOString() ?? null,
      savedBy: row.savedBy === null ? null : memberOf(row.savedBy),
      editTurn: turnOf(row.editor, reader, Date.now()),
    };
  }

  async save(
    reader: LeadReader,
    designId: string,
    body: SaveDocument,
    act: Act,
  ): Promise<SavedDocument> {
    const outcome = await this.documents.save(reader, designId, body, act);
    switch (outcome.outcome) {
      case 'not-found':
        throw new NotFoundException('No such design.');
      case 'refused':
        throw refusedAct(outcome.refusal);
      case 'held': {
        const editor = memberOf(outcome.editor);
        if (editor === null) throw new Error('a held turn names no editor');
        throw refusalWithFacts(designSaveConflictEnvelope, HttpStatus.CONFLICT, {
          code: DESIGN_EDIT_TURN_HELD,
          message: 'Another person is editing this design.',
          facts: { editor },
        });
      }
      case 'saved-first':
        throw refusalWithFacts(designSaveConflictEnvelope, HttpStatus.CONFLICT, {
          code: DESIGN_SAVED_FIRST,
          message: 'Someone saved this design after you opened it.',
          facts: {
            version: outcome.version,
            savedAt: outcome.savedAt.toISOString(),
            savedBy: outcome.savedBy === null ? null : memberOf(outcome.savedBy),
            byThisOpening: outcome.byThisOpening,
          },
        });
      default:
        return { version: outcome.version, savedAt: outcome.savedAt.toISOString() };
    }
  }

  async takeTurn(reader: LeadReader, designId: string, act: Act): Promise<EditTurnWire> {
    const holder = await this.documents.takeTurn(reader, designId, act);
    if (holder === undefined) throw new NotFoundException('No such design.');
    if (holder === 'closed') throw refusedAct('host_closed');
    return turnOf(holder, reader, act.now);
  }

  async giveTurn(reader: LeadReader, designId: string, act: Act): Promise<void> {
    if (!(await this.documents.giveTurn(reader, designId, act))) {
      throw new NotFoundException('No such design.');
    }
  }

  /**
   * The sky picture of the design's site, asked of the provider now. A provider that does not
   * answer is a state the studio draws — it opens on its grid and says why — never an error page.
   */
  async skyPicture(reader: LeadReader, designId: string): Promise<SkyPictureWire> {
    const facts = await this.designs.factsOf(reader, designId);
    if (facts === null) throw new NotFoundException('No such design.');
    const pin = facts.site.pin;
    if (pin === null) return { kind: 'none', gap: 'not_covered' };
    if (!this.pictures.setUp) return { kind: 'none', gap: 'not_set_up' };
    if (!this.mayFetch(reader.actorId, Date.now())) {
      this.logger.warn({ designId }, 'the sky picture cap was reached for a person');
      return { kind: 'none', gap: 'not_answered' };
    }
    try {
      const picture = await this.pictures.pictureAt(pin);
      if (picture === null) return { kind: 'none', gap: 'not_covered' };
      return {
        kind: 'picture',
        source: picture.source,
        credit: picture.credit,
        metresPerPixel: picture.metresPerPixel,
        takenOn: picture.takenOn,
        pieces: picture.pieces.map(wirePiece),
        around: picture.around.map(wirePiece),
      };
    } catch (error) {
      // The message alone: a request to the provider can carry its key, which is never logged.
      const reason = error instanceof Error ? error.message : 'unknown';
      this.logger.warn({ reason }, 'the sky picture source did not answer');
      return { kind: 'none', gap: 'not_answered' };
    }
  }
}
