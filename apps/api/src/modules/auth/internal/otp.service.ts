import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { MESSAGE_DELIVERY, type MessageDelivery, type OtpChallenge } from '@heliogrid/contracts';
import {
  OTP_LENGTH,
  type OtpChannel,
  type OtpHistory,
  type OtpRequestDecision,
  otpHistorySince,
  otpLockedUntil,
  otpRequestDecision,
  otpVerifyDecision,
  platformMessage,
  type UiLanguage,
} from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ContractException } from '../../../common/errors/contract-exception';
import { ENV } from '../../../config/env';
import { MarketPackService } from '../../market/market.public';
import { type ChallengeRow, OtpAdminRepository } from './otp.admin.repository';

const DECIMAL_DIGITS = 10;

/**
 * The code half of the front door (`M01-03`, `M01-04`, `M01-05`): a code is sent through the
 * market's template and the delivery port, verified once, and every refusal is the named state
 * the screen renders. The caps, the lock and the outcome of an attempt are domain decisions.
 */
@Injectable()
export class OtpService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(OtpAdminRepository) private readonly codes: OtpAdminRepository,
    @Inject(MESSAGE_DELIVERY) private readonly delivery: MessageDelivery,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
  ) {}

  async request(
    phoneE164: string,
    channel: OtpChannel,
    language: UiLanguage,
    now: number,
  ): Promise<OtpChallenge> {
    const decision = otpRequestDecision(await this.history(phoneE164, now), now);
    if (decision.kind !== 'allowed') throw refusedRequest(decision);
    const pack = await this.markets.deliverablePack(phoneE164);
    const code = randomCode();
    const challengeId = await this.codes.createChallenge({
      phoneE164,
      codeHash: hashCode(phoneE164, code),
      channel,
      issuedAt: now,
    });
    try {
      await this.delivery.send({
        phoneE164,
        channel,
        message: platformMessage(pack.callingRules, 'sign_in_code', language, { code }),
      });
    } catch {
      await this.codes.markDeliveryFailed(challengeId, now);
      throw new ContractException(
        'OTP_DELIVERY_FAILED',
        'The code could not be sent. Try again in a moment.',
        HttpStatus.BAD_GATEWAY,
      );
    }
    return { challengeId, resendAvailableAt: new Date(decision.resendAvailableAt).toISOString() };
  }

  /** The phone a code verified for, or a named refusal. */
  async verify(challengeId: string, code: string, now: number): Promise<{ phoneE164: string }> {
    const challenge = await this.codes.challengeById(challengeId);
    if (!challenge) throw new NotFoundException('No such code request.');
    const history = await this.history(challenge.phoneE164, now);
    if (otpLockedUntil(history, now) !== null) throw locked();
    const matches = sameHash(hashCode(challenge.phoneE164, code), challenge.codeHash);
    const decision = otpVerifyDecision(
      stateOf(challenge),
      matches,
      now,
      history.consecutiveInvalidations,
    );
    if (decision.kind === 'mismatch') {
      await this.codes.recordVerify(challengeId, { failedVerifies: challenge.failedVerifies + 1 });
      throw refusedVerify('OTP_MISMATCH', 'That code is not right.');
    }
    if (decision.kind === 'invalidated') {
      await this.codes.recordVerify(challengeId, {
        failedVerifies: challenge.failedVerifies + 1,
        invalidatedAt: now,
      });
      if (decision.lockedUntil !== null) throw locked();
      throw refusedVerify('OTP_INVALIDATED', 'That code is used up. Request a fresh one.');
    }
    if (decision.kind === 'expired') throw refusedVerify('OTP_EXPIRED', 'That code has expired.');
    if (decision.kind === 'spent') {
      throw refusedVerify('OTP_INVALIDATED', 'That code was already used. Request a fresh one.');
    }
    const claimed = await this.codes.claimVerified(challengeId, now);
    if (!claimed) {
      throw refusedVerify('OTP_INVALIDATED', 'That code was already used. Request a fresh one.');
    }
    return { phoneE164: challenge.phoneE164 };
  }

  private async history(phoneE164: string, now: number): Promise<OtpHistory> {
    return toHistory(await this.codes.challengesSince(phoneE164, otpHistorySince(now)));
  }
}

/** The phone's recent traffic as the policy reads it, from rows newest first. */
export function toHistory(rows: readonly ChallengeRow[]): OtpHistory {
  let consecutiveInvalidations = 0;
  let lastInvalidatedAt: number | null = null;
  for (const row of rows) {
    if (row.verifiedAt !== null) break;
    if (row.invalidatedAt !== null) {
      consecutiveInvalidations += 1;
      lastInvalidatedAt = Math.max(lastInvalidatedAt ?? 0, row.invalidatedAt.getTime());
    }
  }
  const latest = rows[0];
  return {
    requestedAt: rows.map((row) => row.issuedAt.getTime()),
    lastDeliveryFailed: latest !== undefined && latest.deliveryFailedAt !== null,
    consecutiveInvalidations,
    lastInvalidatedAt,
  };
}

function stateOf(row: ChallengeRow) {
  return {
    issuedAt: row.issuedAt.getTime(),
    failedVerifies: row.failedVerifies,
    verifiedAt: row.verifiedAt?.getTime() ?? null,
    invalidatedAt: row.invalidatedAt?.getTime() ?? null,
  };
}

/** A six-digit code, uniformly random; the leading zeros are part of the code. */
function randomCode(): string {
  return randomInt(0, DECIMAL_DIGITS ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, '0');
}

/** Keyed on the server secret, so a leaked table cannot be brute-forced offline. */
function hashCode(phoneE164: string, code: string): string {
  return createHmac('sha256', ENV.AUTH_TOKEN_SECRET).update(`${phoneE164}:${code}`).digest('hex');
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function refusedRequest(decision: Exclude<OtpRequestDecision, { kind: 'allowed' }>): never {
  const code =
    decision.kind === 'cooldown'
      ? 'OTP_COOLDOWN'
      : decision.kind === 'capped'
        ? 'OTP_CAPPED'
        : 'OTP_LOCKED';
  throw new ContractException(
    code,
    'Too many code requests for this number.',
    HttpStatus.TOO_MANY_REQUESTS,
  );
}

function refusedVerify(
  code: 'OTP_MISMATCH' | 'OTP_EXPIRED' | 'OTP_INVALIDATED',
  message: string,
): never {
  throw new ContractException(code, message, HttpStatus.UNAUTHORIZED);
}

function locked(): never {
  throw new ContractException(
    'OTP_LOCKED',
    'This number is paused for a short while after too many wrong codes.',
    HttpStatus.TOO_MANY_REQUESTS,
  );
}
