import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { OTP_LENGTH } from '@heliogrid/domain';

/**
 * The api's output: the `api` and `api-built` launch configurations write it here, and so does this
 * suite's own server, so one reader serves a local run and CI. The development delivery writes each
 * code into it (`message-delivery.development.ts`) — the only place a new number's code appears.
 */
export const API_LOG = path.join(
  execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim(),
  '.qa',
  'api.log',
);

const CODE = new RegExp(`\\b(\\d{${OTP_LENGTH}})\\b`);
const WAIT_MS = 10_000;
const POLL_MS = 200;

/**
 * The newest code the api wrote for this number at or after `since` (epoch ms). Only its own
 * number's line counts, so specs running side by side never read each other's code, and a line
 * from before `since` is an older request's.
 */
export async function codeSentTo(phoneE164: string, since: number): Promise<string> {
  const marker = `Message for ${phoneE164} via sms:`;
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    const code = newestCode(marker, since);
    if (code !== null) return code;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  throw new Error(
    `no code for ${phoneE164} reached ${API_LOG} within ${WAIT_MS} ms — is the running api the one writing this log?`,
  );
}

function newestCode(marker: string, since: number): string | null {
  if (!existsSync(API_LOG)) {
    throw new Error(
      `no api log at ${API_LOG}: the running api was not started by an \`api\` launch configuration, this suite or CI's phone jobs, so its codes are written nowhere this suite reads`,
    );
  }
  const lines = readFileSync(API_LOG, 'utf8')
    .split('\n')
    .filter((line) => line.includes(marker));
  for (const line of lines.reverse()) {
    const entry = JSON.parse(line) as { time: number; msg: string };
    if (entry.time < since) return null;
    const found = CODE.exec(entry.msg.slice(entry.msg.indexOf(marker) + marker.length));
    if (found?.[1] !== undefined) return found[1];
  }
  return null;
}
