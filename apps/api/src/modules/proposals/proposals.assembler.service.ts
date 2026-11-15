import type { ProposalDetail } from '@heliogrid/contracts';
import {
  can,
  draftProgress,
  type Freshness,
  holdsOutright,
  type MarketPack,
  PROPOSAL_BASIS_WITHOUT_DESIGN,
  PROPOSAL_STEPS,
  PROPOSAL_TASK_PROVENANCES,
  type ProposalDealFacts,
  type ProposalFieldSet,
  type RichTextValue,
  type RolePreset,
  stepStandings,
  UI_LANGUAGES,
  type UiLanguage,
} from '@heliogrid/domain';
import {
  generateVerdict,
  projectNumberOf,
  proposalNumberOf,
  templateFilledSteps,
} from '@heliogrid/domain/server';
import { createTranslator, proposalMoneyLineWords } from '@heliogrid/i18n';
import { Inject, Injectable } from '@nestjs/common';
import { type LeadReader, memberRefOf } from '../crm/crm.public';
import { FileDocumentService } from '../file/file.public';
import {
  documentDefaultsIn,
  type ProposalSettings,
  SettingsService,
  trancheTemplateWire,
} from '../settings/settings.public';
import { assemble, type CompanyNow, computedNow } from './internal/assemble';
import {
  type DocumentFacts,
  documentWire,
  type LiveDocument,
  verdictWire,
} from './internal/document-wire';
import type { FieldSetReader } from './internal/field-set-wire';
import type { NamedPerson } from './proposals.facts.repository';
import type { ProposalFacts } from './proposals.read.repository';
import { shareBlockOf, standingOf, trackingOf, versionSummaries } from './proposals.track-wire';

/** What assembling a document needs beyond the proposal: the company's settings, in one language. */
export interface AssemblyContext {
  readonly settings: ProposalSettings;
  readonly pack: MarketPack;
  readonly language: UiLanguage;
  readonly company: CompanyNow;
  readonly lineLabels: ReturnType<typeof proposalMoneyLineWords>;
  /**
   * The platform's default terms in EVERY launch language: a draft's terms may have been filled in
   * any of them (the customer's, else the company's), so the validity never depends on the reader.
   */
  readonly platformTerms: readonly RichTextValue[];
}

/** What the reader may do with proposals, from the presets they hold (`F2.M06.*`, `F2.M01.*`). */
export function rightsOf(roles: readonly RolePreset[]): ProposalDetail['rights'] {
  // A limited catalog grant — Finance's "view prices & margins" — reads cost and changes no part.
  const managesParts = holdsOutright(roles, 'onboarding.manage_catalog');
  return {
    edit: can(roles, 'proposals.create_edit_proposals'),
    share: can(roles, 'proposals.send_proposals'),
    seesCost: can(roles, 'onboarding.manage_catalog'),
    writesCompanyFacts: can(roles, 'onboarding.manage_tenant_settings'),
    addsParts: managesParts || can(roles, 'onboarding.add_own_catalog_items'),
    managesParts,
    mintsLinks: can(roles, 'customer_link.mint_customer_link'),
    revokesLinks: can(roles, 'customer_link.revoke_customer_link'),
    managesBilling: can(roles, 'billing.manage_billing'),
  };
}

/**
 * A proposal as its screens read it (`M06-41`, `M06-50`): ONE assembly feeds the builder, the
 * check, the track screen and the document, so no two of them can show different facts. Every
 * figure is domain's; this orders the reads around it.
 */
