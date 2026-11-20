/**
 * The PUT and PATCH routes the repeat proof holds to a stated reason instead of a proof: what each
 * records on a repeat, and why that is fine.
 */
export const noRepeatToProve: Readonly<Record<string, string>> = {
  'PUT /catalog/items/:id': 'records every repeat — deferred D163',
  'PUT /catalog/items/:id/override': 'records every repeat — deferred D163',
  'PUT /catalog/imports/:id/mapping': 'an import’s working state; records no entry',
  'PUT /catalog/imports/:id/rows/:rowNumber': 'an import’s working state; records no entry',
  'PUT /lead-imports/:id/mapping':
    'an import’s working state; records no entry; the same mapping again starts no pass (tests/crm/lead-import.test.ts)',
  'PUT /notifications/preferences/:group': 'records no entry',
  'PUT /onboarding/progress/:step': 'records no entry',
  'PUT /onboarding/prompt-points/:fact': 'records no entry',
  'PATCH /tenants/me/membership': 'records no entry',
  'PUT /settings/quiet-hours': 'records no entry',
  'PATCH /users/me': 'records no entry',
  'PUT /users/me/photo': 'records no entry',
  'PATCH /leads/:id':
    'records no entry; a field sent as stored writes no timeline entry (tests/crm/lead-fields.test.ts)',
  'PATCH /contacts/:id': 'records no entry',
  'PATCH /tasks/:id':
    'records no entry; the same due moment again writes nothing (tests/crm/tasks.test.ts)',
  'PUT /customers/:id/primary-contact': 'records no entry; the same choice again writes nothing',
  'PATCH /proposals/:id':
    'a commit sent again as stored writes nothing, records nothing and keeps its revision (tests/proposals/proposal-record.test.ts)',
  'PUT /saved-parts/:id':
    'records no entry; the same words again write nothing (tests/proposals/saved-parts.test.ts)',
  'PUT /designs/:id/site':
    'records no audit entry; the same details again write no timeline entry and leave the design as it was (tests/studio/site-details.test.ts)',
  'PUT /designs/:id/recommended':
    'records no entry; the same mark again writes nothing (tests/studio/design-record.test.ts)',
  'PUT /designs/:id/document':
    'records no entry; a save sent again is made on a version already saved over, so it is refused as saved first — known as its own opening’s — and writes nothing (tests/studio/design-document.test.ts)',
  'PUT /designs/:id/edit-turn':
    'records no entry; the turn taken again is renewed — a lease that runs out, not a record (tests/studio/design-document.test.ts)',
  'PUT /links/:id/label':
    'records no audit entry; the same name again writes no timeline entry (tests/customer-link/link-manager.test.ts)',
};
