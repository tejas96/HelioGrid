import { uuidv7 } from '@heliogrid/db';
import { betterAuth } from 'better-auth';
import { organization, phoneNumber } from 'better-auth/plugins';
import { Pool } from 'pg';
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
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:8080',
    secret: process.env.BETTER_AUTH_SECRET ?? 'dev-only-secret-change-in-fly-secrets',
    database: new Pool({ connectionString: adminDatabaseUrl, max: 5 }),
    plugins: [
      phoneNumber({
        sendOTP: async ({ phoneNumber: phone, code }) => otp.send(phone, code),
        signUpOnVerification: {
          getTempEmail: (phone) => `${phone.replace(/\D/g, '')}@phone.heliogrid.local`,
          getTempName: (phone) => phone,
        },
        otpLength: 6,
        expiresIn: 300,
      }),
      organization(),
    ],
    trustedOrigins: [process.env.WEB_ORIGIN ?? 'http://localhost:3000'],
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
