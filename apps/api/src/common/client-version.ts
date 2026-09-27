import {
  CLIENT_UPGRADE_REQUIRED,
  CLIENT_UPGRADE_REQUIRED_STATUS,
  CLIENT_VERSION_HEADER,
  type ClientUpgradeRequired,
} from '@heliogrid/contracts';
import { type ClientVersion, isBelowMinimum, parseClientVersion } from '@heliogrid/domain';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import type { ApiEnv } from '../config/env';

type MinimumSettings = Pick<
  ApiEnv,
  'MOBILE_MIN_VERSION' | 'MOBILE_STORE_URL_IOS' | 'MOBILE_STORE_URL_ANDROID'
>;

export interface MinimumClientVersion {
  readonly version: ClientVersion;
  readonly upgrade: ClientUpgradeRequired['error']['upgrade'];
}

/* Enough to read any real version in a log line, and no more of what a caller chose to send. */
const LOGGED_VERSION_LENGTH = 32;

/**
 * The configured minimum, or null when none is set and nothing is refused (`F4-36`). THROWS,
 * naming the key, on a minimum it cannot read or one without both store links: the boot stops
 * rather than refuse every phone or none, or refuse one with nowhere to update from.
 */
export function readMinimumClientVersion(settings: MinimumSettings): MinimumClientVersion | null {
  const { MOBILE_MIN_VERSION, MOBILE_STORE_URL_IOS, MOBILE_STORE_URL_ANDROID } = settings;
  if (MOBILE_MIN_VERSION === undefined) return null;
  const version = parseClientVersion(MOBILE_MIN_VERSION);
  if (version === null) {
    throw new Error(
      `MOBILE_MIN_VERSION "${MOBILE_MIN_VERSION}" is not one to three dotted whole numbers, such as 1.10 or 1.10.3.`,
    );
  }
  if (MOBILE_STORE_URL_IOS === undefined || MOBILE_STORE_URL_ANDROID === undefined) {
    const missing =
      MOBILE_STORE_URL_IOS === undefined ? 'MOBILE_STORE_URL_IOS' : 'MOBILE_STORE_URL_ANDROID';
    throw new Error(
      `MOBILE_MIN_VERSION refuses phones below it, so it names the store they update from: set ${missing}.`,
    );
  }
  return {
    version,
    upgrade: {
      requiredVersion: MOBILE_MIN_VERSION,
      storeUrls: { ios: MOBILE_STORE_URL_IOS, android: MOBILE_STORE_URL_ANDROID },
    },
  };
}

/**
 * Answers a phone below the minimum with the 426 every shipped build reads, before the body is
 * parsed and before any route or guard runs — so a too-old phone is never signed out, judged on
 * its body or written for. A request with no version header passes untouched: the web app, a
 * webhook and a health check send none.
 */
export function refuseClientsBelow(
  minimum: MinimumClientVersion,
  logger: PinoLogger,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const sent = req.headers[CLIENT_VERSION_HEADER];
    if (sent === undefined) {
      next();
      return;
    }
    // Node joins a repeated custom header into one comma-separated string, which the grammar
    // reads as unreadable. The list its type allows is read as unreadable too.
    const version = typeof sent === 'string' ? sent : '';
    if (!isBelowMinimum(version, minimum.version)) {
      next();
      return;
    }
    const requestId = String(req.id);
    // This answer is written before the request logger runs, so this line is the only record of
    // it: it names the call, as the request log does — the path without its query.
    logger.warn(
      {
        requestId,
        method: req.method,
        path: req.path,
        clientVersion: version.slice(0, LOGGED_VERSION_LENGTH),
        requiredVersion: minimum.upgrade.requiredVersion,
      },
      'Refused a client below the minimum version',
    );
    const refusal: ClientUpgradeRequired = {
      error: {
        code: CLIENT_UPGRADE_REQUIRED,
        message: 'This version of the app is too old. Update it to continue.',
        requestId,
        upgrade: minimum.upgrade,
      },
    };
    res.status(CLIENT_UPGRADE_REQUIRED_STATUS).json(refusal);
  };
}
