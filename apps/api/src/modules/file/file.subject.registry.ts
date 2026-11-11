import type { FileSubjectKind, RolePreset, SubjectAnswer, SubjectKind } from '@heliogrid/domain';
import { Injectable } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { isFileSubjectKind, isTheCaller, ruleOf } from './internal/subject-kind';

/** The person a `subject` kind's own module judges. */
export interface SubjectPerson {
  readonly userId: string;
  readonly roles: readonly RolePreset[];
}

/** One module's answer: may this person store or read a file against this record of theirs. */
export type SubjectJudge = (
  tenantId: string,
  subjectRef: string,
  person: SubjectPerson,
  act: 'upload' | 'read',
  /** The stored file a read is for; `null` for an upload, which has none yet. */
  fileId: string | null,
) => Promise<boolean>;

/**
 * Who answers for a `subject` kind's files (`M02-32`, `M08-30`, ruling 2026-11-10): the module that
 * owns the record registers its judge when it starts, so this module asks without importing it —
 * the CRM for a lead, projects for a project and for a lead read through the project won from it.
 * Any judge saying yes is a yes; a kind no module judges answers no.
 */
@Injectable()
export class FileSubjectRegistry {
  private readonly judges = new Map<FileSubjectKind, SubjectJudge[]>();

  register(kind: FileSubjectKind, judge: SubjectJudge): void {
    this.judges.set(kind, [...(this.judges.get(kind) ?? []), judge]);
  }

  async allows(
    tenantId: string,
    kind: FileSubjectKind,
    subjectRef: string,
    person: SubjectPerson,
    act: 'upload' | 'read',
    fileId: string | null,
  ): Promise<boolean> {
    for (const judge of this.judges.get(kind) ?? []) {
      if (await judge(tenantId, subjectRef, person, act, fileId)) return true;
    }
    return false;
  }

  /**
   * What the file rules need to know of the subject: whether it is the caller, and — for a kind its
   * own module judges — whether that module lets this person do the act on it.
   */
  async answerFor(
    tenantId: string,
    roles: readonly RolePreset[],
    kind: SubjectKind,
    subjectRef: string,
    who: Pick<Act, 'actorUserId'>,
    act: 'upload' | 'read',
    fileId: string | null,
  ): Promise<SubjectAnswer> {
    const isCaller = isTheCaller(subjectRef, who);
    if (!isFileSubjectKind(kind)) return { isCaller, allows: false };
    const rule = ruleOf(kind);
    const judged = act === 'upload' ? rule.upload === 'subject' : rule.read === 'subject';
    const person = { userId: who.actorUserId, roles };
    return {
      isCaller,
      allows: judged && (await this.allows(tenantId, kind, subjectRef, person, act, fileId)),
    };
  }
}
