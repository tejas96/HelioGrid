import { OTP_LENGTH } from '@heliogrid/domain';
import { COMPANY_SIGNUP, createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { codeSentTo } from './api-log.ts';
import { freshMobile } from './phone.ts';

/**
 * What `mobile/run.sh` hands Maestro, which reads no file and imports nothing mid-flow:
 *   words              — `KEY=value` lines, the door's words from `packages/i18n`, never typed in a flow
 *   phone              — a fresh number: `<national> <e164>`
 *   code <e164> <since> — the code the api sent that number at or after `since` (epoch ms)
 */
const [command, ...args] = process.argv.slice(2);

if (command === 'words') {
  const t = await createTranslator('en');
  const words = {
    SIGN_IN_TITLE: SIGN_IN.signIn,
    MOBILE_NUMBER: SIGN_IN.mobileNumber,
    SEND_CODE: SIGN_IN.sendCode,
    ENTER_THE_CODE: SIGN_IN.enterTheCode,
    CODE_LABEL: t.t(SIGN_IN.codeLabel, { n: OTP_LENGTH }),
    VERIFY_AND_SIGN_IN: SIGN_IN.verifyAndSignIn,
    YOUR_COMPANY: COMPANY_SIGNUP.yourCompany,
    COMPANY_NAME_EXAMPLE: COMPANY_SIGNUP.companyNameExample,
    YOUR_NAME_EXAMPLE: COMPANY_SIGNUP.yourNameExample,
    CITY_EXAMPLE: COMPANY_SIGNUP.cityExample,
    CREATE_COMPANY: COMPANY_SIGNUP.createCompany,
  };
  for (const [key, message] of Object.entries(words)) {
    process.stdout.write(`${key}=${typeof message === 'string' ? message : t.t(message)}\n`);
  }
} else if (command === 'phone') {
  const mobile = freshMobile();
  process.stdout.write(`${mobile.national} ${mobile.e164}\n`);
} else if (command === 'code' && args[0] !== undefined && args[1] !== undefined) {
  process.stdout.write(`${await codeSentTo(args[0], Number(args[1]))}\n`);
} else {
  process.stderr.write('usage: mobile-cli.ts words | phone | code <e164> <since-epoch-ms>\n');
  process.exit(2);
}
