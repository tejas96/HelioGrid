import { randomUUID } from 'node:crypto';
import { IDEMPOTENCY_KEY_HEADER } from '@heliogrid/contracts';
import { IN_FORMATS, OTP_LENGTH } from '@heliogrid/domain';
import {
  BILLING_HOME,
  BILLING_STATE_WORD,
  backToSettings,
  billingStripWords,
  COMPANY_PROFILE,
  COMPANY_SIGNUP,
  createTranslator,
  destinationLabel,
  INVITE_LANDING,
  inviteWords,
  leadInboxWords,
  leadsListTopWords,
  leadsListWords,
  PLAN_SELECTION,
  PRICING,
  paymentTermsWords,
  QUICK_ADD,
  SETUP_LANGUAGE,
  SETUP_READY,
  SETUP_WHAT_YOU_SELL,
  SHELL,
  SIGN_IN,
  searchWords,
  settingsRowName,
  settingsWords,
  setupInviteWords,
  setupWhatYouSellWords,
  tierName,
  usagePageWords,
  usageViewWords,
  verbLabel,
} from '@heliogrid/i18n';
import { API, codeSentTo } from './api-log.ts';
import { customerMergeFlowWords, mergeFromLine } from './customer-merge-flow.ts';
import { leadDetailFlowWords } from './lead-detail-flow.ts';
import { leadImportFlowWords } from './lead-import-flow.ts';
import { paymentsFlowWords } from './payments.ts';
import { freshMobile } from './phone.ts';
import { markWonBody } from './project-facts.ts';
import { projectFlowWords } from './project-flow.ts';

/**
 * What `mobile/run.sh` hands Maestro, which reads no file and imports nothing mid-flow:
 *   words              — `KEY=value` lines, the door's words from `packages/i18n`, never typed in a flow
 *   phone              — a fresh number: `<national> <e164>`
 *   code <e164> <since> — the code the api sent that number at or after `since` (epoch ms)
 *   company <national> <e164> — signs that number in through the api and makes its company,
 *                          `E2E <national>` owned by `Owner <national>`, so a flow signs in to a
 *                          member who has one:
 *                          the phone's own *Create company* press never reaches the api on iOS
 *                          inside Maestro (`D5`). It adds three leads given to the owner, so they
 *                          wait in no inbox — `Lead <national>`, the same family's second record,
 *                          `Family <national>`, and `Won <national>`, marked won so its project
 *                          stands at Won — and prints `<lead id> <its customer> <the family's
 *                          customer> <the project>` for the Lead Detail, Customer Merge and
 *                          projects flows
 *   merge-from <name>  — Customer Merge's "From <name>" under each value that record holds
 */
const [command, ...args] = process.argv.slice(2);

