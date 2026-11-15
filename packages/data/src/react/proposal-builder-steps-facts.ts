import type { ProposalFieldSetWire } from '@heliogrid/contracts';
import { COVER_PICTURES, type CoverCount } from '@heliogrid/domain';
import { editDeal, editStep, type StepContext, saveOf, savesOf } from './proposal-builder-context';
import type {
  BankStepModel,
  ClientStepModel,
  CompanyStepModel,
  TrackRecordStepModel,
} from './proposal-builder-model';

/** Steps 1, 2, 10 and 11: the company, its track record, the client and the bank (`M06-07`, `M06-08`, `M06-16`, `M06-17`). */

type Wire = ProposalFieldSetWire;
const OWN_COVER = 'own';

function present<T extends { value: string | null }>(facts: readonly T[]) {
  return facts.flatMap((fact) =>
    fact.value === null || fact.value === '' ? [] : [{ ...fact, value: fact.value }],
  );
}

export function companyStepOf(ctx: StepContext): CompanyStepModel {
  const { coverPicture, proposalType } = ctx.fields.company;
  const { company } = ctx.detail.document;
  const edit = (key: string, change: (stored: Wire['company']) => Wire['company']) =>
    editStep(ctx, key, 'company', change);
  /* The company's own photo: the one Proposal defaults keep, offered whatever this proposal holds,
     else the one this proposal was started on. */
  const kept = ctx.detail.companyCover;
  const ownSrc =
    coverPicture.kind === 'own' && company.coverPhotoUrl !== null
      ? company.coverPhotoUrl
      : (kept?.url ?? null);
  const ownFileId = kept?.fileId ?? (coverPicture.kind === 'own' ? coverPicture.fileId : null);
  const own = ownSrc === null ? [] : [{ key: OWN_COVER, src: ownSrc }];
  return {
    step: 'company',
    proposalType,
    onProposalType: (type) => edit('company.type', (stored) => ({ ...stored, proposalType: type })),
    covers: [...COVER_PICTURES.map((picture) => ({ key: picture, picture })), ...own],
    cover: coverPicture.kind === 'own' ? OWN_COVER : coverPicture.key,
    onCover: (key) => {
      const picture = COVER_PICTURES.find((one) => one === key);
      if (picture !== undefined) {
        edit('company.cover', (stored) => ({
          ...stored,
          coverPicture: { kind: 'platform', key: picture },
        }));
        return;
      }
      if (key !== OWN_COVER || ownFileId === null) return;
      edit('company.cover', (stored) => ({
        ...stored,
        coverPicture: { kind: 'own', fileId: ownFileId },
      }));
    },
    facts: present([
      { key: 'company' as const, value: company.name },
      { key: 'phone' as const, value: company.phoneE164 },
      { key: 'email' as const, value: company.email },
      { key: 'address' as const, value: company.address },
      { key: 'tax' as const, value: company.taxRegistration?.value ?? null },
    ]),
  };
}

export function trackRecordStepOf(ctx: StepContext): TrackRecordStepModel {
  const keyOf = (count: CoverCount) => `achievements.${count}`;
  return {
    step: 'achievements',
    record: ctx.fields.achievements,
    onCount: (count, value) =>
      editStep(ctx, keyOf(count), 'achievements', (stored) => ({ ...stored, [count]: value })),
    saves: savesOf(ctx, {
      totalCapacityInstalledKw: keyOf('totalCapacityInstalledKw'),
      happyCustomers: keyOf('happyCustomers'),
      citiesServed: keyOf('citiesServed'),
    }),
  };
}

export function clientStepOf(ctx: StepContext): ClientStepModel {
  const address = ctx.deal.siteAddress ?? '';
  const save = saveOf(ctx, 'client.address');
  const areaSave = saveOf(ctx, 'client.area');
  return {
    step: 'client',
    name: ctx.deal.clientName ?? '',
    ...(ctx.detail.lead.customerPhoneE164 === null
      ? {}
      : { phone: ctx.detail.lead.customerPhoneE164 }),
    address,
    onAddress: (typed) =>
      editDeal(ctx, 'client.address', { siteAddress: typed.trim() === '' ? null : typed.trim() }),
    addressMissing: ctx.acts.checkAsked && address.trim() === '',
    area: ctx.deal.area,
    areaMissing: ctx.acts.checkAsked && ctx.deal.area === null,
    onArea: (area) => editDeal(ctx, 'client.area', { area }),
    number: ctx.detail.document.number,
    language: ctx.detail.document.language,
    saves: {
      ...(save === undefined ? {} : { address: save }),
      ...(areaSave === undefined ? {} : { area: areaSave }),
    },
  };
}

export function bankStepOf(ctx: StepContext): BankStepModel {
  const { includeInProposal } = ctx.fields.bank;
  return {
    step: 'bank',
    include: includeInProposal,
    onInclude: () => {
      const include = ctx.flipped('bank.include', includeInProposal);
      editStep(ctx, 'bank.include', 'bank', () => ({ includeInProposal: include }));
    },
    mayEdit: ctx.detail.rights.writesCompanyFacts,
    ...(ctx.acts.bank === null
      ? {}
      : { edit: { details: ctx.acts.bank.details, onDetail: ctx.acts.bank.onDetail } }),
  };
}
