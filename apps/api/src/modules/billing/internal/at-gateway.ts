import { HttpStatus } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { ContractException } from '../../../common/errors/contract-exception';

/**
 * An Owner's act at the gateway: one that does not answer is a 502 with nothing changed, and the
 * same call may be sent again.
 */
export async function atGateway<T>(logger: PinoLogger, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    logger.warn({ err: error }, 'the billing gateway did not answer');
    throw new ContractException(
      'GATEWAY_UNAVAILABLE',
      'The payment service did not answer. Nothing was charged. Try again.',
      HttpStatus.BAD_GATEWAY,
    );
  }
}
