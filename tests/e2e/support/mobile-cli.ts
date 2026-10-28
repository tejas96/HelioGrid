import { OTP_LENGTH } from '@heliogrid/domain';
import {
  backToSettings,
  COMPANY_PROFILE,
  COMPANY_SIGNUP,
  createTranslator,
  destinationLabel,
  INVITE_LANDING,
  inviteWords,
  paymentTermsWords,
  SETUP_LANGUAGE,
  SETUP_READY,
  SETUP_WHAT_YOU_SELL,
  SHELL,
  SIGN_IN,
  settingsRowName,
  settingsWords,
  setupInviteWords,
  setupWhatYouSellWords,
} from '@heliogrid/i18n';
import { API, codeSentTo } from './api-log.ts';
import { freshMobile } from './phone.ts';

/**
 * What `mobile/run.sh` hands Maestro, which reads no file and imports nothing mid-flow:
 *   words              — `KEY=value` lines, the door's words from `packages/i18n`, never typed in a flow
 *   phone              — a fresh number: `<national> <e164>`
 *   code <e164> <since> — the code the api sent that number at or after `since` (epoch ms)
 *   company <national> <e164> — signs that number in through the api and makes its company,
 *                          `E2E <national>` owned by `Owner <national>`, so a flow signs in to a
 *                          member who has one:
 *                          the phone's own *Create company* press never reaches the api on iOS
 *                          inside Maestro (`D5`)
 */
const [command, ...args] = process.argv.slice(2);

if (command === 'words') {
  const t = await createTranslator('en');
  const words = {
    SIGN_IN_TITLE: SIGN_IN.signIn,
    MOBILE_NUMBER: SIGN_IN.mobileNumber,
    SEND_CODE: SIGN_IN.sendCode,
    OR: SIGN_IN.or,
    CONTINUE_WITH_GOOGLE: SIGN_IN.continueWithGoogle,
    ENTER_THE_CODE: SIGN_IN.enterTheCode,
    CODE_LABEL: t.t(SIGN_IN.codeLabel, { n: OTP_LENGTH }),
    VERIFY_AND_SIGN_IN: SIGN_IN.verifyAndSignIn,
    YOUR_COMPANY: COMPANY_SIGNUP.yourCompany,
    COMPANY_NAME_EXAMPLE: COMPANY_SIGNUP.companyNameExample,
    YOUR_NAME_EXAMPLE: COMPANY_SIGNUP.yourNameExample,
    CITY_EXAMPLE: COMPANY_SIGNUP.cityExample,
    CREATE_COMPANY: COMPANY_SIGNUP.createCompany,
    INVITE_GONE: INVITE_LANDING.goneTitle,
    INVITE_SIGN_IN: INVITE_LANDING.signIn,
    /* A well-formed link with no invite behind it: 43 base64url characters, as the token is minted. */
    UNKNOWN_INVITE_TOKEN: 'A'.repeat(43),
    SETUP_LANGUAGE_TITLE: SETUP_LANGUAGE.title,
    CONTINUE: SETUP_LANGUAGE.continue,
    WHAT_YOU_SELL_TITLE: SETUP_WHAT_YOU_SELL.title,
    FIRST_SEGMENT: firstSegment(t),
    SIZE_LABEL: SETUP_WHAT_YOU_SELL.sizeLabel,
    COMPANY_PROFILE_TITLE: COMPANY_PROFILE.title,
    SAVE_COMPANY_PROFILE: COMPANY_PROFILE.saveSpoken,
    INVITE_TITLE: inviteWords(t.t).title,
    SKIP_FOR_NOW: setupInviteWords(t.t).skip,
    READY_TITLE: SETUP_READY.title,
    FIRST_LEAD: SETUP_READY.leadAct,
    MORE: destinationLabel(t.t, 'more'),
    PLACEHOLDER: SHELL.comingLater,
    SETTINGS_TITLE: settingsWords(t.t).title,
    BACK_TO_SETTINGS: backToSettings(t.t),
    YOUR_PAYMENT_TERMS: paymentTermsWords(t.t).yourTerms,
    ...settingsRows(t),
  };
  for (const [key, message] of Object.entries(words)) {
    process.stdout.write(`${key}=${typeof message === 'string' ? message : t.t(message)}\n`);
  }
} else if (command === 'phone') {
  const mobile = freshMobile();
  process.stdout.write(`${mobile.national} ${mobile.e164}\n`);
} else if (command === 'code' && args[0] !== undefined && args[1] !== undefined) {
  process.stdout.write(`${await codeSentTo(args[0], Number(args[1]))}\n`);
} else if (command === 'company' && args[0] !== undefined && args[1] !== undefined) {
  await companyFor(args[0], args[1]);
} else {
  process.stderr.write(
    'usage: mobile-cli.ts words | phone | code <e164> <since-epoch-ms> | company <national> <e164>\n',
  );
  process.exit(2);
}

/** Signs the number in as the phone would, then makes its company the way the sign-up step does. */
async function companyFor(national: string, phoneE164: string): Promise<void> {
  const since = Date.now();
  const challenge = await call('/auth/otp/request', { phoneE164, channel: 'sms' });
  const { challengeId } = (await challenge.json()) as { challengeId: string };
  const code = await codeSentTo(phoneE164, since);
  const verified = await call('/auth/otp/verify', { challengeId, code, platform: 'web' });
  const cookie = verified.headers
    .getSetCookie()
    .map((line) => line.split(';')[0])
    .join('; ');
  const made = { companyName: `E2E ${national}`, ownerName: `Owner ${national}`, city: 'Pune' };
  await call('/tenants', made, cookie);
}

async function call(route: string, body: object, cookie?: string): Promise<Response> {
  const answer = await fetch(`${API}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie === undefined ? {} : { cookie }) },
    body: JSON.stringify(body),
  });
  if (!answer.ok) throw new Error(`${route} answered ${answer.status}: ${await answer.text()}`);
  return answer;
}

/** The first answer *What do you sell?* offers, as the card names it. */
function firstSegment(t: Awaited<ReturnType<typeof createTranslator>>): string {
  const words = setupWhatYouSellWords(t.t, { checking: false, refused: [], failed: false });
  const first = words.options[0];
  if (first === undefined) throw new Error('What do you sell? offers no answer');
  return first.title;
}

/** Each settings row's name, `ROW_<row>`, as the settings list and the row's own header show it. */
function settingsRows(t: Awaited<ReturnType<typeof createTranslator>>): Record<string, string> {
  const rows = [
    'profile',
    'team',
    'roles',
    'branding',
    'proposal_templates',
    'payment_terms',
    'catalog',
  ] as const;
  return Object.fromEntries(
    rows.map((row) => [`ROW_${row.toUpperCase()}`, settingsRowName(t.t, row)]),
  );
}
