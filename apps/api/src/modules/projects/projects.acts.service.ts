import { PROJECT_ACT_REFUSED, type ProjectDetail, projectActsContract } from '@heliogrid/contracts';
import { type Capability, can, type FormatPack, packLabel, stageLabel } from '@heliogrid/domain';
import { projectMovedNotice } from '@heliogrid/i18n';
import {
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { refusalWithFacts } from '../../common/errors/contract-exception';
import { OutboxDispatcher } from '../../common/temporal/outbox.dispatcher';
import {
  NotificationPushService,
  renderedInEveryLanguageWith,
} from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import type { ProjectReader } from './internal/reader';
import type { ActContext, ProjectStep } from './projects.act-kit.repository';
import { ProjectsActsRepository } from './projects.acts.repository';
import type { MoveNotice } from './projects.moves.repository';
import { ProjectsPaymentWordsService } from './projects.payment-words.service';

export type { ProjectStep } from './projects.act-kit.repository';

/**
 * The project acts (`M08-14`…`M08-46`, rulings 2026-11-10): each built with its context — who, when,
 * the company's pack and the manager's notice in every language — run on the locked project, and
 * answered with the project as it now stands, or refused with domain's reason (`F4-16`). A notice
 * pushes only after its write commits.
 */
@Injectable()
export class ProjectsActsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProjectsActsRepository) private readonly acts: ProjectsActsRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(NotificationPushService) private readonly push: NotificationPushService,
    @Inject(OutboxDispatcher) private readonly dispatcher: OutboxDispatcher,
    @Inject(ProjectsPaymentWordsService) private readonly paymentWords: ProjectsPaymentWordsService,
  ) {}

  /**
   * Runs one act. `needs` is the capability the act itself takes where its route admits more than
   * one kind of act (a file is a document or a step's photo).
   */
  async run(
    reader: ProjectReader,
    projectId: string,
    capturedAt: string,
    act: Act,
    actorName: string,
    step: ProjectStep,
    needs?: Capability,
  ): Promise<ProjectDetail> {
    if (needs !== undefined && !can(reader.roles, needs)) {
      throw new ForbiddenException('This act is not yours to do.');
    }
    const formats = (await this.settings.packOf(reader.tenantId)).formats;
    const context: ActContext = {
      reader,
      act,
      capturedAt: new Date(capturedAt),
      formats,
      notice: await this.noticeOf(reader.tenantId, formats),
      mover: { kind: 'person', userId: reader.actorId, name: actorName },
    };
    const outcome = await this.acts.act(context, projectId, step(context));
    if (outcome.outcome === 'not-found') throw new NotFoundException('No such project.');
    if (outcome.outcome === 'refused') {
      throw refusalWithFacts(
        projectActsContract.move.responses[422],
        HttpStatus.UNPROCESSABLE_ENTITY,
        {
          code: PROJECT_ACT_REFUSED,
          message: 'The project cannot take that act where it stands.',
          facts: { refusal: outcome.refusal },
        },
      );
    }
    await this.push.deliverAfterCommit(reader.tenantId, outcome.notified, new Date(act.now));
    for (const eventId of outcome.started) await this.dispatcher.dispatchNow(eventId);
    return outcome.detail;
  }

  /** The manager's notice: the stage and the proof's row in the pack's words for each language. */
  private async noticeOf(tenantId: string, formats: FormatPack): Promise<MoveNotice> {
    return {
      wordsFor: (name, stage, why) =>
        renderedInEveryLanguageWith((translate, language) => {
          const label = stageLabel(formats.vocabulary, stage);
          const rowLabel = (row: string) => {
            const declared = formats.documentChecklist.find((one) => one.row === row)?.label;
            return declared === undefined ? row : packLabel(declared, language);
          };
          return projectMovedNotice(translate, {
            name,
            stage: label === null ? stage : packLabel(label, language),
            why:
              why.by === 'proof' && typeof why.proof === 'object'
                ? { by: 'proof', proof: { row: rowLabel(why.proof.row) } }
                : why,
          });
        }),
      quietHours: await this.settings.quietHoursOf(tenantId),
      payments: await this.paymentWords.wordsOf(tenantId),
    };
  }
}
