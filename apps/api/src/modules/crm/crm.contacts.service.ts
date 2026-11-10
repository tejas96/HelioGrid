import {
  type AddContact,
  type AddContactRoleLabel,
  type Contact,
  type ContactRoleLabel,
  type ContactRoleLabels,
  type CreateHeaders,
  type Customer,
  contactsContract,
  type EditContact,
} from '@heliogrid/contracts';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { refusalWithFacts } from '../../common/errors/contract-exception';
import { SettingsService } from '../settings/settings.public';
import { type ContactRefusal, CrmContactsRepository } from './crm.contacts.repository';
import { marketPhoneOf } from './internal/market-phone';
import type { LeadReader } from './internal/reader';

const notFound = () => new NotFoundException('No such customer, contact or label.');

/**
 * A customer's contacts and the company's role labels (`M02-34`). A number already held by a
 * customer or a contact is refused with that record's facts, pointing to Merge (RFC decision 3).
 */
@Injectable()
export class CrmContactsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmContactsRepository) private readonly contacts: CrmContactsRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  async add(
    reader: LeadReader,
    customerId: string,
    body: AddContact,
    headers: CreateHeaders,
    act: Act,
  ): Promise<Contact> {
    const route = contactsContract.add;
    const phoneE164 = await this.normalised(reader.tenantId, body.phoneE164);
    const key = creationKeyOf(headers, act.actorUserId, route, { customerId, ...body });
    const outcome = await this.contacts.add(reader, customerId, { ...body, phoneE164 }, act, key);
    if (isContactRefusal(outcome)) throw refusalOf(outcome, route.responses[409]);
    return this.replies.rowOf(outcome, route, reader.tenantId);
  }

  async edit(reader: LeadReader, contactId: string, body: EditContact): Promise<Contact> {
    const phoneE164 =
      body.phoneE164 === undefined
        ? undefined
        : await this.normalised(reader.tenantId, body.phoneE164);
    const edit = { ...body, ...(phoneE164 === undefined ? {} : { phoneE164 }) };
    const outcome = await this.contacts.edit(reader, contactId, edit);
    if (isContactRefusal(outcome)) throw refusalOf(outcome, contactsContract.edit.responses[409]);
    return outcome.contact;
  }

  async setPrimary(
    reader: LeadReader,
    customerId: string,
    contactId: string | null,
  ): Promise<Customer> {
    const customer = await this.contacts.setPrimary(reader, customerId, contactId);
    if (customer === null) throw notFound();
    return customer;
  }

  async roleLabels(tenantId: string): Promise<ContactRoleLabels> {
    return { items: await this.contacts.roleLabels(tenantId) };
  }

  async addRoleLabel(
    tenantId: string,
    body: AddContactRoleLabel,
    headers: CreateHeaders,
    act: Act,
  ): Promise<ContactRoleLabel> {
    const route = contactsContract.addRoleLabel;
    const key = creationKeyOf(headers, act.actorUserId, route, body);
    const keyed = await this.contacts.addRoleLabel(tenantId, body.text, act, key);
    return this.replies.rowOf(keyed, route, tenantId);
  }

  /** The number the market's way; a number it cannot read whole is refused on its field. */
  private async normalised(tenantId: string, typed: string): Promise<string> {
    const { formats } = await this.settings.packOf(tenantId);
    return marketPhoneOf(formats, typed);
  }
}

function isContactRefusal(outcome: { readonly outcome: string }): outcome is ContactRefusal {
  return outcome.outcome === 'not-found' || outcome.outcome === 'taken';
}

/** A contact write refused: 404, or 409 with the facts of whoever holds the number. */
function refusalOf(
  refusal: ContactRefusal,
  declared: (typeof contactsContract.add.responses)[409],
) {
  if (refusal.outcome === 'not-found') return notFound();
  return refusalWithFacts(declared, HttpStatus.CONFLICT, {
    code: 'CONTACT_PHONE_TAKEN',
    message: 'This number already belongs to a customer or a contact.',
    facts: refusal.facts,
  });
}
