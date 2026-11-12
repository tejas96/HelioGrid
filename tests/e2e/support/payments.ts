import type { CollectionsSettings, ProjectPayments } from '@heliogrid/contracts';
import { formatMoney } from '@heliogrid/domain';
import {
  collectionsSettingsWords,
  type createTranslator,
  moneySheetWords,
  paymentsPageWords,
  projectMoneyWords,
} from '@heliogrid/i18n';
import type { Page } from '@playwright/test';
import { API } from './api-log.ts';
import { PACK } from './project-facts.ts';

/*
 * What the payments flows share (`M11`, no gateway: the company's own UPI QR, its bank, money
 * recorded by hand), web and phone. A fresh company starts with the standard splits, the first its
 * default, so a project won through the api has its parts and its first part due at Won
 * (`apps/api/src/modules/projects/projects.schedule.repository.ts`). Kept free of Playwright at
 * run time, since `mobile-cli.ts` reads the phone's words from here.
 */

type Translation = Awaited<ReturnType<typeof createTranslator>>;

/** An amount as the India pack draws it on screen — the figure the hero and the sheets show. */
export const packMoney = (amount: string): string => formatMoney(PACK, amount);

/** The settings page's words, the one-rupee test included, as the India pack writes it. */
export const collectionsWords = (t: Translation) =>
  collectionsSettingsWords(t.t, { pack: PACK, language: 'en' }, { oneUnit: packMoney('1') });

/** The web's money sheets, which copy the pay message for the person to paste. */
export const webSheetWords = (t: Translation) =>
  moneySheetWords(t.t, { pack: PACK, language: 'en' }, 'copy');

/** A valid UPI ID, and one that does not read as name@bank. */
export const UPI_ID = 'e2e@okaxis';
export const MALFORMED_UPI_ID = 'not-an-id';

/** A fresh twelve-digit UTR each run, so a run never meets another's receipt. */
export const freshUtr = (): string => `4${String(Date.now()).padStart(11, '0').slice(-11)}`;

/** The project's money as the api reads it — the parts, the requests and the entries drawn. */
export async function readPayments(page: Page, projectId: string): Promise<ProjectPayments> {
  const answer = await page.request.get(`${API}/projects/${projectId}/payments`);
  if (answer.status() !== 200) {
    throw new Error(`GET payments answered ${answer.status()}: ${await answer.text()}`);
  }
  return (await answer.json()) as ProjectPayments;
}

/** The company's UPI ID and shown name, saved through the api as the settings page saves them. */
export async function saveUpiThroughApi(
  page: Page,
  write: { readonly upiId: string; readonly payee: string },
): Promise<CollectionsSettings> {
  const answer = await page.request.put(`${API}/settings/collections`, { data: write });
  if (answer.status() !== 200) {
    throw new Error(`PUT collections answered ${answer.status()}: ${await answer.text()}`);
  }
  return (await answer.json()) as CollectionsSettings;
}

/** The part the hero asks for now: the first request the server put first, and its part. */
export function dueNow(payments: ProjectPayments) {
  const request = payments.requests[0];
  const part = payments.parts.find((one) => one.id === request?.partId);
  if (request === undefined || part === undefined) {
    throw new Error('a project won from the default terms has no part due at Won');
  }
  return { request, part };
}

/**
 * The payments' words for their phone flows (`SCR-M11-02`, `SCR-M11-04`;
 * `mobile/project-payments.yaml`, `collections-settings.yaml`), handed to Maestro by
 * `mobile-cli.ts`. The company has no UPI ID and no bank yet, so the collect sheet opens on UPI
 * naming what to add, and the bank way says the same of the bank.
 */
export function paymentsFlowWords(t: Translation): Record<string, string> {
  const page = paymentsPageWords(t.t);
  const money = projectMoneyWords(t.t);
  const sheet = moneySheetWords(t.t, { pack: PACK, language: 'en' }, 'share');
  const settings = collectionsWords(t);
  return {
    PAYMENTS_TITLE: page.title,
    TO_COLLECT_NOW: money.toCollectNow,
    COLLECT_ACT: money.collect,
    RECORD_ACT: money.record,
    PAYMENT_PARTS: money.parts,
    NOTHING_RECEIVED: money.nothingReceived,
    UPI_TAB: sheet.upiTab,
    BANK_TAB: sheet.bankTab,
    NO_UPI: sheet.noUpi,
    NO_BANK: sheet.noBank,
    SEND_CHAT: sheet.sendChat,
    HOW_PAY_LEAD: settings.lead,
    PAY_WAYS: settings.ways,
    NO_BANK_YET: settings.noBankYet,
  };
}
