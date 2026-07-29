import { OTP_EXPIRY_SECONDS, OTP_LENGTH } from '@heliogrid/contracts';
// The ID generator, not database access — a pure randomBytes function. Imported from the
// dedicated subpath so the repository fence stays exact instead of needing a carve-out.
import { uuidv7 } from '@heliogrid/db/uuid';
import { betterAuth } from 'better-auth';
import { organization, phoneNumber } from 'better-auth/plugins';
import { Pool } from 'pg';
import { ENV } from '../../../config/env';
import { createOtpPort } from './otp';

/**
 * Better Auth instance (S1-verified pattern): self-hosted on our Postgres, phone-OTP
 * primary. It OWNS /api/auth/* and its own tables (via its migrator — never authored in
 * packages/db, never queried by feature code). tenants.id IS the organization.id.
 *
 * S1 traps honoured: OTP login is sendOtp → verify (NOT signIn.phoneNumber, which is
 * password login); signUpOnVerification is mandatory for OTP-first onboarding.
 */
export function createAuth(adminDatabaseUrl: string) {
  const otp = createOtpPort();
  return betterAuth({
    baseURL: ENV.BETTER_AUTH_URL,
    // No dev fallback: a predictable signing secret must never be reachable in any
    // environment. Absent BETTER_AUTH_SECRET is a boot failure (config/env.ts).
    secret: ENV.BETTER_AUTH_SECRET,
    database: new Pool({ connectionString: adminDatabaseUrl, max: 5 }),
    plugins: [
      phoneNumber({
        sendOTP: async ({ phoneNumber: phone, code }) => otp.send(phone, code),
        signUpOnVerification: {
          getTempEmail: (phone) => `${phone.replace(/\D/g, '')}@phone.heliogrid.local`,
          getTempName: (phone) => phone,
        },
        otpLength: OTP_LENGTH,
        expiresIn: OTP_EXPIRY_SECONDS,
      }),
      organization(),
    ],
    trustedOrigins: [ENV.WEB_ORIGIN],
    advanced: {
      database: {
        // users.id IS the BA user.id and tenants.id IS the BA organization.id
        // (docs/04 §1) — our columns are uuid, so BA must mint UUIDv7, not nanoids.
        generateId: () => uuidv7(),
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
