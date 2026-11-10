import {
  type CreateHeaders,
  type CreateTask,
  type Task,
  type TaskAct,
  tasksContract,
} from '@heliogrid/contracts';
import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException } from '../../common/errors/contract-exception';
import { CrmTasksRepository, type TaskActOutcome } from './crm.tasks.repository';
import type { LeadReader } from './internal/reader';

/**
 * Follow-up tasks (`M07-05`, RFC decision 8): added on a lead for its owner or a named person, and
 * done or reopened by whoever holds them. Overdue is the screen's to derive from `dueAt`.
 */
@Injectable()
export class CrmTasksService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmTasksRepository) private readonly tasks: CrmTasksRepository,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  async create(
    reader: LeadReader,
    leadId: string,
    body: CreateTask,
    headers: CreateHeaders,
    act: Act,
  ): Promise<Task> {
    const route = tasksContract.create;
    const key = creationKeyOf(headers, act.actorUserId, route, { leadId, ...body });
    const input = {
      kind: body.kind,
      dueAt: new Date(body.dueAt),
      title: body.title ?? null,
      assigneeId: body.assigneeId ?? null,
    };
    const outcome = await this.tasks.create(reader, leadId, input, act, key);
    if (outcome.outcome === 'not-found') throw new NotFoundException('No such lead.');
    if (outcome.outcome === 'assignee-unavailable') {
      throw new ContractException(
        'ASSIGNEE_UNAVAILABLE',
        'That person is not an active member of your company.',
        HttpStatus.UNPROCESSABLE_ENTITY,
        [{ path: 'assigneeId', issue: 'an active member of the company' }],
      );
    }
    if (outcome.outcome === 'not-diallable') {
      throw new ContractException(
        'NUMBER_NOT_DIALLABLE',
        'This number is marked wrong or do-not-call, so no call can be set.',
        HttpStatus.UNPROCESSABLE_ENTITY,
        [{ path: 'kind', issue: 'a number someone may dial (M02-44)' }],
      );
    }
    return this.replies.rowOf(outcome, route, reader.tenantId);
  }

  async done(reader: LeadReader, taskId: string, body: TaskAct, act: Act): Promise<Task> {
    return taskOf(await this.tasks.done(reader, taskId, new Date(body.capturedAt), act));
  }

  async reopen(reader: LeadReader, taskId: string): Promise<Task> {
    return taskOf(await this.tasks.reopen(reader, taskId));
  }
}

function taskOf(outcome: TaskActOutcome): Task {
  if (outcome.outcome === 'not-found') throw new NotFoundException('No such task.');
  if (outcome.outcome === 'cancelled') {
    throw new ConflictException('A cancelled task is history and cannot change.');
  }
  return outcome.task;
}