@Injectable()
export class ProposalsAssembler {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(FileDocumentService) private readonly documents: FileDocumentService,
  ) {}

  /** The company's settings and words, in the document's language: the customer's, else the company's (`T-M06-017`). */
  async contextFor(
    tenantId: string,
    preferredLanguage: UiLanguage | null,
    owner: NamedPerson | null,
  ): Promise<AssemblyContext> {
    const inCompanyWords = await this.settings.forProposals(tenantId);
    const language = preferredLanguage ?? inCompanyWords.inForce.locale.value.defaultLanguage;
    const settings =
      language === inCompanyWords.inForce.locale.value.defaultLanguage
        ? inCompanyWords
        : await this.settings.forProposals(tenantId, language);
    const [{ t }, platformTerms] = await Promise.all([
      createTranslator(language),
      Promise.all(UI_LANGUAGES.map(async (each) => (await documentDefaultsIn(each)).terms)),
    ]);
    const { pack, inForce } = settings;
    return {
      settings,
      pack,
      language,
      company: {
        identity: inForce.companyIdentity.value,
        taxRegistrations: inForce.taxRegistrations.value,
        brandColour: inForce.branding.value.brandColour,
        phoneE164: owner?.phoneE164 ?? null,
      },
      lineLabels: proposalMoneyLineWords(t, {
        taxName: pack.tax.scheme,
        incentiveName: pack.subsidy.offered ? pack.subsidy.scheme : '',
      }),
      platformTerms,
    };
  }

  /** The document as it stands now, or — with `freshness` null — as Generate freezes it. */
  document(
    context: AssemblyContext,
    fields: ProposalFieldSet,
    deal: ProposalDealFacts,
    preparedBy: NamedPerson,
    freshness: Freshness | null = computedNow(),
  ): LiveDocument {
    return assemble({
      fields,
      deal,
      company: context.company,
      pack: context.pack,
      sectionsIncluded: context.settings.inForce.proposalTemplate.value.sectionsIncluded,
      lineLabels: context.lineLabels,
      language: context.language,
      platformTerms: context.platformTerms,
      preparedBy: { name: preparedBy.name, phoneE164: preparedBy.phoneE164 },
      freshness,
    });
  }

  /** The checklist over a document — the one Generate runs (`M06-23`). */
  verdict(context: AssemblyContext, live: LiveDocument, viewerSeesCost: boolean) {
    const { pack } = context;
    return generateVerdict({
      fields: live.fields,
      deal: live.deal,
      money: live.money,
      formats: pack.formats,
      subsidy: pack.subsidy,
      certification: pack.certificationSchemes,
      market: pack.formats.proposal ?? null,
      basis: PROPOSAL_BASIS_WITHOUT_DESIGN,
      viewerSeesCost,
      taxRegistered: live.company.taxRegistration !== null,
      supplyRates: pack.tax.systemSupplyRates,
    });
  }

  /** The short-lived addresses of the company's pictures a document draws. */
  async pictures(
    tenantId: string,
    live: Pick<LiveDocument, 'company' | 'fields'>,
  ): Promise<Pick<DocumentFacts, 'logoUrl' | 'coverPhotoUrl'>> {
    const now = Date.now();
    const cover = live.fields.company.coverPicture;
    const [logo, photo] = await Promise.all([
      live.company.logoFileId === null
        ? null
        : this.documents.signedDownload(tenantId, live.company.logoFileId, now),
      cover.kind === 'own' ? this.documents.signedDownload(tenantId, cover.fileId, now) : null,
    ]);
    return { logoUrl: logo?.url ?? null, coverPhotoUrl: photo?.url ?? null };
  }

  /** The company's own cover photo, where Proposal defaults keep one, with its short-lived address. */
  private async companyCover(
    tenantId: string,
    picture: ProposalSettings['coverPicture'],
  ): Promise<ProposalDetail['companyCover']> {
    if (picture?.kind !== 'own') return null;
    const link = await this.documents.signedDownload(tenantId, picture.fileId, Date.now());
    return link === null ? null : { fileId: picture.fileId, url: link.url };
  }

  /** One proposal's whole read, for the reader given. */
  async detail(reader: LeadReader, facts: ProposalFacts): Promise<ProposalDetail> {
    const { proposal, deal } = facts;
    const context = await this.contextFor(reader.tenantId, deal.preferredLanguage, facts.owner);
    const rights = rightsOf(reader.roles);
    const wire: FieldSetReader = {
      minorUnitDigits: context.pack.formats.minorUnitDigits,
      seesCost: rights.seesCost,
    };
    const live = this.document(context, proposal.fieldSet, deal.deal, facts.maker);
    const standing = {
      fields: live.fields,
      deal: live.deal,
      templates: templateFilledSteps({ settings: context.settings.inForce }),
    };
    const standings = stepStandings(standing);
    const { identity } = context.company;
    const missing: ProposalDetail['missingCompanyFacts'] = [
      ...(identity.bankDetails === null ? (['bank_details'] as const) : []),
      ...(identity.logoFileId === null ? (['logo'] as const) : []),
      ...(context.company.taxRegistrations.length === 0 ? (['tax_registration'] as const) : []),
      ...(identity.address === null ? (['address'] as const) : []),
    ];
    const template = context.settings.inForce.proposalTemplate;
    const ownLanguage = context.settings.inForce.locale.value.defaultLanguage;
    return {
      id: proposal.id,
      status: proposal.status,
      standing: standingOf(facts),
      quickMode: proposal.quickMode,
      revision: proposal.revision,
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString(),
      lead: {
        id: deal.leadId,
        customerId: deal.customerId,
        stage: deal.lifecycle.stage,
        state: deal.lifecycle.state,
        owner: deal.owner === null ? null : memberRefOf(deal.owner.userId, deal.owner.name),
        city: deal.city,
        customerPhoneE164: deal.customerPhoneE164,
        canDial: deal.canDial,
      },
      document: documentWire(
        live,
        {
          number: proposal.number === null ? null : proposalNumberOf(proposal.number),
          version: null,
          date: new Date(),
          ...(await this.pictures(reader.tenantId, live)),
          preparedByUserId: facts.maker.userId,
        },
        wire,
      ),
      steps: PROPOSAL_STEPS.map((step) => ({ step, standing: standings[step] })),
      progress: draftProgress(standing),
      checklist: verdictWire(this.verdict(context, live, rights.seesCost), wire.minorUnitDigits),
      rights,
      companyFactsBy:
        rights.writesCompanyFacts || facts.owner === null ? null : { name: facts.owner.name },
      missingCompanyFacts: missing,
      companyCover: await this.companyCover(reader.tenantId, context.settings.coverPicture),
      paymentPlans: context.settings.paymentPlans.map(trancheTemplateWire),
      termsPrintIn:
        template.source === 'tenant' && ownLanguage !== context.language ? ownLanguage : null,
      versions: versionSummaries(facts, wire.minorUnitDigits),
      tracking: trackingOf(facts),
      followUp:
        facts.openTasks.find((task) =>
          (PROPOSAL_TASK_PROVENANCES as readonly string[]).includes(task.provenance),
        ) ?? null,
      links: facts.links,
      project:
        facts.project === null
          ? null
          : { id: facts.project.id, number: projectNumberOf(facts.project.number) },
      shareBlockedBy: shareBlockOf(facts, context.pack),
    };
  }
}