if (command === 'words') {
  const t = await createTranslator('en');
  const inbox = leadInboxWords(t.t);
  const search = searchWords(t.t);
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
    YOUR_PLAN: BILLING_HOME.yourPlan,
    TRIAL: BILLING_STATE_WORD.trialing,
    CHANGE_PLAN: BILLING_HOME.changePlan,
    USAGE_THIS_CYCLE: BILLING_HOME.usageThisCycle,
    PAYMENT_METHOD: BILLING_HOME.paymentMethod,
    METHOD_LATER: BILLING_HOME.methodLater,
    NO_INVOICES_YET: BILLING_HOME.noInvoicesYet,
    CANCEL_SUBSCRIPTION: BILLING_HOME.cancelSubscription,
    PLANS: PRICING.plans,
    BACK_TO_BILLING: BILLING_HOME.backToBilling,
    CHOOSE_A_PLAN: PLAN_SELECTION.choosePlan,
    REVIEW_CHANGE: PLAN_SELECTION.reviewChange,
    WHAT_CHANGES: PLAN_SELECTION.whatChanges,
    PLAN_PRO: tierName('pro'),
    CLOSE: SHELL.close,
    /** `SCR-M02-01`: the pill's add action and quick add's four fields, Save and its answers. */
    ADD_LEAD: verbLabel(t.t, 'add_lead'),
    NEW_LEAD: QUICK_ADD.title,
    QUICK_ADD_PHONE: QUICK_ADD.phone,
    QUICK_ADD_NAME: QUICK_ADD.name,
    QUICK_ADD_CITY: QUICK_ADD.city,
    QUICK_ADD_TYPE: QUICK_ADD.type,
    SAVE_LEAD: QUICK_ADD.save,
    NEW_NUMBER: QUICK_ADD.newNumber,
    LEAD_SAVED: QUICK_ADD.saved,
    /** `SCR-M02-02`: the inbox's title, a face's spoken name, junk and the teaching inbox. */
    INBOX_TITLE: inbox.title,
    GIVE_TO_PREFIX: inbox.dock.giveTo('', 0, 0).split(':')[0]?.trim() ?? '',
    JUNK_THIS_LEAD: inbox.deck.junkThis,
    INBOX_TEACHING: inbox.teaching.title,
    NO_NAME_YET: inbox.deck.noName,
    /** `SCR-SHELL-02`: the hint, an unnamed lead's row, nothing found, and Cancel. */
    SEARCH_IDLE: search.idle.title,
    OPEN_THIS_LEAD: search.open('lead', null),
    SEARCH_NONE_BODY: search.none('').body,
    SEARCH_CANCEL: search.cancel,
    ...leadDetailFlowWords(t),
    ...customerMergeFlowWords(t),
    ...leadsListFlowWords(t),
    ...leadImportFlowWords(t),
    ...projectFlowWords(t),
    ...paymentsFlowWords(t),
    ...usageWords(t),
    /** `SCR-SHELL-06`: a fresh trial's quiet count, the day it starts. */
    TRIAL_CHIP: billingStripWords(t.t).trialDaysLeft(14),
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
} else if (command === 'merge-from' && args[0] !== undefined) {
  process.stdout.write(`${await mergeFromLine(args[0])}\n`);
} else {
  process.stderr.write(
    'usage: mobile-cli.ts words | phone | code <e164> <since-epoch-ms> | company <national> <e164> | merge-from <name>\n',
  );
  process.exit(2);
}

