import { Logger } from '@nestjs/common';

/**
 * OtpPort — MSG91 SMS is DLT-gated (docs/ops/msg91-setup.md): while
 * MSG91_OTP_TEMPLATE_ID is unset/PENDING_DLT the dev adapter logs the code (the S1
 * spike pattern) and the full auth flow works end-to-end without a single SMS.
 * DLT flip-on = set the real template id. No code change.
 */
export interface OtpPort {
  send(phoneE164: string, code: string): Promise<void>;
}

const logger = new Logger('OtpPort');

export function createOtpPort(): OtpPort {
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!templateId || templateId === 'PENDING_DLT' || !authKey) {
    return {
      async send(phoneE164, code) {
        logger.warn(`DEV OTP for ${phoneE164.slice(0, 6)}…: ${code} (MSG91 DLT pending)`);
      },
    };
  }
  return {
    async send(phoneE164, code) {
      const res = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authkey: authKey },
        body: JSON.stringify({
          template_id: templateId,
          mobile: phoneE164.replace('+', ''),
          otp: code,
        }),
      });
      if (!res.ok) throw new Error(`MSG91 send failed: ${res.status}`);
    },
  };
}
