import {
  DESIGN_EDIT_TURN_HELD,
  DESIGN_SAVED_FIRST,
  type DesignDocumentWire,
  designSaveConflictEnvelope,
  type EditTurnWire,
  type SaveDocument,
  type SavedDocument,
  studioDocumentSchema,
} from '@heliogrid/contracts';
import { EMPTY_STUDIO_DOCUMENT } from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { refusalWithFacts } from '../../common/errors/contract-exception';
import { type LeadReader, memberRefOf } from '../crm/crm.public';
import { refusedAct } from './internal/design-wire';
import {
  type DocumentEditor,
  type DocumentMember,
  StudioDocumentRepository,
} from './studio.document.repository';

const memberOf = (member: DocumentMember) => memberRefOf(member.userId, member.name);

/** Whose turn it is, as the reader sees it; a turn that ran out is no one's. */
function turnOf(editor: DocumentEditor | null, reader: LeadReader, now: number): EditTurnWire {
  if (editor === null || editor.until.getTime() <= now) return null;
  const member = memberOf(editor);
  return member === null ? null : { editor: member, mine: editor.userId === reader.actorId };
}

/**
 * The design document (`T-M05-002a`): read by whoever may read the design's lead, saved whole by
 * the one editor whose turn it is.
 */
@Injectable()
export class StudioDocumentService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(StudioDocumentRepository) private readonly documents: StudioDocumentRepository,
  ) {}

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
}