/** Signs the number in as the phone would, then makes its company the way the sign-up step does. */
async function companyFor(national: string, phoneE164: string): Promise<void> {
  const since = Date.now();
  const challenge = await call('/auth/otp/request', { phoneE164, channel: 'sms' });
  const { challengeId, resendAvailableAt } = (await challenge.json()) as {
    challengeId: string;
    resendAvailableAt: string;
  };
  const code = await codeSentTo(phoneE164, since);
  const verified = await call('/auth/otp/verify', { challengeId, code, platform: 'web' });
  const cookie = verified.headers
    .getSetCookie()
    .map((line) => line.split(';')[0])
    .join('; ');
  const { actor } = (await verified.json()) as { actor: { userId: string } };
  const made = { companyName: `E2E ${national}`, ownerName: `Owner ${national}`, city: 'Pune' };
  const company = await call('/tenants', made, cookie);
  const owned = cookieAfter(cookie, company);
  const lead = await leadFor(owned, actor.userId, { name: `Lead ${national}`, city: 'Pune' });
  /* The same family's second record, for Customer Merge's flow: another name, city and number. */
  const family = await leadFor(owned, actor.userId, { name: `Family ${national}`, city: 'Mumbai' });
  /* A lead of its own for the projects flows, so the lead flows still read theirs as captured. */
  const won = await leadFor(owned, actor.userId, { name: `Won ${national}`, city: 'Pune' });
  const projectId = await projectFor(owned, won.leadId, actor.userId);
  process.stdout.write(`${lead.leadId} ${lead.customerId} ${family.customerId} ${projectId}\n`);
  /* The phone asks the same number for a code next, and the api sends none until the resend time
     it gave here has passed — a code asked for sooner never reaches the api log. */
  const wait = Date.parse(resendAvailableAt) - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

/**
 * One lead for the Lead Detail, Customer Merge or projects flows (`SCR-M02-04`, `SCR-M02-06`,
 * `SCR-M08-01`), captured as quick add does and given to the owner at once, so it waits in no inbox
 * and the inbox flow still meets only the lead it captured.
 */
async function leadFor(
  cookie: string,
  ownerId: string,
  who: { name: string; city: string },
): Promise<{ leadId: string; customerId: string }> {
  const capture = {
    phoneE164: freshMobile().e164,
    ...who,
    segment: 'residential',
    capturedAt: new Date().toISOString(),
  };
  const created = await call('/leads', capture, cookie, { [IDEMPOTENCY_KEY_HEADER]: randomUUID() });
  const { lead, customer } = (await created.json()) as {
    lead: { id: string };
    customer: { id: string };
  };
  await call(`/leads/${lead.id}/assign`, { assigneeId: ownerId, expectedOwnerId: null }, cookie);
  return { leadId: lead.id, customerId: customer.id };
}

/**
 * *Mark won* on that lead (`M07-62`), as the lead page's sheet sends it: the owner — the company's
 * one project manager — a final value and an install date a month ahead. Answers the project's id.
 */
async function projectFor(cookie: string, leadId: string, ownerId: string): Promise<string> {
  const won = await call(`/leads/${leadId}/won`, markWonBody(ownerId), cookie, {
    [IDEMPOTENCY_KEY_HEADER]: randomUUID(),
  });
  return ((await won.json()) as { projectId: string }).projectId;
}

/** The session's cookies after an answer that set new ones — making a company reissues the token. */
function cookieAfter(cookie: string, answer: Response): string {
  const jar = new Map(cookie.split('; ').map((pair) => [pair.split('=')[0] ?? '', pair]));
  for (const line of answer.headers.getSetCookie()) {
    const pair = line.split(';')[0] ?? '';
    jar.set(pair.split('=')[0] ?? '', pair);
  }
  return [...jar.values()].join('; ');
}

async function call(
  route: string,
  body: object,
  cookie?: string,
  headers: Record<string, string> = {},
): Promise<Response> {
  const answer = await fetch(`${API}${route}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookie === undefined ? {} : { cookie }),
      ...headers,
    },
    body: JSON.stringify(body),
  });
  if (!answer.ok) throw new Error(`${route} answered ${answer.status}: ${await answer.text()}`);
  return answer;
}

/**
 * The Leads list's words (`SCR-M02-03`): the summary's open figure and its dormant one as a screen
 * reader names it, the search's hint, no match and its way back.
 */
function leadsListFlowWords(
  t: Awaited<ReturnType<typeof createTranslator>>,
): Record<string, string> {
  const list = leadsListWords(t.t, { pack: IN_FORMATS, language: 'en', now: Date.now() });
  const top = leadsListTopWords(t.t, { pack: IN_FORMATS, language: 'en', now: Date.now() });
  return {
    LEADS_OPEN: top.open,
    LEADS_SEARCH_HINT: list.searchHint,
    DORMANT_FIGURE: top.dormantSpoken(0),
    LEADS_NO_MATCH: list.noMatch.title,
    CLEAR_FILTERS: list.noMatch.clear,
  };
}

/** The first answer *What do you sell?* offers, as the card names it. */
function firstSegment(t: Awaited<ReturnType<typeof createTranslator>>): string {
  const words = setupWhatYouSellWords(t.t, { checking: false, refused: [], failed: false });
  const first = words.options[0];
  if (first === undefined) throw new Error('What do you sell? offers no answer');
  return first.title;
}

/** The usage screen's words (`SCR-M12-04`): its cards, the meters a fresh trial shows and a ledger's. */
function usageWords(t: Awaited<ReturnType<typeof createTranslator>>): Record<string, string> {
  const view = usageViewWords(t.t, 'en');
  const page = usagePageWords(t.t);
  return {
    ALL_USAGE: t.t(BILLING_HOME.allUsage),
    USAGE_LIMITS: view.limits,
    USAGE_INCLUDED: view.included,
    VOICE_MINUTES: view.view.limits.voiceMinutes,
    OTP_CODES: view.otpCodes,
    NOT_BILLED: view.notBilled,
    VOICE_EVENTS: page.eventsOf(view.view.limits.voiceMinutes),
    NO_CALLS: view.noCalls.title,
    USAGE_CLOSE: page.close,
  };
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
    'collections',
    'catalog',
    'billing',
  ] as const;
  return Object.fromEntries(
    rows.map((row) => [`ROW_${row.toUpperCase()}`, settingsRowName(t.t, row)]),
  );
}
