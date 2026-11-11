import {
  FILE_SUBJECT_KINDS,
  FILE_SUBJECT_RULES,
  type FileSubjectKind,
  type FileSubjectRule,
  type SubjectKind,
} from '@heliogrid/domain';
import type { Act } from '../../../common/auth/session-context';

/** A stored row's kind was a file kind when it was declared; anything else is a broken table. */
export function ruleOf(kind: SubjectKind): FileSubjectRule {
  if (!isFileSubjectKind(kind))
    throw new Error(`a file is stored against ${kind}, which owns none`);
  return FILE_SUBJECT_RULES[kind];
}

export function isFileSubjectKind(kind: SubjectKind): kind is FileSubjectKind {
  return (FILE_SUBJECT_KINDS as readonly SubjectKind[]).includes(kind);
}

/** A `self` kind's subject is the person asking; the wire takes a uuid in either case. */
export function isTheCaller(subjectRef: string, act: Pick<Act, 'actorUserId'>): boolean {
  return subjectRef.toLowerCase() === act.actorUserId.toLowerCase();
}
