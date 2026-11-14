import {
  type CreateHeaders,
  type CustomerLink,
  type CustomerLinks,
  customerLinksContract,
  LINK_ACT_REFUSED,
  type MintLink,
} from '@heliogrid/contracts';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException } from '../../common/errors/contract-exception';
import type { LeadReader } from '../crm/crm.public';
import {
  type AddressedLink,
  CustomerLinkRepository,
  type LinkOutcome,
} from './customer-link.repository';
import { linkAddressOf } from './internal/link-secret';

/** A link with its address — the one moment the address crosses the wire. */
export interface LinkWithAddress {
  readonly link: CustomerLink;
  readonly url: string;
}

const addressed = ({ link, tokenId }: AddressedLink): LinkWithAddress => ({
  link,
  url: linkAddressOf(tokenId),
});

const noSuchLink = () => new NotFoundException('No such link.');

/** A link act the deal's state refuses (`F5-20`, `F5-76`), as the routes declare it. */
function refusedLinkAct(refusal: 'not_shared' | 'already_revoked'): ContractException {
  return new ContractException(
    LINK_ACT_REFUSED,
    refusal === 'not_shared'
      ? 'A link can be named once the proposal is shared.'
      : 'This link is already turned off.',
    HttpStatus.UNPROCESSABLE_ENTITY,
    undefined,
    { refusal },
  );
}

/** The row an act answered, or the status its outcome declares. */
function rowOf<Row>(outcome: LinkOutcome<Row>): Row {
  if (outcome.outcome === 'not-found') throw noSuchLink();
  if (outcome.outcome === 'refused') throw refusedLinkAct(outcome.refusal);
  return outcome.row;
}

/**
 * The deal's links as the company works them (`SCR-M06-20`, `F5-30`): who each is for and who
 * opened it, a named link for another person, a new address, the kill switch. The customer's page
 * shows none of it.
 */
@Injectable()
export class CustomerLinkService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CustomerLinkRepository) private readonly links: CustomerLinkRepository,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  async ofLead(reader: LeadReader, leadId: string): Promise<CustomerLinks> {
    const links = await this.links.ofLead(reader, leadId);
    if (links === null) throw new NotFoundException('No such lead.');
    return links;
  }

  async mint(
    reader: LeadReader,
    leadId: string,
    body: MintLink,
    headers: CreateHeaders,
    act: Act,
  ): Promise<LinkWithAddress> {
    const route = customerLinksContract.mint;
    const named = { label: body.label, contactId: body.contactId };
    const key = creationKeyOf(headers, act.actorUserId, route, { leadId, ...named });
    const outcome = await this.links.mint(reader, leadId, named, act, key);
    if (outcome.outcome === 'not-found') throw new NotFoundException('No such lead or contact.');
    return addressed(this.replies.rowOf(rowOf(outcome), route, reader.tenantId));
  }

  async address(reader: LeadReader, linkId: string): Promise<LinkWithAddress> {
    return addressed(rowOf(await this.links.address(reader, linkId)));
  }

  async relabel(
    reader: LeadReader,
    linkId: string,
    label: string,
    act: Act,
  ): Promise<CustomerLink> {
    const link = await this.links.relabel(reader, linkId, label, act);
    if (link === null) throw noSuchLink();
    return link;
  }

  async remint(
    reader: LeadReader,
    linkId: string,
    revokeEarlier: boolean,
    act: Act,
  ): Promise<LinkWithAddress> {
    return addressed(rowOf(await this.links.remint(reader, linkId, revokeEarlier, act)));
  }

  async revoke(reader: LeadReader, linkId: string, act: Act): Promise<CustomerLink> {
    return rowOf(await this.links.revoke(reader, linkId, act));
  }
}
